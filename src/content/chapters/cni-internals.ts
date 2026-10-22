import type { Chapter } from "../types";
import {
  l,
  h,
  p,
  code,
  note,
  list,
  labContext,
  steps,
  quiz,
  question,
  challenge,
} from "../lesson-kit";
import network from "../../../lab/level-3/cni-internals/network.yaml?raw";

export const cniInternals: Chapter = {
  id: "cni-internals",
  level: 3,
  minutes: 55,
  title: l("Networking and CNI internals", "Réseau et internes CNI"),
  summary: l(
    "Follow cross-node Pod traffic, distinguish sandbox networking from Service forwarding, and localize a network failure with evidence.",
    "Suivre le trafic Pod entre nœuds, distinguer réseau du sandbox et transmission des Services, localiser une panne avec des preuves.",
  ),
  prerequisites: ["dns", "network-policies", "scheduling"],
  related: ["cni-advanced", "cri", "incidents"],
  blocks: [
    h(
      "objectives",
      "Map the packet before changing the network",
      "Cartographier le paquet avant de modifier le réseau",
    ),
    list(
      l(
        "Separate IP allocation, network attachment, cross-node transport and Service lookup.",
        "Séparer allocation IP, attachement réseau, transport entre nœuds et sélection par Service.",
      ),
      l(
        "Compare direct Pod IP, Service IP and DNS requests from the same client.",
        "Comparer depuis le même client les requêtes vers IP de Pod, IP de Service et nom DNS.",
      ),
    ),
    p(
      "A container runtime creates a Pod sandbox and asks networking plugins to configure its network namespace. CNI defines a plugin interface and result format; it does not mandate one overlay, routing protocol or security policy engine. ADD attaches networking, DEL removes it, and CHECK can verify state according to the supported specification. IPAM allocates addresses; the main plugin establishes interfaces and routes. Multiple containers in a Pod normally share this network namespace, address and loopback interface.",
      "Le runtime crée le sandbox d’un Pod et demande aux plugins de configurer son namespace réseau. CNI définit une interface et un format de résultat, sans imposer overlay, protocole de routage ou moteur de sécurité. ADD attache le réseau, DEL le retire et CHECK peut vérifier l’état selon la spécification supportée. IPAM alloue les adresses ; le plugin principal établit interfaces et routes. Les conteneurs d’un Pod partagent normalement ce namespace réseau, son adresse et loopback.",
    ),
    p(
      "A common Linux implementation pairs a Pod interface with a host-side veth. Traffic then follows node routes, an overlay tunnel or another implementation-specific path to the remote node. Encapsulation consumes MTU and can cause large-packet failures even when short requests work. The default Kubernetes model allows Pod-to-Pod addressing without requiring application-visible NAT. Outbound traffic leaving the cluster may still be masqueraded. Do not infer a specific VXLAN or BGP design merely from the word CNI.",
      "Une implémentation Linux courante relie l’interface du Pod à un veth côté hôte. Le trafic suit ensuite routes du nœud, tunnel overlay ou autre chemin propre à l’implémentation jusqu’au nœud distant. L’encapsulation consomme du MTU et peut casser les gros paquets alors que les petites requêtes passent. Le modèle Kubernetes permet l’adressage entre Pods sans NAT imposé visible par l’application. Le trafic sortant peut toutefois être masqué. Ne déduisez pas VXLAN ou BGP du seul mot CNI.",
    ),
    p(
      "A ClusterIP is a virtual Service destination, not usually an address assigned to a physical interface. kube-proxy or an alternative dataplane watches Services and EndpointSlices and programs forwarding. DNS only supplies the destination address. Some CNI products replace kube-proxy with eBPF service handling, but network attachment, Service forwarding and NetworkPolicy remain distinct responsibilities. kindnet supplies basic Pod networking; it does not enforce NetworkPolicies. The NetworkPolicy lesson's deny checks remain necessary on another CNI.",
      "Une ClusterIP est une destination virtuelle de Service, généralement sans adresse assignée à une interface physique. kube-proxy ou un autre plan de données observe Services et EndpointSlices pour programmer la transmission. DNS fournit seulement l’adresse. Certains CNI remplacent kube-proxy par un traitement eBPF des Services ; attachement réseau, transmission et NetworkPolicy restent des responsabilités distinctes. kindnet fournit le réseau de base, sans appliquer NetworkPolicy. Les tests deny du chapitre correspondant restent nécessaires avec un autre CNI.",
    ),
    ...labContext("lab-cni"),
    note(
      "info",
      l("Two workers, no network reinstallation", "Deux workers, aucune réinstallation réseau"),
      l(
        "Use the baseline's two healthy workers. The manifests require source and destination on distinct hostnames. All observations are inside a disposable lab; do not edit node routes, iptables, CNI files or host kernel settings. These commands need no privileged debug container.",
        "Utilisez les deux workers sains de la base. Les manifests imposent des hostnames distincts pour source et destination. Les observations restent dans le lab jetable : ne modifiez ni routes, iptables, fichiers CNI ou paramètres noyau. Aucun conteneur de debug privilégié n’est nécessaire.",
      ),
    ),
    h("fixture", "Require an actual cross-node path", "Exiger un vrai chemin entre nœuds"),
    code("yaml", network, "lab/level-3/cni-internals/network.yaml"),
    steps({
      title: l(
        "Inspect the network namespaces' visible state",
        "Examiner l’état réseau visible des Pods",
      ),
      code: {
        lang: "bash",
        code: "k -n lab-cni apply -f lab/level-3/cni-internals/network.yaml\nk -n lab-cni wait --for=condition=Ready pod/source pod/destination --timeout=120s\nk -n lab-cni get pods -o wide\nk -n lab-cni exec source -- ip address\nk -n lab-cni exec source -- ip route\nk -n lab-cni exec source -- cat /etc/resolv.conf\nk -n kube-system get daemonsets\nk -n kube-system get configmap kube-proxy -o yaml",
      },
      explain: l(
        "Verify distinct node names before calling this a cross-node test. The source's interface, default route and resolver describe the Pod view, not the full host path. kube-proxy's config may show an empty mode meaning implementation defaults; do not treat the absence of an explicit value as proof no proxy runs.",
        "Vérifiez des noms de nœuds distincts avant de parler de test entre nœuds. Interface, route par défaut et résolveur décrivent la vue du Pod, pas tout le chemin hôte. La configuration kube-proxy peut laisser mode vide pour les valeurs par défaut : ce n’est pas une preuve d’absence de proxy.",
      ),
      expected: {
        text: l(
          "Expected: one Pod IP per workload and distinct workers. Actual IP ranges and interface names must be observed, not copied from an example.",
          "Attendu : une IP par workload et des workers distincts. Les plages IP et noms d’interfaces doivent être observés, pas recopiés d’un exemple.",
        ),
      },
    }),
    h(
      "paths",
      "Compare three layers with the same client",
      "Comparer trois couches depuis le même client",
    ),
    code(
      "bash",
      "LAB_DESTINATION_IP=$(kubectl --context kind-k8s-ops-lab -n lab-cni get pod destination -o jsonpath='{.status.podIP}')\nLAB_SERVICE_IP=$(kubectl --context kind-k8s-ops-lab -n lab-cni get service destination -o jsonpath='{.spec.clusterIP}')\nk -n lab-cni exec source -- wget -T 3 -qO- \"http://$LAB_DESTINATION_IP/\"\nk -n lab-cni exec source -- wget -T 3 -qO- \"http://$LAB_SERVICE_IP/\"\nk -n lab-cni exec source -- nslookup destination\nk -n lab-cni exec source -- wget -T 3 -qO- http://destination/\nk -n lab-cni get endpointslices -l kubernetes.io/service-name=destination -o yaml",
    ),
    p(
      "Expected: all HTTP paths return nginx HTML. Direct Pod IP tests application listening plus Pod routing; Service IP adds virtual-IP translation; the name adds resolver behavior. Port-forward would bypass much of this path and cannot substitute for these checks. Success to one endpoint does not prove every node pair or all protocols work. Avoid publishing ephemeral Pod IPs as durable service configuration.",
      "Attendu : les trois chemins HTTP retournent le HTML nginx. L’IP du Pod teste écoute applicative et routage ; l’IP de Service ajoute la traduction virtuelle ; le nom ajoute la résolution. Le port-forward contournerait une partie du chemin et ne remplace pas ces tests. Un endpoint réussi ne prouve ni tous les couples de nœuds ni tous les protocoles. N’utilisez pas ces IP éphémères comme configuration durable.",
    ),
    h(
      "diagnosis",
      "Use a failing layer to narrow the search",
      "Utiliser la couche en échec pour cibler la recherche",
    ),
    p(
      "FailedCreatePodSandBox with a plugin error occurs before the container starts: inspect the Pod Events, runtime/CNI health and node address allocation, not application logs. Running Pods that cannot reach a remote Pod IP suggest routing, policy or MTU after confirming the destination listens. Pod IP working while Service IP fails suggests selectors/endpoints or Service forwarding. Service IP working while a name fails points toward DNS. These are testable branches, not exclusive causes; preserve the error and timestamp before changing anything.",
      "FailedCreatePodSandBox avec erreur plugin survient avant le démarrage du conteneur : examinez Events, santé runtime/CNI et allocation d’adresses, pas les logs applicatifs. Des Pods Running sans accès à une IP distante suggèrent routage, politique ou MTU après vérification de l’écoute. IP du Pod fonctionnelle mais Service en échec : sélecteurs/endpoints ou transmission Service. IP de Service fonctionnelle mais nom en échec : DNS. Ces branches sont testables, sans être exclusives ; conservez erreur et date avant toute modification.",
    ),
    code(
      "bash",
      "k -n lab-cni describe pod source\nk -n lab-cni describe pod destination\nk -n lab-cni get events --sort-by=.metadata.creationTimestamp\nk -n kube-system logs daemonset/kindnet --tail=50\nk -n kube-system logs daemonset/kube-proxy --tail=50",
    ),
    h("quiz", "Assign the responsibility", "Attribuer la responsabilité"),
    quiz(
      question(
        l(
          "Does implementing CNI imply NetworkPolicy enforcement?",
          "Implémenter CNI implique-t-il d’appliquer NetworkPolicy ?",
        ),
        [
          l("Yes, all plugins implement it", "Oui, tous les plugins l’appliquent"),
          l(
            "No, enforcement is an additional capability",
            "Non, le filtrage est une capacité supplémentaire",
          ),
          l("Only with three nodes", "Seulement avec trois nœuds"),
        ],
        1,
        l(
          "CNI defines attachment behavior; a plugin's policy capabilities must be verified separately.",
          "CNI définit l’attachement ; les capacités de politique du plugin se vérifient séparément.",
        ),
      ),
      question(
        l(
          "Pod IP works and ClusterIP fails. What extra layer is involved?",
          "L’IP du Pod fonctionne mais ClusterIP échoue. Quelle couche supplémentaire intervient ?",
        ),
        [
          l(
            "Service endpoint selection and forwarding",
            "Sélection et transmission des endpoints du Service",
          ),
          l("Public DNS delegation", "Délégation DNS publique"),
          l("Container image building", "Construction d’image"),
        ],
        0,
        l(
          "The Service path adds endpoint mapping and virtual-IP handling to the working Pod path.",
          "Le chemin Service ajoute la correspondance des endpoints et le traitement de l’IP virtuelle au chemin Pod fonctionnel.",
        ),
      ),
      question(
        l(
          "Why is a successful port-forward insufficient to prove cross-node routing?",
          "Pourquoi un port-forward réussi ne prouve-t-il pas le routage entre nœuds ?",
        ),
        [
          l("It never reaches a container", "Il n’atteint jamais un conteneur"),
          l("It always requires a public IP", "Il exige toujours une IP publique"),
          l(
            "It uses a different control-plane tunnel path",
            "Il utilise un autre chemin via le tunnel du control plane",
          ),
        ],
        2,
        l(
          "A tunnel can reach the process while the normal client-to-Service dataplane is broken.",
          "Le tunnel peut atteindre le processus alors que le chemin normal client-Service est cassé.",
        ),
      ),
    ),
    h("challenge", "Disprove a CNI outage hypothesis", "Réfuter une hypothèse de panne CNI"),
    challenge(
      l("Wrong Service port, healthy Pod route", "Mauvais port Service, routage Pod sain"),
      l(
        "Change destination's Service targetPort to 8080. Use the three-layer method to identify the failure without restarting CNI. Restore the manifest and verify all paths.",
        "Changez targetPort du Service destination pour 8080. Identifiez l’échec avec les trois couches sans redémarrer le CNI. Restaurez le manifest et vérifiez les chemins.",
      ),
      [
        l(
          "A successful DNS record is not evidence that its port works.",
          "Une réponse DNS ne prouve pas que le port fonctionne.",
        ),
        l(
          "Compare direct Pod :80 against Service :80 and inspect EndpointSlice ports.",
          "Comparez Pod :80 directement et Service :80, puis examinez les ports des EndpointSlices.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-cni patch service destination --type=merge -p \'{"spec":{"ports":[{"name":"http","port":80,"targetPort":8080}]}}\'\nk -n lab-cni get endpointslices -l kubernetes.io/service-name=destination -o yaml --watch',
        ),
        p(
          "Stop the watch with Ctrl+C when the EndpointSlice advertises port 8080, then compare the next two requests. Direct port 80 should succeed while Service traffic is sent to unopened port 8080. A brief old-path success can occur while forwarding converges; retry after observing the changed endpoint instead of claiming that targetPort has no effect. The successful cross-node Pod request contradicts a blanket CNI outage claim.",
          "Arrêtez le watch avec Ctrl+C quand l’EndpointSlice annonce le port 8080, puis comparez les deux requêtes suivantes. Le port 80 direct doit fonctionner tandis que le Service transmet au port 8080 non écouté. Un bref succès sur l’ancien chemin reste possible pendant la convergence : réessayez après observation du port changé avant d’affirmer que targetPort n’a aucun effet. La requête entre Pods sur deux nœuds contredit une panne CNI générale.",
        ),
        code(
          "bash",
          'k -n lab-cni exec source -- wget -T 3 -qO- "http://$LAB_DESTINATION_IP/"\nk -n lab-cni exec source -- wget -T 3 -qO- http://destination/\nk -n lab-cni apply -f lab/level-3/cni-internals/network.yaml\nk -n lab-cni get endpointslices -l kubernetes.io/service-name=destination -o yaml --watch',
        ),
        p(
          "Restoring the manifest reinstates targetPort: http. Stop this watch only once the ready endpoint advertises port 80 again; run the final request in the shell after Ctrl+C.",
          "Rétablir le manifest remet targetPort: http. Arrêtez ce watch seulement quand l’endpoint prêt annonce de nouveau le port 80 ; lancez la dernière requête dans le shell après Ctrl+C.",
        ),
        code("bash", "k -n lab-cni exec source -- wget -T 3 -qO- http://destination/"),
      ],
    ),
    h("limits", "What this does not prove", "Ce que cela ne prouve pas"),
    p(
      "No packet capture, overlay reconfiguration or MTU modification is performed. Production routing, encryption, policy enforcement, multi-network attachments and eBPF maps need implementation-specific tooling and authorization. Advanced CNI architecture returns to these boundaries in level 4.",
      "Aucune capture de paquet, reconfiguration d’overlay ou modification MTU n’est effectuée. Routage de production, chiffrement, filtrage, attachements multiples et maps eBPF exigent outils et autorisations spécifiques. Le niveau 4 approfondit ces limites d’architecture CNI.",
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-cni"),
  ],
};
