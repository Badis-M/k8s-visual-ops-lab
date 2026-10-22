# Kubernetes Visual Ops Lab

A bilingual French/English learning application for understanding Kubernetes through visual explanations, interactive diagrams, quizzes, and practical local labs.

The project combines a web academy with real lab source files. Reading a lesson or marking it complete does not execute Kubernetes commands: learners run the exercises themselves in their terminal.

## Learning experience

- **Academy** (`/academy`): a curriculum organized into four levels. Eleven beginner chapters contain lesson blocks; levels 2–4 are planned topics, not completed courses.
- **Chapter reader** (`/learn/$chapterId`): explanations, commands, diagrams, quizzes, hints, and challenges.
- **Visual foundations** (`/k8s-basics`): Kubernetes architecture and reconciliation concepts.
- **Guided lab** (`/lab`): package a FastAPI application, build its Docker image, and deploy it into a local kind cluster.
- **Prerequisites** (`/prerequisites`) and **source files** (`/source-files`): preparation and the actual application/manifests used by the guided lab.

Beginner lessons cover architecture, reconciliation, kind, namespaces and contexts, Pods, Deployments, Services, labels and selectors, ConfigMaps and Secrets, and troubleshooting.

Language preference and self-reported chapter progress are stored in the browser's localStorage. There is no account system, database, cross-device synchronization, or connection from the website to a Kubernetes cluster. Some legacy guided-lab material is still English-only; see [roadmap.md](roadmap.md).

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

| Command                           | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `bun run dev`                     | Start the local development server                               |
| `bun run build`                   | Build the client and production SSR server                       |
| `bun run preview`                 | Run Vite's build preview                                         |
| `bun run test`                    | Run the application test suite once                              |
| `bun run test:watch`              | Watch application tests                                          |
| `bun x --no-install tsc --noEmit` | Check TypeScript without emitting files                          |
| `bun run lint`                    | Check ESLint rules and Prettier formatting                       |
| `bun run format`                  | Rewrite formatting across the project; review the resulting diff |

The production build and TypeScript check are separate commands. Application tests do not validate a real Kubernetes cluster. Existing formatting/type-check issues should be reviewed separately from feature changes rather than hidden by disabling checks.

## Repository map

```text
src/
  routes/                 File-based pages and root application shell
  content/                Curriculum, bilingual lesson data, quizzes, lab steps
    chapters/             Beginner chapter content
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
  k8s/working/            Namespace, Deployment, and Service manifests
public/                   Static assets
vite.config.ts            Explicit application plugins and production target
vitest.config.ts          Test environment
roadmap.md                Implemented and planned learning material
```

Lessons use the `L` bilingual string type and `Block` schema in `src/content/types.ts`. Reusable renderers live in `src/components/academy/`. A chapter is available only when it contains lesson blocks. The source-file page imports files directly from `lab/` with `?raw`, so edits there also update the displayed examples.

## Run the guided Kubernetes lab

Install Docker, kind, and kubectl first. The following commands create local resources; run them deliberately in the intended local cluster. They are not needed to develop the website.

From the repository root:

```bash
docker build -t k8s-ops-api:local lab/app
kind create cluster --name k8s-ops-lab
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

The API also exposes `/`, `/ready`, and `/config`. These are teaching fixtures, not a production platform. In particular, the current Deployment does not configure Kubernetes health probes. The additional exercises embedded in chapters are distinct from the baseline manifests above and still need real cluster validation.

## Build and deployment status

The current Vite configuration replaces the previous static application with a TanStack Start SSR build. Nitro uses the `cloudflare-module` preset, producing a server bundle and client assets under `.output/` with the installed version. This is a build target, not evidence of a deployed Worker.

The previous GitHub Pages workflow and custom-domain `CNAME` file are absent from this application. Pushing this migration does not establish a new hosting pipeline. Hosting, domain configuration, and deployment validation remain a separate task; do not upload only the client assets and assume the SSR application is deployed.

The local `AGENTS.md` provides additional project context for coding assistants and is intentionally ignored by Git.

## References

- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Nitro](https://nitro.build/)
- [kind](https://kind.sigs.k8s.io/)
- [Kubernetes documentation](https://kubernetes.io/docs/)
