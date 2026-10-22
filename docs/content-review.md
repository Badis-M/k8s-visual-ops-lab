# Course and lab review

Completed: **2026-10-22**. Scope: **60/60 chapters**, all ten guided-lab steps, six displayed source files and shared code/block renderers. Existing uncommitted implementation work was preserved; a pre-review source copy outside the repository was used to compare this review separately from that earlier work. No Git staging, commit, push, deployment, cluster operation or lab service startup.

## Review depth and coverage

Reviewed means source-level English/French inspection of the explanations, prerequisites, code, quizzes where present, hints, hidden corrections and linked fixtures. It does not mean every exercise was executed, every upstream sentence reverified or every chapter visually inspected in a browser. The six original introductory chapters have challenges but no quiz blocks; this review does not pretend they have the later chapters' quiz format.

- Level 1: **11/11**, integrating reviewer; details below.
- Level 2: **16/16**, [detailed review and evidence](review-level-2.md).
- Level 3: **16/16**, helm-charts below plus the [other fifteen chapters](review-level-3.md).
- Level 4: **17/17**, [detailed review and evidence](review-level-4.md).

The shared renderer fixes reach all chapters, including those needing no content edit. **34 chapter source files** have a review diff (7/9/11/7 by level), with additional raw-fixture fixes such as conversion status. No unrelated chapter IDs, /learn routes, language/progress storage keys or architecture were replaced.

| Level | Chapter                    | Review               | Evidence / decision                                                                                                                                                                 |
| ----- | -------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `why-kubernetes`           | Reviewed / corrected | Use loopback ports distinct from the website; preflight container names, allow Docker restart-policy startup time; qualify portability claims.                                      |
| 1     | `architecture`             | Reviewed / corrected | Explicit selected local context and isolated namespace; replace shared scheduler outage with one unclaimed schedulerName Pod; update JSONPath namespace and cleanup.                |
| 1     | `reconciliation`           | Reviewed / corrected | Isolated namespace/context; remove unsafe background job-number cleanup, bound observations and wait before reading the owned ReplicaSet.                                           |
| 1     | `setup-kind`               | Reviewed / corrected | Pin the existing teaching baseline, gate kubectl installation on checksum success, explain Docker-group authority, explicit contexts and optional-cluster cleanup ownership.        |
| 1     | `namespaces-contexts`      | Reviewed             | Full EN/FR, namespace-scoped resources, scope discovery, three quiz answers and challenge reviewed; no chapter-specific defect. Shared context guard improved.                      |
| 1     | `pods`                     | Reviewed / corrected | Isolated namespace/context, host port 8081, wait for duo before exec, remove blocking bad-image watch, clarify Pod UID/IP reuse and tag versus digest.                              |
| 1     | `deployments`              | Reviewed / corrected | Isolated namespace/context and explicit YAML-save instruction; bounded rollout waits, terminating-resource surge caveat and availability wording.                                   |
| 1     | `services`                 | Reviewed / corrected | Full EN/FR including quiz/patch solution reviewed; port-forward uses 8081 rather than the website port; Service network boundary was already correct.                               |
| 1     | `labels-selectors`         | Reviewed             | Full EN/FR, selectors/metadata behavior and quiz/solution reviewed; no chapter-specific defect confirmed.                                                                           |
| 1     | `configmaps-secrets`       | Reviewed             | Full EN/FR, dummy-only Secret use, log exposure, env versus volume refresh and strategic patch solution reviewed; no chapter-specific defect confirmed.                             |
| 1     | `kubectl-troubleshooting`  | Reviewed             | Full EN/FR, failure state, evidence, previous logs, managed-source repair and quiz/solution reviewed; no chapter-specific defect confirmed.                                         |
| 2     | `rollout-strategies`       | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `rollbacks`                | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `resources`                | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `probes`                   | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `init-sidecars`            | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `storage`                  | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `statefulsets`             | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `daemonsets`               | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `jobs`                     | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `dns`                      | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `ingress-gateway`          | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `network-policies`         | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `rbac`                     | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `scheduling`               | Reviewed             | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `helm-basics`              | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 2     | `troubleshooting-2`        | Reviewed / corrected | See [level 2 review](review-level-2.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `helm-charts`              | Reviewed / corrected | Explicit Helm template language and file role; explain define/include/context/whitespace; compare actual offline Service render; use private render and preview-values directories. |
| 3     | `helm-releases`            | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `kustomize`                | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `gitops`                   | Reviewed             | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `hpa`                      | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `vertical-cluster-scaling` | Reviewed             | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `pdb`                      | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `ha`                       | Reviewed             | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `advanced-scheduling`      | Reviewed             | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `security-hardening`       | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `pod-security`             | Reviewed             | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `rbac-advanced`            | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `cni-internals`            | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `observability`            | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `incidents`                | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 3     | `backup-dr`                | Reviewed / corrected | See [level 3 review](review-level-3.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `api-architecture`         | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `controllers-internals`    | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `crds`                     | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `custom-controllers`       | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `operators`                | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `kubebuilder-operator`     | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `admission-webhooks`       | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `api-extension`            | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `scheduler-internals`      | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `etcd`                     | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `cri`                      | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `cni-advanced`             | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `csi`                      | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `control-plane-scale`      | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `multi-cluster`            | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `failure-scenarios`        | Reviewed             | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |
| 4     | `platform-engineering`     | Reviewed / corrected | See [level 4 review](review-level-4.md); includes quiz distractors, correction state and linked fixtures.                                                                           |

## Shared presentation corrections

- Code headers now distinguish **terminal commands, files, examples/excerpts and expected-output examples**. Shell files use a file icon/role; OS-specific command headings remain terminal instructions. Long file paths wrap instead of disappearing behind truncation.
- Explicit language tags include Helm templates, real Makefiles, PromQL and JSON. Raw templates remain literal source code; no HTML interpretation, template evaluation or general Markdown decoding was introduced. The actual pre-review Helm chapter used `text`, not `makefile`; the user's pasted fence did not exist in its data.
- Display and clipboard receive the same original string, preserving tabs, punctuation, HTML-looking text, CRLF in client rendering and final-newline presence/absence. The previous renderer dropped a final newline and then manufactured line endings for display.
- A clipboard failure now shows an actionable alert; it no longer fails silently. Success feedback and timer cleanup are explicit. No new dependency was added.
- Step blocks forward file titles/kinds to the same renderer. Outputs remain explicitly examples and do not offer a misleading command-copy button.
- The custom-controller reader now uses three exact, explained source excerpts (Reconcile, ownership and status), preserving the complete runnable Go project. Other long fixtures remain complete where the surrounding explanations need their contracts; they were not arbitrarily truncated.

## Guided lab and displayed source files

All ten steps and six file descriptions/notices are now available in EN/FR, while commands, source paths and code stay unchanged between languages.

Concrete repairs:

1. Run the optional Python check from the repository root with `--app-dir lab/app`; it no longer leaves the shell inside lab/ before a root-relative Docker build. Explain foreground servers and separate terminals.
2. Use the documented kind 0.31.0 / Kubernetes 1.35.0 topology and explicit kind-k8s-ops-lab context. Preflight existing cluster/namespace names instead of overwriting them.
3. Use host port 8081 for API port-forward; distinguish that Pod tunnel from normal ClusterIP/DNS/load-balancing validation. Add bounded rollout and EndpointSlice inspection.
4. Correct the local image failure to ErrImageNeverPull for imagePullPolicy Never. Explain that `get all` is a subset, not a full inventory.
5. Cleanup removes only the namespace created for the exercise, with local processes stopped separately. Whole-cluster deletion is an explicit separate choice because other lessons can share it.
6. Describe actual baseline limitations: the legacy app's /ready returns HTTP 200 even with READY=false; no probes/resources are configured, requirements are unpinned, and the base container runs as root. The source viewer now explains these facts rather than implying production readiness. This review did not silently change the legacy application's behavior or dependencies.

## Primary references checked by the integrating reviewer

Consulted **2026-10-22**, in addition to the versioned source ledgers and per-level review sources:

- [Helm named templates](https://helm.sh/docs/chart_template_guide/named_templates/): helper scope, define/include and rendered text.
- [Kubernetes port-forward task](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/): selection of a Pod when targeting a Service; not a normal Service dataplane probe.
- [Docker restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/): manual stop behavior and successful-start interval before applying a restart policy.
- [Official Linux kubectl installation](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/): binary/architecture and checksum validation. Installed tooling was not changed by this review.

Existing version pins remain deliberate teaching inputs; offline installed Helm/Kustomize patch/minor differences are still recorded. Introductory setup now explicitly matches the existing kind/Kubernetes baseline instead of following latest automatically. Homebrew's current versions must be checked by the learner.

## Validation from this review

- `bun run test`: **31 tests in five files passed**, including thirteen new presentation regression cases plus an all-snippet literal-render check. Existing quiz, hints/solutions, HPA and navigation checks remain green.
- `bun x --no-install tsc --noEmit`: **passed** after resolving transient integration errors; per-level notes retain their intermediate check history.
- Targeted ESLint on **44** edited/new application sources: **passed**. Existing repository-wide formatting violations were not suppressed or globally reformatted.
- `bun run build`: **passed**, SSR/Cloudflare-module output only. Large eager-curriculum chunk (**1,312 kB minified / 421 kB gzip**, rounded) and existing Vite/Nitro advisories remain; no loading refactor or deployment was attempted.
- `bun run check:labs`: **123 fixture files passed** — 92 YAML files/146 documents, two JSON, ten shell and nineteen Python AST checks.
- Complete exported curriculum: **516 code snippets** including hidden solutions; **415 shell snippets** parsed by both bash/zsh, **43 JSON patches**, **83 plain YAML snippets** and **five quoted-YAML heredocs** parsed without execution. All 60 chapters remain available.
- Python: **46 tests** passed in separate level-4 directories, including eight added tests for etcd run ownership. All Docker/Kubernetes interactions in guard tests are mocked/synthetic.
- Go: matching temporary Go **1.25.14**, `go test -count=1 -p 2 ./...` passed (ten tests plus two invalid-name subcases), no manager/API server. Actual CSI JSONPath evaluated against a synthetic map with client-go v0.35.0.
- Helm/Kustomize: local chart lint/renders and overrides passed. The new rendered Service example was produced with installed Helm **4.3.0** and compared with its source; lesson target remains **4.3.1**. Delivery review also checked hidden Kustomize preview and GitOps generator outputs with installed kubectl **1.37.1** / Kustomize **5.8.1**, not a live target 1.35 API server. Compose configuration parsed without starting a stack.

- Route smoke check: **63/63** local development pages (60 chapters, lab, source files and academy) returned HTTP 200 with an SSR h1.

## Browser evidence and limits

An independent final browser tab had no captured console errors. Earlier concurrent source edits briefly caused Vite HMR reload errors; those were resolved before the final clean-tab check.

Representative Helm, Go, Makefile and source-file/Python/YAML examples, plus the ten guided-lab steps were inspected on desktop and a **390×844** viewport in EN/FR. Document width stayed within the viewport; long code scrolls within its own block. Helm source and rendered YAML are separately labeled; Go excerpts stay scoped and a true Makefile is distinguished from a Helm helper. Hidden solution reveal and self-reported progress after reload were checked, then test progress was undone.

The browser copy button returned success feedback; the IAB clipboard readback API returned an empty string, so an actual cross-application paste was **not** independently verified in that environment. The automated tests do verify the exact string passed to clipboard.writeText, rejection feedback and the rendered literal text. No clipboard result is fabricated.

This remains a static/pedagogical and local application review. Real Kubernetes admission/defaulting, API-to-webhook TLS, image availability, informer/GC behavior, CNI policy/Service forwarding, metrics autoscaling, CSI snapshots, GitOps/telemetry stacks, backup/etcd recovery and physical HA are unexecuted. No site test substitutes for those learner-run experiments. The legacy readiness/dependency/hardening limitations above remain explicitly documented, not fixed by an unrelated lab redesign.

Implementation and review are complete. Next work is separate runtime lab execution and recording actual observations on a disposable environment. Commit/push/deployment remain with Badis. Recommended review commit: `fix: clarify course examples and correct lab workflows`.
