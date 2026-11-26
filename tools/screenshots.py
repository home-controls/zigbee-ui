"""Screenshots of the apps for READMEs, with headless Chrome.

    python tools/screenshots.py <out dir> <name>=<url> [<name>=<url> ...] [--size 1440x900] [--light] [--wait 6000]

Each page loads in a fresh browser profile (so no remembered theme), dark unless --light, gets
--wait ms of (virtual) time to fetch and draw its live data, and is saved as <out dir>/<name>.png.
Point it at a simulator or a mock, never at a real home: screenshots end up public.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome", "chromium", "chromium-browser",
]


def chrome() -> str:
    for c in CHROME:
        if Path(c).exists() or shutil.which(c):
            return c
    sys.exit("Chrome not found")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("pages", nargs="+", help="name=url")
    ap.add_argument("--size", default="1440x900")
    ap.add_argument("--light", action="store_true")
    ap.add_argument("--wait", type=int, default=6000, help="ms of virtual time before the shot")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    w, h = a.size.split("x")
    for page in a.pages:
        name, url = page.split("=", 1)
        with tempfile.TemporaryDirectory() as prof:
            target = (out / f"{name}.png").resolve()
            args = [chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={prof}",
                    f"--window-size={w},{h}", f"--virtual-time-budget={a.wait}", f"--screenshot={target}",
                    "--force-device-scale-factor=1"]
            if not a.light:
                args += ["--force-dark-mode", "--blink-settings=preferredColorScheme=0"]
            subprocess.run(args + [url], check=True, capture_output=True, timeout=120)
        print(f"{target} ({target.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
