# Curriculum implementation

Updated: 2026-10-22. Scope: 49 chapters, preserving all IDs and the eleven level-1 lessons. No cluster operations, installs of services, commits, pushes, or deployments are authorized.

## Baseline and sequence

- Level 2 (16): rollout-strategies, rollbacks, resources, probes, init-sidecars, storage, statefulsets, daemonsets, jobs, dns, ingress-gateway, network-policies, rbac, scheduling, helm-basics, troubleshooting-2.
- Level 3 (16): helm-charts, helm-releases, kustomize, gitops, hpa, vertical-cluster-scaling, pdb, ha, advanced-scheduling, security-hardening, pod-security, rbac-advanced, cni-internals, observability, incidents, backup-dr.
- Level 4 (17): api-architecture, controllers-internals, crds, custom-controllers, operators, kubebuilder-operator, admission-webhooks, api-extension, scheduler-internals, etcd, cri, cni-advanced, csi, control-plane-scale, multi-cluster, failure-scenarios, platform-engineering.

## Progress

- First reference chapter: rollout-strategies implemented with a real manifest, bilingual model, experiment, recovery, quiz, challenge, cleanup.
- Level 2: all 16 chapters integrated; 16 application/integrity/interaction tests, TypeScript, and production build passed. Individual agents parsed YAML, checked shell syntax, and rendered the local Helm chart offline. No chapter labs executed.
- Level 3: all 16 chapters integrated; 17 tests (including the interactive HPA diagram), TypeScript and production build passed. Helm/Kustomize offline rendering, Python/shell syntax and Docker Compose configuration were checked by the respective authors without starting infrastructure.
- Level 4: all 17 chapters integrated, including the complete shared Go controller/Operator. Final application, fixture, unit and browser checks passed; exact evidence follows.

## Final integration evidence — 2026-10-22

All 49 new chapters are available, making 60 total with the preserved eleven level-1 chapters. No IDs, chapter routes or progress storage keys were changed. The prerequisite graph resolves without cycles; each chapter declares its concrete prerequisites and related lessons in its data module. The implementation proceeded from the reference rollout chapter through level 2, then level 3 and level 4 batches; later independent review corrections were applied before final validation.

| Layer               | Actual check and result                                                                                                                                                                                                                                             | What it does not establish                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application         | `bun run test`: **17 tests in 4 files passed**. Includes all 60 available chapters, unique IDs, prerequisite/link integrity, bilingual nested solutions, quiz validity, shell/JSON snippet syntax, reciprocal navigation, concealed solutions and HPA interaction   | Technical/pedagogical correctness is also reviewed; presence tests alone are insufficient                                                                   |
| Types/build         | `bun x --no-install tsc --noEmit` and `bun run build`: **passed**, including SSR and Cloudflare-module packaging                                                                                                                                                    | No deployment, Worker runtime or hosting validation                                                                                                         |
| Targeted lint       | ESLint on **57 edited/new TS/TSX/JS/MJS files passed**                                                                                                                                                                                                              | Repository-wide inherited formatting violations were not reformatted or suppressed                                                                          |
| Fixture syntax      | `bun run check:labs`: **119 files passed** — 91 YAML files/145 documents, 2 JSON, 9 Bash scripts, 17 Python AST checks                                                                                                                                              | No Kubernetes schema/admission, image pull, container startup or infrastructure behavior                                                                    |
| Python examples     | **38 unit tests passed** across admission (7), conversion (7), pagination (3), CRI selection (6), CSI ownership/cleanup (9), dependency failure (3), platform rendering (3)                                                                                         | API calls are mocked/synthetic; no listeners or real runtime/CSI/TLS transport                                                                              |
| Go example          | Go **1.25.14**, **10 top-level fake-client tests** including two invalid-name subcases passed; executable compiled; controller-gen **0.20.0** generated CRD/deepcopy                                                                                                | No manager/envtest/API server started; fake-client metadata/defaulting/watches/GC are not real API behavior                                                 |
| Delivery fixtures   | Local Helm charts linted/rendered; seven delivery render sets and two generated GitOps configurations parsed as 25 YAML documents; selectors, config references, overrides and invalid-input rejection checked                                                      | Installed Helm **4.3.0** differs from target **4.3.1**. Offline Kustomize used kubectl **1.37.1** / Kustomize **5.8.1**, not the target live kubectl 1.35.x |
| Other local tooling | Compose configuration parsed without startup; TLS helper created temporary local SAN certificates and checked expected/wrong hostname behavior and SSLContext loading                                                                                               | No images built, containers/services started or API-server-to-webhook connection tested                                                                     |
| Browser             | Representative rollout, HPA, platform and Go chapters inspected in FR/EN at desktop and **390×844**; no horizontal document overflow; quiz scoring, hidden hints/solutions, HPA 100m→50m / 2→4, language and reloaded progress verified; no captured console errors | Representative browser checks, not exhaustive visual review of every lesson or a physical phone test                                                        |
| Routes              | **60/60** local development chapter URLs returned HTTP 200 and an SSR h1                                                                                                                                                                                            | Development-server smoke check, not a deployed production runtime                                                                                           |
| Git                 | `git diff --check` passed; eleven level-1 source files have no diff; no staged changes                                                                                                                                                                              | No commit or push was made                                                                                                                                  |

Python checks can be reproduced independently from the root with `python3 -B -m unittest discover -s lab/level-4/CHAPTER_DIRECTORY -p 'test_*.py'`, for each of the seven directories listed above. Go commands and their explicit validation boundary are in the [shared project README](../lab/level-4/custom-controllers/greeting-operator/README.md). The [source index](content-sources.md) maps all 49 IDs to consulted official references and exact version contracts.

The build reports a large client chunk (**1,287 kB minified / 414 kB gzip**, rounded), since curriculum data remains in the existing eager import structure. Content loading optimization is separate future performance work; no unrelated architecture refactor was introduced. Existing Vite/Nitro tooling advisories also remain non-fatal.

## Quality boundaries

Use Kubernetes 1.35.0 / kind 0.31.0 as a deliberately pinned teaching baseline, not a claim about the latest release. Labs are isolated by chapter namespace; context kind-k8s-ops-lab is explicit. Additional dependencies are documented per chapter. In-cluster exercises remain unexecuted until separately authorized.

Full repository lint has pre-existing formatting violations. Check newly edited files without reformatting unrelated source. Automated structural tests do not establish pedagogical correctness or operational success.

## Independent technical review corrections

- Explicit nodeTaintsPolicy: Honor in HA and failure-scenario topology-spread fixtures prevents the untolerated control-plane hostname domain from blocking the third replica on the pinned kind topology.
- VPA challenge now uses an explicitly separate hypothetical service; it no longer contradicts the bounded exercise fixture.
- Platform renderer rejects numeric-leading Service names before rendering; tests cover that boundary. Greeting CRD/controller follows the same baseline Service naming constraint.
- Greeting content is HTML-escaped; local manager health and port-forward use distinct ports; paused status preserves the last observed count with an explicit freshness caveat.

These are source/code reviews and offline checks, not real cluster scheduling or runtime evidence.

## Next execution work

Implementation is complete. The remaining work is validation on infrastructure, to be separately authorized and performed on a disposable environment:

- Run the base kind setup and representative workload/network/storage/Helm exercises, recording actual observations and resource cleanup.
- Prepare reviewed optional dependencies before testing enforcing CNI policies, Gateway routes, metrics/HPA/VPA, CSI snapshots, GitOps and the telemetry pipeline. Standard kind does not prove these behaviors.
- Validate real CRD admission, webhook/conversion TLS, controller watches/defaulting/ownership/GC and the built container images. No image availability or cross-architecture runtime claim is made from a Go build.
- Execute the explicitly isolated backup/restore, etcd and failure exercises, measuring recovery rather than treating expected output as proof.
- Retain physical HA, provider node autoscaling and production disaster recovery as unproven outside their required infrastructure.

README.md, roadmap.md and ignored local AGENTS.md reflect these boundaries. Commit/push/deployment remain with Badis. Recommended commit message: `feat: complete Kubernetes academy levels 2 through 4`.

## Subsequent course review

The later [full course review](content-review.md) corrected presentation and workflow defects, including selected level-1 examples, and translated the guided lab/source notices. The evidence above remains the historical implementation snapshot; consult the review for current checks and remaining runtime limits.
