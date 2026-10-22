#!/usr/bin/env bash
set -euo pipefail
umask 077

storage_class=${1:?Usage: bash snapshot-cycle.sh STORAGE_CLASS SNAPSHOT_CLASS}
snapshot_class=${2:?Usage: bash snapshot-cycle.sh STORAGE_CLASS SNAPSHOT_CLASS}
lab_context=kind-k8s-ops-lab
lab_namespace=lab-csi

for resource_name in "$storage_class" "$snapshot_class"; do
  if [[ ! "$resource_name" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
    printf 'Invalid class name: %s\n' "$resource_name" >&2
    exit 1
  fi
done

k() { kubectl --context "$lab_context" "$@"; }
existing_namespace=$(k get namespace "$lab_namespace" --ignore-not-found -o name)
if [[ -n "$existing_namespace" ]]; then
  printf 'Namespace %s already exists; inspect it rather than overwriting it.\n' "$lab_namespace" >&2
  exit 1
fi

driver=$(k get storageclass "$storage_class" -o jsonpath='{.provisioner}')
# A dynamic provisioner name alone is not proof that it is a CSI driver.
k get csidriver "$driver"
k get crd volumesnapshots.snapshot.storage.k8s.io volumesnapshotcontents.snapshot.storage.k8s.io
snapshot_driver=$(k get volumesnapshotclass "$snapshot_class" -o jsonpath='{.driver}')
snapshot_policy=$(k get volumesnapshotclass "$snapshot_class" -o jsonpath='{.deletionPolicy}')
reclaim_policy=$(k get storageclass "$storage_class" -o jsonpath='{.reclaimPolicy}')
if [[ "$driver" != "$snapshot_driver" || "$snapshot_policy" != Delete || "$reclaim_policy" != Delete ]]; then
  printf 'Require matching CSI driver, snapshot deletionPolicy Delete and StorageClass reclaimPolicy Delete.\n' >&2
  exit 1
fi
printf 'Preflight objects match. Confirm controller/node-plugin health before running this script.\n'

command -v python3 >/dev/null
run_directory=$(mktemp -d "${TMPDIR:-/tmp}/k8s-csi-run.XXXXXX")
printf 'Private run directory: %s\n' "$run_directory"
run_id=$(python3 -c 'import uuid; print(uuid.uuid4().hex)')
namespace_json=$(k create -f - -o json <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: "$lab_namespace"
  labels:
    lab.k8sops.dev/exercise: csi-snapshot-cycle
    lab.k8sops.dev/run: "$run_id"
EOF
)
ownership_marker="$run_directory/ownership.json"
printf '%s' "$namespace_json" | python3 lab/level-4/csi/ownership.py record "$ownership_marker" "$run_id"
printf 'Ownership marker: %s\n' "$ownership_marker"
printf 'Cleanup command: bash lab/level-4/csi/cleanup.sh %q\n' "$ownership_marker"
trap 'printf "Exercise stopped; preserve the ownership marker and inspect lab-csi. No automatic deletion performed.\n" >&2' ERR
k -n "$lab_namespace" apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: source-data
spec:
  storageClassName: "$storage_class"
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: writer
spec:
  automountServiceAccountToken: false
  containers:
    - name: writer
      image: busybox:1.37.0
      command: ["sh", "-c", "printf 'snapshot-marker-v1\\n' > /data/marker.txt; sync; sleep 3600"]
      readinessProbe:
        exec:
          command: ["test", "-s", "/data/marker.txt"]
        periodSeconds: 1
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: source-data
EOF
k -n "$lab_namespace" wait --for=condition=Ready pod/writer --timeout=180s
k -n "$lab_namespace" exec writer -- cat /data/marker.txt
# Stop the only writer before taking this simple file-system snapshot.
k -n "$lab_namespace" delete pod writer --wait=true
k -n "$lab_namespace" apply -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: source-snapshot
spec:
  volumeSnapshotClassName: "$snapshot_class"
  source:
    persistentVolumeClaimName: source-data
EOF
k -n "$lab_namespace" wait --for=jsonpath='{.status.readyToUse}'=true volumesnapshot/source-snapshot --timeout=180s
k -n "$lab_namespace" apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-data
spec:
  storageClassName: "$storage_class"
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
  dataSource:
    name: source-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
---
apiVersion: v1
kind: Pod
metadata:
  name: reader
spec:
  automountServiceAccountToken: false
  containers:
    - name: reader
      image: busybox:1.37.0
      command: ["sleep", "3600"]
      volumeMounts:
        - name: data
          mountPath: /data
          readOnly: true
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: restored-data
EOF
k -n "$lab_namespace" wait --for=condition=Ready pod/reader --timeout=180s
restored_marker=$(k -n "$lab_namespace" exec reader -- cat /data/marker.txt)
if [[ "$restored_marker" != snapshot-marker-v1 ]]; then
  printf 'Restored marker mismatch.\n' >&2
  exit 1
fi
k -n "$lab_namespace" get pvc,volumesnapshot
printf 'Restoration verified from a new PVC. Resources retained in lab-csi for inspection.\n'
