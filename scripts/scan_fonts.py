#!/usr/bin/env python3
"""
Scan the ./fonts directory for .ttf files and output a JSON manifest.

Default output: assets/data/fonts.json with extended fields.
Options:
  --minimal      Only include: path, city, file, family, subfamily, full_name
  --fields K,... Custom comma-separated field list to include
Dependencies: fonttools (pip install fonttools)
"""
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    from fontTools.ttLib import TTFont
except ImportError:
    raise SystemExit("Missing dependency: fonttools. Install with 'pip install fonttools'.")

ROOT = Path(__file__).resolve().parents[1]
FONTS_DIR = ROOT / "fonts"
OUTPUT = ROOT / "assets" / "data" / "fonts.json"

NAME_IDS = {
    1: "family",
    2: "subfamily",
    4: "full_name",
    6: "postscript_name",
}

# Preferred typographic names (if available)
PREFERRED_NAME_IDS = {
    16: "preferred_family",
    17: "preferred_subfamily",
}


def _decode_name(rec) -> str:
    """Robustly decode a name record to Unicode."""
    try:
        return rec.toUnicode()
    except Exception:
        try:
            return rec.string.decode(rec.getEncoding())
        except Exception:
            return rec.string.decode("utf-8", errors="ignore")


def get_name_records(tt: TTFont) -> Dict[str, Any]:
    """Extract name table, preferred names, platform-specific display names, and localized variants."""
    names: Dict[str, Any] = {}
    localized: Dict[str, Dict[str, str]] = {}
    name_table = tt["name"]

    # Collect preferred names first (typographic family/subfamily if present)
    for rec in name_table.names:
        if rec.nameID in PREFERRED_NAME_IDS:
            key = PREFERRED_NAME_IDS[rec.nameID]
            names[key] = _decode_name(rec)

    # Collect standard names; prefer Microsoft (platform 3) or Unicode (0)
    for rec in name_table.names:
        if rec.nameID in NAME_IDS:
            key = NAME_IDS[rec.nameID]
            if key not in names or rec.platformID in (0, 3):
                names[key] = _decode_name(rec)

    # Platform-specific display names used by Word (prefer Microsoft platformID=3)
    def pick_platform_name(target_name_id: int, platform_id: int) -> Optional[str]:
        for rec in name_table.names:
            if rec.nameID == target_name_id and rec.platformID == platform_id:
                return _decode_name(rec)
        return None

    names["family_display"] = pick_platform_name(1, 3) or names.get("preferred_family") or names.get("family")
    names["subfamily_display"] = pick_platform_name(2, 3) or names.get("preferred_subfamily") or names.get("subfamily")

    # Localized variants: group by language ID (Windows) or language code
    # We’ll store a limited set (family, subfamily, full_name) if available
    for rec in name_table.names:
        if rec.nameID in (1, 2, 4):
            label = NAME_IDS[rec.nameID]
            text = _decode_name(rec)
            # Build a key containing platform and language id to help consumers
            lang_key = f"plat{rec.platformID}-lang{getattr(rec, 'langID', 'NA')}"
            bucket = localized.setdefault(lang_key, {})
            # only set if not present to avoid overwriting arbitrarily
            bucket.setdefault(label, text)

    names["localized"] = localized
    return names


def scan_fonts(fonts_dir: Path) -> List[Dict[str, Any]]:
    manifest: List[Dict[str, Any]] = []
    for path in fonts_dir.rglob("*.ttf"):
        rel_path = path.relative_to(ROOT).as_posix()
        try:
            tt = TTFont(str(path))
            names = get_name_records(tt)
        except Exception as e:
            names = {"error": f"{type(e).__name__}: {e}"}
        entry = {
            "path": rel_path,
            "city": path.parent.name,
            "file": path.name,
            "family": names.get("preferred_family") or names.get("family") or None,
            "subfamily": names.get("preferred_subfamily") or names.get("subfamily") or None,
            "full_name": names.get("full_name"),
            "postscript_name": names.get("postscript_name"),
            # New fields for UX in Word (Microsoft platform) and localized names
            "family_display": names.get("family_display"),
            "subfamily_display": names.get("subfamily_display"),
            "localized": names.get("localized", {}),
        }
        manifest.append(entry)
    # Sort by display family then subfamily then file name for consistency
    manifest.sort(key=lambda x: (
        (x.get("family_display") or x.get("family") or ""),
        (x.get("subfamily_display") or x.get("subfamily") or ""),
        x["file"],
    ))
    return manifest


def filter_fields(data: List[Dict[str, Any]], fields: List[str]) -> List[Dict[str, Any]]:
    """Filter each entry to only include the specified fields."""
    return [{k: v for k, v in item.items() if k in fields} for item in data]


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    p = argparse.ArgumentParser(description="Scan fonts and emit JSON manifest.")
    p.add_argument("--minimal", action="store_true", help="Only keep path, city, file, family, subfamily, full_name")
    p.add_argument("--fields", type=str, default="", help="Comma-separated list of fields to include")
    p.add_argument(
        "--output",
        type=Path,
        default=OUTPUT,
        help="Output JSON path (default: assets/data/fonts.json)",
    )
    return p.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_args()
    if not FONTS_DIR.exists():
        raise SystemExit(f"Fonts directory not found: {FONTS_DIR}")
    data = scan_fonts(FONTS_DIR)

    fields: List[str] = []
    if args.minimal:
        fields = ["path", "city", "file", "family", "subfamily", "full_name"]
    elif args.fields:
        fields = [f.strip() for f in args.fields.split(",") if f.strip()]

    if fields:
        data = filter_fields(data, fields)

    args.output.parent.mkdir(parents=True, exist_ok=True)

    with args.output.open("w", encoding="utf-8") as f:
        json.dump({"fonts": data}, f, ensure_ascii=False, indent=2)
    print(f"Wrote {args.output} with {len(data)} entries.")


if __name__ == "__main__":
    main()

