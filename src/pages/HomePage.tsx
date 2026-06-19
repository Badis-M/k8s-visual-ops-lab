export function HomePage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Kubernetes Visual Ops Lab</p>

      <h1>Learn Kubernetes by rebuilding a real local lab.</h1>

      <p className="lead">
        This platform explains Kubernetes fundamentals, required tools, and the
        step-by-step workflow behind a local FastAPI deployment running on a kind
        cluster.
      </p>

      <div className="learning-path">
        <article>
          <span>01</span>
          <h2>Kubernetes basics</h2>
          <p>Understand what Kubernetes does and why it exists.</p>
        </article>

        <article>
          <span>02</span>
          <h2>Local prerequisites</h2>
          <p>Prepare Docker, kubectl, kind, and the terminal workflow.</p>
        </article>

        <article>
          <span>03</span>
          <h2>Hands-on lab</h2>
          <p>Rebuild k8s-ops-lab step by step from Docker to Service exposure.</p>
        </article>
      </div>
    </section>
  );
}
