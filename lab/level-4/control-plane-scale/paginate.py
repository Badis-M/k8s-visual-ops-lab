import json
import subprocess
import sys
from urllib.parse import urlencode


context = "kind-k8s-ops-lab"
path = "/api/v1/namespaces/lab-api-scale/configmaps"
token = ""
snapshot_version = None
names = []

for page_number in range(1, 11):
    query = {"limit": "1", "labelSelector": "app=api-sampling"}
    if token:
        query["continue"] = token
    try:
        result = subprocess.run(
            ["kubectl", "--context", context, "--request-timeout=10s", "get", "--raw", f"{path}?{urlencode(query)}"],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        # Keep the API's diagnostic (for example ResourceExpired), not just its code.
        print((error.stderr or "kubectl list request failed").rstrip(), file=sys.stderr)
        raise SystemExit(error.returncode if error.returncode > 0 else 1) from error
    page = json.loads(result.stdout)
    version = page["metadata"]["resourceVersion"]
    if snapshot_version is None:
        snapshot_version = version
    elif version != snapshot_version:
        raise RuntimeError("List snapshot resourceVersion changed unexpectedly")
    page_names = [item["metadata"]["name"] for item in page["items"]]
    names.extend(page_names)
    print(f"page={page_number} names={page_names} resourceVersion={version}")
    token = page["metadata"].get("continue", "")
    if not token:
        break
else:
    raise RuntimeError("Stopped at the explicit ten-page safety limit")

if len(names) != len(set(names)):
    raise RuntimeError("Duplicate items across pages")
print(f"Read {len(names)} objects from one consistent list snapshot")
