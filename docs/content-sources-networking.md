# Level 2 batch: Jobs, DNS, Gateway and NetworkPolicies

Consulted on **2026-10-22**. Sources below are primary upstream documentation, verified live during authoring. Exercises have not been run against Kubernetes by the authoring agents. Static content/application validation is separate evidence.

Baseline: Kubernetes **1.35.0**, kind **0.31.0**, explicit context **kind-k8s-ops-lab**. Core manifests use stable APIs available in that baseline. Teaching images `busybox:1.37.0` and `nginx:1.28.0-alpine` are pinned by tag for reproducibility, not immutable digests or a production patch policy.

## jobs

- [Kubernetes 1.35 Jobs](https://v1-35.docs.kubernetes.io/docs/concepts/workloads/controllers/job/): Indexed completion, `Never` versus `OnFailure`, retry/backoff accounting, runtime deadline, possible duplicate execution, immutable templates and terminal conditions.
- [Kubernetes 1.35 CronJobs](https://v1-35.docs.kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/): timezone, concurrency restricted to one CronJob, approximate scheduling, missed schedules, suspension, history and start deadline.
- [Finished Job cleanup](https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/): TTL retention removes finished Jobs and dependent objects, not business data.

The lab uses `batch/v1`, indexed partition printing and a suspended schedule. Idempotent storage is explained as application responsibility, not falsely implemented by an echo command. The intentional failure uses exit 42. No real reports, external state or schedules were created by authoring.

## dns

- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/): namespace search, normal versus headless records, named-port SRV, resolver policy.
- [Debug DNS resolution](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/): inspect resolver configuration, CoreDNS Pods, DNS Service/EndpointSlices and logs.
- [Services](https://kubernetes.io/docs/concepts/services-networking/service/): virtual IP forwarding and endpoint discovery are separate from name resolution.

Baseline assumes Linux Pods, CoreDNS and default kind domain `cluster.local`; learners inspect the actual domain and labels. Service selector/targetPort failures are deliberately distinguished from DNS failure. Application caching, public DNS and NodeLocal DNSCache are outside the fixture.

## ingress-gateway

- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/): API feature freeze, controller requirement, HTTP host/path routing and IngressClass.
- [Simple Gateway](https://gateway-api.sigs.k8s.io/guides/getting-started/simple-gateway/): listener, parentRefs, allowedRoutes and backendRefs.
- [Envoy Gateway version matrix](https://gateway.envoyproxy.io/news/releases/matrix/): Envoy Gateway **1.9.x**, Gateway API **1.6.1**, Envoy Proxy **1.39.x**, supported Kubernetes **1.33–1.36**; this includes 1.35. Matrix consulted on the stated date, not a promise of indefinite support.
- [Envoy Gateway 1.9 quickstart](https://gateway.envoyproxy.io/v1.9/tasks/quickstart/): pinned Helm installation **v1.9.2**, controller availability, owning-gateway Service labels and proxy port-forward.
- [Envoy Gateway Helm install](https://gateway.envoyproxy.io/v1.9/install/install-helm/): bundled Gateway API/implementation CRDs, provider-managed CRD ownership caveat, CRDs retained/handled separately by Helm.

Prerequisites: learner-installed Helm, disposable cluster-wide permissions, roughly 1 GiB additional memory and registry access. Only instructions are provided; no controller installed. Gateway API CRDs are bundled in the chosen chart, not separately mixed with `latest`. `GatewayClass/lab-envoy` is cluster-scoped. On plain kind no LoadBalancer address is assumed: proxy Service port-forward explicitly tests local HTTP routing only. Gateway conditions, actual ready backends and HTTP results are examined separately. Cleanup removes the exercise before uninstalling its controller; retained CRDs require inspecting ownership or discarding the whole disposable cluster, never blanket deletion on shared infrastructure.

## network-policies

- [Kubernetes NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/): enforcement prerequisite, independent direction isolation, additive allow rules, peer AND/OR semantics, namespace selectors, convergence and limits including ICMP/host traffic.
- [Cilium kind installation](https://docs.cilium.io/en/stable/installation/kind/): a CNI-specific alternative setup disables default CNI **before** cluster creation, then installs and verifies its networking. This is a linked environment prerequisite, not an installer shipped or executed by this chapter.
- [kind configuration](https://kind.sigs.k8s.io/docs/user/configuration/): `disableDefaultCNI` is a cluster-creation setting, not permission to hot-swap a shared cluster's network.

**Conditional exercise:** the standard `lab/kind.yaml` uses kindnet and does not enforce NetworkPolicy. The lesson explicitly stops security conclusions if the negative deny test fails. Complete enforcement exercises require a separately prepared compatible enforcing CNI; no pinned CNI installation is claimed or silently assumed. This narrow scope avoids providing a misleading turnkey security guarantee. Tests begin with working connectivity, then compare allowed and denied new HTTP connections. DNS egress rules assume CoreDNS Pods labeled `k8s-app=kube-dns` in `kube-system`; learners inspect labels, and NodeLocal DNSCache requires an adapted rule. Namespace cleanup does not uninstall a CNI.
