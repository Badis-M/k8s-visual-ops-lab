import mainPy from "../../lab/app/main.py?raw";
import requirementsTxt from "../../lab/app/requirements.txt?raw";
import dockerfile from "../../lab/app/Dockerfile?raw";
import namespaceYaml from "../../lab/k8s/working/namespace.yaml?raw";
import deploymentYaml from "../../lab/k8s/working/deployment.yaml?raw";
import serviceYaml from "../../lab/k8s/working/service.yaml?raw";

const sourceFiles = [
  {
    id: "fastapi-app",
    path: "lab/app/main.py",
    code: mainPy,
    title: "FastAPI application",
    purpose:
      "Defines the small API that will be packaged into a Docker image and deployed on Kubernetes.",
    notice: [
      "The app exposes simple endpoints that are easy to test.",
      "APP_NAME and READY come from environment variables.",
      "The /health and /ready endpoints are useful foundations for operational checks.",
    ],
    relatedStep: "Step 01 — Understand the FastAPI app",
  },
  {
    id: "requirements",
    path: "lab/app/requirements.txt",
    code: requirementsTxt,
    title: "Python dependencies",
    purpose:
      "Lists the Python packages required to run the FastAPI application inside the container image.",
    notice: [
      "The Docker build installs these dependencies before starting the application.",
      "Keeping dependencies explicit makes the lab repeatable on another machine.",
    ],
    relatedStep: "Step 02 — Build the Docker image",
  },
  {
    id: "dockerfile",
    path: "lab/app/Dockerfile",
    code: dockerfile,
    title: "Docker image definition",
    purpose:
      "Describes how to build the runnable container image used by the Kubernetes Deployment.",
    notice: [
      "The Dockerfile is located inside lab/app, so lab/app is the Docker build context.",
      "The resulting image tag must match the image used in the Deployment manifest.",
    ],
    relatedStep: "Step 02 — Build the Docker image",
  },
  {
    id: "namespace",
    path: "lab/k8s/working/namespace.yaml",
    code: namespaceYaml,
    title: "Namespace manifest",
    purpose: "Creates a dedicated Kubernetes namespace for the lab resources.",
    notice: [
      "The namespace isolates the lab objects from the default namespace.",
      "Other manifests should target the same namespace.",
    ],
    relatedStep: "Step 05 — Apply Kubernetes manifests",
  },
  {
    id: "deployment",
    path: "lab/k8s/working/deployment.yaml",
    code: deploymentYaml,
    title: "Deployment manifest",
    purpose:
      "Creates the application workload and tells Kubernetes which container image to run.",
    notice: [
      "replicas controls how many Pods should run.",
      "selector.matchLabels must match the Pod template labels.",
      "imagePullPolicy: Never is required because the image is loaded locally into kind.",
    ],
    relatedStep: "Step 06 — Inspect Deployment, ReplicaSet, and Pods",
  },
  {
    id: "service",
    path: "lab/k8s/working/service.yaml",
    code: serviceYaml,
    title: "Service manifest",
    purpose:
      "Creates a stable internal access point for the application Pods.",
    notice: [
      "The selector must match the labels on the Pods created by the Deployment.",
      "port is the Service port, while targetPort is the container port.",
      "ClusterIP means the Service is internal to the cluster.",
    ],
    relatedStep: "Step 07 — Expose with a ClusterIP Service",
  },
];

export function SourceFilesPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Lab source files</p>

      <h1>Understand the runnable lab material.</h1>

      <p className="lead">
        The repository contains the real source files used by the Kubernetes
        lab. The React application explains the workflow, while the lab folder
        contains the FastAPI application, Docker image definition, and
        Kubernetes manifests that can be executed locally.
      </p>

      <section className="github-action-card" aria-label="GitHub repository link">
        <div>
          <h2>Want to run the lab locally?</h2>
          <p>Clone or download the full repository from GitHub.</p>
        </div>

        <a
          className="button-link button-link-primary"
          href="https://github.com/Badis-M/k8s-visual-ops-lab"
          target="_blank"
          rel="noreferrer"
        >
          Open GitHub repository
        </a>
      </section>

      <div className="lab-guide">
        <aside className="lab-aside" aria-label="Source files table of contents">
          <p className="eyebrow">On this page</p>
          <nav className="lab-toc">
            {sourceFiles.map((file) => (
              <a key={file.id} href={`#${file.id}`}>
                {file.path}
              </a>
            ))}
          </nav>
        </aside>

        <div className="lab-main">
          <section className="lab-architecture">
            <h2>Repository layout</h2>
            <pre><code>{`lab/
├── app/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
└── k8s/
    └── working/
        ├── deployment.yaml
        ├── namespace.yaml
        └── service.yaml`}</code></pre>
            <p>
              The lab folder is intentionally separated from the React source
              code. It contains the files that users can build, apply, inspect,
              and troubleshoot while following the guided lab.
            </p>
          </section>

          {sourceFiles.map((file) => (
            <section key={file.id} id={file.id} className="source-file-section">
              <p className="source-file-path">{file.path}</p>
              <h2>{file.title}</h2>
              <p>{file.purpose}</p>

              <div className="source-file-meta">
                <span>{file.relatedStep}</span>
              </div>

              <div className="lab-step-section">
                <h3>What to notice</h3>
                <ul>
                  {file.notice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="lab-step-section">
                <h3>Source code</h3>
                <pre><code>{file.code}</code></pre>
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}