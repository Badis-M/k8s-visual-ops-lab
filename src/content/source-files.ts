import mainPy from "../../lab/app/main.py?raw";
import requirementsTxt from "../../lab/app/requirements.txt?raw";
import dockerfile from "../../lab/app/Dockerfile?raw";
import namespaceYaml from "../../lab/k8s/working/namespace.yaml?raw";
import deploymentYaml from "../../lab/k8s/working/deployment.yaml?raw";
import serviceYaml from "../../lab/k8s/working/service.yaml?raw";

import { l } from "./lesson-kit";

export const sourceFiles = [
  {
    id: "fastapi-app",
    path: "lab/app/main.py",
    code: mainPy,
    title: l("FastAPI application", "Application FastAPI"),
    purpose: l(
      "The API packaged into the Docker image. Read these real files; do not paste them into a shell.",
      "L’API empaquetée dans l’image Docker. Lisez ces fichiers réels ; ne les collez pas dans un shell.",
    ),
    notice: [
      l(
        "The routes /, /health, /ready and /config return JSON. No Kubernetes probe is configured in the baseline Deployment.",
        "Les routes /, /health, /ready et /config retournent du JSON. Aucune probe Kubernetes n’est configurée dans le Deployment de base.",
      ),
      l(
        "APP_NAME and READY are read from environment variables at process startup; a change requires a new process.",
        "APP_NAME et READY sont lus au démarrage du processus ; un changement exige un nouveau processus.",
      ),
      l(
        "/ready currently returns HTTP 200 even when READY=false. Its JSON message alone cannot drive an HTTP readinessProbe.",
        "/ready retourne actuellement HTTP 200 même avec READY=false. Son seul message JSON ne suffit pas à piloter une readinessProbe HTTP.",
      ),
    ],
    relatedStep: l(
      "Step 01 — Understand the FastAPI app",
      "Étape 01 — Comprendre l’application FastAPI",
    ),
  },
  {
    id: "requirements",
    path: "lab/app/requirements.txt",
    code: requirementsTxt,
    title: l("Python dependencies", "Dépendances Python"),
    purpose: l(
      "Python packages installed while building the image or preparing the optional local virtual environment.",
      "Paquets Python installés au build ou dans l’environnement virtuel local optionnel.",
    ),
    notice: [
      l(
        "These package names are not version-pinned; a later installation may resolve different versions.",
        "Ces noms de paquets ne sont pas figés par version ; une installation ultérieure peut résoudre d’autres versions.",
      ),
      l(
        "A reviewed lock and base-image digest would be needed for stronger reproducibility; this legacy lab does not provide them.",
        "Un verrou de dépendances examiné et un digest d’image renforceraient la reproductibilité ; ce lab historique ne les fournit pas.",
      ),
    ],
    relatedStep: l("Step 02 — Build the Docker image", "Étape 02 — Construire l’image Docker"),
  },
  {
    id: "dockerfile",
    path: "lab/app/Dockerfile",
    code: dockerfile,
    title: l("Docker image definition", "Définition de l’image Docker"),
    purpose: l(
      "Instructions for docker build, stored in lab/app/Dockerfile; run the build command from the repository root.",
      "Instructions pour docker build, dans lab/app/Dockerfile ; lancez la commande de build depuis la racine du dépôt.",
    ),
    notice: [
      l(
        "The build context is lab/app, so COPY paths are relative to that directory.",
        "Le contexte de build est lab/app : les chemins COPY sont relatifs à ce dossier.",
      ),
      l(
        "EXPOSE 8000 documents the application port; it does not publish a host port.",
        "EXPOSE 8000 documente le port applicatif ; il ne publie pas de port sur l’hôte.",
      ),
      l(
        "python:3.12-slim is a mutable teaching tag. This baseline image runs as root and is not a hardened production example.",
        "python:3.12-slim est un tag pédagogique mutable. Cette image de base tourne en root et ne constitue pas un exemple de production durci.",
      ),
    ],
    relatedStep: l("Step 02 — Build the Docker image", "Étape 02 — Construire l’image Docker"),
  },
  {
    id: "namespace",
    path: "lab/k8s/working/namespace.yaml",
    code: namespaceYaml,
    title: l("Namespace manifest", "Manifest du namespace"),
    purpose: l(
      "Declares k8s-ops, the dedicated namespace for the guided lab.",
      "Déclare k8s-ops, le namespace dédié au lab guidé.",
    ),
    notice: [
      l(
        "Check that this namespace is absent before creating it; do not overwrite another exercise.",
        "Vérifiez son absence avant création ; n’écrasez pas un autre exercice.",
      ),
      l(
        "A namespace organizes namespaced objects; it does not by itself enforce network or security isolation.",
        "Un namespace organise les objets de sa portée ; il n’impose pas seul une isolation réseau ou de sécurité.",
      ),
    ],
    relatedStep: l(
      "Step 05 — Apply Kubernetes manifests",
      "Étape 05 — Appliquer les manifests Kubernetes",
    ),
  },
  {
    id: "deployment",
    path: "lab/k8s/working/deployment.yaml",
    code: deploymentYaml,
    title: l("Deployment manifest", "Manifest du Deployment"),
    purpose: l(
      "Requests two copies of the locally built image in k8s-ops.",
      "Demande deux copies de l’image locale dans k8s-ops.",
    ),
    notice: [
      l(
        "selector.matchLabels must match template.metadata.labels; replicas is the desired count.",
        "selector.matchLabels doit correspondre à template.metadata.labels ; replicas est l’effectif désiré.",
      ),
      l(
        "imagePullPolicy: Never is a deliberate local-only choice. The exact tag must be loaded into all eligible kind nodes or startup fails with ErrImageNeverPull.",
        "imagePullPolicy: Never est un choix local explicite. Le tag exact doit être chargé dans les nœuds kind éligibles, sinon le démarrage échoue avec ErrImageNeverPull.",
      ),
      l(
        "The baseline omits resource requests/limits and health probes; Running/Ready alone does not prove application health.",
        "Le lab de base omet requests/limits et probes ; Running/Ready ne prouve pas seul la santé applicative.",
      ),
    ],
    relatedStep: l(
      "Step 06 — Inspect Deployment, ReplicaSet, and Pods",
      "Étape 06 — Examiner Deployment, ReplicaSet et Pods",
    ),
  },
  {
    id: "service",
    path: "lab/k8s/working/service.yaml",
    code: serviceYaml,
    title: l("Service manifest", "Manifest du Service"),
    purpose: l(
      "Declares an internal ClusterIP entry point for the selected API Pods.",
      "Déclare un point d’entrée ClusterIP interne vers les Pods API sélectionnés.",
    ),
    notice: [
      l(
        "The selector app=k8s-ops-api must match Pod labels within k8s-ops.",
        "Le sélecteur app=k8s-ops-api doit correspondre aux labels des Pods de k8s-ops.",
      ),
      l(
        "port: 80 is the client-facing Service port; targetPort: 8000 is the application port.",
        "port: 80 est le port client du Service ; targetPort: 8000 est le port applicatif.",
      ),
      l(
        "Port-forward through a Service selects a Pod; it does not test the ClusterIP network path. Use the Services lesson for an in-cluster client test.",
        "Un port-forward via le Service choisit un Pod sans tester le chemin réseau ClusterIP. Le cours Services propose un test depuis un client du cluster.",
      ),
    ],
    relatedStep: l(
      "Step 07 — Expose with a ClusterIP Service",
      "Étape 07 — Examiner le Service ClusterIP",
    ),
  },
];
