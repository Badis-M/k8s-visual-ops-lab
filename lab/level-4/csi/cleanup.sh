#!/usr/bin/env bash
set -euo pipefail

marker=${1:?Usage: bash cleanup.sh EXACT_PRIVATE_OWNERSHIP_MARKER_PATH}
if [[ $# -ne 1 ]]; then
  printf 'Supply only the exact ownership marker printed by snapshot-cycle.sh\n' >&2
  exit 1
fi
script_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python3 "$script_directory/ownership.py" cleanup "$marker"
