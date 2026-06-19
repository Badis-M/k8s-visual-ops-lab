const steps = [
  {
    number: "01",
    title: "Understand the FastAPI app",
    goal: "Start from a small API that gives Kubernetes something concrete to run.",
    why: "Before using Docker or Kubernetes, the application should be understandable and testable on its own.",
    command: `cd lab
python3 --version
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
python -m uvicorn app.main:app --reload`,
    explanation:
      "This step validates the application before any container or Kubernetes object exists. You enter the lab folder, check that Python 3 is available, create an isolated virtual environment, install the FastAPI dependencies, and start the API with Uvicorn. This confirms that the application itself works before adding Docker and Kubernetes layers.",
    expected:
      "Python is available, the virtual environment is active, dependencies are installed, and the API responds locally before any container or Kubernetes resource exists.",
    mistake:
      "This local Python test is optional, but recommended. Skipping it means you may debug Docker or Kubernetes while the application itself has not been validated yet.",
    fix: {
      title: "Optional local validation",
      command: `curl http://127.0.0.1:8000/
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/ready
curl http://127.0.0.1:8000/config`,
      explanation:
        "If Python is not installed, install Python 3 first, then create a virtual environment with venv. This keeps the FastAPI dependencies isolated from the rest of your machine. Uvicorn is started with --reload for local development so code changes restart the server automatically.",
    },
  },
  {
    number: "02",
    title: "Build the Docker image",
    goal: "Package the application into a container image.",
    why: "Kubernetes does not run a source folder directly. It runs containers created from images.",
    command: "docker build -t k8s-ops-api:local lab/app",
    explanation:
      "This command builds a Docker image from the lab/app directory. That directory is the Docker build context, so Docker uses the Dockerfile and the application files inside it to create a reusable image tagged k8s-ops-api:local. The tag matters because the Kubernetes Deployment references the same image name later.",
    expected: "The image k8s-ops-api:local exists in the local Docker image cache.",
    mistake: "Using one image tag during the build and another one inside the Deployment manifest.",
  },
  {
    number: "03",
    title: "Create the kind cluster",
    goal: "Create a local Kubernetes cluster that runs on Docker.",
    why: "kind gives you a disposable Kubernetes environment without needing a cloud provider.",
    command: "kind create cluster --name k8s-ops-lab",
    explanation:
      "This creates a local Kubernetes cluster named k8s-ops-lab. With kind, the Kubernetes node itself runs as a Docker container. kubectl is then configured to point to the new context, usually kind-k8s-ops-lab, so the following kubectl commands target this local cluster.",
    expected: "kubectl can communicate with the local cluster.",
    mistake: "Assuming that a local Docker image is automatically available inside kind nodes.",
  },
  {
    number: "04",
    title: "Load the image into kind",
    goal: "Make the locally built image available to the kind cluster.",
    why: "The Kubernetes node created by kind needs access to the image before it can start the Pod.",
    command: "kind load docker-image k8s-ops-api:local --name k8s-ops-lab",
    explanation:
      "The Docker image exists on your machine, but the kind node has its own container runtime. This command copies the local k8s-ops-api:local image into the kind cluster so Kubernetes can start Pods from it without pulling from an external registry.",
    expected: "The image is available inside the kind cluster nodes.",
    mistake: "Skipping this step and getting ImagePullBackOff when the Pod starts.",
  },
  {
    number: "05",
    title: "Apply Kubernetes manifests",
    goal: "Create the Namespace first, then create the Deployment and Service from YAML files.",
    why: "Deployment and Service are namespaced resources. The namespace must exist before Kubernetes can create resources inside it.",
    command: `kubectl config current-context
kubectl apply -f lab/k8s/working/namespace.yaml
kubectl apply -f lab/k8s/working/deployment.yaml
kubectl apply -f lab/k8s/working/service.yaml`,
    explanation:
      "This step sends the YAML manifests to the Kubernetes API server. The namespace is applied first because the Deployment and Service both declare namespace: k8s-ops. Once the namespace exists, Kubernetes can create the application workload and the internal Service inside that namespace.",
    expected:
      "The k8s-ops Namespace exists, then the k8s-ops-api-deployment Deployment and k8s-ops-api-service Service are created inside it.",
    mistake:
      "Applying the whole folder immediately after deleting the namespace can fail because the Deployment may be processed before the namespace is fully available.",
    fix: {
      title: "Why not only apply the whole folder?",
      command: `kubectl apply -f lab/k8s/working/
kubectl get all -n k8s-ops`,
      explanation:
        "Applying the whole folder can work after the namespace already exists. For a from-scratch run, this lab applies namespace.yaml first to make the order explicit and easier to understand.",
    },
  },
  {
    number: "06",
    title: "Inspect Deployment, ReplicaSet, and Pods",
    goal: "Understand what Kubernetes created after applying the Deployment.",
    why: "A Deployment manages a ReplicaSet, and the ReplicaSet manages Pods. In this lab, the Deployment is intentionally named k8s-ops-api-deployment to make its role obvious.",
    command: `kubectl get deployment -n k8s-ops
kubectl get replicaset -n k8s-ops
kubectl get pods -n k8s-ops
kubectl get deploy,rs,pods -n k8s-ops
kubectl describe deployment k8s-ops-api-deployment -n k8s-ops`,
    explanation:
      "These commands show the hierarchy created by the Deployment. The Deployment expresses the desired state, the ReplicaSet keeps the requested number of replicas, and the Pods are the running application instances. The describe command adds useful detail such as events, labels, selectors, image name, and rollout status.",
    expected:
      "The k8s-ops-api-deployment Deployment is visible, Kubernetes created a ReplicaSet for it, and two Pods are running because replicas is set to 2.",
    mistake:
      "Using the cluster name or lab name as the namespace. The namespace in the YAML files is k8s-ops, not k8s-ops-lab.",
  },
  {
    number: "07",
    title: "Expose with a ClusterIP Service",
    goal: "Give the Pods a stable internal access point.",
    why: "Pods are temporary. A Service provides a stable way to reach the selected Pods. In this lab, the Service is intentionally named k8s-ops-api-service to make its role explicit.",
    command: `kubectl get service -n k8s-ops
kubectl describe service k8s-ops-api-service -n k8s-ops
kubectl get pods -n k8s-ops --show-labels`,
    explanation:
      "This step verifies that the Service exists and that its selector matches the labels on the Pods. The Service named k8s-ops-api-service targets Pods with app=k8s-ops-api and exposes port 80 inside the cluster while forwarding traffic to container port 8000.",
    expected:
      "The k8s-ops-api-service ClusterIP Service exists and selects Pods with the app=k8s-ops-api label.",
    mistake:
      "Looking for a Service named k8s-ops-api. The actual Service name in service.yaml is k8s-ops-api-service.",
  },
  {
    number: "08",
    title: "Access with port-forward",
    goal: "Reach the Service from your local machine.",
    why: "A ClusterIP Service is internal to the cluster, so local access needs a tunnel from your machine to the Kubernetes Service.",
    command: `kubectl port-forward service/k8s-ops-api-service 8080:80 -n k8s-ops

# In another terminal:
curl http://localhost:8080/
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/config`,
    explanation:
      "The Service is only reachable from inside the cluster, so port-forward opens a temporary local tunnel from localhost:8080 to the Service port 80. The curl commands then test the application through the same Kubernetes path that traffic would take inside the cluster.",
    expected:
      "The API is reachable from http://localhost:8080 and the /health endpoint returns a healthy status.",
    mistake:
      "Port-forwarding to the Deployment name or to a shortened Service name. The correct target here is service/k8s-ops-api-service in the k8s-ops namespace.",
  },
  {
    number: "09",
    title: "Troubleshoot common failures",
    goal: "Debug the most common local Kubernetes issues methodically.",
    why: "Most failures come from image loading, labels, ports, namespaces, or application startup.",
    command: `kubectl get all -n k8s-ops
kubectl describe pod -n k8s-ops
kubectl logs -n k8s-ops -l app=k8s-ops-api
kubectl describe service k8s-ops-api-service -n k8s-ops`,
    explanation:
      "This troubleshooting flow checks the cluster state from broad to specific. get all gives a quick overview, describe pod shows scheduling and image events, logs show application output, and describe service confirms selector, ports, and endpoints. This separates application failures from Kubernetes configuration failures.",
    expected: "Events, logs, labels, and Service details point to the failing layer.",
    mistake:
      "Changing multiple files at once before identifying whether the failure comes from the image, the Pod, the labels, the Service, or the namespace.",
  },
  {
    number: "10",
    title: "Clean up",
    goal: "Delete the local cluster and return to a clean state.",
    why: "A good lab should be repeatable from scratch without hidden state.",
    command: "kind delete cluster --name k8s-ops-lab",
    explanation:
      "This removes the entire local kind cluster, including the namespace, Deployment, Service, Pods, and the image loaded into that cluster. After cleanup, the next run starts from a clean environment, which makes the lab repeatable and avoids confusing old resources with new ones.",
    expected: "The local Kubernetes cluster is removed.",
    mistake: "Leaving old clusters running and confusing previous state with the current lab.",
  },
];

export function LabPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Guided lab</p>

      <h1>Rebuild k8s-ops-lab</h1>

      <p className="lead">
        This lab recreates a local Kubernetes workflow from the application layer
        to the cluster layer: FastAPI app, Docker image, kind cluster,
        Kubernetes manifests, Pods, Service exposure, local access, and
        troubleshooting.
      </p>

      <div className="lab-guide">
        <aside className="lab-aside" aria-label="Lab table of contents">
          <p className="eyebrow">On this page</p>
          <nav className="lab-toc">
            <a href="#lab-architecture">Lab architecture</a>
            {steps.map((step) => (
              <a key={step.number} href={`#step-${step.number}`}>
                Step {step.number} — {step.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="lab-main">
          <section id="lab-architecture" className="lab-architecture">
            <h2>Lab architecture</h2>
            <p>
              FastAPI app → Docker image → kind cluster → Namespace → Deployment
              → ReplicaSet → Pods → ClusterIP Service → port-forward → local
              browser or curl test.
            </p>
          </section>

          {steps.map((step) => (
            <section key={step.number} id={`step-${step.number}`} className="lab-step">
              <div className="lab-step-heading">
                <span className="step-number">Step {step.number}</span>
                <h2>{step.title}</h2>
              </div>

              <p>{step.goal}</p>

              <div className="lab-step-section">
                <h3>Why it matters</h3>
                <p>{step.why}</p>
              </div>

              <pre><code>{step.command}</code></pre>

              <div className="lab-step-section">
                <h3>Explanation</h3>
                <p>{step.explanation}</p>
              </div>

              <div className="lab-step-section">
                <h3>Expected result</h3>
                <p>{step.expected}</p>
              </div>

              <div className="lab-step-section">
                <h3>Common mistake</h3>
                <p>{step.mistake}</p>
              </div>

              {step.fix && (
                <div className="lab-step-section">
                  <h3>{step.fix.title}</h3>
                  <pre><code>{step.fix.command}</code></pre>
                  <p>{step.fix.explanation}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
