#!/usr/bin/env bash
set -euo pipefail
umask 077

destination=${1:?Usage: bash capture.sh EXISTING_PRIVATE_DIRECTORY}
test -d "$destination"
for name in orders.tar orders.tar.partial orders.tar.sha256 orders.sha256 captured-at.txt; do
  if [[ -e "$destination/$name" ]]; then
    printf 'Refusing to overwrite %s\n' "$destination/$name" >&2
    exit 1
  fi
done

# The lesson freezes its synthetic writer; this is not a hot database backup.
kubectl --context kind-k8s-ops-lab -n lab-backup-source exec data -- \
  sh -c 'cd /data && sha256sum orders.csv' > "$destination/orders.sha256"
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$destination/captured-at.txt"
kubectl --context kind-k8s-ops-lab -n lab-backup-source exec data -- \
  tar -C /data -cf - orders.csv > "$destination/orders.tar.partial"
test -s "$destination/orders.tar.partial"
kubectl --context kind-k8s-ops-lab -n lab-backup-source exec -i data -- \
  sh -c 'cd /data && sha256sum -c -' < "$destination/orders.sha256"
mv "$destination/orders.tar.partial" "$destination/orders.tar"
(
  cd "$destination"
  shasum -a 256 orders.tar > orders.tar.sha256
)
printf 'Captured synthetic data in %s\n' "$destination"
