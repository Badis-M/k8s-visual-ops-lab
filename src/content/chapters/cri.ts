import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import runtime from "../../../lab/level-4/cri/runtime.yaml?raw";

export const cri: Chapter = {
  id: "cri",
  level: 4,
  minutes: 55,
  title: l("Container runtime internals and CRI", "Internes du runtime et CRI"),
  summary: l(
    "Map Kubernetes Pod status to runtime sandboxes and containers using scoped read-only crictl inspection.",
    "Relier le statut Kubernetes aux sandboxes et conteneurs runtime avec une inspection crictl ciblée en lecture seule.",
  ),
  prerequisites: ["pods", "init-sidecars", "cni-internals"],
  related: ["cni-advanced", "failure-scenarios", "security-hardening"],
  blocks: [
    h(
      "objectives",
      "Cross the API/runtime boundary safely",
      "Franchir prudemment la frontière API/runtime",
    ),
    list(
      l(
        "Distinguish the API Pod UID, sandbox ID, container ID and image identity.",
        "Distinguer UID du Pod API, ID du sandbox, ID du conteneur et identité d’image.",
      ),
      l(
        "Locate failure before or after sandbox creation without manipulating kubelet-owned containers directly.",
        "Localiser l’échec avant ou après création du sandbox sans manipuler directement les conteneurs gérés par kubelet.",
      ),
    ),
    p(
      "The kubelet reconciles assigned Pod specifications and uses the Container Runtime Interface, a gRPC protocol, to ask a runtime for sandboxes, containers and images. CRI v1 is the baseline interface here. containerd implements the CRI service and delegates low-level execution to an OCI runtime such as runc. OCI image/runtime standards and CRI are different boundaries: an image format is not a kubelet management API. Kubernetes no longer embeds dockershim; Docker on your laptop can host kind nodes whose inner runtime is containerd.",
      "Le kubelet réconcilie les Pods affectés et utilise CRI, protocole gRPC, pour demander sandboxes, conteneurs et images au runtime. CRI v1 est l’interface de base ici. containerd implémente le service CRI et délègue l’exécution bas niveau à un runtime OCI tel que runc. Standards OCI et CRI sont des frontières distinctes : un format d’image n’est pas une API kubelet. Kubernetes n’embarque plus dockershim ; Docker sur votre ordinateur peut héberger les nœuds kind dont le runtime interne est containerd.",
    ),
    p(
      "A sandbox supplies the Pod environment, commonly including shared network namespace and the infrastructure container. Application containers and completed init containers are separate runtime objects associated with it. Restarting an application container need not recreate the sandbox; a deleted/recreated Pod has a new API UID even if its name is reused. Runtime garbage collection can remove old records, so historical API status and a current runtime listing need not contain identical inventories.",
      "Un sandbox fournit l’environnement du Pod, souvent le namespace réseau partagé et le conteneur d’infrastructure. Conteneurs applicatifs et init terminés sont des objets runtime distincts associés. Redémarrer un conteneur applicatif ne recrée pas nécessairement le sandbox ; supprimer/recréer un Pod change son UID API même si son nom revient. Le garbage collection peut supprimer les anciens objets : statut API historique et inventaire runtime actuel ne sont pas toujours identiques.",
    ),
    ...labContext("lab-cri"),
    note(
      "warn",
      l("Runtime access is privileged", "L’accès runtime est privilégié"),
      l(
        "The following docker exec commands are learner instructions only, confined to a disposable kind node. The Docker daemon/socket can control the host environment. Use only crictl version, pods, ps, inspectp and logs here; never stop/remove containers, prune images, change daemon configuration or restart containerd to experiment. The agent has executed none of these commands.",
        "Les commandes docker exec sont uniquement des instructions à l’apprenant, dans un nœud kind jetable. Le daemon/socket Docker peut contrôler l’environnement hôte. Utilisez seulement crictl version, pods, ps, inspectp et logs ici ; ne stoppez/supprimez aucun conteneur, ne purgez aucune image et ne redémarrez pas containerd pour expérimenter. L’agent n’a exécuté aucune de ces commandes.",
      ),
    ),
    h("fixture", "Create visible lifecycle stages", "Créer des étapes de cycle de vie observables"),
    code("yaml", runtime, "lab/level-4/cri/runtime.yaml"),
    code(
      "bash",
      'k -n lab-cri apply -f lab/level-4/cri/runtime.yaml\nk -n lab-cri wait --for=condition=Ready pod/runtime-demo --timeout=120s\nk -n lab-cri get pod runtime-demo -o jsonpath=\'{.metadata.uid}{"\\n"}{.spec.nodeName}{"\\n"}{range .status.containerStatuses[*]}{.name}{" "}{.containerID}{"\\n"}{end}\'\nk -n lab-cri get pod runtime-demo -o jsonpath=\'{range .status.initContainerStatuses[*]}{.name}{" "}{.state.terminated.exitCode}{"\\n"}{end}\'\nk get nodes -o custom-columns=NAME:.metadata.name,RUNTIME:.status.nodeInfo.containerRuntimeVersion',
    ),
    p(
      "Expected: prepare terminated with exit 0, web/companion running, and a containerd runtime reported on the node. A containerID has a runtime prefix such as containerd://; it is not the Pod UID. The two application containers share the Pod network while keeping separate process/filesystem lifecycles. These are Linux containers: on macOS Docker Desktop/another engine supplies a Linux VM, and the node containers share that VM's kernel rather than macOS's kernel.",
      "Attendu : prepare terminé à 0, web/companion actifs et runtime containerd sur le nœud. containerID porte un préfixe tel que containerd:// ; ce n’est pas l’UID du Pod. Les deux conteneurs partagent le réseau mais gardent des cycles processus/fichiers distincts. Ce sont des conteneurs Linux : sur macOS, Docker Desktop ou un autre moteur fournit une VM Linux dont les nœuds partagent le noyau, pas celui de macOS.",
    ),
    h(
      "inspect",
      "Query the actual kind node, read-only",
      "Interroger le vrai nœud kind, en lecture seule",
    ),
    code(
      "bash",
      'LAB_KIND_NODE=$(kubectl --context kind-k8s-ops-lab -n lab-cri get pod runtime-demo -o jsonpath=\'{.spec.nodeName}\')\nLAB_POD_UID=$(kubectl --context kind-k8s-ops-lab -n lab-cri get pod runtime-demo -o jsonpath=\'{.metadata.uid}\')\ntest -n "$LAB_KIND_NODE" && test -n "$LAB_POD_UID"\ndocker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock version\npython3 -m unittest discover -s lab/level-4/cri -p \'test_*.py\'\nLAB_SANDBOX_JSON=$(docker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock pods --namespace \'^lab-cri$\' --name \'^runtime-demo$\' -o json)\nif ! LAB_SANDBOX_ID=$(printf \'%s\' "$LAB_SANDBOX_JSON" | python3 lab/level-4/cri/select_sandbox.py "$LAB_POD_UID"); then\n  printf \'Stop: sandbox identity is missing or ambiguous; inspect before continuing.\\n\' >&2\nelse\n  docker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock ps -a --pod "$LAB_SANDBOX_ID"\nfi',
    ),
    p(
      "Python 3's standard-library selector reads crictl's items array and requires state SANDBOX_READY plus the exact current API Pod UID, namespace and name. Old attempts and NotReady sandboxes are excluded; zero or several matches are refused, and the guarded block does not call ps. Stop there on refusal. The anchored CLI name/namespace filters are regular expressions, not identity proof by themselves. Expected: ps -a includes the completed init alongside running containers. If a Pod is recreated during inspection, reread its UID/node and repeat selection. Do not replace this check with the first or newest arbitrary sandbox ID.",
      "Le sélecteur Python 3 standard lit items et exige état SANDBOX_READY avec UID API courant, namespace et nom exacts. Anciennes tentatives et sandboxes NotReady sont exclus ; zéro ou plusieurs résultats sont refusés sans appeler ps dans le bloc protégé. Arrêtez-vous alors. Les filtres CLI ancrés sont des expressions régulières, pas une preuve d’identité suffisante. Attendu : ps -a inclut l’init terminé avec les actifs. Si le Pod est recréé pendant l’inspection, relisez UID/nœud et recommencez. Ne remplacez pas ce contrôle par le premier ID ou simplement le plus récent.",
    ),
    code(
      "bash",
      'docker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock inspectp "$LAB_SANDBOX_ID"\nLAB_CONTAINER_ID=$(kubectl --context kind-k8s-ops-lab -n lab-cri get pod runtime-demo -o jsonpath=\'{.status.containerStatuses[?(@.name=="companion")].containerID}\')\nLAB_CONTAINER_ID=${LAB_CONTAINER_ID#containerd://}\ndocker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock logs "$LAB_CONTAINER_ID"',
    ),
    p(
      "Expected: sandbox metadata identifies lab-cri/runtime-demo and its network, while logs show Companion started. Inspect only this secret-free fixture; arbitrary runtime dumps can expose environment values, mount paths or credentials. Correlate IDs and timestamps before sharing diagnostics. A working container runtime does not prove that kubelet admission, CNI or CSI is healthy.",
      "Attendu : les métadonnées du sandbox identifient lab-cri/runtime-demo et son réseau ; les logs affichent Companion started. Examinez seulement ce fixture sans secret : des dumps arbitraires peuvent révéler environnement, montages ou identifiants. Corrélez IDs et dates avant partage. Un runtime fonctionnel ne prouve pas la santé de l’admission kubelet, de CNI ou CSI.",
    ),
    h("diagnosis", "Classify before touching the daemon", "Classer avant de toucher au daemon"),
    p(
      "FailedCreatePodSandBox points to sandbox/network preparation; ErrImagePull concerns image acquisition; CreateContainerConfigError may occur before container creation; a terminated process with an exit code is later. Read Pod Events and status first, then the corresponding runtime object if API evidence is insufficient. Resource limits use cgroups, but container OOM, process crash and node memory pressure have distinct evidence. Deleting a container directly bypasses declarative ownership and can erase the evidence kubelet is reconciling.",
      "FailedCreatePodSandBox concerne préparation sandbox/réseau ; ErrImagePull l’acquisition d’image ; CreateContainerConfigError peut précéder toute création ; un processus terminé avec code de sortie est une étape ultérieure. Lisez d’abord Events/statut, puis l’objet runtime si l’API ne suffit pas. Les limites utilisent cgroups, mais OOM conteneur, crash et pression mémoire du nœud ont des preuves différentes. Supprimer directement un conteneur contourne la gestion déclarative et peut effacer les preuves que kubelet réconcilie.",
    ),
    h("quiz", "Read identities correctly", "Lire correctement les identités"),
    quiz(
      question(
        l(
          "Is the Pod UID the runtime container ID?",
          "L’UID du Pod est-il l’ID du conteneur runtime ?",
        ),
        [
          l("Yes, always", "Oui, toujours"),
          l(
            "No; one Pod can have several container IDs and a sandbox",
            "Non ; un Pod peut avoir plusieurs IDs et un sandbox",
          ),
          l("Only for nginx", "Seulement pour nginx"),
        ],
        1,
        l(
          "These identities belong to different API/runtime objects and lifecycles.",
          "Ces identités appartiennent à des objets et cycles de vie différents.",
        ),
      ),
      question(
        l("Why use ps -a for the init container?", "Pourquoi ps -a pour l’init container ?"),
        [
          l("It needs public networking", "Il exige le réseau public"),
          l("It has no runtime object", "Il n’a aucun objet runtime"),
          l("It completed and is no longer running", "Il est terminé et ne tourne plus"),
        ],
        2,
        l(
          "The running-only listing omits stopped containers until garbage collection removes them entirely.",
          "La liste des actifs omet les conteneurs arrêtés avant leur suppression par garbage collection.",
        ),
      ),
      question(
        l(
          "Should crictl stop be a normal deployment rollback?",
          "crictl stop doit-il être un rollback normal ?",
        ),
        [
          l(
            "No; use the owning Kubernetes workload API",
            "Non ; utilisez l’API du workload propriétaire",
          ),
          l("Yes; it updates Deployment history", "Oui ; il actualise l’historique Deployment"),
          l("Only with two containers", "Seulement avec deux conteneurs"),
        ],
        0,
        l(
          "Direct runtime mutation does not change desired state and can conflict with kubelet reconciliation.",
          "La mutation runtime ne change pas l’état désiré et peut entrer en conflit avec kubelet.",
        ),
      ),
    ),
    h("challenge", "Correlate the other container", "Corréler l’autre conteneur"),
    challenge(
      l("Which ID owns nginx logs?", "Quel ID possède les logs nginx ?"),
      l(
        "Find web's runtime ID through the Pod API, remove only its containerd prefix, and read its logs through crictl. Explain why companion's ID cannot answer the same query.",
        "Trouvez l’ID runtime de web via l’API Pod, retirez seulement son préfixe containerd puis lisez ses logs avec crictl. Expliquez pourquoi l’ID companion ne répond pas à la même question.",
      ),
      [
        l(
          "Select containerStatuses by name, not assumed array position.",
          "Sélectionnez containerStatuses par nom, pas par position supposée.",
        ),
        l(
          "The sandbox groups containers but does not merge their logs.",
          "Le sandbox regroupe les conteneurs sans fusionner leurs logs.",
        ),
      ],
      [
        code(
          "bash",
          'LAB_WEB_ID=$(kubectl --context kind-k8s-ops-lab -n lab-cri get pod runtime-demo -o jsonpath=\'{.status.containerStatuses[?(@.name=="web")].containerID}\')\nLAB_WEB_ID=${LAB_WEB_ID#containerd://}\ndocker exec "$LAB_KIND_NODE" crictl --runtime-endpoint unix:///run/containerd/containerd.sock logs "$LAB_WEB_ID"',
        ),
        p(
          "Expected: nginx startup/access output, not Companion started. The selected container has its own output stream. Missing old logs after garbage collection do not prove the process never ran; use a configured durable logging backend for retention.",
          "Attendu : sortie de démarrage/accès nginx, pas Companion started. Le conteneur sélectionné a son propre flux. Des anciens logs absents après garbage collection ne prouvent pas que le processus n’a jamais tourné ; une conservation durable exige un backend configuré.",
        ),
      ],
    ),
    h("cleanup", "Use Kubernetes ownership for cleanup", "Nettoyer par la gestion Kubernetes"),
    code("bash", "k delete namespace lab-cri"),
    p(
      "The kubelet/runtime release the sandbox and containers; garbage collection may be asynchronous. No manual container deletion or image prune is necessary. Unset the local shell variables if desired; no runtime configuration was changed.",
      "Kubelet/runtime libèrent sandbox et conteneurs ; le garbage collection peut être asynchrone. Aucune suppression manuelle ou purge d’image n’est nécessaire. Les variables peuvent être retirées du shell ; aucune configuration runtime n’a changé.",
    ),
  ],
};
