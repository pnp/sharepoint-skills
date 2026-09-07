#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import struct
import sys
from datetime import date
from pathlib import Path, PurePosixPath
from urllib.parse import unquote

CANONICAL_DISCLAIMER = (
    "**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR "
    "IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, "
    "MERCHANTABILITY, OR NON-INFRINGEMENT.**"
)
MONTHS = (
    "January|February|March|April|May|June|July|August|September|October|November|December"
)
REQUIRED_SAMPLE_FIELDS = {
    "name",
    "source",
    "title",
    "shortDescription",
    "url",
    "longDescription",
    "creationDateTime",
    "updateDateTime",
    "products",
    "metadata",
    "thumbnails",
    "authors",
    "references",
}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MIN_PREVIEW_WIDTH = 640
MIN_PREVIEW_HEIGHT = 360


class Validator:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.skills_root = self.root / "Skills"
        self.errors: list[tuple[Path, str]] = []
        self.sample_names: dict[str, Path] = {}
        self.skill_count = 0
        self.demo_count = 0

    def error(self, path: Path, message: str) -> None:
        self.errors.append((path, message))

    @staticmethod
    def exact_child(parent: Path, name: str) -> Path | None:
        if not parent.is_dir():
            return None
        return next((child for child in parent.iterdir() if child.name == name), None)

    def relative(self, path: Path) -> str:
        try:
            return path.relative_to(self.root).as_posix()
        except ValueError:
            return path.as_posix()

    def validate(self) -> None:
        if not self.skills_root.is_dir():
            self.error(self.skills_root, "Skills directory is missing")
            return

        skill_dirs = sorted(
            (path for path in self.skills_root.iterdir() if path.is_dir()),
            key=lambda path: path.name,
        )
        self.skill_count = len(skill_dirs)
        if not skill_dirs:
            self.error(self.skills_root, "No skill folders were found")
            return

        for outer in skill_dirs:
            self.validate_skill(outer)

    def validate_skill(self, outer: Path) -> None:
        skill = outer.name
        if re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", skill) is None:
            self.error(outer, "outer folder name must be lowercase kebab-case")

        expected_directories = {skill, "assets", "demo"}
        unexpected = sorted(
            child.name
            for child in outer.iterdir()
            if child.is_dir() and child.name not in expected_directories
        )
        if unexpected:
            self.error(outer, f"unexpected outer subfolders: {', '.join(unexpected)}")

        inner = self.exact_child(outer, skill)
        if inner is None or not inner.is_dir():
            self.error(outer, f"missing exact same-name inner package: {skill}/")
        else:
            self.validate_manifest(skill, inner)

        readme = self.exact_child(outer, "README.md")
        assets = self.exact_child(outer, "assets")
        if readme is None or not readme.is_file():
            self.error(outer / "README.md", "required outer README.md is missing")
        if assets is None or not assets.is_dir():
            self.error(outer / "assets", "required assets directory is missing")
            return

        sample_path = self.exact_child(assets, "sample.json")
        preview_path = self.exact_child(assets, "preview.png")
        sample = None
        if sample_path is None or not sample_path.is_file():
            self.error(assets / "sample.json", "required sample.json is missing")
        else:
            sample = self.validate_sample(skill, sample_path, preview_path)

        if preview_path is None or not preview_path.is_file():
            self.error(assets / "preview.png", "required preview.png is missing")
        else:
            self.validate_preview(preview_path)

        if readme is not None and readme.is_file():
            self.validate_readme(skill, outer, readme, sample)

        demo = self.exact_child(outer, "demo")
        if demo is not None and demo.is_dir():
            self.demo_count += 1
            demo_readme = self.exact_child(demo, "README.md")
            if demo_readme is None or not demo_readme.is_file():
                self.error(demo / "README.md", "demo folder must contain exact-case README.md")

    def validate_manifest(self, skill: str, inner: Path) -> None:
        manifest = self.exact_child(inner, "SKILL.md")
        if manifest is None or not manifest.is_file():
            self.error(inner / "SKILL.md", "inner package must contain exact-case SKILL.md")
            return

        text = manifest.read_text(encoding="utf-8-sig")
        lines = text.splitlines()
        if not lines or lines[0] != "---":
            self.error(manifest, "SKILL.md must begin with YAML frontmatter")
            return
        try:
            closing_index = lines.index("---", 1)
        except ValueError:
            self.error(manifest, "SKILL.md frontmatter is not closed")
            return

        frontmatter = "\n".join(lines[1:closing_index])
        name_match = re.search(r"^name:\s*['\"]?([^'\"\r\n]+)", frontmatter, re.M)
        if name_match is None:
            self.error(manifest, "frontmatter name is missing")
        elif name_match.group(1).strip() != skill:
            self.error(
                manifest,
                f"frontmatter name must exactly match folder '{skill}'",
            )
        if re.search(r"^description:\s*(?:\S.*)?$", frontmatter, re.M) is None:
            self.error(manifest, "frontmatter description is missing")

    def validate_sample(
        self,
        skill: str,
        sample_path: Path,
        preview_path: Path | None,
    ) -> dict[str, object] | None:
        try:
            parsed = json.loads(sample_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as error:
            self.error(sample_path, f"invalid JSON: {error}")
            return None

        if not isinstance(parsed, list) or len(parsed) != 1:
            self.error(sample_path, "top level must be an array containing exactly one entry")
            return None
        sample = parsed[0]
        if not isinstance(sample, dict):
            self.error(sample_path, "gallery entry must be an object")
            return None

        missing = sorted(REQUIRED_SAMPLE_FIELDS - sample.keys())
        if missing:
            self.error(sample_path, f"missing required fields: {', '.join(missing)}")

        expected_name = f"pnp-sharepoint-skills-{skill}"
        expected_url = f"https://github.com/pnp/sharepoint-skills/tree/main/Skills/{skill}"
        expected_thumbnail = (
            f"https://github.com/pnp/sharepoint-skills/raw/main/Skills/{skill}/assets/preview.png"
        )
        if sample.get("name") != expected_name:
            self.error(sample_path, f"name must be '{expected_name}'")
        elif expected_name in self.sample_names:
            self.error(sample_path, f"duplicate sample name '{expected_name}'")
        else:
            self.sample_names[expected_name] = sample_path
        if sample.get("source") != "pnp":
            self.error(sample_path, "source must be 'pnp'")
        if sample.get("url") != expected_url:
            self.error(sample_path, f"url must be '{expected_url}'")

        for field in ("title", "shortDescription"):
            if not isinstance(sample.get(field), str) or not str(sample[field]).strip():
                self.error(sample_path, f"{field} must be a non-empty string")
        paragraphs = sample.get("longDescription")
        if (
            not isinstance(paragraphs, list)
            or not paragraphs
            or any(not isinstance(item, str) or not item.strip() for item in paragraphs)
        ):
            self.error(sample_path, "longDescription must contain non-empty paragraphs")

        dates: dict[str, date] = {}
        for field in ("creationDateTime", "updateDateTime"):
            try:
                parsed_date = date.fromisoformat(str(sample.get(field, "")))
                if parsed_date.isoformat() != sample.get(field):
                    raise ValueError
                dates[field] = parsed_date
                if parsed_date > date.today():
                    self.error(sample_path, f"{field} cannot be in the future")
            except ValueError:
                self.error(sample_path, f"{field} must use yyyy-mm-dd")
        if (
            "creationDateTime" in dates
            and "updateDateTime" in dates
            and dates["creationDateTime"] > dates["updateDateTime"]
        ):
            self.error(sample_path, "creationDateTime cannot be after updateDateTime")

        products = sample.get("products")
        if not isinstance(products, list) or not {
            "SharePoint",
            "Microsoft 365 Copilot",
        }.issubset(products):
            self.error(sample_path, "products must include SharePoint and Microsoft 365 Copilot")

        metadata = sample.get("metadata")
        metadata = metadata if isinstance(metadata, list) else []
        sample_types = [
            item
            for item in metadata
            if isinstance(item, dict)
            and item.get("key") == "SAMPLE-TYPE"
            and item.get("value") == "SharePoint-AI-Skill"
        ]
        categories = [
            item
            for item in metadata
            if isinstance(item, dict)
            and item.get("key") == "SKILL-CATEGORY"
            and isinstance(item.get("value"), str)
            and item["value"].strip()
        ]
        if len(sample_types) != 1:
            self.error(sample_path, "metadata must contain one SAMPLE-TYPE=SharePoint-AI-Skill")
        if len(categories) != 1:
            self.error(sample_path, "metadata must contain one non-empty SKILL-CATEGORY")

        thumbnails = sample.get("thumbnails")
        if not isinstance(thumbnails, list) or not thumbnails or not isinstance(thumbnails[0], dict):
            self.error(sample_path, "thumbnails must contain at least one object")
        else:
            thumbnail = thumbnails[0]
            if thumbnail.get("type") != "image":
                self.error(sample_path, "first thumbnail type must be 'image'")
            if thumbnail.get("order") != 100:
                self.error(sample_path, "first thumbnail order must be 100")
            if thumbnail.get("url") != expected_thumbnail:
                self.error(sample_path, f"first thumbnail url must be '{expected_thumbnail}'")
            if not isinstance(thumbnail.get("alt"), str) or not thumbnail["alt"].strip():
                self.error(sample_path, "first thumbnail alt text must be non-empty")
            if preview_path is None or not preview_path.is_file():
                self.error(sample_path, "thumbnail URL has no corresponding local preview.png")

        authors = sample.get("authors")
        if not isinstance(authors, list) or not authors:
            self.error(sample_path, "authors must contain at least one author")
        else:
            for index, author in enumerate(authors):
                if not isinstance(author, dict):
                    self.error(sample_path, f"authors[{index}] must be an object")
                    continue
                for field in ("gitHubAccount", "pictureUrl", "name"):
                    if not isinstance(author.get(field), str) or not author[field].strip():
                        self.error(sample_path, f"authors[{index}].{field} must be non-empty")
                account = author.get("gitHubAccount", "")
                if re.search(r"your|placeholder|todo|tbd|example", account, re.I):
                    self.error(sample_path, f"authors[{index}].gitHubAccount is a placeholder")
                if author.get("pictureUrl") != f"https://github.com/{account}.png":
                    self.error(sample_path, f"authors[{index}].pictureUrl does not match account")

        references = sample.get("references")
        references = references if isinstance(references, list) else []
        if not any(
            isinstance(reference, dict)
            and reference.get("url") == "https://agentskills.io/specification"
            for reference in references
        ):
            self.error(sample_path, "references must include the agentskills.io specification")
        for index, reference in enumerate(references):
            if not isinstance(reference, dict):
                self.error(sample_path, f"references[{index}] must be an object")
                continue
            for field in ("name", "description", "url"):
                if not isinstance(reference.get(field), str) or not reference[field].strip():
                    self.error(sample_path, f"references[{index}].{field} must be non-empty")
            if isinstance(reference.get("url"), str) and not reference["url"].startswith("https://"):
                self.error(sample_path, f"references[{index}].url must be absolute HTTPS")

        return sample

    def validate_readme(
        self,
        skill: str,
        outer: Path,
        readme_path: Path,
        sample: dict[str, object] | None,
    ) -> None:
        text = readme_path.read_text(encoding="utf-8-sig")
        for heading in ("What you get", "SharePoint Skill", "Version history", "Disclaimer"):
            if re.search(rf"^## {re.escape(heading)}\s*$", text, re.M) is None:
                self.error(readme_path, f"missing exact heading '## {heading}'")
        if re.search(r"!\[[^\]]*\]\(\./assets/preview\.png\)", text) is None:
            self.error(readme_path, "preview must use ./assets/preview.png")
        stats_url = (
            "https://m365-visitor-stats.azurewebsites.net/"
            f"sharepoint-skills/skills/{skill}"
        )
        if stats_url not in text:
            self.error(readme_path, "visitor-stats URL is missing or does not match folder")
        if re.search(rf"^\|\s*{re.escape(skill)}\s*\|", text, re.M) is None:
            self.error(readme_path, "credits Solution must exactly match folder name")
        if CANONICAL_DISCLAIMER not in text:
            self.error(readme_path, "disclaimer does not match the repository template")

        version_section = re.search(
            r"^## Version history\s*$(.*?)(?=^##\s|\Z)",
            text,
            re.M | re.S,
        )
        dates = (
            re.findall(r"^\|\s*\d[^|]*\|\s*([^|]+?)\s*\|", version_section.group(1), re.M)
            if version_section
            else []
        )
        if not dates:
            self.error(readme_path, "version history must contain at least one version row")
        for value in dates:
            if re.fullmatch(rf"(?:{MONTHS}) \d{{4}}", value.strip()) is None:
                self.error(readme_path, f"version date must use Month YYYY: '{value.strip()}'")

        if sample is not None:
            authors = sample.get("authors")
            if isinstance(authors, list):
                for author in authors:
                    if isinstance(author, dict):
                        account = author.get("gitHubAccount")
                        if isinstance(account, str) and f"github.com/{account}" not in text:
                            self.error(readme_path, f"missing GitHub link for sample author '{account}'")

        for match in re.finditer(r"!?\[[^\]]*\]\(([^)]+)\)", text):
            self.validate_local_link(readme_path, outer, match.group(1))

    def validate_local_link(self, readme: Path, base: Path, raw_url: str) -> None:
        url = raw_url.strip().strip("<>")
        if re.match(r"^(?:https?://|mailto:|#)", url):
            return
        target = unquote(url.split("#", 1)[0].split("?", 1)[0]).replace("\\", "/")
        current = base
        for part in PurePosixPath(target).parts:
            if part in ("", "."):
                continue
            if part == "..":
                current = current.parent
                continue
            child = self.exact_child(current, part)
            if child is None:
                self.error(readme, f"broken or case-mismatched local link: '{url}'")
                return
            current = child

    def validate_preview(self, preview_path: Path) -> None:
        data = preview_path.read_bytes()
        if len(data) < 24 or data[:8] != PNG_SIGNATURE or data[12:16] != b"IHDR":
            self.error(preview_path, "preview must be a valid PNG")
            return
        width, height = struct.unpack(">II", data[16:24])
        if width < MIN_PREVIEW_WIDTH or height < MIN_PREVIEW_HEIGHT:
            self.error(
                preview_path,
                f"preview must be at least {MIN_PREVIEW_WIDTH}x{MIN_PREVIEW_HEIGHT}, "
                f"found {width}x{height}",
            )
        if len(data) < 10_000:
            self.error(preview_path, "preview is suspiciously small; verify it shows actual output")

    def report(self) -> str:
        lines = [
            "# Skill validation",
            "",
            f"Validated **{self.skill_count}** skill folders and **{self.demo_count}** demo folders.",
            "",
        ]
        if self.errors:
            lines.extend([f"## Errors ({len(self.errors)})", ""])
            lines.extend(
                f"- `{self.relative(path)}`: {message}" for path, message in self.errors
            )
        else:
            lines.extend(["## Result", "", "All repository skill structure and metadata checks passed."])
        lines.extend(
            [
                "",
                "Visual confirmation that each preview shows meaningful skill output remains a manual review.",
                "",
            ]
        )
        return "\n".join(lines)

    def emit_annotations(self) -> None:
        if os.getenv("GITHUB_ACTIONS") != "true":
            return
        for path, message in self.errors:
            escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
            print(f"::error file={self.relative(path)}::{escaped}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate all SharePoint skill packages.")
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    validator = Validator(args.root)
    validator.validate()
    report = validator.report()
    print(report)
    if args.report:
        args.report.write_text(report, encoding="utf-8")
    validator.emit_annotations()
    return 1 if validator.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
