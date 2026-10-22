# Greeting operator: one complete shared example

This compact Go project is shared by `custom-controllers`, `operators` and `kubebuilder-operator`. It uses the Kubebuilder API/controller layout and markers, but is an intentionally reduced application-owned implementation rather than an untouched CLI scaffold. There is no essential TODO, external resource provisioning, webhook or finalizer.

## Toolchain and offline checks

- Go **1.25.3+** within the 1.25 line; authoring checks use 1.25.14.
- Kubernetes libraries **0.35.0**, controller-runtime **0.23.1**, controller-gen **0.20.0**.
- Kubebuilder **4.12.0** is used only for the optional scaffold comparison chapter; it is not required to build this checked-in implementation.

From this directory:

```bash
GOTOOLCHAIN=local GOMAXPROCS=2 go mod download
GOTOOLCHAIN=local GOMAXPROCS=2 make generate
GOTOOLCHAIN=local GOMAXPROCS=2 go test -p 2 ./...
umask 077
LAB_OPERATOR_BUILD_DIR=$(mktemp -d)
GOTOOLCHAIN=local GOMAXPROCS=2 go build -o "$LAB_OPERATOR_BUILD_DIR/greeting-controller" ./cmd
```

`generate` uses the pinned controller-gen module to regenerate deepcopy code and the shared CRD at `../../crds/greetings.yaml`. The first download and Go module metadata checks need network access; it never contacts Kubernetes. Review generated changes. `go.sum` records module checksums; do not remove it to hide dependency resolution errors.

Fake-client tests cover deterministic children, repeated calls with no extra writes (a direct write-call spy), desired-state changes, status generations, readiness, foreign ownership, returned conflicts and successful retry, pause, missing primaries, HTML escaping, and names incompatible with child Services. The fake does not run schema admission, real API defaulting, watches, leader election, garbage collection, scheduling or kubelet. envtest would add real API-server semantics, but still not workload execution; it is not started by these unit tests.

## API and controller contract

- `Greeting` uses group `learning.k8svisual.dev`, version `v1alpha1`, with message, replicas and paused fields.
- The name must be a DNS-1035 label beginning with a letter and at most 50 characters, so child labels/Service names remain valid without an optional feature gate.
- One owned ConfigMap (`<name>-content`), Deployment (`<name>`) and Service (`<name>`) are reconciled. Message content is HTML-escaped before serving; this API accepts plain text, not arbitrary HTML.
- Existing unowned or differently owned children are preserved and reported as conflicts. The controller never silently adopts matching names.
- Only managed fields are changed. API-defaulted container fields are explicit to avoid update loops; immutable selector differences require an explicit migration.
- Ready requires current Deployment observedGeneration, desired replica counts and updated/ready/available replicas. Status records the Greeting generation evaluated, and writes only when observations change.
- Pause leaves children unchanged, reports Ready false/Paused and retains a clearly potentially stale readyReplicas observation.
- Owned child API resources use Kubernetes garbage collection; no external cleanup justifies a finalizer here. The controller owns desired replicas, so do not add an HPA independently writing the same child field.

## Optional local run

No step in this README was executed against a cluster by the authoring agent. From the repository root, first inspect any existing shared CRD; do not overwrite another project's type. Then, on the reviewed disposable lab only:

```bash
alias k='kubectl --context kind-k8s-ops-lab'
k create namespace lab-operator
k apply -f lab/level-4/crds/greetings.yaml
k wait --for=condition=Established crd/greetings.learning.k8svisual.dev --timeout=60s
```

Build with the offline instructions above, then choose the local process:

```bash
"$LAB_OPERATOR_BUILD_DIR/greeting-controller" --context kind-k8s-ops-lab --namespace lab-operator
```

The explicit context is required outside Kubernetes: with no context argument, the binary requires in-cluster credentials and does not silently use your current kubeconfig context. The local process uses the selected kubeconfig identity; a namespaced cache is not an RBAC reduction of that identity. Its health endpoint uses host port **8081** and proves process responsiveness, not successful business reconciliation.

From a second terminal at the repository root:

```bash
kubectl --context kind-k8s-ops-lab -n lab-operator apply -f lab/level-4/crds/hello.yaml
kubectl --context kind-k8s-ops-lab -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s
kubectl --context kind-k8s-ops-lab -n lab-operator get greetings,deployments,services,configmaps
kubectl --context kind-k8s-ops-lab -n lab-operator port-forward service/hello 8082:8080
```

Use `curl --fail http://127.0.0.1:8082/` in another terminal. The website may already occupy 8080 and the local manager occupies 8081.

## Optional in-cluster run instead

Use this path instead of a local manager. From the repository root, after explicitly preparing the disposable namespace/CRD:

```bash
docker build -t greeting-controller:local lab/level-4/custom-controllers/greeting-operator
kind load docker-image greeting-controller:local --name k8s-ops-lab
kubectl --context kind-k8s-ops-lab apply -f lab/level-4/custom-controllers/greeting-operator/config/rbac.yaml
kubectl --context kind-k8s-ops-lab apply -f lab/level-4/custom-controllers/greeting-operator/config/manager.yaml
kubectl --context kind-k8s-ops-lab -n lab-operator rollout status deployment/greeting-controller --timeout=180s
```

The runtime is a static Go binary in a scratch image, running as UID 65532. Its projected ServiceAccount credentials are needed for reconciliation. RBAC is a namespaced Role; CRD installation remains a separate administrator step. Leader election uses a Lease in the watched namespace and serializes active managers for this one controller ID. This is not a claim of physical high availability.

## Cleanup

Stop the local process and port-forward with Ctrl+C if used. Delete the dedicated namespace; it removes the in-cluster manager, Role/RoleBinding, Lease, custom instances and child workloads. The shared CRD remains:

```bash
kubectl --context kind-k8s-ops-lab delete namespace lab-operator
kubectl --context kind-k8s-ops-lab get greetings.learning.k8svisual.dev --all-namespaces
```

Only if you installed this exact type and no remaining instance belongs to another chapter, explicitly delete `greetings.learning.k8svisual.dev`. Never remove unrelated CRDs, finalizers, roles or clusters for this cleanup.

Keep `LAB_OPERATOR_BUILD_DIR` in the manager terminal. After stopping the manager, inspect and manually remove that exact private directory.
