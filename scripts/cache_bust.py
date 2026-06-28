#!/usr/bin/env python3
"""Content-hash the static asset URLs and keep the two index.html copies in sync.

`templates/index.html` is the single source of truth. This rewrites every
``static/<asset>?v=<...>`` query to a short hash of that asset's current
contents, then mirrors the result to the repo-root ``index.html`` (used by the
static GitHub Pages export and the Playwright tests).

Run it after changing any CSS/JS, e.g. ``python scripts/cache_bust.py``. It is
idempotent: unchanged assets keep the same hash. The deploy-pages workflow runs
it too, so the static export is always fresh.
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "templates" / "index.html"
MIRROR = ROOT / "index.html"

# static/<asset>.<css|js>?v=<token>  (asset may contain a sub-path)
ASSET_RE = re.compile(r"static/(?P<asset>[A-Za-z0-9_./-]+\.(?:css|js))\?v=[0-9A-Za-z]+")


def short_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:10]


def main() -> None:
    html = SOURCE.read_text(encoding="utf-8")

    changed = []

    def replace(match: "re.Match[str]") -> str:
        asset = match.group("asset")
        asset_path = ROOT / "static" / asset
        if not asset_path.is_file():
            return match.group(0)  # leave unknown assets untouched
        new = f"static/{asset}?v={short_hash(asset_path)}"
        if new != match.group(0):
            changed.append(asset)
        return new

    rewritten = ASSET_RE.sub(replace, html)

    SOURCE.write_text(rewritten, encoding="utf-8")
    MIRROR.write_text(rewritten, encoding="utf-8")

    if changed:
        print("cache_bust: re-hashed " + ", ".join(sorted(set(changed))))
    else:
        print("cache_bust: assets already up to date")
    print("cache_bust: templates/index.html and index.html are in sync")


if __name__ == "__main__":
    main()
