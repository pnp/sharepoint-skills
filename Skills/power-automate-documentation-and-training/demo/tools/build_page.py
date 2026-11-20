#!/usr/bin/env python3
"""Build one SharePoint-ready flow training page.

Inputs:
  --graph    masked step graph from parse_flow.py (or one Copilot wrote by hand, same schema)
  --map      the approved masking map (a second safety pass over the graph and the copy)
  --content  the chat handoff file (YAML or JSON): goal, audience, what/why/how, guardrails,
             quick checks, checklist. See references/content-schema.md.
  -o         output HTML

The page structure comes only from the graph. The content file may change wording but
cannot add steps: an unknown step id is an error.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import parse_flow as pf  # noqa: E402

_INNER = "power-automate-documentation-and-training"
_CANDIDATES = [HERE.parent / _INNER / "templates", HERE.parent.parent / _INNER / "templates", HERE.parent / "templates"]
DEFAULT_TEMPLATE = next((c / "flow-training-template.html" for c in _CANDIDATES if (c / "flow-training-template.html").exists()),
                        _CANDIDATES[0] / "flow-training-template.html")
DOT = "\u00b7"

ICONS = {
    "rss": ("RSS", "#c2571a"), "conversionservice": ("</>", "#2f6b6b"), "sharepointonline": ("S", "#036c70"),
    "office365": ("@", "#0f5ea8"), "teams": ("T", "#4b53bc"), "approvals": ("OK", "#417B5A"),
    "office365users": ("U", "#0f5ea8"), "commondataserviceforapps": ("DV", "#164C80"), "onedriveforbusiness": ("1D", "#0f5ea8"),
    "excelonlinebusiness": ("X", "#217346"), "planner": ("P", "#31752f"),
}
BUILTIN_ICONS = {
    "recurrence": ("\u23f1", "#164C80"), "request": ("\u25b6", "#164C80"), "http": ("{ }", "#03274A"), "compose": ("{ }", "#5b4a8a"),
    "initializevariable": ("x", "#5b4a8a"), "setvariable": ("x", "#5b4a8a"), "incrementvariable": ("x+", "#5b4a8a"),
    "appendtoarrayvariable": ("x+", "#5b4a8a"), "wait": ("||", "#7a6200"), "select": ("\u2261", "#2f6b6b"),
    "query": ("\u2261", "#2f6b6b"), "parsejson": ("{ }", "#2f6b6b"), "terminate": ("\u25a0", "#a5483a"), "response": ("\u21a9", "#164C80"),
}
PARAM_LABELS = {"dataset": "Site Address", "table": "List Name", "feedUrl": "RSS feed URL", "Content": "Content",
                "id": "Id", "uri": "URI", "method": "Method", "body": "Body", "to": "To", "subject": "Subject"}


class BuildError(Exception):
    pass


def load_content(path: str) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    if path.lower().endswith((".yaml", ".yml")):
        try:
            import yaml
        except ImportError as e:  # pragma: no cover
            raise BuildError("PyYAML is not installed; pass the content as JSON instead.") from e
        return yaml.safe_load(text) or {}
    return json.loads(text)


def friendly(expr: str) -> str:
    e = expr.strip()
    m = re.fullmatch(r"triggerOutputs\(\)\?\['body/([^']+)'\]", e) or re.fullmatch(r"triggerBody\(\)\?\['([^']+)'\]", e)
    if m:
        return f"{m.group(1)} from the trigger"
    m = re.fullmatch(r"body\('([^']+)'\)", e)
    if m:
        return f"output of {pf._label(m.group(1))}"
    m = re.fullmatch(r"(?:outputs|body)\('([^']+)'\)\?\['(?:body/)?([^']+)'\]", e)
    if m:
        return f"{m.group(2)} from {pf._label(m.group(1))}"
    m = re.fullmatch(r"items\('([^']+)'\)\?\['([^']+)'\]", e)
    if m:
        return f"{m.group(2)} of the current item"
    m = re.fullmatch(r"variables\('([^']+)'\)", e)
    if m:
        return f"variable {m.group(1)}"
    return ""


def show_value(v: str) -> str:
    if not isinstance(v, str):
        v = json.dumps(v)
    if v.startswith("@") and not v.startswith("@{"):
        expr = v[1:]
        fr = friendly(expr)
        return f"`{expr}`" + (f" ({fr})" if fr else "")
    if "@{" in v:
        return f"`{v}`"
    return f"`{v}`" if len(v) < 80 else f"`{v[:77]}...`"


def param_label(path: str) -> str:
    if path in PARAM_LABELS:
        return PARAM_LABELS[path]
    leaf = re.sub(r"\[\d+\]", "", path.split("/")[-1]) or path
    leaf = PARAM_LABELS.get(leaf, re.sub(r"_x0020_", " ", leaf).replace("_", " "))
    return leaf[:1].upper() + leaf[1:]


def derived_cfg(st: dict) -> list:
    cfg = []
    sett = st.get("settings") or {}
    rec = sett.get("recurrence")
    if isinstance(rec, dict):
        n, unit = rec.get("interval", 1), str(rec.get("frequency", "")).lower()
        cfg.append(["Checks every", f"{n} {unit}{'' if n == 1 else 's'}"])
    if sett.get("splitOn"):
        cfg.append(["Split on", show_value(sett["splitOn"])])
    if sett.get("foreach"):
        cfg.append(["Input", show_value(sett["foreach"])])
    if sett.get("expressionText"):
        cfg.append(["Expression", f"`{sett['expressionText']}`"])
    if isinstance(sett.get("limit"), dict):
        lim = sett["limit"]
        cfg.append(["Limit", f"{lim.get('count', '')} loops, timeout {lim.get('timeout', '')}".strip()])
    for k, v in (st.get("inputs") or {}).items():
        cfg.append([param_label(k), show_value(v)])
    if not cfg:
        cfg.append(["Settings", "Defaults"])
    return cfg[:10]


def as_cfg(how) -> list:
    if how is None:
        return None
    if isinstance(how, dict):
        return [[str(k), str(v)] for k, v in how.items()]
    out = []
    for row in how:
        if isinstance(row, dict):
            out.append([str(row.get("label", "")), str(row.get("value", ""))])
        else:
            out.append([str(row[0]), str(row[1])])
    return out


def as_quiz(q):
    if not q:
        return None
    opts = []
    for o in q.get("options") or q.get("opts") or []:
        opts.append({"t": o.get("text", o.get("t")), "ok": bool(o.get("correct", o.get("ok"))), "fb": o.get("feedback", o.get("fb", ""))})
    if sum(1 for o in opts if o["ok"]) != 1:
        raise BuildError(f"quick check '{q.get('ask')}' needs exactly one correct option")
    return {"ask": q["ask"], "opts": opts}


def build_data(graph: dict, content: dict, warnings: list) -> dict:
    steps = {s["id"]: s for s in graph["steps"]}
    cs = content.get("steps") or {}
    unknown = [k for k in cs if k not in steps and "__empty_" not in k]
    if unknown:
        raise BuildError("content describes steps that are not in the flow: " + ", ".join(unknown))
    guards = list(content.get("guardrails") or [])
    # number guardrails in flow order, so GUARDRAIL 1 is the first one the learner meets
    pos = {s["id"]: s["order"] for s in graph["steps"]}
    guards.sort(key=lambda g: pos.get(g.get("step"), 10 ** 6))
    gmap = {}
    for n, g in enumerate(guards, 1):
        if g.get("step"):
            if g["step"] not in steps:
                raise BuildError(f"guardrail '{g.get('title')}' points at unknown step {g['step']}")
            gmap[g["step"]] = [n, g["title"]]

    out: list[dict] = []

    def branch_meta(parent: dict, br: str):
        if parent["kind"] == "condition":
            return ("YES", "yes") if br == "actions" else ("NO", "no")
        if br == "default":
            return ("Default", "default")
        case = (parent.get("settings") or {}).get("cases", {}).get(br[5:], br[5:])
        return (str(case), br)

    def emit(sid: str, parent_id=None, br=None, arm=None):
        st = steps[sid]
        c = cs.get(sid) or {}
        kind = st["kind"]
        d = {"id": sid}
        if parent_id:
            d["parent"] = parent_id
            d["branch"] = br
        if arm:
            d["armName"], d["armLabel"] = arm
        if kind == "trigger":
            d["kind"], d["trigger"] = "node", True
        elif kind in ("foreach", "until", "scope"):
            d["kind"], d["loop"] = "loop", kind
        elif kind in ("condition", "switch"):
            d["kind"] = "cond"
        else:
            d["kind"] = "node"
        if st.get("onFailure"):
            d["onFailure"] = True
        d["title"] = c.get("title") or st["label"]
        d["k"] = c.get("kicker") or f"{st['group']} {DOT} {st['operation']}"
        sett = st.get("settings") or {}
        if c.get("sub"):
            d["sub"] = c["sub"]
        elif kind in ("condition", "until"):
            d["sub"] = (sett.get("expressionText") or "")[:60]
        else:
            d["sub"] = f"{st['group']} {DOT} {st['operation']}"
        if d["kind"] == "node":
            api = (st.get("connector") or {}).get("apiName")
            ic = ICONS.get(api) or BUILTIN_ICONS.get((st.get("type") or "").lower())
            if c.get("icon") or ic:
                d["icon"] = c.get("icon") or ic[0]
            if c.get("iconBg") or ic:
                d["iconBg"] = c.get("iconBg") or ic[1]
        for key in ("what", "why", "tip", "packet", "label", "laps", "counter", "tag"):
            if c.get(key) is not None:
                d[key] = c[key]
        if not d.get("what"):
            d["what"] = f"{st['operation']} ({st['group']})."
            warnings.append(f"{sid}: no 'what' in the content; used a placeholder")
        if not d.get("why"):
            d["why"] = "TODO: why this step is here, linked to the step before, the step after, and the goal."
            warnings.append(f"{sid}: no 'why' in the content; placeholder written")
        d["cfg"] = as_cfg(c.get("how")) or derived_cfg(st)
        if c.get("quiz"):
            d["quiz"] = as_quiz(c["quiz"])
        if sid in gmap:
            d["guard"] = gmap[sid]
        if c.get("crumb"):
            d["crumb"] = list(c["crumb"])
        if kind in ("foreach",) and "counter" not in d:
            d["counter"] = {"label": "items"}
        out.append(d)
        ch = st.get("children") or {}
        if kind in ("foreach", "until", "scope"):
            for k in ch.get("actions", []):
                emit(k, sid, "actions")
        elif kind in ("condition", "switch"):
            brs = ["actions", "else"] if kind == "condition" else [b for b in ch if b.startswith("case:")] + ["default"]
            for b in brs:
                name, key = branch_meta(st, b)
                lab = ((c.get("arms") or {}).get(key)) or name
                kids = ch.get(b, [])
                if not kids:
                    eid = f"{sid}__empty_{key}"
                    ec = cs.get(eid) or {}
                    out.append({"id": eid, "kind": "node", "empty": True, "parent": sid, "branch": key, "armName": name,
                                "armLabel": lab, "title": ec.get("title", "No action"), "sub": ec.get("sub", "This arm is empty"),
                                "k": "No action", "icon": "\u2013", "what": ec.get("what", "Nothing runs on this arm."),
                                "why": ec.get("why", "This arm is left empty on purpose, so the flow simply moves on."),
                                "cfg": as_cfg(ec.get("how")) or [["Actions", "None"]]})
                    continue
                for j, k in enumerate(kids):
                    emit(k, sid, key, (name, lab) if j == 0 else None)

    for sid in [graph["steps"][0]["id"]] + graph["topLevel"]:
        emit(sid)
    # mark arm names on every step of an arm (template reads armName on the first)
    fill_crumbs(out, steps)
    parts = content.get("parts") or []
    ids = {d["id"] for d in out}
    for p in parts:
        bad = [s for s in p.get("steps", []) if s not in ids]
        if bad:
            raise BuildError(f"part '{p.get('title')}' lists unknown steps: {', '.join(bad)}")
    checks = content.get("checks") or {}
    meta = content.get("meta") or {}
    title = meta.get("title") or f"Build the flow: {graph['flow']['displayName']}"
    return {
        "meta": {
            "title": title,
            "eyebrow": meta.get("eyebrow") or f"Training module {DOT} Power Automate",
            "lede": meta.get("lede") or "Click + to add each step. It draws itself, and a card explains what it does and how to set it up.",
            "summaryHeading": meta.get("summaryHeading") or "You built the flow",
            "summaryLead": meta.get("summaryLead") or content.get("goal") or "",
        },
        "steps": out,
        "parts": [{"title": p["title"], "steps": p.get("steps", [])} for p in parts],
        "guards": [[g["title"], g["text"]] for g in guards],
        "checks": {
            "title": checks.get("title") or "What you covered",
            "center": checks.get("center") or "covered",
            "caption": checks.get("caption") or "One slice per item",
            "items": [{"t": (i if isinstance(i, str) else i.get("text")), "done": True if isinstance(i, str) else bool(i.get("done", True))}
                      for i in checks.get("items", [])],
        },
    }


def fill_crumbs(out: list, steps: dict):
    by = {d["id"]: d for d in out}
    seqs: dict = {}
    for d in out:
        seqs.setdefault((d.get("parent"), d.get("branch")), []).append(d["id"])

    def after(d):
        """What comes after d finishes, walking up the tree."""
        key = (d.get("parent"), d.get("branch"))
        seq = seqs[key]
        k = seq.index(d["id"])
        if k + 1 < len(seq):
            return by[seq[k + 1]]["title"]
        if d.get("parent") is None:
            return "Finish"
        p = by[d["parent"]]
        if p.get("loop") == "foreach":
            return "Next item"
        if p.get("loop") == "until":
            return "Check again, or exit"
        return after(p)

    for d in out:
        if d.get("crumb"):
            continue
        key = (d.get("parent"), d.get("branch"))
        seq = seqs[key]
        k = seq.index(d["id"])
        if d.get("trigger"):
            prev = "Start"
        elif k > 0:
            prev = by[seq[k - 1]]["title"]
        else:
            p = by[d["parent"]]
            if p["kind"] == "cond":
                prev = f"{p['title']}: {d.get('armName', d.get('branch'))}"
            elif p.get("loop") == "foreach":
                prev = f"{p['title']}: one item"
            elif p.get("loop") == "until":
                prev = f"{p['title']}: new lap"
            else:
                prev = p["title"]
        if d["kind"] == "cond":
            arms = [x.get("armName") for x in out if x.get("parent") == d["id"] and x.get("armName")]
            nxt = " or ".join(arms[:3]) + " arm" if arms else after(d)
        elif d["kind"] == "loop":
            kids = seqs.get((d["id"], "actions"), [])
            nxt = by[kids[0]]["title"] if kids else after(d)
        else:
            nxt = after(d)
        d["crumb"] = [prev, nxt]


def safety_pass(data: dict, map_path: str | None, warnings: list) -> dict:
    table = {}
    if map_path:
        doc, table = pf.load_map(map_path)
        if not doc.get("approved"):
            raise BuildError("the masking map is not approved")
    missing: list = []
    masked = pf.apply_map(data, pf.Masker(), table, missing)
    if missing:
        lines = [f"  {m['kind']} {m['preview']} at {m['where']}" for m in missing]
        raise BuildError("unmasked values in the page data (add them to the map or remove them):\n" + "\n".join(lines))
    return masked


def ascii_html(s: str) -> str:
    return "".join(c if ord(c) < 128 else f"&#{ord(c)};" for c in html.escape(s, quote=False))


def render(template: str, data: dict, public: bool = False) -> str:
    js = json.dumps(data, ensure_ascii=True, separators=(",", ":")).replace("</", "<\\/")
    start, endm = "/*FLOW_DATA_BEGIN*/", "/*FLOW_DATA_END*/"
    a, b = template.find(start), template.find(endm)
    if a < 0 or b < 0:
        raise BuildError("template has no FLOW_DATA markers")
    out = template[:a + len(start)] + "\nvar DATA=" + js + ";\n" + template[b:]
    meta = data["meta"]
    out = re.sub(r"<title>.*?</title>", "<title>" + ascii_html(meta["title"]) + "</title>", out, count=1, flags=re.S)
    for eid, key in (("ft-title", "title"), ("ft-eyebrow", "eyebrow"), ("ft-lede", "lede")):
        out = re.sub(r'(id="' + eid + r'">)(.*?)(</)', lambda m: m.group(1) + ascii_html(meta[key]) + m.group(3), out, count=1, flags=re.S)
    libs = ""
    if public:
        # Pinned versions with Subresource Integrity. D3 is ISC licensed, Chart.js is MIT licensed.
        libs = ('<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js" '
                'integrity="sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i" crossorigin="anonymous"></script>\n'
                '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js" '
                'integrity="sha384-Emf5ZVIUiarAdhkgtqK+5/Z5qIvM6QoVrS+qAVtfyZVuD5lIHrac0me485+Antp0" crossorigin="anonymous"></script>')
    out = out.replace("<!--FT_PUBLIC_LIBS-->", libs)
    return out


def lint(page: str, public: bool) -> list:
    problems = []
    try:
        page.encode("ascii")
    except UnicodeEncodeError as e:
        problems.append(f"non-ASCII character at {e.start}")
    for bad in ("fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "indexedDB", "document.cookie", "<link", "<iframe"):
        if bad in page:
            problems.append(f"forbidden token {bad!r}")
    if not public and re.search(r"\b(src|href)\s*=\s*[\"']https?:", page):
        problems.append("remote src/href in the SharePoint copy")
    if '["d3","chart.js"]' not in page:
        problems.append("ka-lib-manifest missing")
    return problems


def copy_lint(content: dict) -> list:
    out = []
    text = json.dumps(content, ensure_ascii=False)
    if "\u2014" in text:
        out.append("em dash in the copy")
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--graph", required=True)
    ap.add_argument("--content", required=True)
    ap.add_argument("--map", help="approved masking map (strongly recommended)")
    ap.add_argument("--template", default=str(DEFAULT_TEMPLATE))
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--public-out", help="also write a copy that loads D3 and Chart.js from a pinned CDN")
    ap.add_argument("--data-out", help="also write the page data JSON (for review)")
    ap.add_argument("--strict", action="store_true", help="fail on placeholders and copy warnings")
    a = ap.parse_args(argv)
    warnings: list = []
    try:
        graph = json.loads(Path(a.graph).read_text(encoding="utf-8"))
        if graph.get("schema") != pf.GRAPH_SCHEMA:
            raise BuildError("not a flow-step-graph/1 file")
        content = load_content(a.content)
        data = build_data(graph, content, warnings)
        data = safety_pass(data, a.map, warnings)
        warnings += copy_lint(content)
        if a.strict and warnings:
            raise BuildError("strict mode: " + "; ".join(warnings))
        tpl = Path(a.template).read_text(encoding="utf-8")
        page = render(tpl, data)
        probs = lint(page, False)
        if probs:
            raise BuildError("page lint: " + "; ".join(probs))
        Path(a.out).write_text(page, encoding="ascii")
        if a.public_out:
            pub = render(tpl, data, public=True)
            probs = lint(pub, True)
            if probs:
                raise BuildError("public page lint: " + "; ".join(probs))
            Path(a.public_out).write_text(pub, encoding="ascii")
        if a.data_out:
            Path(a.data_out).write_text(json.dumps(data, indent=2, ensure_ascii=True) + "\n")
    except (BuildError, pf.ExportError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    for w in warnings:
        print("warning: " + w, file=sys.stderr)
    print(f"wrote {a.out}: {len(data['steps'])} steps, {len(data['guards'])} guardrails, "
          f"{sum(1 for s in data['steps'] if s.get('quiz'))} quick checks", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
