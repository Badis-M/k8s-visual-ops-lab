#!/usr/bin/env bash
set -euo pipefail

source_dir=${1:?Usage: bash restore.sh BACKUP_DIRECTORY}
test -d "$source_dir"

# Validate local integrity before contacting the restore target.
(
  cd "$source_dir"
  shasum -a 256 -c orders.tar.sha256
)
members=$(tar -tf "$source_dir/orders.tar")
if [[ "$members" != 'orders.csv' ]]; then
  printf 'Refusing an archive outside the exercise contract\n' >&2
  exit 1
fi
kubectl --context kind-k8s-ops-lab -n lab-backup-restore exec data -- \
  sh -c 'if test -e /data/orders.csv; then echo "Refusing to overwrite target orders.csv" >&2; exit 1; fi'
kubectl --context kind-k8s-ops-lab -n lab-backup-restore exec -i data -- \
  tar -C /data -xf - < "$source_dir/orders.tar"
kubectl --context kind-k8s-ops-lab -n lab-backup-restore exec -i data -- \
  sh -c 'cd /data && sha256sum -c -' < "$source_dir/orders.sha256"
printf 'Restored bytes and verified their original checksum\n'
