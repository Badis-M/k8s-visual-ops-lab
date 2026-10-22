"""Record a CSI run's namespace identity and request UID-conditional cleanup."""

import argparse
import json
import os
import pathlib
import re
import stat
import subprocess
import sys

CONTEXT = "kind-k8s-ops-lab"
NAMESPACE = "lab-csi"
EXERCISE = "csi-snapshot-cycle"
EXERCISE_LABEL = "lab.k8sops.dev/exercise"
RUN_LABEL = "lab.k8sops.dev/run"


def check_namespace(namespace, run_id, uid=None):
    metadata = namespace.get("metadata", {})
    labels = metadata.get("labels", {})
    actual_uid = metadata.get("uid")
    if (
        metadata.get("name") != NAMESPACE
        or labels.get(EXERCISE_LABEL) != EXERCISE
        or labels.get(RUN_LABEL) != run_id
        or not isinstance(actual_uid, str)
        or not actual_uid
        or (uid is not None and actual_uid != uid)
    ):
        raise ValueError("Namespace UID or exercise/run labels do not match this run; refusing cleanup")
    return actual_uid


def record_marker(path, namespace, run_id):
    if not re.fullmatch(r"[a-f0-9]{32}", run_id):
        raise ValueError("Invalid run identifier")
    uid = check_namespace(namespace, run_id)
    marker = {"context": CONTEXT, "namespace": NAMESPACE, "exercise": EXERCISE, "run_id": run_id, "namespace_uid": uid}
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as output:
        json.dump(marker, output)
        output.write("\n")


def load_marker(path):
    path = pathlib.Path(path)
    details = path.lstat()
    if not stat.S_ISREG(details.st_mode) or details.st_uid != os.getuid() or stat.S_IMODE(details.st_mode) & 0o077:
        raise ValueError("Ownership marker must be a private regular file owned by the current user")
    marker = json.loads(path.read_text())
    if (
        marker.get("context") != CONTEXT
        or marker.get("namespace") != NAMESPACE
        or marker.get("exercise") != EXERCISE
        or not re.fullmatch(r"[a-f0-9]{32}", str(marker.get("run_id", "")))
        or not isinstance(marker.get("namespace_uid"), str)
        or not marker["namespace_uid"]
    ):
        raise ValueError("Ownership marker does not identify a valid CSI exercise run")
    return marker


def request_cleanup(path, runner=None):
    marker = load_marker(path)
    runner = runner or subprocess.run
    base = ["kubectl", "--context", CONTEXT, "--request-timeout=10s"]
    current = runner([*base, "get", "namespace", NAMESPACE, "--ignore-not-found", "-o", "json"], check=True, capture_output=True, text=True)
    if not current.stdout.strip():
        print("Recorded namespace is already absent; no deletion requested")
        return
    namespace = json.loads(current.stdout)
    check_namespace(namespace, marker["run_id"], marker["namespace_uid"])
    version = namespace["metadata"].get("resourceVersion")
    if not isinstance(version, str) or not version:
        raise ValueError("Namespace has no resourceVersion; refusing cleanup")
    # Server-side preconditions also reject a namespace replaced after this read.
    options = {"apiVersion": "v1", "kind": "DeleteOptions", "preconditions": {"uid": marker["namespace_uid"], "resourceVersion": version}}
    runner([*base, "delete", "--raw", f"/api/v1/namespaces/{NAMESPACE}", "-f", "-"], input=json.dumps(options), check=True, capture_output=True, text=True)
    print("Deletion requested for the recorded namespace UID only; inspect finalizers and backend cleanup")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    record = commands.add_parser("record")
    record.add_argument("path")
    record.add_argument("run_id")
    cleanup = commands.add_parser("cleanup")
    cleanup.add_argument("path")
    args = parser.parse_args()
    try:
        if args.command == "record":
            record_marker(args.path, json.load(sys.stdin), args.run_id)
        else:
            request_cleanup(args.path)
    except subprocess.CalledProcessError as error:
        print((error.stderr or "kubectl request failed").rstrip(), file=sys.stderr)
        raise SystemExit(error.returncode if error.returncode > 0 else 1) from error
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(f"CSI ownership guard refused: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
