import type { L } from "./types";

type GuidedStep = {
  number: string;
  title: L;
  goal: L;
  why: L;
  command: string;
  explanation: L;
  expected: L;
  mistake: L;
  fix?: { title: L; command: string; explanation: L };
};

export const labSteps = [
  {
    number: "01",
    title: {
      en: "Understand the FastAPI app",
      fr: "Comprendre l’application FastAPI",
    },
    goal: {
      en: "Start from a small API that gives Kubernetes something concrete to run.",
      fr: "Partir d’une petite API concrète.",
    },
    why: {
      en: "Before using Docker or Kubernetes, the application should be understandable and testable on its own.",
      fr: "Vérifier l’application seule permet de distinguer ses erreurs de celles de Docker ou Kubernetes.",
    },
    command:
      "python3 --version\npython3 -m venv lab/.venv\nsource lab/.venv/bin/activate\npython -m pip install -r lab/app/requirements.txt\npython -m uvicorn main:app --app-dir lab/app --reload --host 127.0.0.1 --port 8000",
    explanation: {
      en: "From the repository root, create an isolated Python environment under lab/.venv and start Uvicorn. Keep this terminal open; use a separate terminal at the repository root for subsequent steps. This local check is optional.",
      fr: "Depuis la racine du dépôt, créez un environnement Python isolé sous lab/.venv et démarrez Uvicorn. Gardez ce terminal ouvert ; utilisez un autre terminal à la racine du dépôt pour les étapes suivantes. Cette étape locale est optionnelle.",
    },
    expected: {
      en: "The API should respond at http://127.0.0.1:8000 before any Kubernetes resource exists.",
      fr: "L’API doit répondre sur http://127.0.0.1:8000 avant toute création de ressource Kubernetes.",
    },
    mistake: {
      en: "Using the occupied Uvicorn terminal or starting the next steps from lab/ instead of the repository root.",
      fr: "Réutiliser le terminal occupé par Uvicorn ou lancer les étapes suivantes depuis lab/ au lieu de la racine.",
    },
    fix: {
      title: {
        en: "Optional local validation",
        fr: "Vérification depuis un autre terminal",
      },
      command:
        "curl http://127.0.0.1:8000/\ncurl http://127.0.0.1:8000/health\ncurl http://127.0.0.1:8000/ready\ncurl http://127.0.0.1:8000/config",
      explanation: {
        en: "Requests should return JSON. /ready currently returns HTTP 200 even with READY=false: this JSON indicator is not yet suitable as an HTTP readinessProbe. No probes are configured in the baseline Deployment.",
        fr: "Les requêtes doivent retourner du JSON. /ready renvoie actuellement HTTP 200 même avec READY=false : ce simple indicateur JSON ne convient pas encore à une readinessProbe HTTP. Aucune probe n’est configurée dans le Deployment de base.",
      },
    },
  },
  {
    number: "02",
    title: {
      en: "Build the Docker image",
      fr: "Construire l’image Docker",
    },
    goal: {
      en: "Package the application into a container image.",
      fr: "Empaqueter l’application dans une image.",
    },
    why: {
      en: "Kubernetes does not run a source folder directly. It runs containers created from images.",
      fr: "Kubernetes exécute des conteneurs issus d’images, pas un dossier source.",
    },
    command: "docker build -t k8s-ops-api:local lab/app",
    explanation: {
      en: "From the repository root, lab/app is the build context. The image tag must match the Deployment. The legacy Python dependencies and base image are not fully pinned: building needs network access and does not guarantee byte-identical output over time.",
      fr: "Depuis la racine du dépôt, lab/app est le contexte de build. Le tag k8s-ops-api:local doit correspondre au manifeste Deployment. Les dépendances Python et l’image de base du lab historique ne sont pas entièrement figées : ce build demande le réseau et n’est pas une garantie de résultat identique à chaque date.",
    },
    expected: {
      en: "The image k8s-ops-api:local exists in the local Docker image cache.",
      fr: "L’image k8s-ops-api:local doit apparaître dans le cache local Docker.",
    },
    mistake: {
      en: "Using one image tag during the build and another one inside the Deployment manifest.",
      fr: "Construire depuis lab/ avec le chemin lab/app, ou utiliser un tag différent du Deployment.",
    },
  },
  {
    number: "03",
    title: {
      en: "Create the kind cluster",
      fr: "Créer le cluster kind",
    },
    goal: {
      en: "Create a local Kubernetes cluster that runs on Docker.",
      fr: "Préparer un environnement Kubernetes local jetable.",
    },
    why: {
      en: "kind gives you a disposable Kubernetes environment without needing a cloud provider.",
      fr: "kind permet d’apprendre sans fournisseur cloud.",
    },
    command:
      "kind version\nkind get clusters\n# Continue only if k8s-ops-lab is absent.\nkind create cluster --name k8s-ops-lab --image kindest/node:v1.35.0 --config lab/kind.yaml\nkubectl --context kind-k8s-ops-lab get nodes -o wide",
    explanation: {
      en: "Use kind 0.31.0 and Kubernetes 1.35.0 from the repository root. lab/kind.yaml defines one control-plane and two workers on one host. Inspect existing clusters first; do not delete an existing k8s-ops-lab to proceed. Subsequent commands explicitly target kind-k8s-ops-lab.",
      fr: "Depuis la racine du dépôt, utilisez kind 0.31.0 et l’image Kubernetes 1.35.0 avec lab/kind.yaml : un control-plane et deux workers sur un seul hôte. Vérifiez d’abord les clusters existants. Si k8s-ops-lab existe, inspectez-le ; ne le supprimez pas pour poursuivre. Les commandes suivantes ciblent explicitement kind-k8s-ops-lab.",
    },
    expected: {
      en: "Three nodes should become Ready. Single-host placement is not physical high availability.",
      fr: "Les trois nœuds doivent devenir Ready. Ce placement local ne prouve aucune haute disponibilité physique.",
    },
    mistake: {
      en: "Reusing an existing cluster without reviewing its contents, or assuming the Docker image is already available inside its nodes.",
      fr: "Réutiliser un cluster existant sans examiner son contenu ou supposer qu’une image Docker locale est déjà accessible dans ses nœuds.",
    },
  },
  {
    number: "04",
    title: {
      en: "Load the image into kind",
      fr: "Charger l’image dans kind",
    },
    goal: {
      en: "Make the locally built image available to the kind cluster.",
      fr: "Rendre l’image locale accessible aux nœuds.",
    },
    why: {
      en: "The Kubernetes node created by kind needs access to the image before it can start the Pod.",
      fr: "Chaque nœud kind possède son propre runtime de conteneurs.",
    },
    command: "kind load docker-image k8s-ops-api:local --name k8s-ops-lab",
    explanation: {
      en: "The Docker image exists on your machine, but the kind node has its own container runtime. This command copies the local k8s-ops-api:local image into the kind cluster so Kubernetes can start Pods from it without pulling from an external registry.",
      fr: "Cette commande copie k8s-ops-api:local dans les nœuds du cluster nommé k8s-ops-lab. Aucun registre externe n’est nécessaire pour cette image applicative.",
    },
    expected: {
      en: "The image is available inside the kind cluster nodes.",
      fr: "L’image doit être disponible dans les runtimes des nœuds kind.",
    },
    mistake: {
      en: "Skipping image loading: with imagePullPolicy: Never, expect ErrImageNeverPull rather than an automatic registry pull.",
      fr: "Oublier le chargement : avec imagePullPolicy: Never, l’erreur attendue est ErrImageNeverPull, pas un téléchargement automatique.",
    },
  },
  {
    number: "05",
    title: {
      en: "Apply Kubernetes manifests",
      fr: "Appliquer les manifests Kubernetes",
    },
    goal: {
      en: "Create the Namespace first, then create the Deployment and Service from YAML files.",
      fr: "Créer le namespace avant ses ressources.",
    },
    why: {
      en: "Deployment and Service are namespaced resources. The namespace must exist before Kubernetes can create resources inside it.",
      fr: "Deployment et Service sont des ressources de namespace.",
    },
    command:
      "kubectl --context kind-k8s-ops-lab get namespace k8s-ops\n# Continue only after confirming NotFound.\nkubectl --context kind-k8s-ops-lab create -f lab/k8s/working/namespace.yaml\nkubectl --context kind-k8s-ops-lab apply -f lab/k8s/working/deployment.yaml\nkubectl --context kind-k8s-ops-lab apply -f lab/k8s/working/service.yaml",
    explanation: {
      en: "Confirm k8s-ops is absent before creating it. If it exists, stop and inspect it. Apply the real files in order with an explicit context; do not rely on your shell current context.",
      fr: "Confirmez que k8s-ops est absent avant de le créer. S’il existe déjà, arrêtez-vous et inspectez-le. Appliquez ensuite les fichiers réels dans l’ordre. Le contexte explicite évite de dépendre du contexte courant de votre shell.",
    },
    expected: {
      en: "The k8s-ops Namespace exists, then the k8s-ops-api-deployment Deployment and k8s-ops-api-service Service are created inside it.",
      fr: "Le namespace k8s-ops, le Deployment k8s-ops-api-deployment et le Service k8s-ops-api-service doivent exister.",
    },
    mistake: {
      en: "Applying into a pre-existing personal namespace or relying on directory application order.",
      fr: "Appliquer les ressources dans un namespace personnel préexistant ou supposer un ordre fiable en appliquant tout un dossier.",
    },
    fix: {
      title: {
        en: "Inspect after creating the namespace",
        fr: "Vérifier après la création du namespace",
      },
      command: "kubectl --context kind-k8s-ops-lab -n k8s-ops get all",
      explanation: {
        en: "The namespace already exists at this step. get all shows a selection of common resources, not a complete inventory.",
        fr: "Le namespace est déjà créé à cette étape. get all donne une sélection de ressources courantes, pas un inventaire complet.",
      },
    },
  },
  {
    number: "06",
    title: {
      en: "Inspect Deployment, ReplicaSet, and Pods",
      fr: "Examiner Deployment, ReplicaSet et Pods",
    },
    goal: {
      en: "Understand what Kubernetes created after applying the Deployment.",
      fr: "Comprendre la hiérarchie créée.",
    },
    why: {
      en: "A Deployment manages a ReplicaSet, and the ReplicaSet manages Pods. In this lab, the Deployment is intentionally named k8s-ops-api-deployment to make its role obvious.",
      fr: "Le Deployment gère les ReplicaSets qui maintiennent les Pods.",
    },
    command:
      "kubectl --context kind-k8s-ops-lab -n k8s-ops rollout status deployment/k8s-ops-api-deployment --timeout=180s\nkubectl --context kind-k8s-ops-lab -n k8s-ops get deploy,rs,pods\nkubectl --context kind-k8s-ops-lab -n k8s-ops describe deployment k8s-ops-api-deployment",
    explanation: {
      en: "These commands show the hierarchy created by the Deployment. The Deployment expresses the desired state, the ReplicaSet keeps the requested number of replicas, and the Pods are the running application instances. The describe command adds useful detail such as events, labels, selectors, image name, and rollout status.",
      fr: "Attendez la fin du rollout avec un timeout borné, puis examinez les trois niveaux. describe ajoute événements, labels, sélecteurs et état du rollout.",
    },
    expected: {
      en: "The k8s-ops-api-deployment Deployment is visible, Kubernetes created a ReplicaSet for it, and two Pods are running because replicas is set to 2.",
      fr: "Un Deployment, son ReplicaSet actif et deux Pods doivent être prêts ; les noms des Pods sont générés.",
    },
    mistake: {
      en: "Using the cluster name or lab name as the namespace. The namespace in the YAML files is k8s-ops, not k8s-ops-lab.",
      fr: "Utiliser k8s-ops-lab comme namespace : c’est le nom du cluster, le namespace est k8s-ops.",
    },
  },
  {
    number: "07",
    title: {
      en: "Expose with a ClusterIP Service",
      fr: "Examiner le Service ClusterIP",
    },
    goal: {
      en: "Give the Pods a stable internal access point.",
      fr: "Relier un Service stable aux Pods sélectionnés.",
    },
    why: {
      en: "Pods are temporary. A Service provides a stable way to reach the selected Pods. In this lab, the Service is intentionally named k8s-ops-api-service to make its role explicit.",
      fr: "Les IP des Pods sont temporaires ; le Service possède une identité stable.",
    },
    command:
      "kubectl --context kind-k8s-ops-lab -n k8s-ops get service\nkubectl --context kind-k8s-ops-lab -n k8s-ops describe service k8s-ops-api-service\nkubectl --context kind-k8s-ops-lab -n k8s-ops get pods --show-labels\nkubectl --context kind-k8s-ops-lab -n k8s-ops get endpointslices -l kubernetes.io/service-name=k8s-ops-api-service",
    explanation: {
      en: "The Service selects app=k8s-ops-api and maps port 80 to application port 8000. Inspect EndpointSlices to see published Pod destinations. The baseline Deployment has no application-level readinessProbe.",
      fr: "Le Service k8s-ops-api-service sélectionne app=k8s-ops-api et expose 80 vers le port applicatif 8000. EndpointSlices permet de vérifier les destinations publiées ; le Deployment de base n’a pas de readinessProbe métier.",
    },
    expected: {
      en: "The Service and its EndpointSlices should reference the selected Pod IPs.",
      fr: "Le Service et ses EndpointSlices doivent référencer les IP des Pods sélectionnés.",
    },
    mistake: {
      en: "Looking for a Service named k8s-ops-api. The actual Service name in service.yaml is k8s-ops-api-service.",
      fr: "Chercher un Service nommé k8s-ops-api ou confondre port 80 du Service et port 8000 de l’application.",
    },
  },
  {
    number: "08",
    title: {
      en: "Access with port-forward",
      fr: "Accéder avec port-forward",
    },
    goal: {
      en: "Reach the Service from your local machine.",
      fr: "Tester un Pod depuis la machine locale.",
    },
    why: {
      en: "A ClusterIP Service is internal to the cluster, so local access needs a tunnel from your machine to the Kubernetes Service.",
      fr: "Un Service ClusterIP ne publie pas directement un port sur la machine hôte.",
    },
    command:
      "kubectl --context kind-k8s-ops-lab -n k8s-ops port-forward service/k8s-ops-api-service 8081:80\n\n# In another terminal:\ncurl --fail http://127.0.0.1:8081/\ncurl --fail http://127.0.0.1:8081/health\ncurl --fail http://127.0.0.1:8081/ready\ncurl --fail http://127.0.0.1:8081/config",
    explanation: {
      en: "Local port 8081 avoids the website on 8080. kubectl selects a Pod through the Service selector and tunnels through the API to its target port. This does not test the ClusterIP VIP, DNS or balancing between replicas. Keep this tunnel in the foreground and run curl from another terminal.",
      fr: "Le port local 8081 évite le port 8080 du site. kubectl choisit un Pod via le sélecteur du Service et crée un tunnel via l’API vers son port cible. Cela ne teste ni le VIP ClusterIP, ni DNS, ni la répartition entre réplicas. Gardez le tunnel au premier plan ; lancez curl dans un autre terminal.",
    },
    expected: {
      en: 'The API should respond at http://127.0.0.1:8081; /health should return {"status":"healthy"}.',
      fr: 'L’API doit répondre sur http://127.0.0.1:8081 ; /health doit renvoyer {"status":"healthy"}.',
    },
    mistake: {
      en: "Treating successful port-forward as proof of Service networking, or reusing an occupied local port.",
      fr: "Croire qu’un port-forward réussi prouve que le réseau du Service fonctionne ou réutiliser un port déjà occupé.",
    },
  },
  {
    number: "09",
    title: {
      en: "Troubleshoot common failures",
      fr: "Diagnostiquer les erreurs courantes",
    },
    goal: {
      en: "Debug the most common local Kubernetes issues methodically.",
      fr: "Identifier la couche en échec avant de la modifier.",
    },
    why: {
      en: "Most failures come from image loading, labels, ports, namespaces, or application startup.",
      fr: "Chargement d’image, démarrage, labels, ports et namespace expliquent de nombreux échecs locaux.",
    },
    command:
      "kubectl --context kind-k8s-ops-lab -n k8s-ops get all\nkubectl --context kind-k8s-ops-lab -n k8s-ops describe pods\nkubectl --context kind-k8s-ops-lab -n k8s-ops logs -l app=k8s-ops-api --tail=50\nkubectl --context kind-k8s-ops-lab -n k8s-ops describe service k8s-ops-api-service\nkubectl --context kind-k8s-ops-lab -n k8s-ops get endpointslices -l kubernetes.io/service-name=k8s-ops-api-service",
    explanation: {
      en: "get all lists some common resources, not everything. Events describe scheduling/image failures, logs show application output, and Service/EndpointSlice evidence ties selectors to destinations. None alone proves business health.",
      fr: "get all montre quelques ressources usuelles. Events et describe révèlent ordonnancement et images ; logs montre stdout/stderr applicatifs ; Service et EndpointSlices relient sélecteurs et destinations. Aucun outil seul ne prouve la santé métier.",
    },
    expected: {
      en: "Events, logs, labels, and Service details point to the failing layer.",
      fr: "Les preuves doivent permettre de formuler une cause précise, puis de vérifier la récupération après une correction ciblée.",
    },
    mistake: {
      en: "Changing multiple files at once before identifying whether the failure comes from the image, the Pod, the labels, the Service, or the namespace.",
      fr: "Modifier simultanément image, labels et ports avant d’avoir identifié la cause.",
    },
  },
  {
    number: "10",
    title: {
      en: "Clean up only this exercise",
      fr: "Nettoyer les ressources créées",
    },
    goal: {
      en: "Remove only resources created for this exercise.",
      fr: "Retirer uniquement les ressources de cet exercice.",
    },
    why: {
      en: "A good lab should be repeatable from scratch without hidden state.",
      fr: "Un lab doit pouvoir être répété sans détruire un environnement partagé.",
    },
    command:
      "# Stop Uvicorn and port-forward with Ctrl+C in their terminals.\n# Only if you created k8s-ops for this exercise:\nkubectl --context kind-k8s-ops-lab delete namespace k8s-ops",
    explanation: {
      en: "Stop the local processes, then remove k8s-ops only if you created it for this exercise. Whole-cluster deletion is a separate choice: kind delete cluster --name k8s-ops-lab destroys other chapters too. The Docker image and lab/.venv remain on the host.",
      fr: "Arrêtez Uvicorn et port-forward avec Ctrl+C dans leurs terminaux. Supprimez k8s-ops uniquement si vous l’avez créé pour cet exercice. Supprimer le cluster entier reste une décision distincte : kind delete cluster --name k8s-ops-lab détruit aussi les ressources des autres chapitres. L’image Docker et lab/.venv restent sur la machine.",
    },
    expected: {
      en: "The lab namespace and its resources should disappear; other namespaces remain.",
      fr: "Le namespace du lab et ses ressources doivent disparaître. Aucun autre namespace ne doit être supprimé.",
    },
    mistake: {
      en: "Deleting the whole cluster while other exercises still use it.",
      fr: "Supprimer le cluster entier alors que d’autres exercices y sont encore présents.",
    },
  },
] satisfies GuidedStep[];
