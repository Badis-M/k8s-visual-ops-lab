# GitOps exercise prerequisites

The local app can be rendered without controllers:

```bash
kubectl kustomize lab/level-3/gitops/app
```

The live paths are optional and separate. Argo CD deploys into `lab-gitops-argo`; Flux deploys into `lab-gitops-flux`. Do not make both controllers own the same resources.

- Argo CD target: **3.5.6**, with its CRDs, application controller, repository server and dependencies in `argocd`. [Pinned upstream installation source](https://github.com/argoproj/argo-cd/blob/v3.5.6/manifests/install.yaml), [3.5 installation and tested Kubernetes versions](https://argo-cd.readthedocs.io/en/release-3.5/operator-manual/installation/). Review the upstream bundle's cluster privileges separately before installing on a disposable lab. Kubernetes 1.35 appears in the 3.5 tested-version table.
- Flux target: **2.9.6**, with source-controller, kustomize-controller and their v1 CRDs. They must watch `lab-gitops-flux` and allow impersonation of the supplied namespaced ServiceAccount. [Pinned upstream installation artifact](https://github.com/fluxcd/flux2/releases/download/v2.9.6/install.yaml), [installation requirements](https://fluxcd.io/flux/installation/). Flux 2.9 requires Kubernetes 1.35.0+ for the 1.35 line. Installing controllers alone is enough for this exercise; bootstrap would additionally write to a Git remote, which this exercise does not need.
- Allow extra CPU/RAM for the selected controller stack; use its actual resource requests to size the laptop. This is a non-HA evaluation, not a production install. There is no need to expose a public UI, add DNS, acquire a domain, or configure an Ingress.
- A credential-free readable HTTPS Git repository must contain the reviewed app tree and its referenced Kustomize base at the selected commit. A purely local or unpushed commit is not readable by the in-cluster repository server. The user performs any needed commit/push themselves before the live exercise.

Source templates contain explicit `REPLACE_*` markers and must not be applied directly. Generate temporary configuration with the complete remote commit SHA:

```bash
LAB_GITOPS_OUTPUT_DIR=$(mktemp -d)
printf 'GitOps configuration directory: %s\n' "$LAB_GITOPS_OUTPUT_DIR"
python3 lab/level-3/gitops/configure.py \
  --repository https://github.com/YOUR_ACCOUNT/k8s-visual-ops-lab.git \
  --commit YOUR_FULL_REMOTE_COMMIT_SHA \
  --output-dir "$LAB_GITOPS_OUTPUT_DIR"
```

Replace the repository and commit arguments with actual reviewed values. The script validates a credential-free HTTPS URL and a full nonzero 40-character SHA, writes only the two named files in the chosen output directory, and never contacts Git or Kubernetes. It refuses existing output files and symbolic-link output directories; use a new private directory for each revision rather than overwriting a previous review. Keep the variable in the same shell for the chapter's apply commands. Inspect the printed directories and remove only your temporary copies manually afterwards. It does not prove remote reachability or trust. Repository authentication and encrypted secret delivery require separate setup; no credential is embedded here.

Run the generator regression tests without Git or Kubernetes:

```bash
python3 -m unittest discover -s lab/level-3/gitops -p 'test_*.py' -v
```

The Argo AppProject permits only Deployment, Service and ConfigMap in the dedicated destination. The Application deliberately has no cascading deletion finalizer. Flux's namespaced reconciler Role permits only those three resource kinds; `deletionPolicy: Orphan` makes final cleanup explicit. Neither configuration manages controller installation, RBAC bootstrap or Namespace objects from the watched application path.
