#!/usr/bin/env python3
"""Rebuild tests/fixtures/solution-sample.zip from the folder next to it (fixed timestamps)."""
import zipfile
from pathlib import Path
src = Path(__file__).parent / "fixtures" / "solution-sample"
dst = Path(__file__).parent / "fixtures" / "solution-sample.zip"
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(src.rglob("*")):
        if f.is_file():
            info = zipfile.ZipInfo(f.relative_to(src).as_posix(), (2026, 11, 20, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, f.read_bytes())
print(dst)
