# Level 4 platform engineering sources

Consulted 2026-10-22. Chapter: `platform-engineering`. Kubernetes 1.35.0 stable Namespace/Service/ResourceQuota v1 and Deployment apps/v1; Python standard library renderer, no platform server dependency.

- [CNCF Platforms White Paper](https://cloudnativeplatforms.com/whitepapers/platforms/): platform as a product, interfaces, ownership and supported self-service capabilities.
- [CNCF Platform Engineering Maturity Model](https://tag-app-delivery.cncf.io/fr/whitepapers/platform-eng-maturity-model/): progression from templates to supported self-service, avoiding portal-equals-platform claims.
- [Kubernetes multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/): identity, namespaces, RBAC and network/storage isolation boundaries.
- [Kubernetes resource quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/): aggregate budgets and admission rejection.
- [Security contexts](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/): non-root, capability dropping, seccomp and filesystem choices.

The renderer and three local unit tests are original examples. Tests passed without a cluster; generated resources were parsed as JSON, not admitted or executed by Kubernetes. `prod` is a parameter selecting two replicas, not a production-readiness claim. nginxinc/nginx-unprivileged:1.28.0-alpine is a fixed teaching image matching the level-3 hardening exercise; it is not an immutable digest or an image security assessment.
