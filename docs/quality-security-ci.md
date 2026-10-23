# Quality, HTTP security and CI

Review date: 2026-10-23. The checkout was clean on `main` before this work. No commit, push, deployment, DNS/account/secret/repository setting change, cluster access, image build or lab service stack was performed. A local production Worker and Chromium were started only to validate the website.

## Content coverage

All **60 chapters** were reread in English and French: 11 beginner, 16 intermediate, 16 advanced, 17 expert chapters, including their prerequisites, code blocks, expected observations, cleanup, hints and detailed challenge solutions. The 54 chapters with quizzes contain **162 questions**; the six introductory chapters intentionally have no quiz. The original guided lab, six displayed source files, content types, role/language metadata and shared lesson/code/quiz renderers were also reviewed. Source viewer files continue to import the real fixtures with `?raw`.

Exact chapter inventories, official references reconsulted and evidence boundaries:

- [Levels 1–2: 27 chapters](quality-review-levels-1-2.md)
- [Level 3: 16 chapters](quality-review-level-3.md)
- [Level 4: 17 chapters](quality-review-level-4.md)
- [Previous presentation review](content-review.md), still relevant to literal rendering/copying; its older counts are dated evidence.

Seventeen chapters received focused corrections, without changing IDs, URLs, storage keys, curriculum versions or the design:

- Architecture: `/readyz?verbose` was unquoted and fails glob expansion in zsh; it is now quoted.
- Pod/Deployment/reconciliation examples: wait for the required Ready/rollout state before exec, access or observation. The Deployment challenge first observes its broken configuration, then repairs it.
- Installer examples: download/checksum steps form a fail-fast sequence; a checksum failure cannot fall through into installation. Success/failure cases were checked using mocked tools, without installation.
- Probes/scheduling: explanations and command order now match the observation being taught.
- PDB: the observation now uses a YAML watch when the lesson asks for health fields absent from the default table.
- Aggregated RBAC and telemetry: separate the triggering action from the wait; observe Collector unavailability before restarting it.
- Kustomize/GitOps/PDB: use isolated temporary directories; separate Argo and Flux alternatives. The GitOps generator refuses overwriting files or following destination symlinks; five new Python tests cover these cases.
- Three Greeting Operator lessons: capture the generation after the initial apply, wait for that `observedGeneration`, then accept Ready. An old Ready condition alone cannot prove the newest generation reconciled.
- Shared foundation lab: a second terminal reuses the context instead of trying to create its namespace again. Shared advanced preflight explicitly stops on any namespace-creation error, including AlreadyExists.

Existing literal code behavior remains: Helm helpers are `.tpl` files/Helm templates, not terminal commands; YAML, Go, Python, HTML-like text, entities and Makefile tabs are not interpreted or decoded. Tests retain exact copied strings, including hidden solutions. No automatic HTML decoding, `dangerouslySetInnerHTML`, template execution or blanket reformatting was introduced.

A review and offline checks do not prove Kubernetes execution. Real admission/TLS, watches/garbage collection, scheduling, recovery, add-ons and container startup remain untested here. Historical app dependency pins and probe limitations remain accurately explained in source notices rather than silently represented as production guarantees.

## Public inventory before changes

Read-only GET checks on 2026-10-23:

| Request | Observed result |
| --- | --- |
| HTTP `/` | 301 to HTTPS on the same host |
| HTTPS `/` | 200 HTML, SSR content present |
| HTTPS missing route | 404 HTML |
| `/assets/styles-CZm1rLl4.css` | 200 CSS; Cloudflare cache HIT; public, one-year immutable cache |

The sampled public responses lacked the CSP, Referrer-Policy, HSTS, nosniff and framing protections requested. Cloudflare response headers establish a Cloudflare-facing layer; they do **not** identify the origin or the complete deployment chain. No public change has been applied by this work. The installed Nitro configuration targets Cloudflare Workers and produces `.output/server/wrangler.json`; that build configuration is separate evidence from the live domain.

## HTTP protections

`src/server.ts` wraps the actual Start handler's successful responses and normalized/caught errors. `src/server/security.ts` applies:

```text
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-<fresh request nonce>' https://static.cloudflareinsights.com;
  script-src-attr 'none';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://cloudflareinsights.com;
  object-src 'none'; base-uri 'none';
  form-action 'self'; frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Strict-Transport-Security: max-age=300
```

- **Enforced CSP**, not Report-Only. Nonces use 32 cryptographically random bytes per request. A request-local `AsyncLocalStorage` in `src/server/nonce.server.ts` supplies the nonce when the request's Router is created, before streaming/hydration helpers capture it. No global mutable nonce, HTML rewriting or browser-supplied nonce header. TanStack's own generated `meta[property="csp-nonce"]` carries it into client hydration. Recheck this integration on Start/Router upgrades.
- The installed Start version runs global request middleware before its own server context exists; calling `getRouterInstance()` there failed in the production runtime. The final implementation uses the request-local store instead and keeps the original CSRF middleware unchanged.
- JavaScript permits neither `unsafe-inline` nor `unsafe-eval`. The **CSS-only** `unsafe-inline` exception supports existing React diagram style attributes and Radix-injected style elements. The error fallback's inline onclick was replaced with an ordinary reload link.
- Google Fonts CSS/font origins are explicitly allowed. No general external script/connect wildcard, cookie or permissive CORS was added. COEP is deliberately absent: the application has no feature requiring `crossOriginIsolated`, and blanket isolation could block resources. COOP/CORP and feature restrictions match the current no-auth/no-upload/no-cross-origin-embedding application; reconsider if those features change.
- HSTS is set only for application responses with an HTTPS URL outside loopback. Arbitrary `Forwarded`/`X-Forwarded-Proto` values are ignored. Start at **300 seconds**, without `includeSubDomains` or `preload`. After verifying actual HTTPS/origin routing and operational rollback, the owner can raise it progressively to 86400 and then a longer period. No preload submission was made.
- HTML responses use `Cache-Control: private, no-store`, `CDN-Cache-Control: no-store` and `Cloudflare-CDN-Cache-Control: no-store`; validators are removed. The wrapper preserves the response stream. An external cache override must also respect this; caching nonce-bearing HTML is not supported.
- `public/_headers` covers **static assets**, with nosniff/referrer/framing/CORP/HSTS and a document-restricting CSP. It does not replace the dynamic SSR wrapper. Nitro preserves these rules and adds immutable `/assets/*` caching. HSTS on HTTP static responses is ignored by browsers; dynamic responses still explicitly check HTTPS. The Vite development server does not enforce the production CSP, to support development/HMR.

### Cloudflare Web Analytics

The shared `RootShell` includes the owner's module-script snippet once, after the existing hydration scripts, with the current SSR nonce. All routes and both languages share this layout. No existing integration was found in the repository or the sampled public homepage before this change. No dependency, visual or lesson-content change is needed.

The only added CSP origins are `https://static.cloudflareinsights.com` in `script-src` and `https://cloudflareinsights.com` in `connect-src`. Nonces and all other protections remain. The [Cloudflare FAQ](https://developers.cloudflare.com/web-analytics/faq/) documents the manual snippet's collection endpoint and recommends a single beacon per page. Static-resource CSP remains unchanged because it does not serve the application HTML.

Browser regression tests substitute the beacon script and collector responses: they exercise script execution, allowed collection requests and a single script across SPA/language navigation without sending synthetic traffic to the real analytics account. They do not prove dashboard ingestion or deployed configuration. No Cloudflare settings were changed.

Follow-up validation passed: 40 application tests, ten production-Worker Chromium tests (desktop/mobile), TypeScript, the inherited-lint gate, the SSR build and `git diff --check`. Existing large-bundle and ignored bundler-option warnings remain. No dependency or lockfile changed; no commit, push or deployment was performed.

## GitHub Actions

`.github/workflows/quality.yml` runs on **every push**, **pull_request**, and **workflow_dispatch**:

| Job | Checks |
| --- | --- |
| `application` | Frozen Bun install, TypeScript, Vitest, inherited-lint gate, fixture syntax, SSR build, Chromium production tests |
| `dependency-audit` | Frozen install and `bun audit` against the real `bun.lock` |
| `lab-tests` | All discovered lab Python unittests and Go fake-client tests |
| `offline-renders` | Checksum-pinned Helm/kubectl installation, Helm lint/template and local Kustomize builds |

No cluster, Docker daemon, controller, add-on, envtest or deployment is used. `kubectl kustomize` only reads local files. Helm rendering explicitly uses Kubernetes **1.35.0**, rather than Helm's newer default target.

The Nitro/Worker compatibility date is pinned to the locally tested 2026-10-23 instead of drifting with each build. Tools are explicit: Ubuntu 24.04, Node 24.21.0, Bun 1.4.2, Python 3.13.7, Go 1.25.14, Helm 4.3.0, kubectl 1.35.0, Playwright 1.64.1, Wrangler 4.151.3. The teaching target Helm 4.3.1 is unchanged; CI uses the locally verified 4.3.0 renderer. Python local tests used 3.14.7; CI uses 3.13.7. The machine's default kubectl is 1.37.1/Kustomize 5.8.1; a separate 1.35.0 client is used for exact CI rendering verification. These offline tool differences are not live cluster compatibility evidence.

All five external action references are full commit SHAs, checked against their public repositories' release/tag commits on 2026-10-23: checkout v7.0.1, setup-node v7.1.0, setup-python v7.1.0, setup-go v7.0.0, setup-bun v2.2.0. Helm/kubectl Linux archive hashes are literal values checked against the official download endpoints. Updating either requires an explicit version/hash review.

Permissions default to `contents: read`; checkout does not persist credentials. No secrets, deployment token, privileged PR event, `pull_request_target` or `continue-on-error`. Jobs have 10–20 minute timeouts and obsolete branch runs are cancelled. No caches are shared between untrusted PRs and privileged jobs; Go cache is disabled and no dependency/browser/build cache is configured. A hosted dependency audit outage fails visibly rather than being treated as zero advisories.

### Inherited lint strategy

`bun run lint` remains the unfiltered ESLint check and still reports inherited debt: **1751 diagnostics in 26 unchanged files** (1740 Prettier violations, 11 React refresh warnings). The new `bun run check:lint` scans the whole repository with the same rules. `scripts/lint-baseline.json` freezes each inherited file's source SHA-256, exact diagnostics fingerprint and the ESLint configuration hash.

Only an unchanged file with identical diagnostics qualifies as inherited. Any edited/new/renamed file must be clean, including warnings. Changed config or dependency behavior cannot silently expand the exemption. This avoids fragile Git diff ranges on first pushes, PRs and renames. CI never regenerates the baseline. Remove entries after fixing their files; do not refresh it to accept new failures. A config/rule upgrade needs an explicit review of the remaining baseline. Negative checks confirmed that a modified inherited file and a new invalid file fail the gate. No rules were disabled and the legacy files were not mass-formatted.

### Dependency review

Initial `bun audit --json` reported real advisories in transitive tools and Vite. Its dry-run plan was reviewed before applying compatible patches: brace-expansion 1.1.21/5.0.12, js-yaml 4.3.2, nanoid 3.3.18, source-map-js 1.2.2, Vite 8.1.6. Vitest 4.1.12 fixes the remaining pinned mocker advisories. No automatic major upgrade or audit ignore was used. New local/CI tools are exact dev dependencies; the 24-hour minimum release age is preserved. The resulting audit returned `{}` with exit 0 on the review date. This is an advisory-service snapshot, not proof that no vulnerabilities exist.

## Validation record

Passed locally after integration:

- `bun install --frozen-lockfile`.
- `bun run check:types`; 39 Vitest tests in seven files.
- `bun run check:lint`, including new/modified files; negative inherited/new-file gate probes rejected as expected. Full raw lint remains intentionally red for the documented legacy debt.
- Production SSR build with the installed Nitro Cloudflare module runtime. Existing large curriculum bundle warning remains; no unrelated loading refactor.
- `bun run check:labs`: 124 fixtures, 92 YAML files/146 documents, two JSON, ten Bash, twenty Python syntax checks.
- `python3 scripts/test-python.py`: 51 tests, including five new GitOps safety tests.
- Go 1.25.14 `go test ./...`: controller tests and application compilation passed, without Kubernetes. An incomplete old temporary SDK first failed; a newly downloaded official archive with verified checksum resolved that environment issue.
- Helm lint/template for both L3 charts; dev/prod/GitOps Kustomize builds. Local initial Helm target mismatch was corrected by passing `--kube-version 1.35.0`.
- Eight Playwright tests using the **built production Worker**, Chromium desktop and Pixel 7 viewport: actual SSR 200/404 and static headers; four concurrent requests with distinct matching script/header nonces; no-store HTML; FR/EN and persisted preference; diagrams; literal Helm rendering/exact clipboard; quiz, hidden/revealed solution and persisted progress; source/lab/Go routes; no horizontal document overflow; actual Geist font loading; no unexpected page errors/CSP violations; injected non-nonced inline script rejected. Screenshots/traces stay ignored under `test-results/`.
- Workflow syntax and action inputs passed actionlint 1.7.12 (official temporary binary, checksum verified); Helm/Kustomize renders also passed with the separate exact kubectl 1.35.0 client.
- Additional unit tests cover secure HTML statuses 200/404/500, both real server fallback branches (throw and swallowed h3 JSON error), HSTS HTTPS/loopback/proxy behavior and nonce generation. A transient integration 500 was observed with the new headers during local troubleshooting; no deliberate public fault or production-only failure endpoint was added.
- Dependency audit: zero returned advisories at the time of the check.

Not established: a successful **GitHub** run, remote branch protection, deployment chain configuration, new headers on the public domain, exact-version live Kubernetes behavior, every browser/OS/device, all 60 chapters visually at every breakpoint, or an external security score. The review covers all course source content; browser evidence is representative. CI Linux execution must still be observed after the user's push.

## Owner actions after push

### CI follow-up: missing local Helm dependency

The first remote `offline-renders` run failed because `release-demo/charts/academy-web` was absent. The other jobs were green according to the owner's report; no remote run was independently inspected for this follow-up. The original local render check incorrectly relied on an already-built, Git-ignored `charts/` directory, which a fresh checkout does not contain.

`scripts/check-charts.sh` now copies both charts into an isolated temporary tree, removes any copied generated dependency, then runs `helm dependency build --skip-refresh` before linting and rendering. The checked-in `Chart.lock` must stay identical (`cmp`); the dependency is resolved through its existing local `file://` path. No vendored archive, dependency version change or chart edit is needed. See [Helm dependency build](https://helm.sh/docs/helm/helm_dependency_build/) for reconstruction from the lock rather than dependency renegotiation.

Verification used a temporary export of **only tracked HEAD files**: the original script reproduced the missing-dependency failure; the corrected script passed both chart lints/templates and all three Kustomize renders with Helm 4.3.0 and kubectl 1.35.0/Kustomize 5.7.1. The checkout's parent chart remained free of generated `charts/` and its lock was unchanged. Bash syntax and `git diff --check` passed. This verifies the local fix; a new GitHub execution remains pending the owner's commit/push. No cluster or deployment was contacted.

### Deployment and verification

1. Open GitHub Actions → **Quality and security** and inspect all four jobs. Repository settings/branch protection are untouched; require these checks in the existing branch rule if desired. No GitHub secret is needed.
2. Identify the origin/deployment pipeline actually serving the domain. Deploy the **SSR server and assets together** through that pipeline; client-only/static hosting cannot run this SSR entry. Keep the nonce wrapper and node async context support enabled.
3. For an existing Cloudflare Worker deployment, the production build already generates the tested configuration at `.output/server/wrangler.json`. Its relevant shape is:

   ```json
   {
     "name": "badis-m-k8s-visual-ops-lab",
     "main": "index.mjs",
     "compatibility_date": "2026-10-23",
     "compatibility_flags": ["nodejs_compat"],
     "assets": { "binding": "ASSETS", "directory": "../public" },
     "no_bundle": true,
     "rules": [{ "type": "ESModule", "globs": ["**/*.mjs", "**/*.js"] }]
   }
   ```

   Paths above are relative to the generated config. If this is the confirmed existing Worker, the owner can use `bun x --no-install wrangler deploy --config .output/server/wrangler.json` through their normal authenticated deployment process. This command was **not run**. Do not create a parallel Worker or remap the domain just because the generated name exists locally. If the actual host is different, adapt its Nitro runtime first; do not assume this Worker configuration secures another origin.
4. Ensure CDN/host rules do not override app CSP or cache HTML despite no-store. Remove a conflicting old CSP at its owning layer rather than stacking contradictory policies. Keep immutable asset caching. Existing HTTP→HTTPS redirect should remain. Purge any pre-existing cached HTML using the hosting owner's normal process if needed.
5. Check the deployed responses below, browser console/network, navigation and concurrency. Only then consider raising HSTS. Neither subdomains nor preload are authorized by this change.

Read-only post-deployment checks:

```bash
curl --silent --show-error --dump-header - --output /dev/null http://k8s.badismerakchi.com/
curl --fail --silent --show-error --dump-header - --output /dev/null https://k8s.badismerakchi.com/
curl --silent --show-error --dump-header - --output /dev/null https://k8s.badismerakchi.com/this-page-does-not-exist
curl --fail --silent --show-error --dump-header /tmp/k8s-public-headers.txt --output /tmp/k8s-public-page.html https://k8s.badismerakchi.com/
```

Expect same-host HTTPS redirection, protected 200/404 HTML, a fresh CSP nonce in each response matching every script, no-store HTML and `Strict-Transport-Security: max-age=300` on HTTPS. Use the actual CSS/JS URLs in the freshly fetched HTML to check asset headers; hashes change on builds. Read nonce attributes with `getAttribute` from the raw response or the DOM `nonce` property; browsers intentionally hide the attribute value from some DOM APIs. Do not intentionally crash the public site to test 500.

## Primary sources

Consulted 2026-10-23, in addition to the per-level course sources:

- [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP): nonce uniqueness, directives and enforcement.
- [MDN HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security): HTTPS behavior and staged rollout.
- [MDN COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy): isolation choices.
- [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use): immutable action references and untrusted workflows.
- [Bun audit](https://bun.sh/docs/pm/cli/audit): Bun lockfile audit and explicit fix planning; installed Bun 1.4.2 help/actual output also checked.
- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) and the installed Start/Router sources: actual pinned runtime behavior takes precedence over examples for another version.
- [Cloudflare static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/): `_headers` does not cover Worker-generated SSR.
- [Nitro Cloudflare deployment](https://nitro.build/deploy/providers/cloudflare): local production Worker preview and generated deployment configuration.

Recommended commits (not created):

```text
fix(content): improve lesson sequencing and lab safety
ci: add offline quality checks and production browser tests
fix(security): enforce request-scoped CSP and HTTP protections
```
