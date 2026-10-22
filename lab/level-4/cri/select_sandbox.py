"""Select one current Ready sandbox from crictl's protobuf JSON output."""

import argparse
import json
import sys


def select_sandbox(document, pod_uid, namespace="lab-cri", name="runtime-demo"):
    if not isinstance(pod_uid, str) or not pod_uid:
        raise ValueError("The current API Pod UID is required")
    if not isinstance(document, dict) or not isinstance(document.get("items"), list):
        raise ValueError("Expected crictl pods -o json with an items array")
    matches = []
    for item in document["items"]:
        if not isinstance(item, dict):
            raise ValueError("Invalid sandbox item")
        metadata = item.get("metadata", {})
        if not isinstance(metadata, dict):
            raise ValueError("Invalid sandbox metadata")
        if (
            item.get("state") == "SANDBOX_READY"
            and metadata.get("uid") == pod_uid
            and metadata.get("namespace") == namespace
            and metadata.get("name") == name
        ):
            sandbox_id = item.get("id")
            if not isinstance(sandbox_id, str) or not sandbox_id or not sandbox_id.isalnum():
                raise ValueError("Invalid sandbox ID")
            matches.append(sandbox_id)
    if len(matches) != 1:
        raise ValueError(f"Expected exactly one Ready sandbox for the current Pod UID; found {len(matches)}")
    return matches[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pod_uid")
    args = parser.parse_args()
    try:
        print(select_sandbox(json.load(sys.stdin), args.pod_uid))
    except (ValueError, TypeError) as error:
        print(f"Sandbox selection refused: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
