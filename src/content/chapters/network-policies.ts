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
import workloads from "../../../lab/level-2/network-policies/workloads.yaml?raw";
import denyWeb from "../../../lab/level-2/network-policies/deny-web.yaml?raw";
import allowTrusted from "../../../lab/level-2/network-policies/allow-trusted.yaml?raw";
import denyEgress from "../../../lab/level-2/network-policies/deny-client-egress.yaml?raw";
import allowEgress from "../../../lab/level-2/network-policies/allow-client-egress.yaml?raw";

export const networkPolicies: Chapter = {
  id: "network-policies",
  level: 2,
  minutes: 55,
  title: l("NetworkPolicies", "NetworkPolicies"),
  summary: l(
    "Build an allow-list with ingress and egress rules, prove enforcement and distinguish DNS failure from a blocked application port.",
    "Construire une liste d’autorisations ingress/egress, prouver son application et distinguer DNS bloqué et port applicatif filtré.",
  ),
  prerequisites: ["services", "labels-selectors", "dns"],
  related: ["cni-internals", "security-hardening", "troubleshooting-2"],
  heavy: l(
    "Enforcement exercise requires an already configured NetworkPolicy-capable CNI. Default kindnet does not enforce these objects.",
    "L’exercice de filtrage exige un CNI déjà configuré qui applique NetworkPolicy. Le kindnet par défaut n’applique pas ces objets.",
  ),
  blocks: [
    h(
      "objectives",
      "Prove the allowed flow and the blocked flow",
      "Prouver le flux permis et le flux bloqué",
    ),
    list(
      l(
        "Predict additive policy selection and distinguish ingress from egress isolation.",
        "Prévoir la sélection additive des politiques et distinguer isolation ingress et egress.",
      ),
      l(
        "Verify enforcement with positive and negative HTTP tests instead of trusting an accepted YAML file.",
        "Vérifier l’application avec des tests HTTP positifs et négatifs au lieu de faire confiance au YAML accepté.",
      ),
    ),
    p(
      "A NetworkPolicy describes allowed connections at IP/port level for selected Pods. Kubernetes stores the object; a capable network implementation enforces it. A Pod is initially non-isolated in each direction. A policy selecting it for Ingress or Egress isolates that direction, then the union of all applicable allow rules permits traffic. There is no ordered deny rule to override a broad allow. For a connection between two isolated Pods, the source's egress and destination's ingress must both allow it; reply traffic is implicitly permitted.",
      "Une NetworkPolicy décrit les connexions autorisées au niveau IP/port pour des Pods sélectionnés. Kubernetes stocke l’objet ; une implémentation réseau compatible l’applique. Un Pod est initialement non isolé dans chaque direction. Une politique qui le sélectionne pour Ingress ou Egress isole cette direction, puis l’union des règles applicables autorise le trafic. Aucune règle deny ordonnée n’annule un allow trop large. Entre deux Pods isolés, egress source et ingress destination doivent tous deux autoriser la connexion ; le trafic de réponse est implicitement permis.",
    ),
    note(
      "warn",
      l("Mandatory environment gate", "Condition d’environnement obligatoire"),
      l(
        "The default lab/kind.yaml uses kindnet, which does not enforce NetworkPolicy. On that baseline, study the manifests and optionally observe the failed enforcement check, but do not claim isolation or continue to a security conclusion. The full exercise is conditional on a disposable cluster already configured with a supported enforcing CNI such as Cilium or Calico. Installing or replacing a CNI is a separate cluster setup, never a live swap performed by these commands.",
        "Le lab/kind.yaml par défaut utilise kindnet, qui n’applique pas NetworkPolicy. Sur cette base, étudiez les manifests et observez éventuellement l’échec du test de filtrage, sans conclure à une isolation. L’exercice complet exige un cluster jetable déjà configuré avec un CNI compatible tel que Cilium ou Calico. Installer ou remplacer le CNI est une préparation distincte du cluster, jamais un remplacement à chaud par ces commandes.",
      ),
    ),
    p(
      "Before continuing, inspect kube-system DaemonSets, the actual CNI's supported Kubernetes versions, policy mode and health. A DaemonSet name alone is not evidence of enforcement. For a new dedicated setup, use the official CNI kind installation guide linked in the source register, disable kind's default CNI before creation, and verify its connectivity checks. This chapter deliberately does not provision that alternative environment. If you choose a different cluster name, replace every explicit context consistently.",
      "Avant de poursuivre, examinez les DaemonSets kube-system, les versions Kubernetes supportées du CNI réel, son mode de politique et sa santé. Un nom de DaemonSet ne prouve pas le filtrage. Pour une nouvelle installation dédiée, suivez le guide kind officiel du CNI référencé dans les sources, désactivez le CNI kind avant création et vérifiez les tests de connectivité du fournisseur. Ce chapitre ne provisionne volontairement pas cet environnement alternatif. Si le nom du cluster change, adaptez tous les contextes explicites de façon cohérente.",
    ),
    ...labContext("lab-netpol"),
    code("bash", "k -n kube-system get daemonsets\nk -n kube-system get pods -o wide"),
    h("workloads", "Establish a working baseline first", "Établir d’abord une base fonctionnelle"),
    code("yaml", workloads, "lab/level-2/network-policies/workloads.yaml"),
    code(
      "bash",
      "k -n lab-netpol apply -f lab/level-2/network-policies/workloads.yaml\nk -n lab-netpol rollout status deployment/web --timeout=120s\nk -n lab-netpol wait --for=condition=Ready pod/trusted pod/untrusted --timeout=120s\nk -n lab-netpol exec trusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/",
    ),
    p(
      "Expected before policies: both clients receive nginx HTML. If either fails, fix readiness, Service selection or DNS first; an already broken baseline cannot prove a policy blocks anything. These clients use separate Pod labels, not authenticated identities. Anyone authorized to change those labels may acquire their network privileges, so pair policies with RBAC and admission controls.",
      "Attendu avant les politiques : les deux clients reçoivent le HTML nginx. Si l’un échoue, corrigez readiness, sélection du Service ou DNS ; une base déjà cassée ne prouve aucun filtrage. Les clients portent des labels distincts, pas des identités authentifiées. Une personne autorisée à changer ces labels peut acquérir leurs privilèges réseau : associez politiques, RBAC et admission.",
    ),
    h("deny", "Isolate only the backend ingress", "Isoler seulement l’ingress du backend"),
    code("yaml", denyWeb, "lab/level-2/network-policies/deny-web.yaml"),
    steps({
      title: l("Make the enforcement check decisive", "Rendre le test d’application décisif"),
      code: {
        lang: "bash",
        code: "k -n lab-netpol apply -f lab/level-2/network-policies/deny-web.yaml\nk -n lab-netpol get networkpolicy isolate-web -o yaml\nk -n lab-netpol exec trusted -- nslookup web\nk -n lab-netpol exec trusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/",
      },
      explain: l(
        "After CNI convergence, retry new HTTP connections. DNS is unaffected because only web ingress is isolated. The empty ingress list grants no connection to web; it does not isolate unrelated Pods. Existing connections may behave differently by implementation, so use new wget processes.",
        "Après convergence du CNI, recommencez de nouvelles connexions HTTP. DNS reste inchangé car seul l’ingress de web est isolé. La liste ingress vide n’accorde aucune connexion à web ; elle n’isole pas les autres Pods. Les connexions existantes peuvent dépendre de l’implémentation : utilisez de nouveaux processus wget.",
      ),
      expected: {
        text: l(
          "Expected with enforcement: DNS succeeds and both HTTP commands fail, often with a timeout. If either still receives HTML after convergence, STOP: enforcement or selection is unproven. On default kindnet this failure to block is expected.",
          "Attendu avec filtrage : DNS réussit et les deux commandes HTTP échouent, souvent par timeout. Si l’une reçoit toujours du HTML après convergence, ARRÊTEZ : application ou sélection non démontrée. Sur kindnet par défaut, cette absence de blocage est attendue.",
        ),
      },
    }),
    h("allow", "Add the smallest working permission", "Ajouter la permission minimale utile"),
    code("yaml", allowTrusted, "lab/level-2/network-policies/allow-trusted.yaml"),
    code(
      "bash",
      "k -n lab-netpol apply -f lab/level-2/network-policies/allow-trusted.yaml\nk -n lab-netpol exec trusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol get pods --show-labels\nk -n lab-netpol describe networkpolicy",
    ),
    p(
      "Expected: trusted succeeds while untrusted remains blocked. The peer podSelector without a namespaceSelector selects only Pods in the policy's namespace. A namespaceSelector and podSelector in the same peer item are ANDed; two list items are alternatives, ORed. A port list further restricts the peer match to TCP 80. Inspect YAML indentation carefully: a misplaced dash can allow all Pods in a namespace instead of one selected group.",
      "Attendu : trusted réussit et untrusted reste bloqué. Un podSelector de pair sans namespaceSelector sélectionne seulement les Pods du namespace de la politique. namespaceSelector et podSelector dans le même élément de pair se combinent avec ET ; deux éléments de liste sont des alternatives, donc OU. Les ports limitent encore le pair à TCP 80. Vérifiez l’indentation : un tiret mal placé peut autoriser tous les Pods d’un namespace au lieu d’un groupe précis.",
    ),
    h("egress", "Remember DNS when restricting a client", "Penser au DNS en limitant un client"),
    code("yaml", denyEgress, "lab/level-2/network-policies/deny-client-egress.yaml"),
    code(
      "bash",
      "k -n lab-netpol apply -f lab/level-2/network-policies/deny-client-egress.yaml\nk -n lab-netpol exec trusted -- nslookup web\nk -n kube-system get pods -l k8s-app=kube-dns --show-labels",
    ),
    code("yaml", allowEgress, "lab/level-2/network-policies/allow-client-egress.yaml"),
    p(
      "The egress allow-list grants DNS to CoreDNS Pods in kube-system on UDP and TCP 53, plus TCP 80 to the selected backend in this namespace. Verify the real DNS labels first. NodeLocal DNSCache or host-network resolvers need rules adapted to that implementation; do not assume this selector covers them. The namespace's immutable kubernetes.io/metadata.name label makes the namespace selection explicit. DNS access is not permission to contact every address returned by DNS.",
      "La liste egress autorise DNS vers les Pods CoreDNS de kube-system en UDP et TCP 53, puis TCP 80 vers le backend sélectionné dans ce namespace. Vérifiez les vrais labels DNS avant. NodeLocal DNSCache et les résolveurs hostNetwork exigent des règles adaptées ; ne supposez pas ce sélecteur suffisant. Le label immuable kubernetes.io/metadata.name explicite le namespace visé. Autoriser DNS n’autorise pas à contacter toute adresse retournée.",
    ),
    code(
      "bash",
      "k -n lab-netpol apply -f lab/level-2/network-policies/allow-client-egress.yaml\nk -n lab-netpol exec trusted -- nslookup web\nk -n lab-netpol exec trusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/",
    ),
    h(
      "diagnosis",
      "Avoid false security conclusions",
      "Éviter les fausses conclusions de sécurité",
    ),
    p(
      "Expected: DNS and trusted HTTP recover, untrusted HTTP remains blocked. If resolution works but HTTP fails, check both ingress and egress selection, target ports, ready endpoints and CNI health. If the initial deny test never blocks, check for another broad allow before blaming the CNI: policies are additive. Kubernetes NetworkPolicy has no universal Ready condition proving dataplane convergence. Do not use ping as a conformance test: ICMP behavior is implementation-dependent. A timeout alone is not a security audit.",
      "Attendu : DNS et HTTP trusted fonctionnent de nouveau, HTTP untrusted reste bloqué. Si DNS fonctionne mais HTTP échoue, vérifiez sélections ingress/egress, ports cibles, endpoints prêts et santé du CNI. Si le deny initial ne bloque rien, recherchez une autorisation large avant d’accuser le CNI : les politiques s’additionnent. NetworkPolicy n’a pas de condition Ready universelle prouvant la convergence du plan de données. N’utilisez pas ping comme test de conformité : ICMP dépend de l’implémentation. Un timeout seul n’est pas un audit de sécurité.",
    ),
    h("quiz", "Predict the union of rules", "Prévoir l’union des règles"),
    quiz(
      question(
        l(
          "A deny-all and an allow-all ingress policy select the same Pod. What wins?",
          "Une politique ingress deny-all et une allow-all sélectionnent le même Pod. Laquelle gagne ?",
        ),
        [
          l("The newest policy", "La politique la plus récente"),
          l("The deny always wins", "Le deny gagne toujours"),
          l(
            "The union permits the allow-all traffic",
            "L’union permet le trafic autorisé par allow-all",
          ),
        ],
        2,
        l(
          "Policies are additive allow-lists, not a firewall rule order. Remove unintended broad allows.",
          "Les politiques additionnent les autorisations, sans ordre de règles de pare-feu. Retirez les autorisations larges involontaires.",
        ),
      ),
      question(
        l(
          "Ingress allows the client but its egress denies the destination. Does HTTP work?",
          "Ingress autorise le client mais son egress interdit la destination. HTTP fonctionne-t-il ?",
        ),
        [
          l(
            "No, both directions' connection permissions must agree",
            "Non, les permissions de connexion des deux directions doivent concorder",
          ),
          l("Yes, ingress overrides egress", "Oui, ingress annule egress"),
          l("Only with a Service name", "Seulement avec un nom de Service"),
        ],
        0,
        l(
          "Source egress and destination ingress are independent checks; DNS does not bypass either.",
          "Egress source et ingress destination sont indépendants ; DNS ne contourne aucun des deux.",
        ),
      ),
      question(
        l(
          "kubectl accepted the policy. What proves enforcement?",
          "kubectl a accepté la politique. Qu’est-ce qui prouve son application ?",
        ),
        [
          l("The YAML has an apiVersion", "Le YAML contient apiVersion"),
          l(
            "Working allowed traffic and blocked denied traffic after a healthy baseline",
            "Un trafic autorisé fonctionnel et un trafic interdit bloqué après une base saine",
          ),
          l("The object's creation timestamp", "La date de création de l’objet"),
        ],
        1,
        l(
          "API acceptance proves storage and validation, not that a network component enforces the rule.",
          "L’acceptation API prouve stockage et validation, pas l’application par un composant réseau.",
        ),
      ),
    ),
    h("challenge", "Prove label-driven access", "Prouver l’accès piloté par labels"),
    challenge(
      l("A newly trusted client", "Un client nouvellement autorisé"),
      l(
        "Without editing any policy, grant untrusted the same network role as trusted and prove the outcome. Then restore its original label. Explain why this is an RBAC concern and not authentication.",
        "Sans modifier de politique, attribuez à untrusted le rôle réseau de trusted et prouvez le résultat. Restaurez ensuite son label initial. Expliquez pourquoi cela concerne RBAC et ne constitue pas une authentification.",
      ),
      [
        l(
          "Policies continuously select Pods by current labels.",
          "Les politiques sélectionnent continuellement les Pods par leurs labels actuels.",
        ),
        l(
          "Changing role also selects the client's egress policies, so both directions must now work.",
          "Modifier role sélectionne aussi les politiques egress du client : les deux directions doivent maintenant fonctionner.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-netpol label pod untrusted role=trusted-client --overwrite\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/\nk -n lab-netpol label pod untrusted role=untrusted-client --overwrite\nk -n lab-netpol exec untrusted -- wget -T 3 -qO- http://web/",
        ),
        p(
          "Expected after convergence: success with trusted-client and failure after restoration. Labels express policy membership; they do not prove user identity. Restrict who can create or relabel Pods in protected namespaces. NetworkPolicy also does not encrypt traffic, verify HTTP users, or replace TLS and application authorization.",
          "Attendu après convergence : succès avec trusted-client, échec après restauration. Les labels expriment une appartenance, pas l’identité d’un utilisateur. Limitez la création et le changement de labels des Pods protégés. NetworkPolicy ne chiffre pas le trafic, ne vérifie pas les utilisateurs HTTP et ne remplace ni TLS ni les autorisations applicatives.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-netpol"),
    p(
      "The policies and workloads are namespaced and disappear together. This cleanup does not uninstall or modify the CNI. If you provisioned an alternative dedicated cluster separately, follow its setup guide for teardown; never remove the networking component from a shared running cluster as a shortcut.",
      "Politiques et workloads sont dans le namespace et disparaissent ensemble. Ce nettoyage ne désinstalle ni ne modifie le CNI. Si vous avez créé séparément un cluster alternatif dédié, suivez son guide de suppression ; ne retirez jamais le composant réseau d’un cluster partagé pour aller plus vite.",
    ),
  ],
};
