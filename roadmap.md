# Roadmap

- [x] Replace the original site with the academy application
- [x] Academy, chapter reader, FR/EN, local progress and existing visual diagrams
- [x] Level 1: eleven beginner chapters (preserved during the advanced-content implementation)
- [x] Level 2: all sixteen intermediate lessons with bilingual explanations, exercises, quizzes and corrections
- [x] Level 3: all sixteen advanced lessons, including delivery, autoscaling, reliability, security and telemetry
- [x] Level 4: all seventeen expert lessons, including a complete buildable/tested Go controller/Operator
- [x] Isolated lab fixtures, pinned prerequisites and official source mapping for all 49 added chapters
- [x] Interactive HPA request/replica diagram and curriculum integrity/interaction tests
- [ ] Execute and record the original guided lab and representative chapter labs on a separately authorized disposable kind cluster
- [ ] Validate conditional add-ons on a real lab: policy-enforcing CNI, Gateway, metrics/VPA, CSI snapshots, GitOps and observability
- [ ] Validate real API admission/conversion TLS, controller watches/ownership/garbage collection and container images
- [ ] Execute isolated backup/restore, etcd recovery and failure scenarios; record observed recovery limits
- [x] Translate the original guided lab (/lab) and displayed source descriptions to French
- [x] Review all 60 courses, literal code rendering/copying and practical workflow corrections (see docs/content-review.md)
- [x] Add push/PR/manual CI with frozen dependencies, offline lab checks and production browser tests
- [x] Prepare and locally test request-scoped SSR CSP, static headers and staged HSTS
- [x] Freeze inherited lint diagnostics while rejecting new or modified-file violations
- [ ] Resolve inherited repository-wide formatting debt separately
- [ ] Observe the first remote CI run and verify new security headers after deployment
- [ ] Choose and validate SSR hosting and domain configuration

Content availability is not cluster execution evidence. See [implementation status](docs/content-implementation.md) and [official sources](docs/content-sources.md).
