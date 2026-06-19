export function LabPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Guided lab</p>

      <h1>Rebuild k8s-ops-lab</h1>

      <p className="lead">
        The lab will recreate a local Kubernetes deployment based on a FastAPI
        application, a Docker image, a kind cluster, a Namespace, a Deployment,
        Pods, and a ClusterIP Service.
      </p>

      <div className="lab-placeholder">
        <h2>Step timeline coming next</h2>
        <p>
          Next, this page will be powered by structured lab steps: goal, concept,
          command, expected result, common mistake, and deep explanation.
        </p>
      </div>
    </section>
  );
}
