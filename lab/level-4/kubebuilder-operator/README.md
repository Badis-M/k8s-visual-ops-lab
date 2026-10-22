# Kubebuilder comparison boundary

Use Kubebuilder **4.12.0** for the optional temporary scaffold. Its upstream project-v4 fixture uses Go 1.25.3, controller-runtime 0.23.1 and Kubernetes libraries 0.35.0, matching the checked-in shared project.

The complete implementation is maintained once in `../custom-controllers/greeting-operator`; it is not copied into this directory. The scaffold is an optional learning comparison in a new temporary folder. Do not initialize Kubebuilder in this repository root or overwrite an existing application.

The compact project's `make generate` generates both deepcopy and the shared CRD. A standard CLI scaffold normally separates `make generate` and `make manifests` and includes extra deployment, metrics and envtest wiring. Those generated extras are not claimed present or executed here. Follow the shared project's README for the actual complete build, fake tests, local manager or in-cluster deployment and cleanup.
