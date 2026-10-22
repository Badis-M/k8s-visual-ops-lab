#!/usr/bin/env bash
set -euo pipefail

lab_context=kind-k8s-ops-lab
sample_dir=$(mktemp -d "${TMPDIR:-/tmp}/k8s-api-samples.XXXXXX")
printf 'Writing two bounded API metric snapshots to %s\n' "$sample_dir"
for sample_number in 1 2; do
  printf '%s\t%s\n' "$sample_number" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> "$sample_dir/timestamps.tsv"
  kubectl --context "$lab_context" --request-timeout=10s get --raw /metrics > "$sample_dir/metrics-$sample_number.prom"
  if [[ "$sample_number" -eq 1 ]]; then sleep 10; fi
done
printf 'Inspect snapshots locally; counters need differences and elapsed time, not raw totals.\n'
printf 'Remove only this exact directory when finished: %s\n' "$sample_dir"
