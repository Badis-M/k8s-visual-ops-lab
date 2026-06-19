const steps = [
  {
    number: "01",
    title: "Understand the FastAPI app",
    goal: "Start from a small API that gives Kubernetes something concrete to run.",
    why: "Before using Docker or Kubernetes, the application should be understandable and testable on its own.",
    command: "python -m uvicorn app.main:app --reload",
    expected: "The API responds locally before any container or Kubernetes resource exists.",
    mistake: "Jumping into Kubernetes before checking what the application actually does.",
  },
  {
    number: "02",
    title: "Build the Docker image",
    goal: "Package the application into a container image.",
    why: "Kubernetes does not run a source folder directly. It runs containers created from images.",
    command: "docker build -t k8s-ops-api:local ./app",
    expected: "The image k8s-ops-api:local exists in the local Docker image cache.",
    mistake: "Using one image tag during the build and another one inside the Deployment manifest.",
  },
  {
    number: "03",
    title: "Create the kind cluster",
    goal: "Create a local Kubernetes cluster that runs on Docker.",
    why: "kind gives you a disposable Kubernetes environment without needing a cloud provider.",
    command: "kind create cluster --name k8s-ops-lab",
    expected: "kubectl can communicate with the local cluster.",
    mistake: "Assuming that a local Docker image is automatically available inside kind nodes.",
  },
  {
    number: "04",
    title: "Load the image into kind",
    goal: "Make the locally built image available to the kind cluster.",
    why: "The Kubernetes node created by kind needs access to the image before it can start the Pod.",
    command: "kind load docker-image k8s-ops-api:local --name k8s-ops-lab",
    expected: "The image is available inside the kind cluster nodes.",
    mistake: "Skipping this step and getting ImagePullBackOff when the Pod starts.",
  },
  {
    number: "05",
    title: "Apply Kubernetes manifests",
    goal: "Create the Namespace, Deployment, and Service from YAML files.",
    why: "Kubernetes is usually driven by declarative manifests that describe the desired state.",
    command: "kubectl apply -f k8s/working/",
    expected: "The lab resources are created in the cluster.",
    mistake: "Applying the manifests while kubectl is pointing to the wrong Kubernetes context.",
    fix: {
      title: "Fix",
      command: `kubectl config current-context
kubectl config get-contexts
kubectl config use-context kind-k8s-ops-lab`,
      explanation:
      "kubectl sends commands to the current context configured in kubeconfig. If you previously worked on another cluster, switch back to the kind lab context before applying manifests.",
    },
  },
  {
    number: "06",
    title: "Inspect Deployment, ReplicaSet, and Pods",
    goal: "Understand what Kubernetes created after applying the Deployment.",
    why: "A Deployment manages a ReplicaSet, and the ReplicaSet manages Pods.",
    command: "kubectl get deploy,rs,pods -n k8s-ops-lab",
    expected: "The Deployment, ReplicaSet, and Pods are visible and healthy.",
    mistake: "Thinking that Deployment, ReplicaSet, and Pod are the same kind of object.",
  },
  {
    number: "07",
    title: "Expose with a ClusterIP Service",
    goal: "Give the Pods a stable internal access point.",
    why: "Pods are temporary. A Service provides a stable way to reach the selected Pods.",
    command: "kubectl get service -n k8s-ops-lab",
    expected: "A ClusterIP Service exists and targets the application Pods.",
    mistake: "Using a Service selector that does not match the Pod labels.",
  },
  {
    number: "08",
    title: "Access with port-forward",
    goal: "Reach the Service from your local machine.",
    why: "A ClusterIP Service is internal to the cluster, so local access needs a tunnel.",
    command: "kubectl port-forward service/k8s-ops-api 8080:80 -n k8s-ops-lab",
    expected: "The API is reachable from http://localhost:8080.",
    mistake: "Trying to open a ClusterIP address directly from the browser.",
  },
  {
    number: "09",
    title: "Troubleshoot common failures",
    goal: "Debug the most common local Kubernetes issues methodically.",
    why: "Most failures come from image loading, labels, ports, namespaces, or application startup.",
    command: "kubectl describe pod -n k8s-ops-lab",
    expected: "Events and logs point to the failing layer.",
    mistake: "Changing multiple files at once before identifying the actual failure.",
  },
  {
    number: "10",
    title: "Clean up",
    goal: "Delete the local cluster and return to a clean state.",
    why: "A good lab should be repeatable from scratch without hidden state.",
    command: "kind delete cluster --name k8s-ops-lab",
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
