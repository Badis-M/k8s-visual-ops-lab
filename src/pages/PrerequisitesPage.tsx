export function PrerequisitesPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Before the lab</p>

      <h1>Prepare your local environment.</h1>

      <p className="lead">
        This project is meant to be cloned or downloaded from GitHub, then run
        locally on your machine. Before starting the Kubernetes lab, make sure
        your workstation can run the learning platform, build containers, create
        a local cluster, and communicate with it.
      </p>

      <div className="content-grid">
        <article>
          <h2>Required tools</h2>
          <ul>
            <li>Git, to clone the repository from GitHub.</li>
            <li>
              A Linux-style terminal: Terminal on macOS, a Linux shell, or WSL 2
              on Windows.
            </li>
            <li>Node.js and npm, to run this Vite learning platform.</li>
            <li>Docker Desktop, to build images and provide a container runtime.</li>
            <li>kubectl, to communicate with the Kubernetes cluster.</li>
            <li>kind, to create a local Kubernetes cluster with Docker nodes.</li>
            <li>Python 3, to understand or run the FastAPI application locally.</li>
            <li>VS Code or another editor, to inspect the source files.</li>
          </ul>
        </article>

        <article>
          <h2>Optional but useful</h2>
          <ul>
            <li>A modern terminal with copy/paste support.</li>
            <li>A browser to open the learning platform.</li>
            <li>curl, to test HTTP endpoints from the terminal.</li>
            <li>tree, to inspect the project structure more easily.</li>
          </ul>
        </article>
      </div>

      <article className="lab-placeholder">
        <h2>Get the project</h2>
        <p>
          Clone the repository from GitHub, or download it as a ZIP archive and
          open the extracted folder in your terminal.
        </p>
        <pre><code>{`git clone <repository-url>
cd k8s-visual-ops-lab`}</code></pre>
      </article>

      <article className="lab-placeholder">
        <h2>Run the learning platform</h2>
        <p>
          Install the frontend dependencies, then start the local Vite
          development server.
        </p>
        <pre><code>{`npm install
npm run dev`}</code></pre>
        <p>Then open http://localhost:5173/ in your browser.</p>
      </article>

      <article className="lab-placeholder">
        <h2>Supported environments</h2>
        <p>
          This lab is written for macOS and Linux-style terminals. The commands
          are intended to be run from a Unix-like shell.
        </p>
        <p>
          On Windows, use WSL 2 with Ubuntu or another Linux distribution. Keep
          Docker Desktop running and enable WSL integration so Docker commands
          work from inside the WSL terminal.
        </p>
      </article>

      <article className="lab-placeholder">
        <h2>Validate Kubernetes lab tools</h2>
        <p>
          These commands confirm that the required tools are available before
          the lab starts creating Kubernetes resources.
        </p>
        <pre><code>{`git --version
node --version
npm --version
docker --version
kubectl version --client
kind version
python3 --version`}</code></pre>
      </article>

      <article className="lab-placeholder">
        <h2>Readiness checklist</h2>
        <ul>
          <li>The repository is cloned or downloaded locally.</li>
          <li>The learning platform starts with npm run dev.</li>
          <li>Docker Desktop is installed and running. (make sure to activate Kubernetes from the options)</li>
          <li>kubectl responds from the terminal.</li>
          <li>kind responds from the terminal.</li>
          <li>You are ready to create a local Kubernetes cluster in the lab.</li>
        </ul>
      </article>
    </section>
  );
}
