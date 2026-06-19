import { Link } from "react-router";

export function HomePage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Kubernetes Visual Ops Lab</p>

      <h1>Learn Kubernetes by rebuilding a real local lab.</h1>

      <p className="lead">
        A guided learning platform that explains Kubernetes fundamentals through
        a practical local project: a FastAPI application packaged as a Docker
        image, loaded into a kind cluster, deployed with Kubernetes manifests,
        exposed through a Service, and tested from your machine.
      </p>

          <article className="lab-placeholder">
        <h2>Minimum knowledge before starting Kubernetes</h2>
        <p>
          You do not need to master Kubernetes before starting this lab, but a few
          foundations will make the learning path much clearer.
        </p>
        <ul>
          <li>
            <strong>Linux basics:</strong> files, processes, ports, logs,
            environment variables, and why most cloud-native workloads run on
            Linux-based systems.
          </li>
          <li>
            <strong>Terminal basics:</strong> commands, flags, output, errors,
            and stopping a running process.
          </li>
          <li>
            <strong>HTTP basics:</strong> requests, responses, localhost, and
            application ports such as localhost:8080.
          </li>
          <li>
            <strong>Docker basics:</strong> the difference between an image and a
            running container, and why a Dockerfile packages an application.
          </li>
          <li>
            <strong>YAML basics:</strong> indentation-based configuration files,
            because Kubernetes objects are usually described as YAML manifests.
          </li>
        </ul>
      </article>

      <article className="lab-placeholder">
        <h2>What is Kubernetes?</h2>
        <p>
          Kubernetes is a container orchestration platform. In practice, it helps
          you run applications inside containers, keep them available, expose
          them on the network, and update them in a controlled way.
        </p>
        <p>
          This lab keeps the scope intentionally small: one local application,
          one local cluster, a few core Kubernetes objects, and a clear
          troubleshooting path.
        </p>
      </article>

      <article className="lab-placeholder">
        <h2>What you will build</h2>
        <p>
          FastAPI app → Docker image → kind cluster → Namespace → Deployment →
          Pods → ClusterIP Service → port-forward → troubleshooting
        </p>
      </article>

      <div className="learning-path">
        <article>
          <span>01</span>
          <h2>Kubernetes basics</h2>
          <p>
            Understand what Kubernetes does, what problem it solves, and why
            containers need orchestration.
          </p>
        </article>

        <article>
          <span>02</span>
          <h2>Local prerequisites</h2>
          <p>
            Prepare Docker, kubectl, kind, and the terminal workflow required to
            run the lab locally.
          </p>
        </article>

        <article>
          <span>03</span>
          <h2>Hands-on lab</h2>
          <p>
            Rebuild k8s-ops-lab step by step, from application packaging to
            Kubernetes deployment and Service exposure.
          </p>
        </article>

        <article>
          <span>04</span>
          <h2>Operational checks</h2>
          <p>
            Use kubectl get, describe, logs, and port-forward to verify what is
            running and debug common issues.
          </p>
        </article>
      </div>

      <article className="lab-placeholder">
        <h2>Start the learning path</h2>
        <p>
          Begin with the prerequisites if you want to prepare your local machine,
          or open the lab directly if your tools are already installed.
        </p>
        <div className="home-actions">
          <Link className="button-link button-link-primary" to="/prerequisites">
            Start with prerequisites
          </Link>
          <Link className="button-link button-link-secondary" to="/lab">
            Open the lab
          </Link>
        </div>
      </article>
    </section>
  );
}
