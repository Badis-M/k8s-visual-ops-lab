import { foundationLab } from "../foundation-lab";
import { h, code } from "../lesson-kit";
import type { Chapter } from "../types";

export const architecture: Chapter = {
  id: "architecture",
  level: 1,
  minutes: 50,
  title: { en: "Cluster architecture", fr: "L'architecture d'un cluster" },
  summary: {
    en: "Control plane and worker nodes, every component's job, and exactly what happens when you run kubectl apply.",
    fr: "Control plane et nœuds workers, le rôle de chaque composant, et ce qui se passe exactement quand vous lancez kubectl apply.",
  },
  prerequisites: ["why-kubernetes"],
  related: ["reconciliation", "setup-kind", "pods"],
  blocks: [
    {
      type: "h2",
      id: "two-halves",
      text: {
        en: "Two halves: control plane and workers",
        fr: "Deux moitiés : control plane et workers",
      },
    },
    {
      type: "p",
      text: {
        en: "A Kubernetes cluster is a set of machines called nodes. They play two roles. The control plane is the brain: it stores the desired state, makes decisions (where should this Pod run?) and detects drift. Worker nodes are the muscle: they actually run your containers and report back. In production the control plane usually runs on 3 dedicated machines for high availability; in kind, one container can play both roles.",
        fr: "Un cluster Kubernetes est un ensemble de machines appelées nœuds. Elles jouent deux rôles. Le control plane est le cerveau : il stocke l'état désiré, prend les décisions (où doit tourner ce Pod ?) et détecte les écarts. Les nœuds workers sont les muscles : ils exécutent réellement vos conteneurs et rendent compte. En production, le control plane tourne souvent sur 3 machines dédiées pour la haute disponibilité ; avec kind, un seul conteneur peut tenir les deux rôles.",
      },
    },
    {
      type: "p",
      text: {
        en: "The most important architectural rule: every component talks to the API server, and only the API server talks to etcd. The scheduler never calls a kubelet directly, controllers never write to etcd. Components coordinate indirectly by reading and writing objects through the API — a hub-and-spoke design that keeps each piece simple and replaceable.",
        fr: "La règle d'architecture la plus importante : chaque composant parle à l'API server, et seul l'API server parle à etcd. Le scheduler n'appelle jamais directement un kubelet, les contrôleurs n'écrivent jamais dans etcd. Les composants se coordonnent indirectement en lisant et écrivant des objets via l'API — une architecture en étoile qui garde chaque pièce simple et remplaçable.",
      },
    },
    { type: "diagram", name: "architecture" },
    {
      type: "callout",
      tone: "tip",
      title: { en: "Use the diagram", fr: "Utilisez le schéma" },
      text: {
        en: "Click any component to read its responsibilities, then press “Play kubectl apply” to watch the request lifecycle step by step. Arrows only exist where real communication happens.",
        fr: "Cliquez sur un composant pour lire ses responsabilités, puis sur « Lancer kubectl apply » pour suivre le cycle de vie de la requête étape par étape. Les flèches n'existent que là où une vraie communication a lieu.",
      },
    },
    {
      type: "h2",
      id: "control-plane",
      text: { en: "Control plane components", fr: "Les composants du control plane" },
    },
    {
      type: "fields",
      rows: [
        {
          field: "kube-apiserver",
          text: {
            en: "The front door and the only component that reads/writes etcd. It authenticates the caller, authorizes the action (RBAC), runs admission controllers that can mutate or reject the object, validates it against its schema, persists it, and serves watch streams so other components are notified of changes.",
            fr: "La porte d'entrée et le seul composant qui lit/écrit dans etcd. Il authentifie l'appelant, autorise l'action (RBAC), exécute les admission controllers qui peuvent modifier ou rejeter l'objet, le valide selon son schéma, le persiste, et sert des flux watch pour notifier les autres composants.",
          },
        },
        {
          field: "etcd",
          text: {
            en: "A distributed, strongly consistent key-value store (Raft consensus). It holds every object of the cluster: the source of truth. Losing etcd without a backup means losing the cluster's state — which is why backing it up is a core operational task.",
            fr: "Un magasin clé-valeur distribué et fortement cohérent (consensus Raft). Il contient tous les objets du cluster : la source de vérité. Perdre etcd sans sauvegarde, c'est perdre l'état du cluster — d'où l'importance de sa sauvegarde.",
          },
        },
        {
          field: "kube-scheduler",
          text: {
            en: "Watches for Pods with no `spec.nodeName`. For each one it filters nodes that can fit it (resources, taints, affinity…) then scores the remaining ones, and writes a Binding through the API server. It decides; it does not start anything.",
            fr: "Surveille les Pods sans `spec.nodeName`. Pour chacun, il filtre les nœuds capables de l'accueillir (ressources, taints, affinité…), note les candidats restants, puis écrit un Binding via l'API server. Il décide ; il ne démarre rien.",
          },
        },
        {
          field: "kube-controller-manager",
          text: {
            en: "One process running many controllers: Deployment, ReplicaSet, Node, Job, EndpointSlice, ServiceAccount… Each is a loop that watches some objects and acts to move actual state toward desired state.",
            fr: "Un processus qui exécute de nombreux contrôleurs : Deployment, ReplicaSet, Node, Job, EndpointSlice, ServiceAccount… Chacun est une boucle qui surveille certains objets et agit pour rapprocher l'état réel de l'état désiré.",
          },
        },
        {
          field: "cloud-controller-manager",
          text: {
            en: "Optional. Integrates with a cloud provider (load balancers, node lifecycle, routes). Not present in kind.",
            fr: "Optionnel. Intègre un fournisseur cloud (load balancers, cycle de vie des nœuds, routes). Absent de kind.",
          },
        },
      ],
    },
    {
      type: "h2",
      id: "worker-nodes",
      text: { en: "Worker node components", fr: "Les composants d'un nœud worker" },
    },
    {
      type: "fields",
      rows: [
        {
          field: "kubelet",
          text: {
            en: "The node agent. It watches the API server for Pods bound to its node, asks the container runtime to create them, runs probes, mounts volumes and reports Pod and node status back. It only manages containers created by Kubernetes.",
            fr: "L'agent du nœud. Il surveille l'API server pour les Pods assignés à son nœud, demande au runtime de les créer, exécute les probes, monte les volumes et remonte le statut des Pods et du nœud. Il ne gère que les conteneurs créés par Kubernetes.",
          },
        },
        {
          field: "container runtime",
          text: {
            en: "containerd or CRI-O. The kubelet talks to it through the Container Runtime Interface (CRI, a gRPC API). It pulls images and starts containers using a low-level runtime such as runc.",
            fr: "containerd ou CRI-O. Le kubelet lui parle via la Container Runtime Interface (CRI, une API gRPC). Il télécharge les images et démarre les conteneurs avec un runtime bas niveau comme runc.",
          },
        },
        {
          field: "CNI plugin",
          text: {
            en: "When a Pod sandbox is created, the runtime calls the CNI plugin (kindnet in kind; Calico, Cilium… elsewhere) to give the Pod an IP and connect it to the cluster network so every Pod can reach every other Pod.",
            fr: "À la création du sandbox d'un Pod, le runtime appelle le plugin CNI (kindnet dans kind ; Calico, Cilium… ailleurs) pour attribuer une IP au Pod et le connecter au réseau du cluster afin que tous les Pods puissent se joindre.",
          },
        },
        {
          field: "kube-proxy",
          text: {
            en: "Watches Services and EndpointSlices and programs the configured iptables, nftables or IPVS dataplane on the node so traffic sent to a Service's virtual IP is forwarded to one of its Pods. Some CNIs (e.g. Cilium) can replace it.",
            fr: "Surveille les Services et EndpointSlices et programme le dataplane configuré iptables, nftables ou IPVS sur le nœud pour que le trafic envoyé à l'IP virtuelle d'un Service soit redirigé vers un de ses Pods. Certains CNI (ex. Cilium) peuvent le remplacer.",
          },
        },
      ],
    },
    {
      type: "h2",
      id: "kubectl-apply",
      text: { en: "What happens on kubectl apply", fr: "Ce qui se passe lors d'un kubectl apply" },
    },
    {
      type: "p",
      text: {
        en: "Take this Deployment manifest from the lab:",
        fr: "Prenons ce manifeste de Deployment issu du lab :",
      },
    },
    {
      type: "code",
      lang: "yaml",
      title: "lab/k8s/working/deployment.yaml",
      code: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: k8s-ops-api-deployment\n  namespace: k8s-ops\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: k8s-ops-api\n  template:\n    metadata:\n      labels:\n        app: k8s-ops-api\n    spec:\n      containers:\n        - name: api\n          image: k8s-ops-api:local\n          imagePullPolicy: Never\n          ports:\n            - containerPort: 8000",
    },
    {
      type: "list",
      ordered: true,
      items: [
        {
          en: "`kubectl` reads your kubeconfig, finds the API server address and credentials, and sends the object over HTTPS (server-side it is a create or a patch).",
          fr: "`kubectl` lit votre kubeconfig, trouve l'adresse de l'API server et les identifiants, et envoie l'objet en HTTPS (côté serveur, une création ou un patch).",
        },
        {
          en: "The API server authenticates you, checks RBAC, runs admission (defaults are filled in), validates, and writes the Deployment to etcd. kubectl returns `deployment.apps/k8s-ops-api-deployment created` — this confirms API acceptance, without waiting for Pods to run.",
          fr: "L'API server vous authentifie, vérifie le RBAC, exécute l'admission (les valeurs par défaut sont ajoutées), valide, puis écrit le Deployment dans etcd. kubectl affiche `deployment.apps/k8s-ops-api-deployment created` — cela confirme l’acceptation API, sans attendre le démarrage des Pods.",
        },
        {
          en: "The Deployment controller (in the controller manager) is notified through its watch, and creates a ReplicaSet. The ReplicaSet controller sees a ReplicaSet wanting 2 Pods and 0 existing, and creates 2 Pod objects — with no node assigned.",
          fr: "Le contrôleur Deployment (dans le controller manager) est notifié via son watch et crée un ReplicaSet. Le contrôleur ReplicaSet voit un ReplicaSet qui veut 2 Pods alors qu'il en existe 0, et crée 2 objets Pod — sans nœud assigné.",
        },
        {
          en: "The scheduler sees two unscheduled Pods, picks a node for each, and writes a Binding (setting `spec.nodeName`).",
          fr: "Le scheduler voit deux Pods non planifiés, choisit un nœud pour chacun et écrit un Binding (qui renseigne `spec.nodeName`).",
        },
        {
          en: "The kubelet on that node sees new Pods bound to it.",
          fr: "Le kubelet de ce nœud voit de nouveaux Pods qui lui sont assignés.",
        },
        {
          en: "The kubelet asks the runtime (CRI) to create the Pod sandbox; the runtime calls CNI for networking, then starts the `api` container from `k8s-ops-api:local`.",
          fr: "Le kubelet demande au runtime (CRI) de créer le sandbox du Pod ; le runtime appelle le CNI pour le réseau, puis démarre le conteneur `api` à partir de `k8s-ops-api:local`.",
        },
        {
          en: "The kubelet reports status (`Running`, Pod IP) to the API server, which stores it. The Deployment's status now shows 2/2 available, and the EndpointSlice controller adds the Pod IPs behind any matching Service.",
          fr: "Le kubelet remonte le statut (`Running`, IP du Pod) à l'API server qui le stocke. Le statut du Deployment indique 2/2 disponibles, et le contrôleur EndpointSlice ajoute les IP des Pods derrière tout Service correspondant.",
        },
      ],
    },
    {
      type: "callout",
      tone: "info",
      title: { en: "Asynchronous by design", fr: "Asynchrone par conception" },
      text: {
        en: "kubectl apply returns after step 2. Everything else happens asynchronously, driven by watches. That is why you verify with `kubectl get` or `kubectl rollout status` afterwards.",
        fr: "kubectl apply rend la main après l'étape 2. Tout le reste se fait de façon asynchrone, piloté par les watches. C'est pourquoi on vérifie ensuite avec `kubectl get` ou `kubectl rollout status`.",
      },
    },
    ...foundationLab("lab-architecture"),
    {
      type: "h2",
      id: "lab",
      text: {
        en: "Lab: see the components in your cluster",
        fr: "Lab : voir les composants dans votre cluster",
      },
    },
    {
      type: "p",
      text: {
        en: "This lab needs a kind cluster. If you don't have one, complete “Install kubectl and create a kind cluster” first — then come back. In kind (built with kubeadm) the control plane components run as static Pods in the `kube-system` namespace, so you can inspect them like any workload.",
        fr: "Ce lab nécessite un cluster kind. Si vous n'en avez pas, faites d'abord « Installer kubectl et créer un cluster kind », puis revenez. Dans kind (construit avec kubeadm), les composants du control plane tournent comme des Pods statiques dans le namespace `kube-system` : on peut les inspecter comme n'importe quelle charge.",
      },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "List nodes and their roles", fr: "Lister les nœuds et leurs rôles" },
          code: { lang: "bash", code: "k get nodes -o wide" },
          explain: {
            en: "`-o wide` adds internal IP, OS image, kernel and container runtime columns. Note the runtime: containerd.",
            fr: "`-o wide` ajoute l'IP interne, l'OS, le noyau et le runtime. Notez le runtime : containerd.",
          },
          expected: {
            text: {
              en: "A control-plane node and any workers created by your chosen kind topology. The following row is an illustrative single-node output.",
              fr: "Un nœud control-plane et les workers de la topologie kind choisie. La ligne suivante illustre un cluster mononœud.",
            },
            output:
              "NAME                        STATUS   ROLES           VERSION   CONTAINER-RUNTIME\nk8s-lab-control-plane       Ready    control-plane   v1.3x.x   containerd://1.7.x",
          },
        },
        {
          title: { en: "Find the control plane Pods", fr: "Trouver les Pods du control plane" },
          code: { lang: "bash", code: "k get pods -n kube-system -o wide" },
          explain: {
            en: "You should recognise etcd, kube-apiserver, kube-controller-manager, kube-scheduler, plus kube-proxy, kindnet (the CNI) and CoreDNS (cluster DNS, an add-on).",
            fr: "Vous devriez reconnaître etcd, kube-apiserver, kube-controller-manager, kube-scheduler, ainsi que kube-proxy, kindnet (le CNI) et CoreDNS (le DNS du cluster, un add-on).",
          },
          expected: {
            text: {
              en: "All Pods `Running`. Names of static Pods end with the node name.",
              fr: "Tous les Pods en `Running`. Le nom des Pods statiques se termine par le nom du nœud.",
            },
          },
        },
        {
          title: { en: "Watch the flow live", fr: "Observer le flux en direct" },
          code: {
            lang: "bash",
            code: "# terminal 1\nk get events -A --watch\n\n# terminal 2\nk create deployment hello --image=nginx:1.27 --replicas=2",
          },
          explain: {
            en: "Events are written by components as they act. You will see, in order: ScalingReplicaSet (Deployment controller), SuccessfulCreate (ReplicaSet controller), Scheduled (scheduler), Pulling/Pulled/Created/Started (kubelet). This is the diagram's lifecycle in real time.",
            fr: "Les événements sont écrits par les composants quand ils agissent. Vous verrez dans l'ordre : ScalingReplicaSet (contrôleur Deployment), SuccessfulCreate (contrôleur ReplicaSet), Scheduled (scheduler), Pulling/Pulled/Created/Started (kubelet). C'est le cycle du schéma en temps réel.",
          },
          mistake: {
            en: "Running the watch after creating the Deployment: events appear quickly, start the watch first.",
            fr: "Lancer le watch après avoir créé le Deployment : les événements arrivent vite, démarrez le watch d'abord.",
          },
        },
        {
          title: { en: "Ask the API directly", fr: "Interroger directement l'API" },
          code: {
            lang: "bash",
            code: "k get --raw '/readyz?verbose' | tail -n 5\nk get deployment hello -v=6 2>&1 | grep GET",
          },
          explain: {
            en: "`--raw` calls an API path directly. Quote paths containing ? so Bash/Zsh pass the query string literally rather than expanding a filename pattern. `-v=6` makes kubectl print the HTTP requests it sends — proof that kubectl is just an API client.",
            fr: "`--raw` appelle directement un chemin de l'API. Protégez les chemins contenant ? avec des guillemets pour que Bash/Zsh transmettent la requête littéralement sans expansion de noms de fichiers. `-v=6` affiche les requêtes HTTP envoyées par kubectl — la preuve que kubectl n'est qu'un client de l'API.",
          },
          expected: {
            text: {
              en: "`readyz check passed` and a GET to `/apis/apps/v1/namespaces/lab-architecture/deployments/hello`.",
              fr: "`readyz check passed` et un GET vers `/apis/apps/v1/namespaces/lab-architecture/deployments/hello`.",
            },
          },
        },
        {
          title: { en: "Clean up", fr: "Nettoyer" },
          code: { lang: "bash", code: "k delete deployment hello" },
          explain: {
            en: "Deleting the Deployment cascades to its ReplicaSet and Pods via owner references and garbage collection.",
            fr: "Supprimer le Deployment entraîne la suppression de son ReplicaSet et de ses Pods via les owner references et le garbage collector.",
          },
        },
      ],
    },
    {
      type: "challenge",
      title: {
        en: "A Pod without a matching scheduler",
        fr: "Un Pod sans scheduler correspondant",
      },
      task: {
        en: "Create a standalone Pod with schedulerName: lab-no-scheduler. No scheduler in this lab owns that name. Predict its node assignment, observe it, then delete only this Pod. This illustrates the assignment boundary without stopping a shared control-plane component.",
        fr: "Créez un Pod autonome avec schedulerName: lab-no-scheduler. Aucun scheduler du lab ne prend en charge ce nom. Prédisez son affectation, observez-la puis supprimez seulement ce Pod. Cela illustre cette frontière sans arrêter un composant partagé du control-plane.",
      },
      hints: [
        {
          en: "Inspect spec.schedulerName and spec.nodeName on the exact exercise Pod.",
          fr: "Examinez spec.schedulerName et spec.nodeName sur le Pod précis de l’exercice.",
        },
        {
          en: "A kubelet starts assigned Pods; it does not claim arbitrary unassigned API Pods.",
          fr: "Le kubelet démarre les Pods affectés ; il ne prend pas en charge arbitrairement les Pods API non affectés.",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "bash",
          code: "k apply -f - <<'YAML'\napiVersion: v1\nkind: Pod\nmetadata:\n  name: orphan\nspec:\n  schedulerName: lab-no-scheduler\n  containers:\n    - name: web\n      image: nginx:1.27\nYAML\nk get pod orphan -o wide\nk get pod orphan -o jsonpath='{.spec.schedulerName}{\" / node=\"}{.spec.nodeName}{\"\\n\"}'\nk delete pod orphan",
        },
        {
          type: "p",
          text: {
            en: "Expected: orphan remains Pending with an empty nodeName because no matching scheduler binds it. The default scheduler still handles normal Pods. This deliberately unclaimed Pod is not proof that the scheduler process failed; inspect the requested scheduler name before diagnosing an outage.",
            fr: "Attendu : orphan reste Pending avec nodeName vide car aucun scheduler correspondant ne l’affecte. Le scheduler par défaut continue de traiter les Pods ordinaires. Ce Pod volontairement non pris en charge ne prouve pas une panne du processus scheduler ; vérifiez le nom demandé avant de conclure à une indisponibilité.",
          },
        },
      ],
    },
    h("cleanup", "Finish this isolated exercise", "Terminer cet exercice isolé"),
    code("bash", "k delete namespace lab-architecture"),
  ],
};
