# A small paved-road contract

This pure Python standard-library example renders a Namespace, a ResourceQuota, a hardened Deployment and an internal Service. It never contacts Kubernetes. Run `python3 -m unittest discover -s lab/level-4/platform-engineering -v` from the repository root.

```bash
umask 077
LAB_PLATFORM_DIR=$(mktemp -d)
python3 lab/level-4/platform-engineering/render.py --name notes --owner learning --environment dev > "$LAB_PLATFORM_DIR/workload.json"
```

Review the result before optionally applying it to the disposable local cluster with an explicit context. The `prod` input demonstrates a configuration choice (two replicas), not a claim of production readiness. There is no portal, authentication, tenant isolation or backend service in this exercise. RBAC, quotas, policies, domain independence, data services and exception handling belong to the wider platform design.

The fixed resource tiers and reviewed non-root image demonstrate an opinionated default. They are not a vulnerability assessment or a guarantee that an arbitrary application can run unchanged. A caller with broader Kubernetes access can bypass this renderer; enforce real policy at admission and authorization boundaries.

Keep `LAB_PLATFORM_DIR` for the optional apply, then manually remove that exact private directory after reviewing the generated document.
