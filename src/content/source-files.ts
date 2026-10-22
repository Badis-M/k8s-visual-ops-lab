import mainPy from "../../lab/app/main.py?raw";
import requirementsTxt from "../../lab/app/requirements.txt?raw";
import dockerfile from "../../lab/app/Dockerfile?raw";
import namespaceYaml from "../../lab/k8s/working/namespace.yaml?raw";
import deploymentYaml from "../../lab/k8s/working/deployment.yaml?raw";
import serviceYaml from "../../lab/k8s/working/service.yaml?raw";

export const sourceFiles = [
  {
    id: "fastapi-app",
    path: "lab/app/main.py",
    code: mainPy,
    title: "FastAPI application",
    purpose:
      "Defines the small API that will be packaged into a Docker image and deployed on Kubernetes.",
    notice: [
      "The app exposes simple endpoints that are easy to test.",
      "APP_NAME and READY come from environment variables.",
      "The /health and /ready endpoints are useful foundations for operational checks.",
    ],
    relatedStep: "Step 01 — Understand the FastAPI app",
  },
  {
    id: "requirements",
    path: "lab/app/requirements.txt",
    code: requirementsTxt,
    title: "Python dependencies",
    purpose:
      "Lists the Python packages required to run the FastAPI application inside the container image.",
    notice: [
      "The Docker build installs these dependencies before starting the application.",
      "Keeping dependencies explicit makes the lab repeatable on another machine.",
    ],
    relatedStep: "Step 02 — Build the Docker image",
  },
  {
    id: "dockerfile",
    path: "lab/app/Dockerfile",
    code: dockerfile,
    title: "Docker image definition",
    purpose:
      "Describes how to build the runnable container image used by the Kubernetes Deployment.",
    notice: [
      "The Dockerfile is located inside lab/app, so lab/app is the Docker build context.",
      "The resulting image tag must match the image used in the Deployment manifest.",
    ],
    relatedStep: "Step 02 — Build the Docker image",
  },
  {
    id: "namespace",
    path: "lab/k8s/working/namespace.yaml",
    code: namespaceYaml,
    title: "Namespace manifest",
    purpose: "Creates a dedicated Kubernetes namespace for the lab resources.",
    notice: [
      "The namespace isolates the lab objects from the default namespace.",
      "Other manifests should target the same namespace.",
    ],
    relatedStep: "Step 05 — Apply Kubernetes manifests",
  },
  {
    id: "deployment",
    path: "lab/k8s/working/deployment.yaml",
    code: deploymentYaml,
    title: "Deployment manifest",
    purpose:
      "Creates the application workload and tells Kubernetes which container image to run.",
    notice: [
      "replicas controls how many Pods should run.",
      "selector.matchLabels must match the Pod template labels.",
      "imagePullPolicy: Never is required because the image is loaded locally into kind.",
    ],
    relatedStep: "Step 06 — Inspect Deployment, ReplicaSet, and Pods",
  },
  {
    id: "service",
    path: "lab/k8s/working/service.yaml",
    code: serviceYaml,
    title: "Service manifest",
    purpose:
      "Creates a stable internal access point for the application Pods.",
    notice: [
      "The selector must match the labels on the Pods created by the Deployment.",
      "port is the Service port, while targetPort is the container port.",
      "ClusterIP means the Service is internal to the cluster.",
    ],
    relatedStep: "Step 07 — Expose with a ClusterIP Service",
  },
];

