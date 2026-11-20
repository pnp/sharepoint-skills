"""Unit tests for parse_flow.py and build_page.py.

Run: python3 -m unittest discover -s tests -v

The real legacy export (Tech Ease RSS) is used when it exists on this machine, set by
FLOW_LEGACY_ZIP or the default path below. It is never copied into the repo, and these
tests only assert on structure and redacted output.
"""
import io
import json
import os
import re
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stderr
from pathlib import Path

HERE = Path(__file__).resolve().parent
for _p in (HERE.parent / "scripts", HERE.parent):
    sys.path.insert(0, str(_p))
import parse_flow as pf  # noqa: E402
import build_page as bp  # noqa: E402

SAMPLE = HERE / "fixtures" / "solution-sample.zip"
SAMPLE_DIR = HERE / "fixtures" / "solution-sample"
LEGACY = Path(os.environ.get("FLOW_LEGACY_ZIP", "/nonexistent/legacy-export.zip"))


def suggested_map(findings):
    doc = pf.map_doc(findings)
    doc["approved"] = True
    return doc


def masked_graph(path, extra=None):
    fmt, flows, graph = pf.parse(str(path))
    m = pf.Masker(extra)
    m.scan(graph)
    findings = m.numbered()
    table = {f["fingerprint"]: f["replacement"] for f in findings}
    missing = []
    out = pf.apply_map(graph, pf.Masker(extra), table, missing)
    return graph, out, findings, missing


def raw_values(zip_path):
    """Every string leaf in the real export, kept in memory only."""
    vals = set()
    with zipfile.ZipFile(zip_path) as z:
        for n in z.namelist():
            if n.endswith(".json"):
                for v in pf._walk_strings(json.loads(z.read(n).decode("utf-8-sig"))):
                    vals.add(v)
    return vals


class SolutionSample(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fmt, cls.flows, cls.g = pf.parse(str(SAMPLE))
        cls.by = {s["id"]: s for s in cls.g["steps"]}

    def test_detects_solution(self):
        self.assertEqual(self.fmt, "solution")
        self.assertEqual(self.g["flow"]["displayName"], "Weekly site request intake")
        self.assertEqual(self.g["flow"]["packageName"], "SiteRequestIntake")

    def test_folder_input_matches_zip(self):
        fmt, _, g = pf.parse(str(SAMPLE_DIR))
        self.assertEqual(fmt, "solution")
        self.assertEqual([s["id"] for s in g["steps"]], [s["id"] for s in self.g["steps"]])

    def test_step_count_and_preorder(self):
        ids = [s["id"] for s in self.g["steps"]]
        self.assertEqual(len(ids), 15)
        self.assertEqual(ids[0], "Every_Monday")
        # runAfter beats JSON order: Initialize_state is listed second but runs first
        self.assertLess(ids.index("Initialize_state"), ids.index("Get_requests"))
        self.assertEqual(ids[ids.index("Apply_to_each_request") + 1], "Is_approved")
        self.assertEqual(ids[-2:], ["Notify_on_failure", "Failure_note"])

    def test_nesting(self):
        b = self.by
        self.assertEqual(b["Apply_to_each_request"]["kind"], "foreach")
        self.assertEqual(b["Is_approved"]["parent"], "Apply_to_each_request")
        self.assertEqual(b["Wait_until_ready"]["kind"], "until")
        self.assertEqual(b["Wait_until_ready"]["branch"], "actions")
        self.assertEqual(b["Check_provisioning"]["parent"], "Wait_until_ready")
        self.assertEqual(b["Check_provisioning"]["depth"], 4)
        self.assertEqual(b["Wait_until_ready"]["children"]["actions"], ["Delay", "Check_provisioning", "Set_state"])
        self.assertEqual(b["Wait_until_ready"]["settings"]["limit"], {"count": 10, "timeout": "PT1H"})

    def test_condition_else_and_switch(self):
        b = self.by
        self.assertEqual(b["Is_approved"]["children"]["actions"], ["Wait_until_ready", "Email_the_owner"])
        self.assertEqual(b["Is_approved"]["children"]["else"], ["By_priority"])
        self.assertEqual(b["By_priority"]["branch"], "else")
        self.assertEqual(b["By_priority"]["kind"], "switch")
        self.assertEqual(b["By_priority"]["children"]["case:Case_high"], ["Post_to_triage"])
        self.assertEqual(b["By_priority"]["children"]["default"], [])
        self.assertEqual(b["By_priority"]["settings"]["cases"], {"Case_high": "High"})
        txt = b["Is_approved"]["settings"]["expressionText"]
        self.assertIn("is equal to \"Approved\"", txt)
        self.assertIn(" AND NOT (", txt)

    def test_connectors_and_operations(self):
        b = self.by
        self.assertEqual(b["Get_requests"]["group"], "SharePoint")
        self.assertEqual(b["Get_requests"]["operation"], "Get items")
        self.assertEqual(b["Email_the_owner"]["operation"], "Send an email (V2)")
        self.assertEqual(b["Every_Monday"]["operation"], "Recurrence")
        self.assertEqual(b["Delay"]["group"], "Schedule")
        refs = {c["key"]: c for c in self.g["connections"]}
        self.assertEqual(refs["shared_teams"]["connectionDisplayName"], "Teams (requests)")
        self.assertEqual(refs["shared_office365"]["connectionName"], "nw_sharedoffice365_2b9c4")

    def test_inputs_and_expressions(self):
        b = self.by
        self.assertEqual(b["Get_requests"]["inputs"]["$filter"], "Status ne 'Done'")
        self.assertIn("items('Apply_to_each_request')?['Title']", b["Post_to_triage"]["expressions"])
        self.assertIn("body('Check_provisioning')?['state']", b["Set_state"]["expressions"])
        self.assertEqual(b["Apply_to_each_request"]["settings"]["foreach"], "@outputs('Get_requests')?['body/value']")
        self.assertEqual(b["Log_count"]["inputs"], {"value": "@length(body('Get_requests')?['value'])"})

    def test_error_handling_and_parallel(self):
        self.assertTrue(self.by["Notify_on_failure"]["onFailure"])
        self.assertEqual(self.by["Notify_on_failure"]["runAfterStatuses"], ["Failed", "TimedOut"])
        self.assertIn("Apply_to_each_request", self.by["Log_count"]["parallelWith"])
        self.assertTrue(any("parallel" in w for w in self.g["warnings"]))
        self.assertTrue(any("error handling" in w for w in self.g["warnings"]))

    def test_masking_finds_everything(self):
        graph, out, findings, missing = masked_graph(SAMPLE)
        kinds = {f["kind"] for f in findings}
        for k in ("sharepoint-url", "secret-url", "secret", "email", "guid", "connection-id"):
            self.assertIn(k, kinds)
        self.assertEqual(missing, [])
        text = json.dumps(out)
        for leak in ("northwind", "Zx9QwErTy7", "abcDEF1234567890", "k9F2mQ7vX3bN8cL1", "5b1f3c2a", "nw_shared", "it-desk@"):
            self.assertNotIn(leak, text)
        self.assertIn("[REDACTED]", text)
        self.assertIn("https://contoso.sharepoint.com/sites/team-site-1", text)
        # previews never carry the raw value
        for f in findings:
            self.assertNotIn("northwind", f["preview"])
            self.assertNotIn("_value", pf.map_doc([f])["entries"][0])

    def test_extra_terms(self):
        m = pf.Masker(["Triage"])
        m.scan(self.g)
        self.assertIn("term", {f["kind"] for f in m.numbered()})


@unittest.skipUnless(LEGACY.exists(), "real legacy export not on this machine")
class LegacyTechEase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fmt, cls.flows, cls.g = pf.parse(str(LEGACY))
        cls.by = {s["id"]: s for s in cls.g["steps"]}

    def test_detects_legacy(self):
        self.assertEqual(self.fmt, "legacy-package")
        self.assertEqual(self.g["flow"]["displayName"], "Tech Ease")
        self.assertEqual(self.g["flow"]["packageName"], "Tech Ease RSS")

    def test_three_steps_in_order(self):
        self.assertEqual([s["id"] for s in self.g["steps"]], ["When_a_feed_item_is_published", "Html_to_text", "Create_item"])
        self.assertEqual(self.g["counts"]["steps"], 3)
        self.assertEqual(self.g["warnings"], [])

    def test_trigger(self):
        t = self.by["When_a_feed_item_is_published"]
        self.assertEqual(t["kind"], "trigger")
        self.assertEqual(t["group"], "RSS")
        self.assertEqual(t["operation"], "When a feed item is published")
        self.assertEqual(t["settings"]["recurrence"], {"frequency": "Minute", "interval": 1})
        self.assertEqual(t["settings"]["splitOn"], "@triggerOutputs()?['body/value']")

    def test_actions(self):
        h, c = self.by["Html_to_text"], self.by["Create_item"]
        self.assertEqual((h["group"], h["operation"]), ("Content Conversion", "Html to text"))
        self.assertEqual(h["after"], [])
        self.assertIn("triggerOutputs()?['body/summary']", h["expressions"])
        self.assertEqual((c["group"], c["operation"]), ("SharePoint", "Create item"))
        self.assertEqual(c["after"], ["Html_to_text"])
        for k in ("item/Title", "item/Link", "item/Summary", "item/PublishedDate"):
            self.assertIn(k, c["inputs"])
        self.assertEqual(c["inputs"]["item/Summary"], "@body('Html_to_text')")

    def test_connection_labels_from_manifest(self):
        refs = {c["key"]: c for c in self.g["connections"]}
        self.assertEqual(refs["shared_conversionservice"]["apiDisplayName"], "Content Conversion")
        self.assertIn("@", refs["shared_sharepointonline"]["connectionDisplayName"])

    def test_masking_covers_the_export(self):
        graph, out, findings, missing = masked_graph(LEGACY)
        kinds = [f["kind"] for f in findings]
        self.assertIn("personal-site-url", kinds)
        self.assertIn("url", kinds)
        self.assertEqual(kinds.count("connection-id"), 3)
        self.assertIn("connection-display-name", kinds)
        self.assertGreaterEqual(kinds.count("guid"), 2)
        self.assertEqual(missing, [])
        text = json.dumps(out)
        # no raw URL, email, GUID, or connection id from the export survives
        for v in raw_values(LEGACY):
            if pf.URL_RX.search(v) and "schema.management" not in v and "static.powerapps" not in v:
                self.assertNotIn(v, text)
            for rx in (pf.EMAIL_RX, pf.GUID_RX, pf.HEX32_RX):
                for m in rx.finditer(v):
                    self.assertNotIn(m.group(0), text)
        self.assertIn("https://contoso-my.sharepoint.com/personal/alex_contoso_com", text)
        self.assertIn("https://example.com/podcast/rss", text)
        self.assertIn("Tech Ease", text)

    def test_markdown_table_is_redacted(self):
        _, _, findings, _ = masked_graph(LEGACY)
        md = pf.masking_markdown(findings, "Tech Ease")
        for v in raw_values(LEGACY):
            if len(v) > 12 and (pf.URL_RX.search(v) or "@" in v and "." in v.split("@")[-1]):
                if "schema.management" in v or "static.powerapps" in v or v.startswith("@"):
                    continue
                self.assertNotIn(v, md)


class LooseDefinition(unittest.TestCase):
    def test_bare_definition_json(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "definition.json"
            p.write_text(json.dumps({"triggers": {"manual": {"type": "Request", "kind": "Button"}},
                                     "actions": {"Compose": {"type": "Compose", "inputs": "hi", "runAfter": {}}}}))
            fmt, _, g = pf.parse(str(p))
            self.assertEqual(fmt, "definition")
            self.assertEqual(g["steps"][0]["operation"], "Manually trigger a flow")
            self.assertEqual(len(g["steps"]), 2)

    def test_not_a_flow(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "x.zip"
            with zipfile.ZipFile(p, "w") as z:
                z.writestr("readme.txt", "nothing")
            with self.assertRaises(pf.ExportError):
                pf.parse(str(p))


class Cli(unittest.TestCase):
    def test_graph_requires_approved_map(self):
        with tempfile.TemporaryDirectory() as d:
            mp, out = Path(d) / "map.json", Path(d) / "g.json"
            with redirect_stderr(io.StringIO()):
                self.assertEqual(pf.main([str(SAMPLE), "-o", str(out)]), 3)
                self.assertEqual(pf.main([str(SAMPLE), "--map-out", str(mp)]), 0)
                self.assertEqual(pf.main([str(SAMPLE), "--map", str(mp), "-o", str(out)]), 3)
                doc = json.loads(mp.read_text())
                doc["approved"] = True
                mp.write_text(json.dumps(doc))
                self.assertEqual(pf.main([str(SAMPLE), "--map", str(mp), "-o", str(out)]), 0)
            self.assertNotIn("northwind", out.read_text())
            self.assertNotIn("northwind", mp.read_text())


class BuildPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _, cls.graph, findings, _ = masked_graph(SAMPLE)
        cls.tmp = tempfile.TemporaryDirectory()
        cls.map = Path(cls.tmp.name) / "map.json"
        cls.map.write_text(json.dumps(suggested_map(findings)))

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def data(self, content):
        return bp.build_data(self.graph, content, [])

    def test_empty_arm_becomes_no_action(self):
        d = self.data({})
        ids = [s["id"] for s in d["steps"]]
        self.assertIn("By_priority__empty_default", ids)
        e = next(s for s in d["steps"] if s["id"] == "By_priority__empty_default")
        self.assertTrue(e["empty"])
        self.assertEqual(e["armName"], "Default")
        first_yes = next(s for s in d["steps"] if s["id"] == "Wait_until_ready")
        self.assertEqual((first_yes["armName"], first_yes["branch"], first_yes["loop"]), ("YES", "yes", "until"))
        self.assertEqual(next(s for s in d["steps"] if s["id"] == "By_priority")["armName"], "NO")

    def test_crumbs_link_previous_and_next(self):
        d = {s["id"]: s for s in self.data({})["steps"]}
        self.assertEqual(d["Every_Monday"]["crumb"], ["Start", "Initialize state"])
        self.assertEqual(d["Delay"]["crumb"][0], "Wait until ready: new lap")
        self.assertEqual(d["Set_state"]["crumb"][1], "Check again, or exit")
        self.assertEqual(d["Email_the_owner"]["crumb"][1], "Next item")
        self.assertEqual(d["Is_approved"]["crumb"][1], "YES or NO arm")
        self.assertEqual(d["Failure_note"]["crumb"][1], "Finish")

    def test_unknown_step_is_rejected(self):
        with self.assertRaises(bp.BuildError):
            self.data({"steps": {"Invented_step": {"what": "x"}}})

    def test_quiz_needs_one_correct(self):
        with self.assertRaises(bp.BuildError):
            self.data({"steps": {"Delay": {"quiz": {"ask": "?", "options": [{"text": "a", "correct": True}, {"text": "b", "correct": True}]}}}})

    def test_guardrails_numbered_in_flow_order(self):
        d = self.data({"guardrails": [{"title": "Late", "text": "t", "step": "Failure_note"}, {"title": "Early", "text": "t", "step": "Every_Monday"}]})
        self.assertEqual(d["guards"][0][0], "Early")
        self.assertEqual(next(s for s in d["steps"] if s["id"] == "Every_Monday")["guard"], [1, "Early"])

    def test_safety_pass_blocks_unmapped_values(self):
        d = self.data({"steps": {"Delay": {"why": "Ask sam.lee@northwind.example first."}}})
        with self.assertRaises(bp.BuildError):
            bp.safety_pass(d, str(self.map), [])

    def test_page_is_ascii_and_sandbox_safe(self):
        with tempfile.TemporaryDirectory() as d:
            g = Path(d) / "g.json"
            g.write_text(json.dumps(self.graph))
            c = Path(d) / "c.json"
            c.write_text(json.dumps({"meta": {"title": "Caf\u00e9 \u00b7 flow"}, "steps": {"Delay": {"why": "Wait </script> here"}}}))
            out, pub = Path(d) / "p.html", Path(d) / "pub.html"
            with redirect_stderr(io.StringIO()):
                rc = bp.main(["--graph", str(g), "--content", str(c), "--map", str(self.map), "-o", str(out), "--public-out", str(pub)])
            self.assertEqual(rc, 0)
            page = out.read_bytes().decode("ascii")
            self.assertIn('class="ka-lib-manifest">["d3","chart.js"]', page)
            self.assertNotIn("cdn.jsdelivr", page)
            self.assertIn("cdn.jsdelivr", pub.read_text())
            self.assertIn("<title>Caf&#233; &#183; flow</title>", page)
            self.assertEqual(page.count("</script>"), page.count("<script"))
            self.assertNotIn("Wait </script>", page)
            self.assertEqual(bp.lint(page, False), [])

    def test_strict_fails_on_placeholders(self):
        with tempfile.TemporaryDirectory() as d:
            g = Path(d) / "g.json"
            g.write_text(json.dumps(self.graph))
            c = Path(d) / "c.json"
            c.write_text("{}")
            with redirect_stderr(io.StringIO()):
                rc = bp.main(["--graph", str(g), "--content", str(c), "--map", str(self.map), "-o", str(Path(d) / "p.html"), "--strict"])
            self.assertEqual(rc, 2)


class SkillInstructions(unittest.TestCase):
    """The SharePoint Copilot path has no code: SKILL.md must force a template copy, not a new page."""

    @classmethod
    def setUpClass(cls):
        cls.tpl_path = Path(bp.DEFAULT_TEMPLATE)
        cls.tpl = cls.tpl_path.read_text(encoding="utf-8")
        cls.skill = (cls.tpl_path.parent.parent / "SKILL.md").read_text(encoding="utf-8")

    def test_hard_rule_one_is_copy_the_template(self):
        rules = self.skill.split("## Hard rules", 1)[1]
        first = rules.strip().splitlines()[0]
        self.assertTrue(first.startswith("1. **The page is the template"), first)
        for phrase in ("templates/flow-training-template.html", "/*FLOW_DATA_BEGIN*/", "never turn it into a dashboard",
                       "Never design or write your own HTML, CSS, or JavaScript", "keep its own markup",
                       "That is expected and fine"):
            self.assertIn(phrase, first)

    def test_description_carries_the_rule(self):
        desc = re.search(r"^description: (.*)$", self.skill, re.M).group(1)
        self.assertIn("keeps the markup, CSS and JavaScript of templates/flow-training-template.html unchanged", desc)
        self.assertIn("SharePoint's own page wrapper is fine", desc)
        self.assertIn("never a page or dashboard of your own design", desc)
        self.assertNotIn("byte", desc)
        self.assertLessEqual(len(desc), 1024)

    def test_generate_step_is_strict_and_self_check_listed(self):
        gen = self.skill.split("### 6. Generate", 1)[1].split("### 7.", 1)[0]
        self.assertNotIn("byte for byte", gen)
        self.assertIn("keep all of its own content unchanged", gen)
        self.assertIn("SharePoint's page-authoring wrapper", gen)
        self.assertIn("Do not wait for another prompt", gen)
        self.assertIn("say exactly that and stop", gen)
        chk = self.skill.split("### 7. Check before you hand it over", 1)[1].split("## Package contents", 1)[0]
        for item in ("Template markers present", "`ka-lib-manifest` present", "`FLOW_DATA` block present",
                     "Step count matches the playback", "Counts in the copy match the data", "No real values", "**Saved:**"):
            self.assertIn(item, chk)

    def test_self_check_markers_exist_in_template(self):
        chk = self.skill.split("### 7. Check before you hand it over", 1)[1].split("## Package contents", 1)[0]
        for marker in re.findall(r'`(id="[^"]+")`', chk):
            self.assertIn(marker, self.tpl, marker)
        self.assertIn("window.__flowTraining", self.tpl)
        self.assertEqual(self.tpl.count("/*FLOW_DATA_BEGIN*/"), 1)
        self.assertEqual(self.tpl.count("/*FLOW_DATA_END*/"), 1)
        self.assertIn('<script type="application/json" class="ka-lib-manifest">["d3","chart.js"]</script>', self.tpl)


if __name__ == "__main__":
    unittest.main()
