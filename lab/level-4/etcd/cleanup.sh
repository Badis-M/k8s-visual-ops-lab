#!/usr/bin/env bash
set -euo pipefail

marker=${1:?Usage: bash cleanup.sh EXACT_PRIVATE_OWNERSHIP_MARKER}
script_directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
python3 "$script_directory/ownership.py" cleanup "$marker"
