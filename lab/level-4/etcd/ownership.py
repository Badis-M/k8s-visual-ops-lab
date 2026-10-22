"""Require a private run marker and Docker labels before isolated etcd cleanup."""

import argparse
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys

EXERCISE = "etcd-isolated-recovery"
LABEL = "lab.k8sops.dev/run"
CONTAINERS = ("lab-etcd-source", "lab-etcd-restored")
VOLUMES = ("lab-etcd-source-data", "lab-etcd-restored-data", "lab-etcd-snapshots")


def record(path, context, run_id):
    if not context or not re.fullmatch(r"[a-f0-9]{32}", run_id):
        raise ValueError("Invalid explicit Docker context or run ID")
    marker = {"exercise": EXERCISE, "context": context, "run_id": run_id}
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as output:
        json.dump(marker, output)
        output.write("\n")


def load(path):
    path = Path(path)
    details = path.lstat()
    if not stat.S_ISREG(details.st_mode) or details.st_uid != os.getuid() or stat.S_IMODE(details.st_mode) & 0o077:
        raise ValueError("Marker must be a private regular file owned by the current user")
    marker = json.loads(path.read_text())
    if marker.get("exercise") != EXERCISE or not isinstance(marker.get("context"), str) or not marker["context"] or not re.fullmatch(r"[a-f0-9]{32}", str(marker.get("run_id", ""))):
        raise ValueError("Marker does not identify this isolated exercise")
    return marker


def cleanup(path, runner=None):
    marker = load(path)
    runner = runner or subprocess.run
    base = ["docker", "--context", marker["context"]]

    def run(*args):
        return runner([*base, *args], check=True, capture_output=True, text=True).stdout

    # List first: missing objects are normal; transport/daemon failures stay errors.
    names = set(run("ps", "-a", "--format", "{{.Names}}").splitlines())
    volumes = set(run("volume", "ls", "--format", "{{.Name}}").splitlines())
    container_ids, volume_names = [], []
    for name in CONTAINERS:
        if name not in names:
            continue
        obj = json.loads(run("container", "inspect", name))[0]
        labels = obj.get("Config", {}).get("Labels") or {}
        if labels.get(LABEL) != marker["run_id"] or labels.get("lab.k8sops.dev/exercise") != EXERCISE:
            raise ValueError(f"Container {name} belongs to another run; no cleanup performed")
        identity = obj.get("Id", "")
        if not re.fullmatch(r"[a-f0-9]{64}", identity):
            raise ValueError("Invalid container identity")
        container_ids.append(identity)
    for name in VOLUMES:
        if name not in volumes:
            continue
        obj = json.loads(run("volume", "inspect", name))[0]
        labels = obj.get("Labels") or {}
        if labels.get(LABEL) != marker["run_id"] or labels.get("lab.k8sops.dev/exercise") != EXERCISE:
            raise ValueError(f"Volume {name} belongs to another run; no cleanup performed")
        volume_names.append(name)
    # Validate every candidate before deleting any; immutable container IDs avoid name reuse.
    if container_ids:
        run("rm", "-f", *container_ids)
    for name in volume_names:
        # Docker volumes have names, not immutable IDs: recheck the label at the boundary.
        obj = json.loads(run("volume", "inspect", name))[0]
        labels = obj.get("Labels") or {}
        if labels.get(LABEL) != marker["run_id"] or labels.get("lab.k8sops.dev/exercise") != EXERCISE:
            raise ValueError(f"Volume {name} changed ownership; refusing its removal")
        run("volume", "rm", name)
    print("Removed only labeled objects from the recorded synthetic run")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    init = commands.add_parser("record")
    init.add_argument("path")
    init.add_argument("context")
    init.add_argument("run_id")
    delete = commands.add_parser("cleanup")
    delete.add_argument("path")
    args = parser.parse_args()
    try:
        if args.command == "record":
            record(args.path, args.context, args.run_id)
        else:
            cleanup(args.path)
    except subprocess.CalledProcessError as error:
        print((error.stderr or "Docker request failed").rstrip(), file=sys.stderr)
        raise SystemExit(error.returncode if error.returncode > 0 else 1) from error
    except (OSError, ValueError, TypeError, KeyError, IndexError, AttributeError) as error:
        print(f"etcd cleanup refused: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
