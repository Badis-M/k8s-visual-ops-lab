# Kubernetes Visual Ops Lab

A bilingual French/English learning application for understanding Kubernetes through visual explanations, interactive diagrams, quizzes, and practical local labs.

The project combines a web academy with real lab source files. Reading a lesson or marking it complete does not execute Kubernetes commands: learners run the exercises themselves in their terminal.

## Learning experience

- **Academy** (`/academy`): a curriculum organized into four levels. All 60 chapters are available: 11 beginner, 16 intermediate, 16 advanced, and 17 expert lessons.
- **Chapter reader** (`/learn/$chapterId`): explanations, commands, diagrams, quizzes, hints, and challenges.
- **Visual foundations** (`/k8s-basics`): Kubernetes architecture and reconciliation concepts.
- **Guided lab** (`/lab`): package a FastAPI application, build its Docker image, and deploy it into a local kind cluster.
- **Prerequisites** (`/prerequisites`) and **source files** (`/source-files`): preparation and the actual application/manifests used by the guided lab.

| Level            | Chapters | Focus                                                                                                                    |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1 — Beginner     | 11       | Architecture, reconciliation, kind, Pods, Deployments, Services and configuration                                        |
| 2 — Intermediate | 16       | Rollouts, resources/probes, stateful workloads, storage, networking, RBAC, placement and Helm                            |
| 3 — Advanced     | 16       | Delivery/GitOps, autoscaling, availability, security, observability, incidents and recovery                              |
| 4 — Expert       | 17       | API/controller internals, a complete Go Operator, admission/conversion, scheduler, etcd, CRI/CNI/CSI and platform design |

The 49 lessons added in levels 2–4 include equivalent French/English explanations, guided exercises, expected observations, diagnostic paths, explained quizzes, progressive hints, corrections and cleanup. The HPA diagram lets learners vary the CPU request and see its effect on nominal replica calculations. Expected outputs describe what learners should verify; they are not recorded cluster results.

Language preference and self-reported chapter progress are stored in the browser's localStorage. There is no account system, database, cross-device synchronization, or connection from the website to a Kubernetes cluster. The guided lab and its source-file descriptions are available in both languages.

## Stack

- React 19 and TypeScript
- TanStack Start and TanStack Router, with server-side rendering and file-based routes
- TanStack Query
- Vite 8, Tailwind CSS 4, Radix UI, and Lucide icons
- Nitro for production server packaging, targeting Cloudflare Workers
- Bun for dependency installation and scripts
- Vitest, Testing Library, and jsdom for application tests
- FastAPI, Docker, kind, and Kubernetes for the separate hands-on lab

## Run locally

Use Node.js 22.12 or newer and Bun 1.4.2 (the version used for this migration). Docker, kind, kubectl, and Python are not required just to browse the web application.

```bash
git clone https://github.com/Badis-M/k8s-visual-ops-lab.git
cd k8s-visual-ops-lab
bun install --frozen-lockfile
bun run dev
```

Open the URL printed by Vite (port 8080 by default, on the local loopback interface). No application secrets or environment variables are required for the current learning content. The interface loads Google Fonts from the network.

`bunfig.toml` keeps a 24-hour minimum release age for newly resolved dependencies; `bun.lock` records the dependency versions. Use Bun consistently rather than generating a second package-manager lockfile.

## Development commands

| Command                           | Purpose                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| `bun run dev`                     | Start the local development server                                      |
| `bun run build`                   | Build the client and production SSR server                              |
| `bun run preview`                 | Run Vite's build preview                                                |
| `bun run test`                    | Run the application test suite once                                     |
| `bun run check:labs`              | Parse lab YAML/JSON and check Bash/Python syntax without infrastructure |
| `bun run test:watch`              | Watch application tests                                                 |
| `bun x --no-install tsc --noEmit` | Check TypeScript without emitting files                                 |
| `bun run lint`                    | Check ESLint rules and Prettier formatting                              |
| `bun run format`                  | Rewrite formatting across the project; review the resulting diff        |

The production build and TypeScript check are separate commands. Application tests do not validate a real Kubernetes cluster. Existing formatting/type-check issues should be reviewed separately from feature changes rather than hidden by disabling checks.

## Repository map

```text
src/
  routes/                 File-based pages and root application shell
  content/                Curriculum, bilingual lesson data, quizzes, lab steps
    chapters/             All 60 chapters, with bilingual lesson blocks
    lesson-kit.ts         Small typed authoring helpers using the existing Block schema
  components/
    academy/              Reusable lesson, quiz, and navigation components
    diagrams/             Interactive Kubernetes diagrams
    ui/                   Shared UI primitives
  lib/                    Language, progress, utilities, and SSR error handling
  test/                   Content, routing, and interaction tests
  router.tsx              Router and per-request query client
  routeTree.gen.ts        Generated route tree; do not edit manually
  server.ts               SSR entry and error response handling
  start.ts                Request middleware, including server-function CSRF protection
lab/
  app/                    FastAPI application, dependencies, and Dockerfile
  k8s/working/            Original FastAPI lab manifests
  level-2/                Workload, networking, access and Helm exercises
  level-3/                Delivery, scaling, security, reliability and telemetry exercises
  level-4/                API extensions, Go Operator, internals and recovery exercises
  kind.yaml               Pinned one-control-plane/two-worker teaching topology
  README.md               Lab baseline, resources, dependencies and execution boundary
scripts/check-labs.mjs     Offline fixture syntax checks
docs/                     Implementation status and per-chapter official sources
public/                   Static assets
vite.config.ts            Explicit application plugins and production target
vitest.config.ts          Test environment
roadmap.md                Implemented and planned learning material
```

Lessons use the `L` bilingual string type and `Block` schema in `src/content/types.ts`. Reusable renderers live in `src/components/academy/`. A chapter is available only when it contains lesson blocks. The source-file page imports files directly from `lab/` with `?raw`, so edits there also update the displayed examples.

## Run the guided Kubernetes lab

Read [lab/README.md](lab/README.md) first. Use kind 0.31.0, Kubernetes 1.35.0 and a matching kubectl client as the deliberately pinned teaching baseline. Install Docker, kind, and kubectl first. The following commands create local resources; run them deliberately in the intended local cluster. They are not needed to develop the website.

From the repository root:

```bash
docker build -t k8s-ops-api:local lab/app
kind create cluster --name k8s-ops-lab --image kindest/node:v1.35.0 --config lab/kind.yaml
kubectl config current-context
```

Confirm that the context is `kind-k8s-ops-lab`, then use an explicit context for the lab operations:

```bash
kind load docker-image k8s-ops-api:local --name k8s-ops-lab
kubectl --context kind-k8s-ops-lab apply -f lab/k8s/working/namespace.yaml
kubectl --context kind-k8s-ops-lab apply -f lab/k8s/working/deployment.yaml
kubectl --context kind-k8s-ops-lab apply -f lab/k8s/working/service.yaml
kubectl --context kind-k8s-ops-lab get all -n k8s-ops
kubectl --context kind-k8s-ops-lab port-forward service/k8s-ops-api-service 8081:80 -n k8s-ops
```

Port 8081 avoids the web application's default port 8080. In another terminal:

```bash
curl http://localhost:8081/health
```

Expected response: `{"status":"healthy"}`. Stop port-forwarding with Ctrl+C. When finished, remove the disposable lab cluster:

```bash
kind delete cluster --name k8s-ops-lab
```

The API also exposes `/`, `/ready`, and `/config`. These are teaching fixtures, not a production platform. In particular, the current Deployment does not configure Kubernetes health probes. The additional exercises embedded in chapters are distinct from these original manifests and still need real cluster validation.

## Advanced exercises and validation

Start with each chapter’s prerequisites. A standard kind cluster does not supply policy enforcement, Metrics Server, VPA, Gateway/Ingress controllers, CSI snapshots or GitOps/observability stacks. Conditional exercises stop at preflight if these dependencies are missing. Single-host placement is not proof of physical HA; node autoscaling and provider-dependent behavior are explained with their infrastructure limits.

The Go [Greeting Operator](lab/level-4/custom-controllers/greeting-operator/README.md) is a complete buildable example shared by three expert lessons, with typed CRD, generated deepcopy/schema, ownership checks, status, manager, scoped RBAC, Dockerfile and fake-client tests. It needs Go 1.25.3+ in the 1.25 family; offline checks used 1.25.14. Admission/conversion servers and the platform renderer have separate Python unit tests. The corresponding chapters and adjacent test files describe the commands and limits.

See [course review](docs/content-review.md) for presentation and workflow corrections, [implementation evidence](docs/content-implementation.md) for exact checks, unresolved runtime validation and next steps, and [official sources](docs/content-sources.md) for all 49 chapter mappings, versions and consultation dates. Application tests, fixture parsing, Go compilation/fake tests and Python unit tests run without Kubernetes. They do not prove real API admission, TLS transport, scheduling, container startup, storage recovery or add-on compatibility. No cluster exercises, image builds, deployment or hosting changes were performed during this content implementation.

## Build and deployment status

The current Vite configuration replaces the previous static application with a TanStack Start SSR build. Nitro uses the `cloudflare-module` preset, producing a server bundle and client assets under `.output/` with the installed version. This is a build target, not evidence of a deployed Worker.

The previous GitHub Pages workflow and custom-domain `CNAME` file are absent from this application. Pushing this migration does not establish a new hosting pipeline. Hosting, domain configuration, and deployment validation remain a separate task; do not upload only the client assets and assume the SSR application is deployed.

The local `AGENTS.md` provides additional project context for coding assistants and is intentionally ignored by Git.

## References

- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Nitro](https://nitro.build/)
- [kind](https://kind.sigs.k8s.io/)
- [Kubernetes documentation](https://kubernetes.io/docs/)
