# Level 3 batch: placement, network, telemetry and incidents

Consulted **2026-10-22**, primary upstream sources verified live during authoring. Kubernetes fixture baseline: **1.35.0**, kind **0.31.0**, two workers plus one control plane. All described cluster/Compose outputs are expected learner observations, not recorded executions. No cluster, service or controller was installed or changed by the authoring agent.

## advanced-scheduling

- [Pod topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/): hard versus soft scheduling, eligible topology domains, `maxSkew`, `minDomains`, selector scope and non-rebalancing behavior.
- [Assigning Pods to nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/): node affinity, Pod anti-affinity and `IgnoredDuringExecution`.
- [Pod priority and preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/): queue ordering, non-preempting classes, limitations and best-effort PDB consideration.

Fixtures use hostname spread on the two actual kind workers. `PriorityClass/lab-spread-priority` is cluster-scoped, `globalDefault: false`, `preemptionPolicy: Never`; it is explicitly removed during cleanup. No drain, node metadata changes, victim eviction, production zones or physical high availability are demonstrated. A separate strict anti-affinity Deployment deliberately leaves one replica Pending on two hosts; scaling to two is the scoped repair. All APIs/fields used are present in Kubernetes 1.35; no beta scheduler features are required.

## cni-internals

- [CNI specification 1.1.0](https://www.cni.dev/docs/spec/): plugin invocation, ADD/DEL/CHECK and IPAM distinction; spec version is separate from implementation releases.
- [Kubernetes network plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/): runtime/CNI relationship, network requirements and plugin capabilities.
- [Virtual IPs and Service proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/): kube-proxy/alternative service dataplanes, Service/EndpointSlice forwarding; no assumption that a ClusterIP is a physical interface address.
- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/): compare DNS, Service IP, ready endpoints and direct Pod access.
- [kind configuration](https://kind.sigs.k8s.io/docs/user/configuration/): default networking is distinct from an optional enforcing CNI.

The fixture requires source/destination on distinct workers with required anti-affinity and compares actual observed IPs. It does not run privileged host tooling or change routes, CNI configuration or MTU. kindnet is explicitly **not** claimed to enforce NetworkPolicy. `kube-proxy`/`kindnet` diagnostics target this baseline, not every Kubernetes distribution; implementation-specific substitutes need adapted commands.

## observability

The stack is deliberately local **Docker Compose**, separate from Kubernetes, to show a complete small signal path without pretending cluster exporters exist. Versioned teaching inputs:

- Python image **3.13.9-slim**, OpenTelemetry Python SDK and OTLP HTTP exporter **1.38.0** paired deliberately to their checked API (not a claim of latest support).
- Collector Contrib **0.163.0**, [official distribution release](https://github.com/open-telemetry/opentelemetry-collector-releases/releases/tag/v0.163.0).
- Prometheus **3.15.1**, [official release](https://github.com/prometheus/prometheus/releases/tag/v3.15.1).
- Grafana OSS image **13.2.4**, [official release list](https://github.com/grafana/grafana/releases) checked on consultation date.

Protocol compatibility comes from OTLP HTTP and Prometheus exposition, not matching version numbers across unrelated projects. Tags and direct Python package versions are fixed; transitive Python dependencies are resolved by pip and are not claimed fully locked. Production use requires reviewed digests, a full lock and current patch review.

Primary references:

- [OpenTelemetry Collector configuration](https://opentelemetry.io/docs/collector/configuration/): receivers/processors/exporters, explicit signal pipelines, binding and validation.
- [OpenTelemetry Python instrumentation](https://opentelemetry.io/docs/languages/python/instrumentation/): trace/metric providers, instruments, resources and context.
- [Python SDK 1.38.0 release](https://github.com/open-telemetry/opentelemetry-python/releases/tag/v1.38.0) and [versioned logging example](https://raw.githubusercontent.com/open-telemetry/opentelemetry-python/v1.38.0/docs/examples/logs/example.py): pinned `LoggerProvider`, `LoggingHandler` and correlated log context. Logs APIs are experimental; newer releases move/deprecate handlers, so the lesson explicitly avoids silently upgrading them.
- [Collector 0.163.0 Prometheus exporter](https://raw.githubusercontent.com/open-telemetry/opentelemetry-collector-contrib/v0.163.0/exporter/prometheusexporter/README.md): explicit `UnderscoreEscapingWithSuffixes`, counter/unit suffixes, scrape endpoint and metric freshness limits.
- [Prometheus getting started](https://prometheus.io/docs/prometheus/latest/getting_started/): real scrape jobs and target status.
- [PromQL functions](https://prometheus.io/docs/prometheus/latest/querying/functions/): `rate` and histogram quantiles with real observations, not fabricated samples.
- [Grafana Docker setup](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/) and [datasource provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/): OSS image, environment configuration and container-local datasource URL.

Signals: actual Python HTTP requests generate a counter, a duration histogram, a span and a structured correlated log. Metrics use Collector Prometheus export -> Prometheus -> Grafana Explore. Traces/logs use Collector debug output **without durable backend**. No kube-state-metrics, node exporter, Loki, Tempo, cloud account, alert notifications or invented production telemetry. Approximately **2 CPU / 2 GiB additional RAM** is an evaluation estimate, not measured capacity. OTLP is internal to the Compose network; published HTTP ports bind to `127.0.0.1`; a learner-chosen Grafana password is required, never committed or printed by instructions. `down --volumes` explicitly deletes only the dedicated Compose project's retained local data. The agent did not start Compose or download images.

## incidents

- [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/): selector, endpoint, port and direct-versus-Service checks.
- [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/): endpoint addresses/ports/readiness and reconciliation.
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/): rollout history covers the Deployment Pod template, not unrelated Service mutations.

The bounded incident is an intentionally added `release: canary` Service selector while Pods retain `release: stable`. Evidence distinguishes healthy Pods/DNS from absent selected endpoints; mitigation removes only the injected selector key. A second targetPort drill demonstrates a different failure with endpoints still present. The runbook requires actual UTC timestamps, factual impact, hypotheses and ten fresh client requests for recovery. It does not claim a production success rate, duration, SLO, external communication or real incident execution. No broad restarts, cluster disruption or infrastructure mutation are performed by the authoring agent.
