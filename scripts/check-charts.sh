#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
for chart in lab/level-3/helm-charts/academy-web lab/level-3/helm-releases/release-demo; do
  helm lint "$chart" --kube-version 1.35.0
  helm template academy "$chart" --kube-version 1.35.0 > "$workdir/$(basename "$chart").yaml"
done
for overlay in lab/level-3/kustomize/overlays/*; do
  kubectl kustomize "$overlay" > "$workdir/$(basename "$overlay").yaml"
done
kubectl kustomize lab/level-3/gitops/app > "$workdir/gitops.yaml"
python3 - "$workdir" <<'PY'
import pathlib
import sys
for path in pathlib.Path(sys.argv[1]).glob("*.yaml"):
    if not path.read_text().strip():
        raise SystemExit(f"Empty rendered output: {path}")
    print(f"Rendered {path.name}")
PY
