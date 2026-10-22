# Curriculum sources and version baseline

Consolidated on **2026-10-22**. This index covers all **49 chapter IDs in levels 2–4**: 16 intermediate, 16 advanced and 17 expert chapters, in curriculum order. Level 1 is outside this implementation's source inventory.

The teaching baseline is **Kubernetes 1.35.0**, **kubectl 1.35.x** for cluster exercises, **kind 0.31.0**, and the explicit local context **kind-k8s-ops-lab** unless a chapter deliberately creates another isolated target. These are fixed teaching inputs, not claims about the newest releases. Stable APIs must be supported by that baseline. Unversioned upstream pages can describe newer behavior; the chapter ledgers record the relevant version, feature state, dependencies and limits.

- [kind 0.31.0 release and supported node image](https://github.com/kubernetes-sigs/kind/releases/tag/v0.31.0)
- [Kubernetes versioned 1.35 documentation](https://v1-35.docs.kubernetes.io/docs/)

Each chapter row links to its detailed ledger of **official primary sources**, version contracts and prerequisites. The four initial chapters retain their references [in this file](#root-reference-chapters). Fragment consultation dates are **2026-10-22**; their individual validation sections distinguish exact tools tested from lesson targets. Fixed image tags are not immutable digests or vulnerability assessments.

## Source ledger directory

The fragments remain separate so source details, later corrections and validation boundaries have one maintained home. Together with the four root references, their coverage is 49 chapters.

| Ledger                                                             | Chapters | Scope                                                                                   |
| ------------------------------------------------------------------ | -------: | --------------------------------------------------------------------------------------- |
| [Root reference chapters](#root-reference-chapters)                |        4 | Level 2 rollout strategies, rollback, resources and probes                              |
| [Workloads](content-sources-workloads.md)                          |        4 | Level 2 init/sidecars, storage, StatefulSets and DaemonSets                             |
| [Networking](content-sources-networking.md)                        |        4 | Level 2 Jobs, DNS, Gateway and NetworkPolicy                                            |
| [Operations](content-sources-operations.md)                        |        4 | Level 2 RBAC, scheduling, Helm and troubleshooting                                      |
| [Delivery](content-sources-delivery.md)                            |        4 | Level 3 Helm charts/releases, Kustomize and GitOps                                      |
| [Scaling and availability](content-sources-scaling.md)             |        4 | Level 3 HPA, VPA/node scaling, PDB and HA                                               |
| [Reliability](content-sources-reliability.md)                      |        4 | Level 3 placement, CNI, observability and incidents                                     |
| [Security and recovery](content-sources-security.md)               |        4 | Level 3 hardening, Pod Security, RBAC and backup/restore                                |
| [Controllers and API machinery](content-sources-controllers.md)    |        6 | Level 4 API architecture, controller internals, CRDs and the shared Go/operator example |
| [Internals](content-sources-internals.md)                          |        5 | Level 4 scheduler, CRI, advanced CNI, CSI and API scale                                 |
| [Extensions and controlled failure](content-sources-extensions.md) |        5 | Level 4 admission, conversion, etcd, multi-cluster and failure scenarios                |
| [Platform engineering](content-sources-platform.md)                |        1 | Level 4 platform interfaces and local renderer                                          |

The [controllers ledger](content-sources-controllers.md) records the shared Go project's actual generation, unit-test and compilation evidence. The [shared operator README](../lab/level-4/custom-controllers/greeting-operator/README.md) documents the checked-in toolchain, optional runtime paths and cleanup contract.

## Level 2 — Intermediate: 16 chapters

| Chapter ID           | Official sources and detailed notes                                 | Version or dependency boundary                                                         |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `rollout-strategies` | [Root references](#rollout-strategies)                              | `apps/v1`; surge, readiness and progress deadlines                                     |
| `rollbacks`          | [Root references](#rollbacks)                                       | Deployment Pod-template revisions; application data is separate                        |
| `resources`          | [Root references](#resources)                                       | Per-container `v1` requests/limits and LimitRange; no metrics API assumed              |
| `probes`             | [Root references](#probes)                                          | Startup, readiness and liveness have distinct effects                                  |
| `init-sidecars`      | [Workloads ledger](content-sources-workloads.md)                    | Native sidecars stable since 1.33; `initContainers[].restartPolicy: Always`            |
| `storage`            | [Workloads ledger](content-sources-workloads.md)                    | Inspect the actual local-path provisioner/class; it is not CSI                         |
| `statefulsets`       | [Workloads ledger](content-sources-workloads.md)                    | Identity, headless DNS, PVC retention and backend reclamation are separate             |
| `daemonsets`         | [Workloads ledger](content-sources-workloads.md)                    | Existing two-worker kind topology; exercise-owned node labels need cleanup             |
| `jobs`               | [Networking ledger](content-sources-networking.md#jobs)             | `batch/v1`; retries and concurrency do not guarantee exactly-once execution            |
| `dns`                | [Networking ledger](content-sources-networking.md#dns)              | Inspect real namespace search paths and cluster domain                                 |
| `ingress-gateway`    | [Networking ledger](content-sources-networking.md#ingress-gateway)  | Optional Envoy Gateway 1.9.2 / Gateway API 1.6.1; CRDs and implementation required     |
| `network-policies`   | [Networking ledger](content-sources-networking.md#network-policies) | Enforcement exercise conditional on an enforcing CNI; default kindnet does not qualify |
| `rbac`               | [Operations ledger](content-sources-operations.md)                  | `rbac.authorization.k8s.io/v1`; impersonation needs administrator authorization        |
| `scheduling`         | [Operations ledger](content-sources-operations.md)                  | Two actual workers; custom labels and taint have explicit cleanup                      |
| `helm-basics`        | [Operations ledger](content-sources-operations.md)                  | Helm 4.3.1 lesson target; chart API `v2`; local check used 4.3.0                       |
| `troubleshooting-2`  | [Operations ledger](content-sources-operations.md)                  | Pod, Service, DNS and storage evidence; no successful CSI provisioning claimed         |

## Level 3 — Advanced: 16 chapters

| Chapter ID                 | Official sources and detailed notes                                      | Version or dependency boundary                                                                 |
| -------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `helm-charts`              | [Delivery ledger](content-sources-delivery.md)                           | Helm 4.3.1 target; schema, stable selectors and configuration checksum                         |
| `helm-releases`            | [Delivery ledger](content-sources-delivery.md)                           | Pinned local dependency and lock; Helm 4 rollback-on-failure and values semantics              |
| `kustomize`                | [Delivery ledger](content-sources-delivery.md)                           | Local overlays; offline renderer version is recorded separately from kubectl 1.35.x            |
| `gitops`                   | [Delivery ledger](content-sources-delivery.md)                           | Optional Argo CD 3.5.6 or Flux 2.9.6; existing compatible controllers and reviewed source pins |
| `hpa`                      | [Scaling ledger](content-sources-scaling.md)                             | `autoscaling/v2`; working metrics API and Metrics Server 0.8.0 prerequisites                   |
| `vertical-cluster-scaling` | [Scaling ledger](content-sources-scaling.md)                             | VPA 1.5.1, recommendation-only `Off` mode; node autoscaling needs a provider                   |
| `pdb`                      | [Scaling ledger](content-sources-scaling.md)                             | `policy/v1`; scoped Eviction API, without node drain                                           |
| `ha`                       | [Scaling ledger](content-sources-scaling.md)                             | `nodeTaintsPolicy: Honor`; hostname placement on one host does not prove physical HA           |
| `advanced-scheduling`      | [Reliability ledger](content-sources-reliability.md#advanced-scheduling) | Spread, affinity and non-preempting PriorityClass; no global drain or victim eviction          |
| `security-hardening`       | [Security ledger](content-sources-security.md)                           | Non-root unprivileged NGINX fixture; runtime and image assumptions are explicit                |
| `pod-security`             | [Security ledger](content-sources-security.md)                           | Pod Security Admission labels pinned to `v1.35`; one disposable namespace                      |
| `rbac-advanced`            | [Security ledger](content-sources-security.md)                           | Custom aggregation, named access and escalation checks; no wildcard repair                     |
| `cni-internals`            | [Reliability ledger](content-sources-reliability.md#cni-internals)       | CNI specification 1.1.0; distinguish attachment, Service forwarding and policy                 |
| `observability`            | [Reliability ledger](content-sources-reliability.md#observability)       | Optional separate Compose stack; exact OTel/Collector/Prometheus/Grafana versions in ledger    |
| `incidents`                | [Reliability ledger](content-sources-reliability.md#incidents)           | Bounded Service-selector/targetPort incident; recovery evidence is learner-produced            |
| `backup-dr`                | [Security ledger](content-sources-security.md)                           | Quiesced synthetic file, checksum and new PVC; no full-cluster or database recovery claim      |

## Level 4 — Expert: 17 chapters

| Chapter ID              | Official sources and detailed notes                                  | Version or dependency boundary                                                                   |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `api-architecture`      | [Controllers ledger](content-sources-controllers.md)                 | Kubernetes API identity, discovery, optimistic concurrency and status                            |
| `controllers-internals` | [Controllers ledger](content-sources-controllers.md)                 | Queue/cache/reconcile semantics and ownership                                                    |
| `crds`                  | [Controllers ledger](content-sources-controllers.md)                 | `apiextensions.k8s.io/v1`, structural schema/CEL and shared Greeting type                        |
| `custom-controllers`    | [Controllers ledger](content-sources-controllers.md)                 | Shared Go 1.25.3+ project; Kubernetes libraries 0.35.0 / controller-runtime 0.23.1               |
| `operators`             | [Controllers ledger](content-sources-controllers.md)                 | Shared Greeting reconciler, pause/status/ownership lifecycle                                     |
| `kubebuilder-operator`  | [Controllers ledger](content-sources-controllers.md)                 | Optional Kubebuilder 4.12.0 scaffold comparison; controller-gen 0.20.0                           |
| `admission-webhooks`    | [Extensions ledger](content-sources-extensions.md)                   | `admission.k8s.io/v1`; private local CA, exact Service SAN and bounded fail-closed scope         |
| `api-extension`         | [Extensions ledger](content-sources-extensions.md)                   | `apiextensions.k8s.io/v1` ConversionReview; preserve UID, ordering and object identity           |
| `scheduler-internals`   | [Internals ledger](content-sources-internals.md#scheduler-internals) | Stable scheduler binary configuration `v1`; diagnostic fixture does not install a scheduler      |
| `etcd`                  | [Extensions ledger](content-sources-extensions.md)                   | Standalone etcd 3.6.5; separate synthetic source/restored stores and volumes                     |
| `cri`                   | [Internals ledger](content-sources-internals.md#cri)                 | CRI v1 and cri-tools 1.35.0 reference; read-only runtime diagnostics                             |
| `cni-advanced`          | [Internals ledger](content-sources-internals.md#cni-advanced)        | Cross-worker packet path and stable Service locality; no dataplane replacement                   |
| `csi`                   | [Internals ledger](content-sources-internals.md#csi)                 | CSI 1.11.0 specification reference; snapshot/restore requires a real compatible installed driver |
| `control-plane-scale`   | [Internals ledger](content-sources-internals.md#control-plane-scale) | Kubernetes 1.35 pagination, bounded watch and APF; no production benchmark                       |
| `multi-cluster`         | [Extensions ledger](content-sources-extensions.md)                   | Two optional kind 0.31.0 / Kubernetes 1.35.0 clusters, private kubeconfigs and explicit contexts |
| `failure-scenarios`     | [Extensions ledger](content-sources-extensions.md)                   | Synthetic readiness dependency, quota refusal and PDB scope; no shared infrastructure failure    |
| `platform-engineering`  | [Platform ledger](content-sources-platform.md)                       | Python standard-library renderer, stable Kubernetes APIs and explicit platform-product limits    |

## Root reference chapters

### rollout-strategies

- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Rolling update tutorial](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/)
- [Deployment apps/v1 reference](https://kubernetes.io/docs/reference/kubernetes-api/apps/deployment-v1/)

Contract: `apps/v1`, Kubernetes 1.35. Surge budget excludes terminating resource consumption; readiness is not a business-level guarantee; progress deadlines do not automatically roll back. `nginx:1.28.0` is a fixed exercise image.

### rollbacks

- [Deployment rollback](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)
- [kubectl rollout undo](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout/kubectl_rollout_undo/)

Contract: `apps/v1`; a revision records Pod-template history, not restoration of application data, external configuration or unrelated resources.

### resources

- [Resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [LimitRange](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [Memory exercise](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/)

Contract: per-container `v1` resource requests and limits. No optional in-place resize is required and no metrics API is assumed.

### probes

- [Probe configuration](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Probe concepts](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [Pod v1 API](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/)

Contract: startup/liveness require `successThreshold: 1`. A readiness failure removes normal Service traffic eligibility rather than restarting the container; restart behavior belongs to startup/liveness and the Pod's restart policy.

## Evidence and execution boundary

Source consultation supports technical explanations; it is not execution evidence. The fragments keep their local syntax, rendering, unit-test and tool-version results. Whole-application integration and browser observations belong in [content-implementation.md](content-implementation.md).

All Kubernetes, Docker/Compose, controller and failure-injection exercises remain learner instructions until separately executed on the documented disposable environment. Successful TypeScript checks, YAML parsing, fake clients or certificate loading do not prove live admission, scheduling, image availability, network enforcement, CSI restore, etcd recovery or physical high availability. Conditional chapters stop when required metrics, controllers, enforcing CNI, CSI driver or snapshot components are absent; those dependencies are not silently installed by the website or authoring agent.

## Subsequent review references

The [course review](content-review.md) and [level 2](review-level-2.md), [level 3](review-level-3.md), [level 4](review-level-4.md) review notes record reconsulted official sources, corrections and the ConversionReview documentation discrepancy. The pinned teaching baseline remains unchanged.
