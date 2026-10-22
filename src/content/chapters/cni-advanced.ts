import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import locality from "../../../lab/level-4/cni-advanced/locality.yaml?raw";

export const cniAdvanced: Chapter = {
  id: "cni-advanced",
  level: 4,
  minutes: 60,
  title: l("CNI architecture and advanced networking", "Architecture CNI et réseau avancé"),
  summary: l(
    "Separate attachment, transport and endpoint locality, then demonstrate why a reachable remote Pod can remain unavailable through a local-only Service.",
    "Séparer attachement, transport et localité des endpoints, puis démontrer pourquoi un Pod distant accessible peut être indisponible via un Service local-only.",
  ),
  prerequisites: ["cni-internals", "network-policies", "advanced-scheduling"],
  related: ["cri", "ha", "incidents"],
  blocks: [
    h("objectives", "Explain the whole path and its return", "Expliquer le chemin et son retour"),
    list(
      l(
        "Compare native routing, overlays and Service dataplanes without assuming one implementation.",
        "Comparer routage natif, overlays et plans de données Service sans présumer une implémentation.",
      ),
      l(
        "Diagnose locality filtering separately from transport and policy failure.",
        "Diagnostiquer le filtrage par localité séparément des pannes de transport ou politique.",
      ),
    ),
    p(
      "CNI is the attachment contract, not a fixed network architecture. A typical packet crosses a Pod network namespace, host link and node dataplane before reaching another node and Pod. Native routing advertises/reaches Pod prefixes directly; an overlay encapsulates them across an underlay; eBPF can implement forwarding and policy at several hooks. Some products also replace Service proxying. Compare requirements such as routability, operational visibility, encryption, MTU and compatibility before choosing a product; a faster mechanism does not by itself yield correct policy or topology.",
      "CNI est le contrat d’attachement, pas une architecture figée. Un paquet traverse typiquement namespace réseau du Pod, lien hôte et plan de données avant le nœud distant et son Pod. Le routage natif atteint directement les préfixes ; un overlay les encapsule dans un underlay ; eBPF peut transmettre et filtrer à différents hooks. Certains produits remplacent aussi le proxy des Services. Comparez routabilité, visibilité, chiffrement, MTU et compatibilité avant le choix ; un mécanisme plus rapide ne garantit ni politique ni topologie correctes.",
    ),
    p(
      "Service translation chooses eligible endpoints before transport carries the packet. Connection tracking or an equivalent implementation must make reply traffic correspond to the original connection; source/destination rewrites and routing affect that return path. Do not confuse externalTrafficPolicy, which concerns externally arriving traffic, with internalTrafficPolicy for cluster-originated traffic. Local internal policy restricts backends to the client's node, even when remote endpoints are perfectly healthy and reachable directly. It trades cross-node traffic for potentially missing local capacity.",
      "La traduction Service choisit les endpoints admissibles avant que le transport porte le paquet. Conntrack ou un équivalent doit relier le retour à la connexion d’origine ; réécriture d’adresses et routage influencent ce retour. Ne confondez pas externalTrafficPolicy pour le trafic externe et internalTrafficPolicy pour le trafic originaire du cluster. La politique interne Local limite les backends au nœud client, même si des endpoints distants sont sains et directement accessibles. Elle réduit le trafic entre nœuds au prix d’une éventuelle absence de capacité locale.",
    ),
    p(
      "Overlay headers reduce the payload fitting in the underlay MTU. TCP segmentation, path MTU discovery, blocked ICMP and offloads complicate diagnosis: a successful large HTTP download is not proof that equally large IP packets crossed without fragmentation. Multiple CNI attachments likewise require explicit interface routing and policy support; the default Pod network does not automatically govern every extra interface. Verify capabilities on the actual implementation rather than inferring them from CNI compliance.",
      "Les en-têtes overlay réduisent la charge utile disponible dans le MTU de l’underlay. Segmentation TCP, découverte de MTU, ICMP bloqué et offloads compliquent le diagnostic : un gros téléchargement HTTP réussi ne prouve pas le passage d’aussi gros paquets IP sans fragmentation. Plusieurs attachements CNI exigent également routage et politique explicites ; le réseau par défaut ne gouverne pas automatiquement chaque interface supplémentaire. Vérifiez les capacités réelles plutôt que de les déduire de la conformité CNI.",
    ),
    ...labContext("lab-locality"),
    note(
      "warn",
      l("No dataplane replacement", "Aucun remplacement du plan de données"),
      l(
        "This two-worker experiment uses the existing kindnet and Service proxy. It neither installs eBPF agents nor modifies host routes, MTU, iptables or CNI files. kindnet does not enforce NetworkPolicy. Kind node containers share a Linux host/VM kernel; this is not independent network hardware or a physical-zone benchmark.",
        "Cette expérience à deux workers utilise kindnet et le proxy existants. Elle n’installe aucun agent eBPF et ne modifie routes hôte, MTU, iptables ou fichiers CNI. kindnet n’applique pas NetworkPolicy. Les nœuds kind partagent un noyau Linux hôte/VM : aucun matériel indépendant ni benchmark de zones physiques.",
      ),
    ),
    h("fixture", "Force a remote endpoint", "Imposer un endpoint distant"),
    code("yaml", locality, "lab/level-4/cni-advanced/locality.yaml"),
    p(
      "Required anti-affinity separates source and destination by hostname; node affinity excludes the control plane. The destination's init container prepares a 128 KiB file in emptyDir, then an HTTP server exposes port 8080. The Service maps its port 80 to that named target. internalTrafficPolicy starts at Cluster to establish a working path. Stop if the two workloads do not reach Ready on distinct workers.",
      "L’anti-affinité stricte sépare source et destination par hostname ; l’affinité exclut le control plane. L’init prépare un fichier de 128 Kio dans emptyDir puis le serveur HTTP l’expose en 8080. Le Service relie son port 80 à cette cible nommée. internalTrafficPolicy commence à Cluster pour vérifier une base fonctionnelle. Arrêtez-vous si les workloads ne sont pas Ready sur des workers distincts.",
    ),
    code(
      "bash",
      "k -n lab-locality apply -f lab/level-4/cni-advanced/locality.yaml\nk -n lab-locality wait --for=condition=Ready pod/source pod/destination --timeout=120s\nk -n lab-locality get pods -o wide\nLAB_REMOTE_IP=$(kubectl --context kind-k8s-ops-lab -n lab-locality get pod destination -o jsonpath='{.status.podIP}')\nk -n lab-locality exec source -- wget -T 5 -O /tmp/direct.bin \"http://$LAB_REMOTE_IP:8080/payload.bin\"\nk -n lab-locality exec source -- wc -c /tmp/direct.bin\nk -n lab-locality exec source -- wget -T 5 -O /tmp/service.bin http://destination/payload.bin\nk -n lab-locality exec source -- wc -c /tmp/service.bin\nk -n lab-locality exec source -- ip link",
    ),
    p(
      "Expected: both downloads contain 131072 bytes. This establishes working cross-node application transport and Service forwarding. The observed interface MTU is a local property; it does not measure the entire path. BusyBox tools provide a bounded check without a privileged packet capture or host access. A failed download should be diagnosed before changing locality, otherwise the next failure has no clean baseline.",
      "Attendu : chaque téléchargement contient 131072 octets. Cela établit transport applicatif entre nœuds et transmission Service fonctionnels. Le MTU observé est une propriété locale, pas une mesure de tout le chemin. BusyBox donne un contrôle borné sans capture privilégiée ni accès hôte. Diagnostiquez tout échec avant le changement de localité pour garder une référence propre.",
    ),
    h(
      "local",
      "Remove only remote Service eligibility",
      "Retirer seulement l’admissibilité Service distante",
    ),
    code(
      "bash",
      'k -n lab-locality patch service destination --type=merge -p \'{"spec":{"internalTrafficPolicy":"Local"}}\'\nk -n lab-locality get service destination -o yaml\nk -n lab-locality get endpointslices -l kubernetes.io/service-name=destination -o yaml\nk -n lab-locality exec source -- nslookup destination\nk -n lab-locality exec source -- wget -T 3 -O /tmp/local.bin http://destination/payload.bin\nk -n lab-locality exec source -- wget -T 3 -O /tmp/direct-again.bin "http://$LAB_REMOTE_IP:8080/payload.bin"',
    ),
    p(
      "Expected after proxy convergence: DNS still resolves, the ready remote address remains in EndpointSlices, direct Pod HTTP succeeds, but the Service request fails because the source's node has no local backend. Read the endpoint's nodeName and the source's spec.nodeName to prove the mismatch. This is a deliberate selection policy, not a vanished endpoint or broken CNI route. The exact timeout/refusal behavior depends on the Service implementation.",
      "Attendu après convergence : DNS répond, l’adresse distante prête reste dans les EndpointSlices, HTTP direct fonctionne mais le Service échoue car le nœud source n’a aucun backend local. Comparez nodeName de l’endpoint et spec.nodeName de source pour prouver le décalage. Il s’agit d’une sélection volontaire, pas d’un endpoint disparu ou d’une route CNI cassée. Timeout ou refus exact dépend de l’implémentation Service.",
    ),
    h(
      "diagnosis",
      "Identify which architecture contract failed",
      "Identifier le contrat d’architecture en défaut",
    ),
    p(
      "No endpoint addresses suggests selection/readiness; remote endpoints with Local and no local endpoint suggests locality; direct remote IP failure with healthy destination requires transport/policy investigation. Small requests working while larger transfers fail adds MTU or application buffering hypotheses, without proving either. For host packet tracing, require implementation-specific tooling, a scoped capture plan and privacy review of real payloads. This lab intentionally stops before privileged capture or dataplane manipulation.",
      "Aucune adresse suggère sélection/readiness ; endpoints distants avec Local sans endpoint local suggère localité ; échec de l’IP distante avec destination saine exige enquête transport/politique. Petites requêtes réussies mais transferts larges cassés ajoutent hypothèses MTU ou buffering, sans les prouver. Une capture hôte exige outils spécifiques, plan borné et examen de confidentialité des vrais paquets. Le lab s’arrête volontairement avant capture privilégiée ou manipulation du plan de données.",
    ),
    h(
      "quiz",
      "Distinguish reachability and eligibility",
      "Distinguer accessibilité et admissibilité",
    ),
    quiz(
      question(
        l(
          "A ready remote Pod works directly but not through internalTrafficPolicy Local. Why?",
          "Un Pod distant prêt fonctionne directement mais pas via internalTrafficPolicy Local. Pourquoi ?",
        ),
        [
          l("The DNS domain is public", "Le domaine DNS est public"),
          l(
            "The client node has no eligible local endpoint",
            "Le nœud client n’a aucun endpoint local admissible",
          ),
          l("CNI always blocks remote TCP", "CNI bloque toujours TCP distant"),
        ],
        1,
        l(
          "Service locality can exclude a reachable endpoint without changing the underlying route.",
          "La localité Service exclut un endpoint accessible sans modifier sa route.",
        ),
      ),
      question(
        l(
          "Does downloading 128 KiB prove 128 KiB IP packets crossed the network?",
          "Télécharger 128 Kio prouve-t-il le passage de paquets IP de 128 Kio ?",
        ),
        [
          l("No, TCP segments the byte stream", "Non, TCP segmente le flux d’octets"),
          l("Yes, HTTP uses one packet", "Oui, HTTP utilise un seul paquet"),
          l("Only with nginx", "Seulement avec nginx"),
        ],
        0,
        l(
          "Application payload size and packet/MTU size are different measurements.",
          "Taille applicative et taille paquet/MTU sont des mesures distinctes.",
        ),
      ),
      question(
        l(
          "Does choosing an eBPF CNI prove encryption and policy enforcement?",
          "Choisir un CNI eBPF prouve-t-il chiffrement et filtrage ?",
        ),
        [
          l("Always", "Toujours"),
          l("Only on kind", "Seulement sur kind"),
          l(
            "No; enabled features and actual behavior need verification",
            "Non ; fonctions activées et comportement réel se vérifient",
          ),
        ],
        2,
        l(
          "An implementation technique does not establish the configured security contract.",
          "Une technique d’implémentation n’établit pas le contrat de sécurité configuré.",
        ),
      ),
    ),
    h(
      "challenge",
      "Restore reachability by changing the right contract",
      "Rétablir l’accès en changeant le bon contrat",
    ),
    challenge(
      l("Remote capacity is acceptable", "La capacité distante est acceptable"),
      l(
        "Restore the Service for the source without moving Pods or modifying any node. Explain the cost and verify the entire file, then state what an architecture retaining Local would need.",
        "Rétablissez le Service sans déplacer de Pod ni modifier de nœud. Expliquez le coût, vérifiez le fichier entier puis précisez ce qu’exigerait une architecture gardant Local.",
      ),
      [
        l(
          "Locality is selected by a Service field, not a DNS setting.",
          "La localité est un champ Service, pas un réglage DNS.",
        ),
        l(
          "Cluster allows ready remote endpoints; Local requires per-client-node capacity.",
          "Cluster permet les endpoints distants prêts ; Local exige une capacité sur chaque nœud client.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-locality patch service destination --type=merge -p \'{"spec":{"internalTrafficPolicy":"Cluster"}}\'\nk -n lab-locality exec source -- wget -T 5 -O /tmp/recovered.bin http://destination/payload.bin\nk -n lab-locality exec source -- wc -c /tmp/recovered.bin',
        ),
        p(
          "Expected after convergence: 131072 bytes through the Service. Cluster trades cross-node traffic for access to remote capacity. Retaining Local requires an available endpoint on every relevant client node or explicit client placement; a DaemonSet can supply node-local replicas for suitable stateless services, but readiness and resource capacity still matter.",
          "Attendu après convergence : 131072 octets via le Service. Cluster échange du trafic entre nœuds contre l’accès à la capacité distante. Garder Local exige un endpoint disponible par nœud client concerné ou un placement explicite des clients ; un DaemonSet peut fournir des réplicas locaux pour certains services stateless, avec readiness et capacité à vérifier.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-locality"),
  ],
};
