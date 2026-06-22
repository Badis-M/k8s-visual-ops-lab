import { Link } from "react-router";

export function HomePage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Kubernetes Visual Ops Lab</p>

      <h1>Learn Kubernetes by rebuilding a real local lab.</h1>

      <p className="lead">
        A visual learning platform that explains how Kubernetes runs an
        application, then guides you through a local hands-on lab with FastAPI,
        Docker, kind, kubectl, Deployments, Pods, Services, and troubleshooting.
      </p>

      <div className="home-actions">
        <Link className="button-link button-link-primary" to="/k8s-basics">
          Start with K8s Basics
        </Link>
        <Link className="button-link button-link-secondary" to="/lab">
          Open the lab
        </Link>
        <a
          className="button-link button-link-secondary"
          href="https://github.com/Badis-M/k8s-visual-ops-lab"
          target="_blank"
          rel="noreferrer"
        >
          Open GitHub repository
        </a>
      </div>

      <div className="learning-path home-learning-list">
        <article>
          <h2>K8s Fundamentals</h2>
          <p>
            Understand what Kubernetes is, why it exists, and how the control
            plane and worker nodes cooperate to run applications.
          </p>
        </article>

        <article>
          <h2>Prerequisites</h2>
          <p>
            Prepare the local tools required for the lab: Docker, kubectl, kind,
            Python, and a terminal workflow.
          </p>
        </article>

        <article>
          <h2>Guided lab</h2>
          <p>
            Rebuild k8s-ops-lab step by step, from application packaging to
            Kubernetes deployment and Service exposure.
          </p>
        </article>

        <article>
          <h2>Source files</h2>
          <p>
            Review the FastAPI application, Dockerfile, and Kubernetes manifests
            used by the lab.
          </p>
        </article>
      </div>
    </section>
  );
}