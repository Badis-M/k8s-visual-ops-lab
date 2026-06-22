import { Link } from "react-router";

export function K8sBasicsPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">K8s Basics</p>

      <h1>How Kubernetes runs your application.</h1>

      <p className="lead">
        Kubernetes receives a desired state, stores it, and continuously works to
        make the real cluster match that desired state. This page explains the
        core architecture used by the lab before you run the commands.
      </p>

      <section className="lab-placeholder basics-warning-card">
        <p className="basics-warning-label">Before Kubernetes</p>
        <h2>Kubernetes is easier when the foundations are clear.</h2>
        <p>
          Kubernetes brings together Linux, networking, containers, and basic
          application operations. You do not need to be an expert, but these
          foundations make Pods, Services, logs, and troubleshooting much easier
          to understand.
        </p>

        <ul className="basics-foundation-list">
          <li>
            <strong>Linux basics:</strong> know how to move around the filesystem,
            inspect files, read logs, and check processes with commands like
            <code> cd</code>, <code> ls</code>, <code> cat</code>,
            <code> grep</code>, <code> ps</code>, and <code> top</code>.
          </li>
          <li>
            <strong>Networking basics:</strong> understand IP addresses, ports,
            HTTP requests, DNS names, and why a Service needs a stable access
            point in front of changing Pods.
          </li>
          <li>
            <strong>Container basics:</strong> understand that a Docker image is a
            packaged application, while a running container is the execution of
            that image.
          </li>
          <li>
            <strong>Troubleshooting mindset:</strong> be able to ask simple
            questions: is the process running, is the port reachable, are the
            logs clear, and is the configuration correct?
          </li>
        </ul>
      </section>

      <section className="lab-placeholder">
        <h2>What is Kubernetes?</h2>
        <p>
          Kubernetes is a container orchestration platform. It helps run
          containerized applications, keep them available, restart them when they
          fail, expose them on the network, and update them in a controlled way.
        </p>
        <p>
          The short version: you describe what you want, and Kubernetes works to
          make it true.
        </p>
      </section>

      <section className="lab-placeholder">
        <h2>What is K8s?</h2>
        <p>
          K8s is simply a shorter way to write Kubernetes. The number 8 replaces
          the eight letters between the K and the s.
        </p>
      </section>

      <section className="lab-placeholder">
        <h2>Why do teams use Kubernetes?</h2>
        <ul className="concept-list">
          <li>
            <strong>Self-healing:</strong> Kubernetes can restart or replace
            containers when they fail.
          </li>
          <li>
            <strong>Scaling:</strong> teams can run more than one replica of an
            application to handle more traffic or improve availability.
          </li>
          <li>
            <strong>Controlled updates:</strong> new versions can be rolled out
            progressively instead of replacing everything manually at once.
          </li>
          <li>
            <strong>Stable access:</strong> applications can be exposed through a
            Service even when the Pods behind it change.
          </li>
        </ul>
      </section>

      <section className="lab-placeholder">
        <h2>Kubernetes works with objects</h2>
        <p>
          Kubernetes does not work like a script where each command directly
          starts a process. You describe objects in YAML, send them to the API,
          and Kubernetes works to keep the cluster aligned with that description.
        </p>
        <ul className="concept-list">
          <li>
            <strong>Namespace:</strong> groups related resources so the lab stays
            isolated from the rest of the cluster.
          </li>
          <li>
            <strong>Deployment:</strong> describes how many application Pods
            should exist and which container image they should run.
          </li>
          <li>
            <strong>Pod:</strong> runs the application container. In this lab, each
            Pod runs the FastAPI app.
          </li>
          <li>
            <strong>Service:</strong> gives changing Pods a stable network access
            point.
          </li>
        </ul>
      </section>

      <section className="lab-placeholder">
        <h2>Pod, Deployment, and Service</h2>
        <p>
          These three concepts are the core of the lab. They are related, but
          they do not do the same job.
        </p>
        <ul className="concept-list">
          <li>
            <strong>Pod:</strong> where the container actually runs.
          </li>
          <li>
            <strong>Deployment:</strong> the controller that keeps the expected
            number of Pods running.
          </li>
          <li>
            <strong>Service:</strong> the stable entry point used to reach the Pods
            over the network.
          </li>
        </ul>
      </section>

      <section className="lab-placeholder">
        <h2>Control plane and worker nodes</h2>
        <p>
          The control plane makes decisions and stores the state of the cluster.
          Worker nodes run the application workloads as Pods and containers.
        </p>

        <div className="architecture-diagram" aria-label="Kubernetes architecture diagram">
          <div className="diagram-user">User / kubectl</div>
          <div className="diagram-arrow">↓</div>

          <div className="diagram-layer control-plane">
            <div className="diagram-layer-heading">Control Plane</div>
            <div className="diagram-grid">
              <article>
                <strong>API Server</strong>
                <span>Receives kubectl and manifest requests.</span>
              </article>
              <article>
                <strong>etcd</strong>
                <span>Stores the desired and current cluster state.</span>
              </article>
              <article>
                <strong>Scheduler</strong>
                <span>Chooses a worker node for new Pods.</span>
              </article>
              <article>
                <strong>Controller Manager</strong>
                <span>Reconciles desired state with real state.</span>
              </article>
            </div>
          </div>

          <div className="diagram-arrow">↓</div>

          <div className="diagram-layer worker-node">
            <div className="diagram-layer-heading">Worker Node</div>
            <div className="diagram-grid">
              <article>
                <strong>kubelet</strong>
                <span>Local agent that makes sure Pods run.</span>
              </article>
              <article>
                <strong>Container runtime</strong>
                <span>Starts and manages containers.</span>
              </article>
              <article>
                <strong>kube-proxy</strong>
                <span>Helps route Service traffic to Pods.</span>
              </article>
              <article>
                <strong>Pods</strong>
                <span>Smallest deployable units that run containers.</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="lab-placeholder">
        <h2>What happens when you run kubectl apply?</h2>
        <p>
          <code>kubectl apply</code> starts a reconciliation loop. You submit a
          manifest, Kubernetes stores the desired state, then the control plane
          and worker node components cooperate until the application is running.
        </p>

        <div className="apply-timeline" aria-label="kubectl apply chronological execution flow">
          <article className="apply-timeline-step">
            <span className="apply-timeline-number">01</span>
            <div>
              <p className="apply-timeline-zone">Kubectl apply</p>
              <h3>kubectl sends the manifest</h3>
              <p>
                Your terminal sends <code>deployment.yaml</code> or
                <code> service.yaml</code> to the Kubernetes API. No Pod is
                created locally by kubectl.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-control-plane">
            <span className="apply-timeline-number">02</span>
            <div>
              <p className="apply-timeline-zone">Control Plane · API Server</p>
              <h3>The API Server receives and validates the request</h3>
              <p>
                The API Server is the front door of the cluster. It checks the
                manifest, validates the object, and exposes it to the rest of the
                control plane.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-control-plane">
            <span className="apply-timeline-number">03</span>
            <div>
              <p className="apply-timeline-zone">Control Plane · etcd</p>
              <h3>The desired state is stored</h3>
              <p>
                etcd stores the fact that Kubernetes should now have a Deployment,
                a ReplicaSet, Pods, or a Service matching the manifest.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-control-plane">
            <span className="apply-timeline-number">04</span>
            <div>
              <p className="apply-timeline-zone">Control Plane · Controllers</p>
              <h3>Controllers compare desired state and real state</h3>
              <p>
                The controller manager notices that the requested Pods do not
                exist yet. It starts reconciling the cluster toward the desired
                state.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-control-plane">
            <span className="apply-timeline-number">05</span>
            <div>
              <p className="apply-timeline-zone">Control Plane · Scheduler</p>
              <h3>The Scheduler chooses a worker node</h3>
              <p>
                The Scheduler decides where each pending Pod should run. It does
                not start the container itself; it assigns the Pod to a node.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-worker-node">
            <span className="apply-timeline-number">06</span>
            <div>
              <p className="apply-timeline-zone">Worker Node · kubelet</p>
              <h3>kubelet receives the Pod assignment</h3>
              <p>
                kubelet runs on the worker node. It watches for Pods assigned to
                its node and makes sure the expected containers are running.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-worker-node">
            <span className="apply-timeline-number">07</span>
            <div>
              <p className="apply-timeline-zone">Worker Node · Runtime</p>
              <h3>The container runtime starts the application</h3>
              <p>
                The runtime starts the FastAPI container from the image that was
                loaded into kind. The Pod becomes the running workload.
              </p>
            </div>
          </article>

          <article className="apply-timeline-step apply-timeline-worker-node">
            <span className="apply-timeline-number">08</span>
            <div>
              <p className="apply-timeline-zone">Worker Node · Service routing</p>
              <h3>The Service points traffic to matching Pods</h3>
              <p>
                The Service selects Pods using labels. In this lab,
                <code> kubectl port-forward</code> then creates a temporary path
                from your machine to that Service.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="lab-placeholder">
        <h2>How this maps to the lab</h2>
        <ul className="concept-list">
          <li>
            <strong>Docker image:</strong> packages the FastAPI application so it
            can run as a container.
          </li>
          <li>
            <strong>kind cluster:</strong> provides a local Kubernetes cluster
            running on Docker.
          </li>
          <li>
            <strong>Namespace:</strong> isolates the lab resources under{" "}
            <code>k8s-ops</code>.
          </li>
          <li>
            <strong>Deployment:</strong> declares that two application Pods should
            exist.
          </li>
          <li>
            <strong>Service:</strong> gives the Pods a stable internal access
            point.
          </li>
          <li>
            <strong>port-forward:</strong> creates a temporary tunnel from your
            machine to the Kubernetes Service.
          </li>
        </ul>
      </section>

      <article className="lab-placeholder next-action-card">
        <h2>Next step</h2>
        <p>
          Once the architecture is clear, prepare your local machine or open the
          guided lab directly.
        </p>
        <div className="home-actions">
          <Link className="button-link button-link-primary" to="/prerequisites">
            Check prerequisites
          </Link>
          <Link className="button-link button-link-secondary" to="/lab">
            Open the lab
          </Link>
        </div>
      </article>
    </section>
  );
}
