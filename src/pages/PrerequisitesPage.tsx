export function PrerequisitesPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Before the lab</p>

      <h1>Prerequisites</h1>

      <p className="lead">
        Before deploying anything to Kubernetes, the local machine must be able
        to build containers, create a local cluster, and communicate with it.
      </p>

      <div className="content-grid">
        <article>
          <h2>Required tools</h2>
          <ul>
            <li>Docker Desktop</li>
            <li>kubectl</li>
            <li>kind</li>
            <li>Node.js for this learning platform</li>
            <li>Python basics for the FastAPI app</li>
          </ul>
        </article>

        <article>
          <h2>Validation commands</h2>
          <pre><code>{`docker --version
kubectl version --client
kind version`}</code></pre>
        </article>
      </div>
    </section>
  );
}
