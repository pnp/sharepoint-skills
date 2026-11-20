#!/usr/bin/env python3
"""Parse a Power Automate cloud flow export into a step graph and a masking report.

Accepted inputs:
  * a legacy package zip (Export > Package (.zip)):
      manifest.json + Microsoft.Flow/flows/<id>/definition.json (+ apisMap.json, connectionsMap.json)
  * a solution zip (Export solution):
      solution.xml + customizations.xml + Workflows/<Name>-<GUID>.json
  * a loose definition JSON (the flow JSON or a bare {"triggers", "actions"} object)
  * an already unzipped folder of either zip layout

Typical use:
  1. Scan only (no graph is written, real values never leave memory):
       parse_flow.py export.zip --report work/masking-report.json --map-out work/masking-map.json
  2. The user reviews the masking table, edits replacements, and sets "approved": true.
  3. Write the masked graph:
       parse_flow.py export.zip --map work/masking-map.json -o work/graph.json

The script never writes a raw value from the export when a masking map is required.
Use --raw only for local debugging on a machine the export already lives on.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import io
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path, PurePosixPath

GRAPH_SCHEMA = "flow-step-graph/1"
MAP_SCHEMA = "flow-masking-map/1"

CONTAINER_TYPES = {"foreach", "until", "if", "scope", "switch"}

# Friendly labels for common operations. Anything missing falls back to the action name.
OPERATION_LABELS = {
    "OnNewFeed": "When a feed item is published",
    "ListFeedItems": "List all RSS feed items",
    "HtmlToText": "Html to text",
    "PostItem": "Create item",
    "PatchItem": "Update item",
    "GetItems": "Get items",
    "GetItem": "Get item",
    "DeleteItem": "Delete item",
    "GetOnNewItems": "When an item is created",
    "GetOnUpdatedItems": "When an item is created or modified",
    "GetOnNewFileItems": "When a file is created in a folder",
    "CreateFile": "Create file",
    "GetFileContent": "Get file content",
    "HttpRequest": "Send an HTTP request to SharePoint",
    "SendEmailV2": "Send an email (V2)",
    "SendEmail": "Send an email",
    "OnNewEmailV3": "When a new email arrives (V3)",
    "PostMessageToConversation": "Post message in a chat or channel",
    "PostCardToConversation": "Post card in a chat or channel",
    "StartAndWaitForAnApproval": "Start and wait for an approval",
    "CreateAnApproval": "Create an approval",
    "WaitForAnApproval": "Wait for an approval",
    "GetUser_V2": "Get user profile (V2)",
    "UserProfile_V2": "Get user profile (V2)",
    "Manager_V2": "Get manager (V2)",
    "CreateTask_V3": "Create a task",
    "ListRows": "List rows",
    "CreateRecord": "Add a new row",
    "UpdateRecord": "Update a row",
}

BUILTIN_LABELS = {
    "recurrence": ("Schedule", "Recurrence"),
    "request": ("Manual trigger", "Manually trigger a flow"),
    "http": ("HTTP", "HTTP"),
    "httpwebhook": ("HTTP", "HTTP Webhook"),
    "response": ("Request", "Response"),
    "compose": ("Data operation", "Compose"),
    "parsejson": ("Data operation", "Parse JSON"),
    "query": ("Data operation", "Filter array"),
    "select": ("Data operation", "Select"),
    "table": ("Data operation", "Create HTML table"),
    "join": ("Data operation", "Join"),
    "initializevariable": ("Variables", "Initialize variable"),
    "setvariable": ("Variables", "Set variable"),
    "incrementvariable": ("Variables", "Increment variable"),
    "decrementvariable": ("Variables", "Decrement variable"),
    "appendtoarrayvariable": ("Variables", "Append to array variable"),
    "appendtostringvariable": ("Variables", "Append to string variable"),
    "wait": ("Schedule", "Delay"),
    "terminate": ("Control", "Terminate"),
    "foreach": ("Control", "Apply to each"),
    "until": ("Control", "Do until"),
    "if": ("Control", "Condition"),
    "switch": ("Control", "Switch"),
    "scope": ("Control", "Scope"),
    "workflow": ("Flows", "Run a child flow"),
    "expression": ("Data operation", "Expression"),
}

API_LABELS = {
    "rss": "RSS",
    "conversionservice": "Content Conversion",
    "sharepointonline": "SharePoint",
    "office365": "Office 365 Outlook",
    "office365users": "Office 365 Users",
    "teams": "Microsoft Teams",
    "approvals": "Approvals",
    "commondataserviceforapps": "Microsoft Dataverse",
    "onedriveforbusiness": "OneDrive for Business",
    "planner": "Planner",
    "excelonlinebusiness": "Excel Online (Business)",
    "flowpush": "Notifications",
    "logicflows": "Flows",
}


class ExportError(Exception):
    pass


# --------------------------------------------------------------------------- reading


class Source:
    """A uniform view over a zip, a folder, or a single JSON file."""

    def __init__(self, path: str):
        self.path = path
        self.files: dict[str, bytes] = {}
        p = Path(path)
        if p.is_dir():
            for f in p.rglob("*"):
                if f.is_file():
                    self.files[f.relative_to(p).as_posix()] = f.read_bytes()
            self.kind = "folder"
        elif zipfile.is_zipfile(path):
            with zipfile.ZipFile(path) as z:
                for info in z.infolist():
                    if not info.is_dir():
                        self.files[info.filename.replace("\\", "/")] = z.read(info)
            self.kind = "zip"
        elif p.is_file():
            self.files[p.name] = p.read_bytes()
            self.kind = "file"
        else:
            raise ExportError(f"Input not found: {path}")

    def json(self, name: str):
        raw = self.files[name]
        return json.loads(raw.decode("utf-8-sig"))

    def find(self, pattern: str) -> list[str]:
        rx = re.compile(pattern, re.I)
        return sorted(n for n in self.files if rx.search(n))


def detect(src: Source) -> str:
    if src.find(r"(^|/)Microsoft\.Flow/flows/[^/]+/definition\.json$"):
        return "legacy-package"
    if src.find(r"(^|/)Workflows/[^/]+\.json$"):
        return "solution"
    jsons = [n for n in src.files if n.lower().endswith(".json")]
    if len(jsons) == 1:
        return "definition"
    raise ExportError(
        "Could not find a flow definition. Expected Microsoft.Flow/flows/<id>/definition.json "
        "(legacy package) or Workflows/*.json (solution export)."
    )


def _definition_parts(doc: dict) -> tuple[dict, dict, dict]:
    """Return (definition, connectionReferences, properties) from any flow JSON shape."""
    if "triggers" in doc or "actions" in doc:
        return doc, {}, {}
    props = doc.get("properties", doc)
    definition = props.get("definition") or {}
    if not ("triggers" in definition or "actions" in definition):
        raise ExportError("JSON has no properties.definition with triggers or actions.")
    return definition, props.get("connectionReferences") or {}, props


def load_flows(src: Source) -> tuple[str, list[dict]]:
    fmt = detect(src)
    flows: list[dict] = []
    if fmt == "legacy-package":
        manifest = {}
        mnames = [n for n in src.files if PurePosixPath(n).name == "manifest.json" and "Microsoft.Flow" not in n]
        if mnames:
            manifest = src.json(sorted(mnames, key=len)[0])
        resources = manifest.get("resources", {}) if isinstance(manifest, dict) else {}
        for dpath in src.find(r"(^|/)Microsoft\.Flow/flows/[^/]+/definition\.json$"):
            folder = dpath.rsplit("/", 1)[0]
            doc = src.json(dpath)
            definition, refs, props = _definition_parts(doc)
            apis = src.json(folder + "/apisMap.json") if folder + "/apisMap.json" in src.files else {}
            conns = src.json(folder + "/connectionsMap.json") if folder + "/connectionsMap.json" in src.files else {}
            connections = []
            for key, ref in refs.items():
                api_id = ref.get("id") or ""
                api_name = ref.get("apiName") or api_id.rsplit("/shared_", 1)[-1]
                api_res = resources.get(apis.get(key, ""), {})
                conn_res = resources.get(conns.get(key, ""), {})
                connections.append({
                    "key": key,
                    "apiName": api_name,
                    "apiDisplayName": (api_res.get("details") or {}).get("displayName") or API_LABELS.get(api_name, api_name),
                    "connectionName": ref.get("connectionName"),
                    "connectionDisplayName": (conn_res.get("details") or {}).get("displayName"),
                    "source": ref.get("source"),
                })
            flow_res = resources.get(folder.rsplit("/", 1)[-1], {})
            flows.append({
                "path": dpath,
                "id": doc.get("name") or folder.rsplit("/", 1)[-1],
                "displayName": props.get("displayName") or (flow_res.get("details") or {}).get("displayName") or "Flow",
                "packageName": ((manifest.get("details") or {}).get("displayName") if isinstance(manifest, dict) else None),
                "description": props.get("description") or ((manifest.get("details") or {}).get("description") if isinstance(manifest, dict) else "") or "",
                "definition": definition,
                "connections": connections,
                "metadataDropped": sorted((definition.get("metadata") or {}).keys()),
            })
    elif fmt == "solution":
        names = _solution_names(src)
        for wpath in src.find(r"(^|/)Workflows/[^/]+\.json$"):
            doc = src.json(wpath)
            try:
                definition, refs, props = _definition_parts(doc)
            except ExportError:
                continue  # not a cloud flow (for example a classic workflow)
            stem = PurePosixPath(wpath).stem
            guid = _guid_tail(stem)
            info = names["workflows"].get((guid or "").lower(), {})
            connections = []
            for key, ref in refs.items():
                api_name = ((ref.get("api") or {}).get("name") or ref.get("apiName") or key).replace("shared_", "")
                logical = ((ref.get("connection") or {}).get("connectionReferenceLogicalName")
                           or (ref.get("connection") or {}).get("name") or ref.get("connectionName"))
                cref = names["connrefs"].get((logical or "").lower(), {})
                connections.append({
                    "key": key,
                    "apiName": api_name,
                    "apiDisplayName": API_LABELS.get(api_name, api_name),
                    "connectionName": logical,
                    "connectionDisplayName": cref.get("displayName"),
                    "source": ref.get("runtimeSource") or ref.get("source"),
                })
            flows.append({
                "path": wpath,
                "id": guid or stem,
                "displayName": info.get("name") or props.get("displayName") or re.sub(r"-?" + re.escape(guid or "") + "$", "", stem) or stem,
                "packageName": names.get("solution"),
                "description": info.get("description") or "",
                "definition": definition,
                "connections": connections,
                "metadataDropped": sorted((definition.get("metadata") or {}).keys()),
            })
        if not flows:
            raise ExportError("The solution has a Workflows folder but no cloud flow definitions.")
    else:
        name = [n for n in src.files if n.lower().endswith(".json")][0]
        doc = src.json(name)
        definition, refs, props = _definition_parts(doc)
        connections = [{
            "key": k, "apiName": (r.get("apiName") or (r.get("api") or {}).get("name") or k).replace("shared_", ""),
            "apiDisplayName": API_LABELS.get((r.get("apiName") or k).replace("shared_", ""), k),
            "connectionName": r.get("connectionName") or (r.get("connection") or {}).get("connectionReferenceLogicalName"),
            "connectionDisplayName": None, "source": r.get("source"),
        } for k, r in refs.items()]
        flows.append({
            "path": name, "id": doc.get("name") or PurePosixPath(name).stem,
            "displayName": props.get("displayName") or PurePosixPath(name).stem,
            "packageName": None, "description": props.get("description") or "",
            "definition": definition, "connections": connections,
            "metadataDropped": sorted((definition.get("metadata") or {}).keys()),
        })
    return fmt, flows


def _guid_tail(s: str):
    m = re.search(r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$", s)
    return m.group(1) if m else None


def _solution_names(src: Source) -> dict:
    out = {"workflows": {}, "connrefs": {}, "solution": None}
    cx = src.find(r"(^|/)customizations\.xml$")
    if cx:
        try:
            root = ET.fromstring(src.files[cx[0]])
            for wf in root.iter():
                if _local(wf.tag) == "Workflow":
                    wid = (wf.get("WorkflowId") or "").strip("{}").lower()
                    desc = ""
                    for ch in wf:
                        if _local(ch.tag) == "Description":
                            desc = ch.text or ""
                    out["workflows"][wid] = {"name": wf.get("Name"), "description": desc}
                if _local(wf.tag).lower() == "connectionreference":
                    logical = wf.get("connectionreferencelogicalname") or ""
                    disp = None
                    for ch in wf:
                        if _local(ch.tag).lower() == "connectionreferencedisplayname":
                            disp = ch.text
                    out["connrefs"][logical.lower()] = {"displayName": disp}
        except ET.ParseError:
            pass
    sx = src.find(r"(^|/)solution\.xml$")
    if sx:
        try:
            root = ET.fromstring(src.files[sx[0]])
            for el in root.iter():
                if _local(el.tag) == "UniqueName" and el.text:
                    out["solution"] = el.text
                    break
        except ET.ParseError:
            pass
    return out


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


# --------------------------------------------------------------------------- graph


def _sorted_siblings(actions: dict, warnings: list) -> list[str]:
    """Topological order by runAfter, ties broken by JSON key order."""
    names = list(actions.keys())
    pos = {n: i for i, n in enumerate(names)}
    deps = {}
    for n in names:
        ra = (actions[n] or {}).get("runAfter") or {}
        known = [d for d in ra if d in actions]
        for d in ra:
            if d not in actions:
                warnings.append(f"{n}: runAfter refers to '{d}', which is not a sibling. Drawn after its siblings.")
        deps[n] = known
    done, out = set(), []
    while len(out) < len(names):
        ready = [n for n in names if n not in done and all(d in done for d in deps[n])]
        if not ready:
            rest = [n for n in names if n not in done]
            warnings.append("runAfter cycle among: " + ", ".join(rest) + ". Kept JSON order.")
            ready = rest
        ready.sort(key=lambda n: pos[n])
        n = ready[0]
        done.add(n)
        out.append(n)
    return out


def _flatten(prefix: str, value, out: dict):
    if isinstance(value, dict):
        if not value:
            out[prefix] = "{}"
        for k, v in value.items():
            _flatten(f"{prefix}/{k}" if prefix else str(k), v, out)
    elif isinstance(value, list):
        if all(not isinstance(v, (dict, list)) for v in value):
            out[prefix] = json.dumps(value, ensure_ascii=False)
        else:
            for i, v in enumerate(value):
                _flatten(f"{prefix}[{i}]", v, out)
    elif value is None:
        out[prefix] = "null"
    else:
        out[prefix] = value if isinstance(value, str) else json.dumps(value)


EXPR_RX = re.compile(r"@\{[^}]*\}|^@.*$", re.S)


def _expressions(values) -> list[str]:
    found = []
    for v in values:
        if not isinstance(v, str):
            continue
        for m in EXPR_RX.finditer(v):
            e = m.group(0)
            e = e[2:-1] if e.startswith("@{") else e[1:]
            if e and e not in found:
                found.append(e)
    return found


def condition_text(expr) -> str:
    """Readable text for an If/Until expression object or string."""
    if isinstance(expr, str):
        return expr[1:] if expr.startswith("@") else expr
    if isinstance(expr, dict):
        if len(expr) != 1:
            return json.dumps(expr)
        op, args = next(iter(expr.items()))
        words = {"equals": "is equal to", "greater": "is greater than", "greaterOrEquals": "is greater than or equal to",
                 "less": "is less than", "lessOrEquals": "is less than or equal to", "contains": "contains",
                 "startsWith": "starts with", "endsWith": "ends with"}
        if op in ("and", "or"):
            parts = [condition_text(a) for a in args]
            return (" " + op.upper() + " ").join(f"({p})" if (" AND " in p or " OR " in p) else p for p in parts)
        if op == "not":
            inner = args if isinstance(args, dict) else (args[0] if args else {})
            return "NOT (" + condition_text(inner) + ")"
        if op in words and isinstance(args, list) and len(args) == 2:
            return f"{_operand(args[0])} {words[op]} {_operand(args[1])}"
        return f"{op}({', '.join(_operand(a) for a in (args if isinstance(args, list) else [args]))})"
    return json.dumps(expr)


def _operand(v) -> str:
    if isinstance(v, str):
        return v[1:] if v.startswith("@") else json.dumps(v)
    if isinstance(v, dict):
        return condition_text(v)
    return json.dumps(v)


def _connector(node: dict, connections: dict) -> dict | None:
    inputs = node.get("inputs")
    host = (inputs.get("host") or {}) if isinstance(inputs, dict) else {}
    key = host.get("connectionName") or host.get("connectionReferenceName")
    if not key and isinstance(host.get("connection"), dict):
        name = host["connection"].get("name") or ""
        m = re.search(r"\['([^']+)'\]", name)
        key = m.group(1) if m else None
    api_id = host.get("apiId") or ""
    if not key and not api_id:
        return None
    conn = connections.get(key or "", {})
    api_name = conn.get("apiName") or api_id.rsplit("/shared_", 1)[-1] or (key or "").replace("shared_", "")
    return {
        "key": key,
        "apiName": api_name,
        "displayName": conn.get("apiDisplayName") or API_LABELS.get(api_name, api_name),
        "operationId": host.get("operationId"),
    }


def _kind(t: str) -> str:
    t = (t or "").lower()
    return {"foreach": "foreach", "until": "until", "if": "condition", "switch": "switch", "scope": "scope"}.get(t, "action")


def _label(name: str) -> str:
    return re.sub(r"_+", " ", name).strip()


def _step(name: str, node: dict, connections: dict, *, kind: str, parent, branch, depth: int, siblings_ra: dict) -> dict:
    node = node or {}
    t = node.get("type") or ""
    conn = _connector(node, connections)
    builtin = BUILTIN_LABELS.get(t.lower())
    if conn:
        group = conn["displayName"]
        op = OPERATION_LABELS.get(conn.get("operationId") or "", None) or _label(conn.get("operationId") or name)
    elif builtin:
        group, op = builtin
        if t.lower() == "request":
            k = (node.get("kind") or "").lower()
            op = {"button": "Manually trigger a flow", "http": "When an HTTP request is received",
                  "powerapp": "When Power Apps calls a flow", "powerappv2": "When Power Apps calls a flow (V2)",
                  "skills": "When an agent calls the flow"}.get(k, op)
    else:
        group, op = "Action", t or "Unknown"
    inputs_raw = node.get("inputs")
    flat: dict = {}
    if isinstance(inputs_raw, dict):
        params = inputs_raw.get("parameters")
        if isinstance(params, dict):
            _flatten("", params, flat)
        rest = {k: v for k, v in inputs_raw.items() if k not in ("parameters", "host", "authentication")}
        if rest:
            _flatten("", rest, flat)
        if "authentication" in inputs_raw and not (isinstance(inputs_raw["authentication"], str) and inputs_raw["authentication"].startswith("@parameters(")):
            _flatten("authentication", inputs_raw["authentication"], flat)
    elif inputs_raw is not None:
        _flatten("value", inputs_raw, flat)
    settings: dict = {}
    for key in ("recurrence", "splitOn", "foreach", "limit", "description", "kind", "conditions", "trackedProperties"):
        if key in node:
            settings[key] = node[key]
    if "expression" in node:
        settings["expression"] = node["expression"]
        settings["expressionText"] = condition_text(node["expression"])
    rc = node.get("runtimeConfiguration") or {}
    if rc:
        settings["runtimeConfiguration"] = rc
    if (node.get("operationOptions")):
        settings["operationOptions"] = node["operationOptions"]
    ra = node.get("runAfter") or {}
    statuses = sorted({s for v in ra.values() for s in (v or [])})
    exprs = _expressions(list(flat.values()) + [node.get("splitOn"), node.get("foreach"),
                         node["expression"] if isinstance(node.get("expression"), str) else None])
    if isinstance(node.get("expression"), dict):
        for v in _walk_strings(node["expression"]):
            if v.startswith("@") and v[1:] not in exprs:
                exprs.append(v[1:])
    step = {
        "id": name,
        "label": _label(name),
        "type": t,
        "kind": kind,
        "parent": parent,
        "branch": branch,
        "depth": depth,
        "connector": conn,
        "group": group,
        "operation": op,
        "runAfter": ra,
        "after": list(ra.keys()),
        "onFailure": bool(ra) and "Succeeded" not in statuses,
        "runAfterStatuses": statuses,
        "inputs": flat,
        "expressions": exprs,
        "settings": settings,
        "children": {},
    }
    # parallel: another sibling shares the same predecessor set
    key = tuple(sorted(ra.keys()))
    twins = [n for n, r in siblings_ra.items() if n != name and tuple(sorted((r or {}).keys())) == key]
    step["parallelWith"] = twins
    return step


def _walk_strings(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, dict):
        for k, x in v.items():
            yield from _walk_strings(x)
    elif isinstance(v, list):
        for x in v:
            yield from _walk_strings(x)


def build_graph(fmt: str, flow: dict) -> dict:
    definition = flow["definition"]
    connections = {c["key"]: c for c in flow["connections"]}
    warnings: list[str] = []
    steps: list[dict] = []
    triggers = definition.get("triggers") or {}
    if not triggers:
        warnings.append("No trigger found in the definition.")
    if len(triggers) > 1:
        warnings.append("More than one trigger; only the first is drawn as START.")
    for i, (tname, tnode) in enumerate(triggers.items()):
        st = _step(tname, tnode, connections, kind="trigger", parent=None, branch=None, depth=0, siblings_ra={})
        if i == 0:
            steps.append(st)

    def walk(actions: dict, parent, branch, depth):
        if not isinstance(actions, dict):
            return []
        ids = []
        for name in _sorted_siblings(actions, warnings):
            node = actions[name] or {}
            t = (node.get("type") or "").lower()
            st = _step(name, node, connections, kind=_kind(t), parent=parent, branch=branch, depth=depth,
                       siblings_ra={n: (a or {}).get("runAfter") for n, a in actions.items()})
            if st["parallelWith"] and any(w in actions for w in st["parallelWith"]):
                pass
            steps.append(st)
            ids.append(name)
            if t in ("foreach", "until", "scope"):
                st["children"]["actions"] = walk(node.get("actions") or {}, name, "actions", depth + 1)
            elif t == "if":
                st["children"]["actions"] = walk(node.get("actions") or {}, name, "actions", depth + 1)
                st["children"]["else"] = walk(((node.get("else") or {}).get("actions")) or {}, name, "else", depth + 1)
            elif t == "switch":
                cases = node.get("cases") or {}
                st["settings"]["cases"] = {}
                for cname, case in cases.items():
                    case = case or {}
                    st["settings"]["cases"][cname] = case.get("case")
                    st["children"]["case:" + cname] = walk(case.get("actions") or {}, name, "case:" + cname, depth + 1)
                st["children"]["default"] = walk(((node.get("default") or {}).get("actions")) or {}, name, "default", depth + 1)
            elif node.get("actions") and isinstance(node.get("actions"), dict):
                warnings.append(f"{name}: type '{node.get('type')}' has nested actions; treated as a container.")
                st["kind"] = "scope"
                st["children"]["actions"] = walk(node["actions"], name, "actions", depth + 1)
        return ids

    top = walk(definition.get("actions") or {}, None, None, 1)
    for k, s in enumerate(steps):
        s["order"] = k
        if s["parallelWith"]:
            warnings.append(f"{s['id']}: runs in parallel with {', '.join(s['parallelWith'])}. v1 draws parallel branches one after another.")
        if s["onFailure"]:
            warnings.append(f"{s['id']}: runs after {', '.join(s['after'])} with status {', '.join(s['runAfterStatuses'])} (error handling).")
        if s["kind"] == "action" and s["type"] and s["type"].lower() not in BUILTIN_LABELS and not s["connector"] \
                and s["type"].lower() not in ("openapiconnection", "apiconnection", "openapiconnectionwebhook", "apiconnectionwebhook"):
            warnings.append(f"{s['id']}: unrecognized action type '{s['type']}'; drawn as a plain step.")
    # dedupe warnings, keep order
    seen, uniq = set(), []
    for w in warnings:
        if w not in seen:
            seen.add(w)
            uniq.append(w)
    return {
        "schema": GRAPH_SCHEMA,
        "source": {"format": fmt, "flowPath": flow["path"]},
        "flow": {
            "id": flow["id"],
            "displayName": flow["displayName"],
            "packageName": flow.get("packageName"),
            "description": flow.get("description") or "",
        },
        "connections": flow["connections"],
        "topLevel": top,
        "steps": steps,
        "counts": {
            "steps": len(steps),
            "containers": sum(1 for s in steps if s["kind"] in ("foreach", "until", "condition", "switch", "scope")),
            "maxDepth": max((s["depth"] for s in steps), default=0),
        },
        "metadataDropped": flow.get("metadataDropped", []),
        "warnings": uniq,
    }


# --------------------------------------------------------------------------- masking

URL_RX = re.compile(r"https?://[^\s\"'<>\\)\]}]+", re.I)
EMAIL_RX = re.compile(r"[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
HOST_RX = re.compile(r"\b[a-z0-9][a-z0-9-]*(?:-my)?\.(?:sharepoint\.com|onmicrosoft\.com|crm\d*\.dynamics\.com|azurewebsites\.net|logic\.azure\.com|blob\.core\.windows\.net|vault\.azure\.net)\b", re.I)
PERSONAL_RX = re.compile(r"/personal/[A-Za-z0-9_.-]+", re.I)
GUID_RX = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")
HEX32_RX = re.compile(r"\b[0-9a-fA-F]{32}\b")
JWT_RX = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}")
BEARER_RX = re.compile(r"\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}", re.I)
KEYVAL_RX = re.compile(r"(?i)\b(?:api[-_]?key|apikey|x-api-key|client[-_]?secret|password|passwd|secret|access[-_]?token|token|sig|code|subscription-key|ocp-apim-subscription-key)\b[\"']?\s*[:=]\s*[\"']?([A-Za-z0-9._~+/%=-]{8,})")
LONGTOKEN_RX = re.compile(r"\b[A-Za-z0-9+/_-]{40,}={0,2}")

SECRET_KEYS = re.compile(r"(?i)(password|secret|api[-_]?key|apikey|token|authorization|subscription-key|clientsecret|client_secret|sig)$")
WHOLE_VALUE_KEYS = re.compile(r"(?i)(^|/)(connectionName|connectionReferenceLogicalName|tenantId|tenant|clientId|audience)$")

SAFE_HOSTS = ("example.com", "example.org", "example.net", "contoso.com", "contoso.sharepoint.com", "contoso-my.sharepoint.com",
              "contoso.onmicrosoft.com", "fabrikam.com", "schema.management.azure.com")
FICTIONAL_GUID = re.compile(r"^0{8}-0{4}-[0-9a-f]{4}-[0-9a-f]{4}-0{4}[0-9a-f]{8}$", re.I)


def fingerprint(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def preview(kind: str, v: str) -> str:
    """A redacted preview that identifies the value without revealing it."""
    if kind in ("secret",):
        return v[:3] + "***" if len(v) > 6 else "***"
    if kind in ("email", "connection-display-name"):
        m = re.match(r"([^@]*)@(.*)", v)
        if m:
            return (m.group(1)[:1] + "***@" + m.group(2)[:1] + "***." + m.group(2).rsplit(".", 1)[-1])
    if kind in ("guid", "connection-id", "hex-id"):
        return v[:4] + "..." + v[-4:] if len(v) > 10 else "***"
    if kind.endswith("url") or kind in ("tenant-host", "personal-path"):
        m = re.match(r"(https?://)?([^/]*)(.*)", v)
        scheme, host, path = m.group(1) or "", m.group(2), m.group(3)
        mhost = _mask_host(host)
        segs = [s for s in path.split("/") if s]
        mpath = "/".join((s if s.lower() in ("personal", "sites", "teams", "s", "_api", "lists") else s[:1] + "***") for s in segs[:3])
        return scheme + mhost + ("/" + mpath if mpath else "") + ("/..." if len(segs) > 3 else "")
    if kind == "term":
        return v[:1] + "***"
    return v[:2] + "***"


PUBLIC_SUFFIXES = ("sharepoint.com", "onmicrosoft.com", "dynamics.com", "azurewebsites.net", "logic.azure.com",
                   "blob.core.windows.net", "vault.azure.net", "co.uk", "com.au")


def _mask_host(host: str) -> str:
    """Keep only a known service suffix (or the TLD); every other label becomes x***."""
    h = host.lower()
    suffix = next((sfx for sfx in PUBLIC_SUFFIXES if h.endswith("." + sfx)), None)
    if suffix:
        head = host[: -(len(suffix) + 1)]
    else:
        parts = host.rsplit(".", 1)
        head, suffix = (parts[0], parts[1]) if len(parts) == 2 else (host, "")
    labels = [(lb[:1] + "***" + ("-my" if lb.lower().endswith("-my") else "")) for lb in head.split(".") if lb]
    return ".".join(labels + ([suffix] if suffix else []))


def _generic_tail(url: str) -> str:
    path = re.sub(r"^https?://[^/]+", "", url).split("?", 1)[0]
    segs = [s for s in path.split("/") if s]
    keep = []
    for s in reversed(segs):
        if re.fullmatch(r"[A-Za-z]{2,12}(\.[a-z]{2,4})?", s) and not re.search(r"\d", s):
            keep.insert(0, s.lower())
        else:
            break
    return "/".join(keep[-3:])


class Masker:
    def __init__(self, extra_terms=None):
        self.findings: dict[str, dict] = {}  # fingerprint -> finding
        self.extra = [t for t in (extra_terms or []) if t]
        self.counters: dict[str, int] = {}

    def _num(self, kind):
        self.counters[kind] = self.counters.get(kind, 0) + 1
        return self.counters[kind]

    def _suggest(self, kind: str, v: str) -> tuple[str, str]:
        if kind == "personal-site-url":
            n = self._num("person")
            who = ["alex", "sam", "jordan", "taylor", "casey"][(n - 1) % 5]
            rest = re.sub(r"^https?://[^/]+/personal/[^/?#]+", "", v)
            return f"https://contoso-my.sharepoint.com/personal/{who}_contoso_com" + _mask_rest(rest), "replace"
        if kind == "sharepoint-url":
            n = self._num("site")
            m = re.match(r"https?://[^/]+(/(?:sites|teams)/[^/?#]+)?(.*)", v)
            site = f"/sites/team-site-{n}" if m and m.group(1) else ""
            return "https://contoso.sharepoint.com" + site + _mask_rest(m.group(2) if m else ""), "replace"
        if kind == "secret-url":
            return "https://example.com/redacted", "redact"
        if kind == "url":
            tail = _generic_tail(v)
            return "https://example.com/" + (tail or f"resource-{self._num('url')}"), "replace"
        if kind == "tenant-host":
            return ("contoso-my.sharepoint.com" if "-my." in v.lower() else
                    "contoso.sharepoint.com" if "sharepoint.com" in v.lower() else
                    "contoso.onmicrosoft.com" if "onmicrosoft" in v.lower() else f"service{self._num('host')}.example.com"), "replace"
        if kind == "personal-path":
            who = ["alex", "sam", "jordan", "taylor", "casey"][(self._num("person") - 1) % 5]
            return f"/personal/{who}_contoso_com", "replace"
        if kind in ("email", "connection-display-name"):
            who = ["alex", "sam", "jordan", "taylor", "casey"][(self._num("email") - 1) % 5]
            return f"{who}@contoso.com", "replace"
        if kind == "guid":
            return "00000000-0000-4000-8000-%012x" % self._num("guid"), "replace"
        if kind == "connection-id":
            return "connection-%d" % self._num("conn"), "replace"
        if kind == "hex-id":
            return "%032x" % self._num("hex"), "replace"
        if kind == "secret":
            return "[REDACTED]", "redact"
        if kind == "term":
            return "Contoso", "replace"
        return "[REVIEW]", "replace"

    def _safe(self, kind, v):
        lv = v.lower()
        if kind in ("url", "sharepoint-url", "personal-site-url", "tenant-host"):
            host = re.sub(r"^https?://", "", lv).split("/", 1)[0]
            if any(host == h or host.endswith("." + h) for h in SAFE_HOSTS):
                return True
        if kind in ("email", "connection-display-name") and lv.split("@")[-1] in ("contoso.com", "example.com", "fabrikam.com"):
            return True
        if kind == "guid" and FICTIONAL_GUID.match(v):
            return True
        if kind == "connection-id" and re.fullmatch(r"connection-\d+", v):
            return True
        if kind == "hex-id" and re.fullmatch(r"0{20,}[0-9a-f]+", lv):
            return True
        return False

    def _add(self, kind, v, where):
        if self._safe(kind, v):
            return None
        fp = fingerprint(v)
        f = self.findings.get(fp)
        if not f:
            rep, action = self._suggest(kind, v)
            f = {"id": None, "kind": kind, "fingerprint": fp, "preview": preview(kind, v),
                 "where": [], "replacement": rep, "action": action, "_value": v}
            self.findings[fp] = f
        if where not in f["where"] and len(f["where"]) < 6:
            f["where"].append(where)
        return f

    def spans(self, s: str, path: str, key: str = "") -> list[tuple[int, int, str]]:
        """Detect sensitive substrings. Returns (start, end, kind) without overlaps."""
        out: list[tuple[int, int, str]] = []

        def free(a, b):
            return all(b <= x or a >= y for x, y, _ in out)

        if WHOLE_VALUE_KEYS.search(key) and s and not s.startswith("@"):
            out.append((0, len(s), "connection-id" if "connection" in key.lower() else "guid" if GUID_RX.fullmatch(s) else "hex-id"))
            return out
        if key.endswith("connectionDisplayName") and s:
            if "@" in s:
                out.append((0, len(s), "connection-display-name"))
                return out
        if SECRET_KEYS.search(key) and s and not s.startswith("@"):
            out.append((0, len(s), "secret"))
            return out
        for m in URL_RX.finditer(s):
            u = m.group(0).rstrip(".,;")
            lu = u.lower()
            if re.search(r"[?&](sig|code|key|token|api[-_]?key|access_token|client_secret)=", lu):
                kind = "secret-url"
            elif "-my.sharepoint.com/personal/" in lu:
                kind = "personal-site-url"
            elif ".sharepoint.com" in lu:
                kind = "sharepoint-url"
            else:
                kind = "url"
            out.append((m.start(), m.start() + len(u), kind))
        for rx, kind in ((JWT_RX, "secret"), (BEARER_RX, "secret")):
            for m in rx.finditer(s):
                if free(m.start(), m.end()):
                    out.append((m.start(), m.end(), kind))
        for m in KEYVAL_RX.finditer(s):
            if free(m.start(1), m.end(1)):
                out.append((m.start(1), m.end(1), "secret"))
        for rx, kind in ((EMAIL_RX, "email"), (HOST_RX, "tenant-host"), (PERSONAL_RX, "personal-path"),
                         (GUID_RX, "guid"), (HEX32_RX, "hex-id")):
            for m in rx.finditer(s):
                if free(m.start(), m.end()):
                    out.append((m.start(), m.end(), kind))
        for m in LONGTOKEN_RX.finditer(s):
            tok = m.group(0)
            if free(m.start(), m.end()) and re.search(r"\d", tok) and re.search(r"[A-Za-z]", tok) and not re.search(r"[_/]", tok[:1]):
                if not re.fullmatch(r"[a-z_]+", tok, re.I):
                    out.append((m.start(), m.end(), "secret"))
        low = s.lower()
        for t in self.extra:
            start = 0
            tl = t.lower()
            while True:
                i = low.find(tl, start)
                if i < 0:
                    break
                if free(i, i + len(t)):
                    out.append((i, i + len(t), "term"))
                start = i + len(t)
        out.sort()
        return out

    def scan(self, obj, path="$", key=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                # keys can carry data too (for example "item/Contoso_x0020_ID")
                if isinstance(k, str):
                    for a, b, kind in self.spans(k, path + ".<key>"):
                        self._add(kind, k[a:b], path + ".<key>")
                self.scan(v, f"{path}.{k}", str(k))
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                self.scan(v, f"{path}[{i}]", key)
        elif isinstance(obj, str):
            for a, b, kind in self.spans(obj, path, key):
                self._add(kind, obj[a:b], path)

    def numbered(self) -> list[dict]:
        out = []
        for k, f in enumerate(self.findings.values(), 1):
            f["id"] = f"M{k}"
            out.append(f)
        return out


def _mask_rest(rest: str) -> str:
    """Mask GUIDs and email-ish parts that trail a site URL (lists, folders)."""
    rest = GUID_RX.sub("00000000-0000-4000-8000-000000000000", rest)
    return re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", "alex@contoso.com", rest)


def apply_map(obj, masker: Masker, table: dict, missing: list, path="$", key=""):
    """Return a deep copy of obj with every detected value replaced through table (fingerprint -> replacement)."""
    def fix(s: str, p: str, k: str) -> str:
        sp = masker.spans(s, p, k)
        if not sp:
            return s
        out, last = [], 0
        for a, b, kind in sp:
            v = s[a:b]
            if masker._safe(kind, v):
                continue
            fp = fingerprint(v)
            if fp not in table:
                missing.append({"kind": kind, "preview": preview(kind, v), "fingerprint": fp, "where": p})
                rep = "[UNMAPPED]"
            else:
                rep = table[fp]
            out.append(s[last:a])
            out.append(rep)
            last = b
        out.append(s[last:])
        return "".join(out)

    if isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            nk = fix(k, path + ".<key>", "") if isinstance(k, str) else k
            new[nk] = apply_map(v, masker, table, missing, f"{path}.{k}", str(k))
        return new
    if isinstance(obj, list):
        return [apply_map(v, masker, table, missing, f"{path}[{i}]", key) for i, v in enumerate(obj)]
    if isinstance(obj, str):
        return fix(obj, path, key)
    return obj


def load_map(path: str) -> tuple[dict, dict]:
    doc = json.loads(Path(path).read_text(encoding="utf-8"))
    if doc.get("schema") != MAP_SCHEMA:
        raise ExportError(f"{path}: not a {MAP_SCHEMA} file")
    table = {}
    for e in doc.get("entries", []):
        rep = e.get("replacement")
        if rep is None or rep == "":
            raise ExportError(f"{path}: entry {e.get('id')} has no replacement")
        table[e["fingerprint"]] = "[REDACTED]" if e.get("action") == "redact" and rep in ("", None) else rep
    return doc, table


def report_doc(graph_name: str, findings: list[dict], fmt: str, warnings: list[str], dropped: list[str]) -> dict:
    return {
        "schema": "flow-masking-report/1",
        "flow": graph_name,
        "format": fmt,
        "findings": [{k: v for k, v in f.items() if not k.startswith("_")} for f in findings],
        "metadataDropped": dropped,
        "warnings": warnings,
        "note": "Previews are redacted on purpose. Real values stay in the export and are never written by this tool.",
    }


def map_doc(findings: list[dict]) -> dict:
    return {
        "schema": MAP_SCHEMA,
        "approved": False,
        "approvedBy": "",
        "entries": [{"id": f["id"], "kind": f["kind"], "fingerprint": f["fingerprint"], "preview": f["preview"],
                     "replacement": f["replacement"], "action": f["action"]} for f in findings],
    }


def masking_markdown(findings: list[dict], flow_name: str) -> str:
    lines = [f"# Masking table: {flow_name}", "",
             "Previews are redacted. The real values stay inside the export and are never written to any output.", "",
             "| ID | What it is | Where | Real value (redacted) | Fictional replacement | Action |",
             "| --- | --- | --- | --- | --- | --- |"]
    labels = {"personal-site-url": "Personal OneDrive site URL", "sharepoint-url": "SharePoint site URL", "url": "External URL",
              "secret-url": "URL with a key or signature", "tenant-host": "Tenant host name", "personal-path": "Personal site path",
              "email": "Email address", "connection-display-name": "Connection display name (sign-in account)",
              "guid": "GUID (list, flow, or resource ID)", "connection-id": "Connection ID", "hex-id": "Hex ID",
              "secret": "Key, token, or password", "term": "Name you asked to hide"}
    for f in findings:
        where = ", ".join(w.replace("$.", "").replace("|", "/") for w in f["where"][:3])
        lines.append(f"| {f['id']} | {labels.get(f['kind'], f['kind'])} | `{where}` | `{f['preview']}` | `{f['replacement']}` | {f['action']} |")
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------- CLI


def parse(path: str, flow_sel: str | None = None):
    src = Source(path)
    fmt, flows = load_flows(src)
    if len(flows) > 1 and flow_sel is None:
        names = ", ".join(f"[{i}] {f['displayName']}" for i, f in enumerate(flows))
        raise ExportError(f"The export has {len(flows)} cloud flows: {names}. Pick one with --flow.")
    flow = flows[0]
    if flow_sel is not None:
        pick = [f for i, f in enumerate(flows) if str(i) == flow_sel or f["displayName"] == flow_sel or f["id"] == flow_sel]
        if not pick:
            raise ExportError(f"No flow named {flow_sel!r}.")
        flow = pick[0]
    return fmt, flows, build_graph(fmt, flow)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="export zip, unzipped folder, or definition JSON")
    ap.add_argument("--flow", help="flow index or display name when a solution has several flows")
    ap.add_argument("--list", action="store_true", help="list the cloud flows in the export and exit")
    ap.add_argument("--report", help="write the masking report JSON (redacted previews only)")
    ap.add_argument("--report-md", help="write the masking table as Markdown")
    ap.add_argument("--map-out", help="write a masking map template to edit and approve")
    ap.add_argument("--map", help="approved masking map; required to write a graph")
    ap.add_argument("-o", "--out", help="write the masked step graph JSON")
    ap.add_argument("--extra-terms", default="", help="comma separated names to hide (company, people). Not written anywhere.")
    ap.add_argument("--raw", action="store_true", help="debug only: write the graph without masking")
    a = ap.parse_args(argv)
    try:
        fmt, flows, graph = parse(a.input, a.flow)
    except ExportError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if a.list:
        for i, f in enumerate(flows):
            print(f"[{i}] {f['displayName']}  ({f['path']})")
        return 0
    masker = Masker([t.strip() for t in a.extra_terms.split(",")])
    masker.scan(graph)
    findings = masker.numbered()
    name = graph["flow"]["displayName"]
    if a.report:
        Path(a.report).write_text(json.dumps(report_doc(name, findings, fmt, graph["warnings"], graph["metadataDropped"]), indent=2) + "\n")
    if a.report_md:
        Path(a.report_md).write_text(masking_markdown(findings, name))
    if a.map_out:
        Path(a.map_out).write_text(json.dumps(map_doc(findings), indent=2) + "\n")
    print(f"{fmt}: '{name}', {graph['counts']['steps']} steps, depth {graph['counts']['maxDepth']}, "
          f"{len(findings)} masking findings, {len(graph['warnings'])} warnings", file=sys.stderr)
    if a.out:
        if a.raw:
            out = graph
        else:
            if not a.map:
                print("error: --map (an approved masking map) is required to write a graph. Use --map-out first.", file=sys.stderr)
                return 3
            doc, table = load_map(a.map)
            if not doc.get("approved"):
                print("error: the masking map is not approved yet. Review it and set \"approved\": true.", file=sys.stderr)
                return 3
            missing: list = []
            out = apply_map(graph, Masker([t.strip() for t in a.extra_terms.split(",")]), table, missing)
            if missing:
                print("error: values found that the map does not cover:", file=sys.stderr)
                for m in missing:
                    print(f"  {m['kind']} {m['preview']} at {m['where']} ({m['fingerprint']})", file=sys.stderr)
                return 4
            out["masking"] = {"map": os.path.basename(a.map), "entries": len(table), "approvedBy": doc.get("approvedBy", "")}
        Path(a.out).write_text(json.dumps(out, indent=2, ensure_ascii=True) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
