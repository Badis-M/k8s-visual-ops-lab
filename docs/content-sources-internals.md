# Level 4 batch: scheduling, runtime, networking, CSI and API scale

Primary upstream references consulted live on **2026-10-22**. Kubernetes examples target **1.35.0**, kind **0.31.0**, explicit context **kind-k8s-ops-lab**. All runtime, network, storage and API outputs in lessons are expected learner observations; none of these labs were executed by the authoring agent. No scheduler, CNI/CSI driver, cluster service or benchmark was installed or started.

## scheduler-internals

- [Kubernetes 1.35 scheduler](https://v1-35.docs.kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/): assignment responsibility versus kubelet/runtime and feasible node selection.
- [Kubernetes 1.35 scheduler configuration](https://v1-35.docs.kubernetes.io/docs/reference/scheduling/config/): stable `kubescheduler.config.k8s.io/v1`, extension points, plugins, multiple profiles, shared QueueSort and score/plugin weights.
- [Scheduling framework](https://v1-35.docs.kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/): scheduling versus binding cycles, reservation rollback, extension points and custom plugin responsibilities.

The runnable namespace fixture deliberately selects an unregistered scheduler name, then replaces its Pod through a Deployment template update. No existing Pod's immutable schedulerName is patched. `profile.yaml` is a real **binary configuration example**, explicitly not a Kubernetes API resource, not an installed scheduler, and not a pseudocode implementation. Runtime deployment, credentials and leader-election configuration are outside that illustrative file. Default scheduler static Pod configuration is read only. No preemption or node metadata is changed.

## cri

- [Kubernetes 1.35 CRI](https://v1-35.docs.kubernetes.io/docs/concepts/architecture/cri/): kubelet gRPC boundary and runtime responsibility.
- [Debug with crictl](https://v1-35.docs.kubernetes.io/docs/tasks/debug/debug-cluster/crictl/): explicit runtime endpoint, sandbox/container listing and logs.
- [cri-tools 1.35.0 commands](https://github.com/kubernetes-sigs/cri-tools/blob/v1.35.0/docs/crictl.md): CLI operations and read-only diagnostic surfaces.

Fixture images: `nginx:1.28.0-alpine`, `busybox:1.37.0`, fixed teaching tags rather than immutable/reviewed production digests. A completed init and two application containers allow Pod UID, sandbox and individual container IDs to be compared. Commands identify the assigned kind node dynamically and target containerd's explicit Unix socket. `docker exec` is documented for the learner only; **no daemon access was exercised by the agent**. Runtime operations are limited to version, pods, ps, inspectp and logs; no stop/rm/prune/restart or direct mutation of kubelet-owned objects. Inspection is restricted to the secret-free fixture. The lesson distinguishes Linux VM kernel, kind node containers and macOS host, and does not suggest running Windows/macOS binaries as Linux Pod processes.

## cni-advanced

- [Kubernetes 1.35 internal traffic policy](https://v1-35.docs.kubernetes.io/docs/concepts/services-networking/service-traffic-policy/): `internalTrafficPolicy: Local`, stable since 1.26, and behavior without node-local endpoints.
- [Virtual IPs and Service proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/): endpoint selection, Service dataplane and implementation variation.
- [CNI 1.1 specification](https://www.cni.dev/docs/spec/): attachment contract independent of overlay, policy and Service forwarding.
- [Kubernetes network plugins](https://v1-35.docs.kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/): runtime network requirements and implementation-specific capabilities.

The fixture creates source and destination on distinct worker hostnames, transfers a real 128 KiB HTTP file, then changes only the Service's internal traffic policy. Expected DNS success, present remote ready EndpointSlice and working direct remote Pod IP distinguish locality filtering from a transport outage. Large application payload is explicitly not a packet-size/MTU proof. No capture, host route, MTU, conntrack, iptables or CNI configuration is changed. Default kindnet is never claimed to enforce NetworkPolicy. eBPF, encryption and multi-network attachments are architectural comparisons with explicit implementation prerequisites, not falsely demonstrated installations.

## csi

- [Kubernetes 1.35 CSI volumes](https://v1-35.docs.kubernetes.io/docs/concepts/storage/volumes/#csi): CSI PV fields and separation from non-CSI provisioners.
- [CSI developer introduction](https://kubernetes-csi.github.io/docs/introduction.html): kubelet node RPCs, controller/API separation and registration.
- [CSI sidecar roles](https://kubernetes-csi.github.io/docs/sidecar-containers.html): external-provisioner, attacher, node-driver-registrar, snapshotter and their distinct responsibilities.
- [CSI specification 1.11.0](https://github.com/container-storage-interface/spec/blob/v1.11.0/spec.md): idempotency and capability-dependent controller/node operations. This is a versioned conceptual RPC reference, not a claim that every deployed driver supports every optional operation.
- [Kubernetes 1.35 volume snapshots](https://v1-35.docs.kubernetes.io/docs/concepts/storage/volume-snapshots/): snapshot objects, CRDs, controller requirements and restore dataSource.
- [CSI snapshot/restore](https://kubernetes-csi.github.io/docs/snapshot-restore-feature.html): capability and component prerequisites, restoration through a new claim.

**Conditional restore exercise:** no CSI driver, external sidecars or snapshot controller are installed by this batch. Learners inventory the actual cluster first. Default kind local-path is **not CSI** and cannot pass the scripted CSI driver/CRD preflight. `snapshot-cycle.sh` takes real existing class names, validates their names/driver identity, requires Delete policies, refuses an existing namespace, creates a source PVC/writer, quiesces this simple file, snapshots it, restores into a **new PVC** and verifies the marker from a reader mounting that new claim. There is no fake driver, fictional driver version or silently assumed snapshot service. The separately prepared optional environment must document its actual Kubernetes 1.35/CSI/snapshotter compatibility and healthy controller/node components. The script's finite waits fail clearly if unsupported. File snapshots do not demonstrate database consistency, independent backup storage or disaster recovery. Cleanup requests deletion and requires inspecting driver-managed PV/snapshot-content removal, never removing finalizers to hide failure. Shared classes, CRDs and driver remain untouched.

## control-plane-scale

- [Kubernetes 1.35 API concepts](https://v1-35.docs.kubernetes.io/docs/reference/using-api/api-concepts/): opaque resourceVersion, limit/continue pagination, consistent snapshot and continuation expiration.
- [Kubernetes 1.35 API Priority and Fairness](https://v1-35.docs.kubernetes.io/docs/concepts/cluster-administration/flow-control/): FlowSchema, PriorityLevelConfiguration, concurrency seats, request duration and exempt clients.
- [Kubernetes 1.35 metrics reference](https://v1-35.docs.kubernetes.io/docs/reference/instrumentation/metrics/): actual API duration histograms, APF BETA metrics and ALPHA `etcd_request_duration_seconds`, with stability boundaries stated explicitly.

Three small ConfigMaps support a one-item paginated list; the Python standard-library helper URL-encodes continuation tokens, requires a consistent collection version, detects duplicate names and stops at ten pages. A 20-second watch and one annotation demonstrate change delivery without a tight relist loop. Optional API telemetry sampling is two requests ten seconds apart with timestamps and a ten-second timeout, restricted to existing `/metrics` authorization. It writes a private temporary directory for learner inspection, with no Prometheus/etcd service installed. A quiet kind cluster is not expected to show APF rejection or every metric series. The admin identity can be APF-exempt; no claim of demonstrated fairness, production throughput or capacity is made. No load generation, APF mutation, API flag change, etcd membership/compaction/defragmentation or production benchmark occurs. etcd WAL/backend telemetry requires a separately authorized collection path and is not fabricated from API metrics.

## Cross-review corrections and offline evidence — 2026-10-22

The original source notes above are preserved. A separate read-only review identified three concrete gaps, now corrected:

- **CSI cleanup ownership:** `snapshot-cycle.sh` records the UID returned by its successful namespace creation, together with unique exercise/run labels, in a newly created mode-0600 local marker. Both the marker and its private directory are printed as actual paths. A refused preflight creates no marker and never authorizes namespace deletion. `cleanup.sh` delegates to `ownership.py`, which requires that marker, current-user/private-file ownership, matching namespace UID and matching exercise/run labels. It sends a raw namespace DELETE with both UID and resourceVersion preconditions, protecting against replacement between inspection and deletion. No cleanup is automatically attempted on failure. Namespace/finalizer controllers handle owned content asynchronously; no direct deletion of shared PVs, snapshot contents, classes or finalizers occurs.
- **Pagination diagnostics:** `paginate.py` now reports captured kubectl stderr and preserves a nonzero exit status. A ResourceExpired/invalid-token diagnostic can no longer disappear behind an uninformative CalledProcessError traceback.
- **CRI sandbox identity:** `select_sandbox.py` requires exactly one `items` entry with state `SANDBOX_READY`, current API Pod UID and exact namespace/name. Old UIDs, NotReady entries, unknown state encodings and ambiguous matches are refused. CLI namespace/name filters are explicitly anchored regular expressions; they are not relied upon as identity proof. The guarded lesson snippet does not call `ps` when selection fails.

Additional upstream source checks:

- [cri-tools v1.35.0 sandbox command](https://raw.githubusercontent.com/kubernetes-sigs/cri-tools/v1.35.0/cmd/crictl/sandbox.go): `pods -o json` emits `ListPodSandboxResponse`, namespace/name filtering uses regular expressions, and Ready maps to the CRI `SANDBOX_READY` enum.
- [cri-tools v1.35.0 protobuf JSON serializer](https://raw.githubusercontent.com/kubernetes-sigs/cri-tools/v1.35.0/cmd/crictl/util.go): protojson emits default values and symbolic enum names rather than the table's display text.
- [CRI v0.35.0 protocol](https://raw.githubusercontent.com/kubernetes/cri-api/v0.35.0/pkg/apis/runtime/v1/api.proto): sandbox metadata.uid is the API Pod UID; the list envelope contains `items`; sandbox state enum separates READY and NOTREADY.
- [kubectl v0.35.0 delete command](https://raw.githubusercontent.com/kubernetes/kubectl/v0.35.0/pkg/cmd/delete/delete.go), [raw HTTP transport](https://raw.githubusercontent.com/kubernetes/kubectl/v0.35.0/pkg/rawhttp/raw.go): `delete --raw ... -f -` transmits stdin as the DELETE body, allowing explicit Kubernetes DeleteOptions preconditions without starting a proxy/listener.

Offline validation on host Python 3.14.7:

- **9 CSI ownership tests:** absent marker makes no API request; public/symlink marker is refused; changed UID/run label cannot reach deletion; valid ownership carries UID/resourceVersion preconditions; conflict is not retried; marker overwrite is refused; a simulated preflight refusal creates no marker; a simulated successful namespace creation records its returned UID before a later synthetic failure, with no automatic deletion.
- **6 CRI selector tests:** current Ready identity versus old UID/NotReady, ambiguous matches, wrong namespace/name, malformed input and empty UID. The selector does not mutate its input.
- **3 pagination tests:** ResourceExpired stderr and exit code are preserved, absent stderr receives an explicit diagnostic, and a valid multi-page snapshot URL-encodes the continuation token.
- Targeted ESLint on `csi.ts`/`cri.ts`, TypeScript and Bash syntax checks passed after these corrections.

All API interactions in these tests were mocks or a temporary synthetic kubectl stand-in. No real cluster/runtime command, Docker operation, listener or service was started. These checks validate guards and error handling, not CSI provisioning/restoration or runtime/API compatibility on a live cluster.
