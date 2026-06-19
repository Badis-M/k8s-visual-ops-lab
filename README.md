# Kubernetes Visual Ops Lab

A visual learning platform and runnable Kubernetes lab for understanding how a small application becomes a containerized workload running inside a local Kubernetes cluster.

Live site:

```text
https://k8s.badismerakchi.com/
```

The repository contains two parts:

- `src/`: the React + TypeScript + Vite learning platform.
- `lab/`: the real runnable lab material used to build, deploy, inspect, troubleshoot, and clean up a local Kubernetes workload.

The goal is not to provide a production-ready Kubernetes platform. The goal is to make the core Kubernetes workflow understandable by rebuilding it step by step.

---

## What you will learn

This lab walks through the complete path from application source code to a running Kubernetes Service:

```text
FastAPI app
→ Docker image
→ kind cluster
→ image loaded into kind
→ Namespace
→ Deployment
→ ReplicaSet
→ Pods
→ ClusterIP Service
→ port-forward
→ local test
```

By the end, you should understand:

- what Kubernetes runs,
- why a Docker image is needed,
- how a local kind cluster works,
- how manifests describe Kubernetes resources,
- how a Deployment creates Pods,
- how a Service targets Pods,
- how to access a ClusterIP Service locally,
- how to debug common local Kubernetes issues.

---

## Repository structure

```text
k8s-visual-ops-lab/
├── lab/
│   ├── app/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── requirements.txt
│   └── k8s/
│       └── working/
│           ├── deployment.yaml
│           ├── namespace.yaml
│           └── service.yaml
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── CNAME
│   ├── favicon.svg
│   └── icons.svg
├── package.json
├── vite.config.ts
└── README.md
```

### `src/`

Contains the learning platform UI:

- home page,
- prerequisites page,
- guided lab page,
- source files page.

### `lab/`

Contains the real Kubernetes lab material:

- FastAPI application,
- Dockerfile,
- Kubernetes Namespace manifest,
- Kubernetes Deployment manifest,
- Kubernetes Service manifest.

This folder is intentionally separated from the React application. The UI explains the workflow, while `lab/` contains the files that are actually executed.

---

## Prerequisites

Install the following tools before running the full lab:

- Git
- Node.js and npm
- Docker Desktop or Docker Engine
- kubectl
- kind
- Python 3, optional for reading or running the app locally
- A Linux-style terminal

Supported environments:

- macOS terminal
- Linux shell
- Windows through WSL 2, preferably with Ubuntu and Docker Desktop WSL integration enabled

Validate your tools:

```bash
git --version
node --version
npm --version
docker --version
kubectl version --client
kind version
python3 --version
```

---

## Run the learning platform

Clone the repository:

```bash
git clone https://github.com/Badis-M/k8s-visual-ops-lab.git
cd k8s-visual-ops-lab
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173/
```

Build the frontend for production:

```bash
npm run build
```

---

## Deployment

The learning platform is deployed as a static Vite site through GitHub Pages.

Production URL:

```text
https://k8s.badismerakchi.com/
```

The custom domain is configured through:

- `public/CNAME`, copied into the production build by Vite,
- GitHub Pages custom domain settings,
- an OVH DNS `CNAME` record pointing `k8s.badismerakchi.com` to `badis-m.github.io`.

Because the site is served from a custom domain at the root path, the Vite base path should remain:

```ts
base: "/"
```

Useful deployment commands:

```bash
npm run build
git push
```

The GitHub Actions workflow builds the static site and publishes the `dist/` artifact to GitHub Pages.

---

## Run the Kubernetes lab

The following steps rebuild the lab from scratch.

### Step 1 — Inspect the FastAPI application

Source file:

```text
lab/app/main.py
```

The application exposes simple endpoints:

- `/`
- `/health`
- `/ready`
- `/config`

The goal is to have a small HTTP API that Kubernetes can run as a containerized workload.

Optional local run:

```bash
cd lab
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
python -m uvicorn app.main:app --reload
```

Then test:

```bash
curl http://127.0.0.1:8000/health
```

Return to the repository root before continuing:

```bash
cd ..
```

---

### Step 2 — Build the Docker image

Build the image from the `lab/app` directory:

```bash
docker build -t k8s-ops-api:local lab/app
```

Check that the image exists locally:

```bash
docker images | grep k8s-ops-api
```

Why this matters:

Kubernetes does not run your source folder directly. It runs containers created from images. The image tag must match the image referenced in the Deployment manifest.

---

### Step 3 — Create a local kind cluster

Create a disposable local Kubernetes cluster:

```bash
kind create cluster --name k8s-ops-lab
```

Check the current Kubernetes context:

```bash
kubectl config current-context
```

Expected context:

```text
kind-k8s-ops-lab
```

If needed, switch manually:

```bash
kubectl config use-context kind-k8s-ops-lab
```

Check the cluster:

```bash
kubectl get nodes
```

---

### Step 4 — Load the Docker image into kind

A local Docker image is not automatically available inside kind nodes. Load it into the cluster:

```bash
kind load docker-image k8s-ops-api:local --name k8s-ops-lab
```

Why this matters:

The Deployment uses:

```yaml
image: k8s-ops-api:local
imagePullPolicy: Never
```

This tells Kubernetes to use an image already available on the node. If the image was not loaded into kind, the Pod will not start correctly.

---

### Step 5 — Apply the Kubernetes manifests

Apply the Namespace first, then the namespaced resources:

```bash
kubectl apply -f lab/k8s/working/namespace.yaml
kubectl apply -f lab/k8s/working/deployment.yaml
kubectl apply -f lab/k8s/working/service.yaml
```

This avoids timing or ordering issues where a Deployment or Service is applied before the Namespace is available.

This creates:

- the `k8s-ops` Namespace,
- the `k8s-ops-api-deployment` Deployment,
- the `k8s-ops-api-service` ClusterIP Service.

Check the namespace:

```bash
kubectl get namespace k8s-ops
```

Check all lab resources:

```bash
kubectl get all -n k8s-ops
```

Common mistake:

Before applying manifests, always check that `kubectl` points to the right cluster:

```bash
kubectl config current-context
kubectl config get-contexts
kubectl config use-context kind-k8s-ops-lab
```

---

### Step 6 — Inspect Deployment, ReplicaSet, and Pods

Check the workload objects:

```bash
kubectl get deployment -n k8s-ops
kubectl get replicaset -n k8s-ops
kubectl get pods -n k8s-ops
```

Or all at once:

```bash
kubectl get deploy,rs,pods -n k8s-ops
```

Expected result:

- one Deployment,
- one ReplicaSet,
- two Pods, based on `replicas: 2` in the Deployment manifest.

Useful detailed inspection:

```bash
kubectl describe deployment k8s-ops-api-deployment -n k8s-ops
kubectl describe pod -n k8s-ops
```

---

### Step 7 — Inspect the Service

Check the Service:

```bash
kubectl get service -n k8s-ops
```

Expected Service:

```text
k8s-ops-api-service
```

The Service manifest uses:

```yaml
type: ClusterIP
selector:
  app: k8s-ops-api
ports:
  - port: 80
    targetPort: 8000
```

Meaning:

- `port: 80` is the Service port inside the cluster,
- `targetPort: 8000` forwards traffic to the container port,
- the selector targets Pods with `app: k8s-ops-api`.

---

### Step 8 — Access the application with port-forward

Because the Service is a ClusterIP Service, it is internal to the cluster. Use port-forward to access it from your local machine:

```bash
kubectl port-forward service/k8s-ops-api-service 8080:80 -n k8s-ops
```

In another terminal, test the API:

```bash
curl http://localhost:8080/
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/config
```

Expected health response:

```json
{"status":"healthy"}
```

---

### Step 9 — Troubleshoot common failures

#### Wrong Kubernetes context

Symptom:

```text
Resources are created in the wrong cluster, or kubectl cannot find expected resources.
```

Fix:

```bash
kubectl config current-context
kubectl config get-contexts
kubectl config use-context kind-k8s-ops-lab
```

#### Pod stuck in ImagePullBackOff

Symptom:

```bash
kubectl get pods -n k8s-ops
```

shows `ImagePullBackOff`.

Likely cause:

The image was built locally but not loaded into kind.

Fix:

```bash
kind load docker-image k8s-ops-api:local --name k8s-ops-lab
kubectl rollout restart deployment/k8s-ops-api-deployment -n k8s-ops
```

#### Service does not route traffic

Symptom:

Port-forward works poorly or the app is unreachable.

Check labels and selectors:

```bash
kubectl get pods -n k8s-ops --show-labels
kubectl describe service k8s-ops-api-service -n k8s-ops
```

The Service selector must match the Pod labels.

#### Pod starts but application fails

Check logs:

```bash
kubectl logs -n k8s-ops -l app=k8s-ops-api
```

Describe Pods:

```bash
kubectl describe pod -n k8s-ops
```

---

### Step 10 — Clean up

Delete the local kind cluster:

```bash
kind delete cluster --name k8s-ops-lab
```

Check that the context is gone or no longer active:

```bash
kubectl config get-contexts
```

Why this matters:

The lab should be repeatable from scratch. Cleaning up avoids confusing old cluster state with the next run.

---

## Source files explained

The learning platform includes a `/source-files` page that explains each file in the `lab/` folder and displays its actual content.

Main files:

| File | Role |
|---|---|
| `lab/app/main.py` | FastAPI application |
| `lab/app/requirements.txt` | Python dependencies |
| `lab/app/Dockerfile` | Container image definition |
| `lab/k8s/working/namespace.yaml` | Kubernetes namespace |
| `lab/k8s/working/deployment.yaml` | Application workload |
| `lab/k8s/working/service.yaml` | Stable internal access point |

---

## Useful commands

Run the UI:

```bash
npm run dev
```

Build the UI:

```bash
npm run build
```

Build the app image:

```bash
docker build -t k8s-ops-api:local lab/app
```

Create the local cluster:

```bash
kind create cluster --name k8s-ops-lab
```

Load the image into kind:

```bash
kind load docker-image k8s-ops-api:local --name k8s-ops-lab
```

Apply manifests:

```bash
kubectl apply -f lab/k8s/working/namespace.yaml
kubectl apply -f lab/k8s/working/deployment.yaml
kubectl apply -f lab/k8s/working/service.yaml
```

Inspect resources:

```bash
kubectl get all -n k8s-ops
```

Access the app:

```bash
kubectl port-forward service/k8s-ops-api-service 8080:80 -n k8s-ops
```

Clean up:

```bash
kind delete cluster --name k8s-ops-lab
```

---

## Reference documentation

- Vite guide: https://vite.dev/guide/
- Vite static assets: https://vite.dev/guide/assets
- GitHub Pages custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Docker build context: https://docs.docker.com/build/concepts/context/
- kind quick start: https://kind.sigs.k8s.io/docs/user/quick-start/
- kubectl reference: https://kubernetes.io/docs/reference/kubectl/
- kubectl apply: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/
- Kubernetes namespaces: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
- Kubernetes concepts: https://kubernetes.io/docs/concepts/

---

## Project status

Current scope:

- visual learning platform,
- runnable local Kubernetes lab,
- FastAPI application,
- Docker image build,
- kind local cluster,
- Kubernetes Deployment and Service,
- source file explanations,
- troubleshooting basics,
- GitHub Pages deployment with a custom domain.

Out of scope for now:

- production Kubernetes hardening,
- Helm,
- Ingress,
- CI/CD deployment pipeline,
- cloud-managed Kubernetes,
- live Kubernetes dashboard.