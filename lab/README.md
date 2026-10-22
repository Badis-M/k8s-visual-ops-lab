# Local curriculum labs

These files support the web lessons. Nothing in the application runs them. All commands below are instructions for the learner; the curriculum implementation does not execute them.

## Deliberate baseline

- kind 0.31.0 and Kubernetes 1.35.0; kubectl 1.35.x is the simplest matching client.
- Docker with Linux containers and cgroup v2 support. Allow roughly 4 CPU / 6 GiB RAM for the basic multi-node lab; observability, GitOps, and multi-cluster chapters need more and identify their own requirements.
- Images use fixed tags for teaching repeatability, not guarantees of immutable registry content or vulnerability clearance. Use reviewed digests for production.
- Use a disposable cluster named k8s-ops-lab and explicit context kind-k8s-ops-lab. If that name already belongs to an existing lab, do not delete it to follow this guide. Reuse it only after checking it is disposable and meets the exercise prerequisites, or adapt all commands to a new name/context.

Create a cluster only when you choose to run the exercises:

```bash
kind create cluster --name k8s-ops-lab --image kindest/node:v1.35.0 --config lab/kind.yaml
kubectl --context kind-k8s-ops-lab get nodes -o wide
```

kind.yaml defines one control-plane and two worker nodes to demonstrate placement. All run on one host: this is not physical high availability. The default kind network does not enforce NetworkPolicies; network-policy labs require an enforcing CNI and describe that prerequisite. kind's local storage is not a production CSI service. Metrics APIs, Gateway/Ingress controllers and GitOps/observability stacks are not assumed installed.

Run chapter commands from the repository root. An alias is scoped to your current shell:

```bash
alias k='kubectl --context kind-k8s-ops-lab'
```

Each exercise uses its own namespace; do not place personal workloads there. Read the cleanup section before running failure scenarios. Namespaced cleanup does not remove cluster-scoped CRDs, ClusterRoles, webhooks, PVs, or third-party controllers: those exercises list extra cleanup explicitly.

When finished, cluster deletion destroys all workloads and local lab data:

```bash
kind delete cluster --name k8s-ops-lab
```

No cloud account or paid service is required. Downloads still need network access and third-party binaries must be installed by the learner. Application tests and manifest parsing do not prove these labs ran successfully on a cluster.
