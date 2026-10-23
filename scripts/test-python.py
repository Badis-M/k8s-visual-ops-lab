"""Run every lab unittest directory independently without contacting a cluster."""
import pathlib
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parent.parent
folders = sorted({path.parent for path in (root / "lab").rglob("test_*.py")})
if not folders:
    raise SystemExit("No Python lab tests found")
for folder in folders:
    print(f"Testing {folder.relative_to(root)}", flush=True)
    subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", str(folder), "-v"], check=True)
