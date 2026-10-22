#!/usr/bin/env bash
set -euo pipefail
umask 077

docker_context=${1:?Usage: bash isolated-recovery.sh VERIFIED_LOCAL_DOCKER_CONTEXT}
image=quay.io/coreos/etcd:v3.6.5
script_directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
command -v python3 >/dev/null
d() { docker --context "$docker_context" "$@"; }
d version --format '{{.Server.Version}}'
containers=$(d ps -a --format '{{.Names}}')
volumes=$(d volume ls --format '{{.Name}}')
for name in lab-etcd-source lab-etcd-restored; do
  if printf '%s\n' "$containers" | grep -Fxq "$name"; then
    printf 'Refusing existing container %s\n' "$name" >&2
    exit 1
  fi
done
for name in lab-etcd-source-data lab-etcd-restored-data lab-etcd-snapshots; do
  if printf '%s\n' "$volumes" | grep -Fxq "$name"; then
    printf 'Refusing existing volume %s\n' "$name" >&2
    exit 1
  fi
done
run_directory=$(mktemp -d)
run_id=$(python3 -c 'import uuid; print(uuid.uuid4().hex)')
ownership_marker="$run_directory/ownership.json"
python3 "$script_directory/ownership.py" record "$ownership_marker" "$docker_context" "$run_id"
printf 'Ownership marker: %s\n' "$ownership_marker"
printf 'Keep the marker for cleanup, including after partial failure. No automatic deletion runs.\n'
for name in lab-etcd-source-data lab-etcd-restored-data lab-etcd-snapshots; do
  d volume create --label "lab.k8sops.dev/run=$run_id" \
    --label lab.k8sops.dev/exercise=etcd-isolated-recovery "$name"
  actual_run=$(d volume inspect --format '{{index .Labels "lab.k8sops.dev/run"}}' "$name")
  if [[ "$actual_run" != "$run_id" ]]; then
    printf 'Volume %s appeared with different ownership; stop and inspect.\n' "$name" >&2
    exit 1
  fi
done

# No published ports, host paths, host networking or Kubernetes credentials.
d run -d --name lab-etcd-source --network none --read-only \
  --label "lab.k8sops.dev/run=$run_id" --label lab.k8sops.dev/exercise=etcd-isolated-recovery \
  --cap-drop ALL --security-opt no-new-privileges \
  --mount type=volume,source=lab-etcd-source-data,target=/etcd-data \
  --mount type=volume,source=lab-etcd-snapshots,target=/backup \
  --entrypoint /usr/local/bin/etcd "$image" \
  --name source --data-dir /etcd-data \
  --listen-client-urls http://127.0.0.1:2379 \
  --advertise-client-urls http://127.0.0.1:2379 \
  --listen-peer-urls http://127.0.0.1:2380 \
  --initial-advertise-peer-urls http://127.0.0.1:2380 \
  --initial-cluster source=http://127.0.0.1:2380 \
  --initial-cluster-token source-lab

wait_member() {
  for attempt in {1..30}; do
    if d exec "$1" /usr/local/bin/etcdctl --endpoints=http://127.0.0.1:2379 endpoint health; then
      return
    fi
    sleep 1
  done
  printf 'Member %s did not become healthy\n' "$1" >&2
  return 1
}
wait_member lab-etcd-source
d exec lab-etcd-source /usr/local/bin/etcdctl put /workshop/release blue
d exec lab-etcd-source /usr/local/bin/etcdctl snapshot save /backup/snapshot.db
d run --rm --network none --read-only --cap-drop ALL \
  --mount type=volume,source=lab-etcd-snapshots,target=/backup,readonly \
  --entrypoint /usr/local/bin/etcdutl "$image" snapshot status /backup/snapshot.db --write-out=table
d exec lab-etcd-source /usr/local/bin/etcdctl put /workshop/release green

# Restore into a new data directory/member, never into the source member.
d run --rm --network none --read-only --cap-drop ALL \
  --mount type=volume,source=lab-etcd-snapshots,target=/backup,readonly \
  --mount type=volume,source=lab-etcd-restored-data,target=/restored \
  --entrypoint /usr/local/bin/etcdutl "$image" snapshot restore /backup/snapshot.db \
  --name restored --data-dir /restored/data \
  --initial-cluster restored=http://127.0.0.1:2380 \
  --initial-advertise-peer-urls http://127.0.0.1:2380 \
  --initial-cluster-token restored-lab \
  --bump-revision 1000000000 --mark-compacted
d run -d --name lab-etcd-restored --network none --read-only \
  --label "lab.k8sops.dev/run=$run_id" --label lab.k8sops.dev/exercise=etcd-isolated-recovery \
  --cap-drop ALL --security-opt no-new-privileges \
  --mount type=volume,source=lab-etcd-restored-data,target=/etcd-data \
  --entrypoint /usr/local/bin/etcd "$image" \
  --name restored --data-dir /etcd-data/data \
  --listen-client-urls http://127.0.0.1:2379 \
  --advertise-client-urls http://127.0.0.1:2379 \
  --listen-peer-urls http://127.0.0.1:2380 \
  --initial-advertise-peer-urls http://127.0.0.1:2380 \
  --initial-cluster restored=http://127.0.0.1:2380 \
  --initial-cluster-token restored-lab
wait_member lab-etcd-restored
source_value=$(d exec lab-etcd-source /usr/local/bin/etcdctl get /workshop/release --print-value-only)
restored_value=$(d exec lab-etcd-restored /usr/local/bin/etcdctl get /workshop/release --print-value-only)
if [[ "$source_value" != green || "$restored_value" != blue ]]; then
  printf 'Unexpected recovery result: source=%s restored=%s\n' "$source_value" "$restored_value" >&2
  exit 1
fi
printf 'Verified synthetic recovery: source=green, restored=blue\n'
d exec lab-etcd-restored /usr/local/bin/etcdctl endpoint status --write-out=table
