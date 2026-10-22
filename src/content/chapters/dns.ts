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
import discovery from "../../../lab/level-2/dns/discovery.yaml?raw";

export const dns: Chapter = {
  id: "dns",
  level: 2,
  minutes: 40,
  title: l("Cluster DNS and service discovery", "DNS du cluster et découverte de services"),
  summary: l(
    "Resolve Services from a Pod, compare normal and headless records, and separate DNS failure from a missing backend.",
    "Résoudre les Services depuis un Pod, comparer les enregistrements normaux et headless, distinguer panne DNS et backend absent.",
  ),
  prerequisites: ["services", "namespaces-contexts", "pods"],
  related: ["network-policies", "ingress-gateway", "troubleshooting-2"],
  blocks: [
    h("objectives", "Find the failure layer", "Trouver la couche en échec"),
    list(
      l(
        "Predict how namespace search suffixes expand a short Service name.",
        "Prévoir l’expansion d’un nom court de Service avec les suffixes du namespace.",
      ),
      l(
        "Diagnose name resolution, Service endpoints and HTTP independently.",
        "Diagnostiquer séparément la résolution, les endpoints du Service et HTTP.",
      ),
    ),
    p(
      "Inside a Pod, DNS translates names to addresses; it does not route HTTP. A normal ClusterIP Service receives a stable virtual IP and a DNS record even when no backend is ready. The Service data plane then forwards connections to eligible endpoints. CoreDNS usually serves cluster records and forwards external queries. A successful DNS answer proves name resolution, not network reachability, readiness or application health.",
      "Dans un Pod, DNS traduit les noms en adresses ; il ne route pas HTTP. Un Service ClusterIP normal reçoit une IP virtuelle stable et un enregistrement DNS même sans backend prêt. Le plan de données du Service transmet ensuite les connexions aux endpoints éligibles. CoreDNS sert généralement les noms du cluster et relaie les requêtes externes. Une réponse DNS prouve la résolution, pas la connectivité, la readiness ni la santé applicative.",
    ),
    p(
      "For this kind baseline the domain is cluster.local. web in namespace lab-dns resolves using the Pod search list, commonly lab-dns.svc.cluster.local, svc.cluster.local, cluster.local. web.lab-dns targets that namespace from another one. web.lab-dns.svc.cluster.local. is absolute because of its final dot. With ndots:5, names with fewer dots may try search suffixes first; use an absolute name to diagnose unnecessary search expansion rather than changing every Pod's resolver blindly.",
      "Pour cette base kind, le domaine est cluster.local. web dans lab-dns est résolu avec la liste de recherche du Pod, généralement lab-dns.svc.cluster.local, svc.cluster.local, cluster.local. web.lab-dns vise ce namespace depuis un autre. web.lab-dns.svc.cluster.local. est absolu grâce au point final. Avec ndots:5, les noms ayant moins de points peuvent d’abord essayer les suffixes : un nom absolu aide à diagnostiquer cette expansion sans modifier aveuglément le résolveur de tous les Pods.",
    ),
    ...labContext("lab-dns"),
    h("manifest", "One workload, two discovery models", "Un workload, deux modèles de découverte"),
    code("yaml", discovery, "lab/level-2/dns/discovery.yaml"),
    p(
      "Both Services select app: dns-web and point to the named container port http. web uses a ClusterIP. web-headless sets clusterIP: None and returns ready endpoint addresses directly; clients take responsibility for choosing and refreshing them. A named Service port also permits SRV discovery. These records are cluster-internal; your laptop's DNS does not automatically know cluster.local. hostNetwork Pods need deliberate DNS policy configuration beyond this example.",
      "Les deux Services sélectionnent app: dns-web et ciblent le port nommé http du conteneur. web utilise une ClusterIP. web-headless définit clusterIP: None et renvoie directement les adresses des endpoints prêts ; le client doit les choisir et les rafraîchir. Un port de Service nommé permet aussi la découverte SRV. Ces noms sont internes : le DNS de votre ordinateur ne connaît pas automatiquement cluster.local. Les Pods hostNetwork nécessitent une politique DNS spécifique hors de cet exemple.",
    ),
    steps(
      {
        title: l(
          "Compare answers from the actual client",
          "Comparer les réponses depuis le vrai client",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-dns apply -f lab/level-2/dns/discovery.yaml\nk -n lab-dns rollout status deployment/web --timeout=120s\nk -n lab-dns wait --for=condition=Ready pod/client --timeout=120s\nk -n lab-dns exec client -- cat /etc/resolv.conf\nk -n lab-dns exec client -- nslookup web\nk -n lab-dns exec client -- nslookup web-headless.lab-dns.svc.cluster.local.\nk -n lab-dns get service web web-headless -o wide\nk -n lab-dns get pods -l app=dns-web -o wide",
        },
        explain: l(
          "Match returned addresses to Service and Pod IPs. Reissue the headless lookup after readiness converges; DNS caches can temporarily retain old positive or negative answers.",
          "Rapprochez les adresses retournées des IP des Services et Pods. Recommencez la recherche headless après convergence de la readiness ; les caches DNS peuvent conserver temporairement des réponses positives ou négatives.",
        ),
        expected: {
          text: l(
            "Expected: web returns its virtual IP; web-headless returns the two ready Pod IPs, in unspecified order. Observe your actual cluster domain and resolver IP.",
            "Attendu : web retourne son IP virtuelle ; web-headless retourne les IP des deux Pods prêts, dans un ordre indéterminé. Relevez le domaine et l’IP du résolveur réellement utilisés.",
          ),
        },
      },
      {
        title: l(
          "Resolve across namespaces and inspect SRV",
          "Résoudre entre namespaces et examiner SRV",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-dns exec client -- nslookup kubernetes.default.svc.cluster.local.\nk -n lab-dns exec client -- nslookup -type=SRV _http._tcp.web-headless.lab-dns.svc.cluster.local.\nk -n lab-dns exec client -- wget -T 3 -qO- http://web/",
        },
        explain: l(
          "The API Service belongs to default, so kubernetes alone in lab-dns is not equivalent. The SRV query discovers the named port; wget then verifies a separate HTTP request. This fixture is not a StatefulSet and does not promise stable per-Pod identities.",
          "Le Service de l’API appartient à default : kubernetes seul dans lab-dns n’est pas équivalent. La requête SRV découvre le port nommé ; wget vérifie ensuite une requête HTTP distincte. Cet exemple n’est pas un StatefulSet et ne promet pas d’identités stables par Pod.",
        ),
        expected: {
          text: l(
            "Expected: a DNS answer for kubernetes.default, SRV answers with port 80, and nginx HTML from web. Do not copy a recorded IP as configuration.",
            "Attendu : une réponse pour kubernetes.default, des réponses SRV avec le port 80 et le HTML nginx via web. Ne recopiez pas une IP observée dans votre configuration.",
          ),
        },
      },
    ),
    h("failure", "Break selection, keep DNS", "Casser la sélection, conserver le DNS"),
    code(
      "bash",
      'k -n lab-dns patch service web --type=merge -p \'{"spec":{"selector":{"app":"missing-backend"}}}\'\nk -n lab-dns get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-dns exec client -- nslookup web\nk -n lab-dns exec client -- wget -T 3 -qO- http://web/',
    ),
    p(
      "Expected: the normal Service still resolves, but after EndpointSlice convergence no ready backend matches and HTTP fails. This rules out DNS as the primary cause. Restore the selector with the command below. For genuine name failure, NXDOMAIN suggests a missing name or namespace; SERVFAIL suggests a server-side lookup error; a timeout suggests the resolver cannot be reached or respond. Those are starting hypotheses to test, not universal diagnoses.",
      "Attendu : le Service normal reste résolu, mais après convergence des EndpointSlices aucun backend prêt ne correspond et HTTP échoue. DNS n’est donc pas la cause principale. Restaurez le sélecteur ci-dessous. Pour une vraie panne de nom, NXDOMAIN suggère un nom ou namespace absent ; SERVFAIL suggère une erreur du serveur DNS ; un timeout suggère un résolveur inaccessible ou incapable de répondre. Ce sont des hypothèses à vérifier, pas des diagnostics universels.",
    ),
    code(
      "bash",
      "k -n lab-dns apply -f lab/level-2/dns/discovery.yaml\nk -n kube-system get pods -l k8s-app=kube-dns -o wide\nk -n kube-system get service kube-dns\nk -n kube-system get endpointslices -l kubernetes.io/service-name=kube-dns\nk -n kube-system logs deployment/coredns --tail=50\nk -n lab-dns get networkpolicies",
    ),
    p(
      "Inspect the client's resolv.conf before editing CoreDNS. Verify resolver Pods, Service endpoints and access to UDP and TCP port 53; TCP is required for some DNS replies. An egress policy can block DNS while allowing HTTP to a literal IP. Query logs are not necessarily enabled, so absence of a name in default CoreDNS logs is not proof that no query arrived. Avoid changing shared CoreDNS configuration for this isolated experiment.",
      "Examinez resolv.conf du client avant de modifier CoreDNS. Vérifiez ses Pods, les endpoints du Service et l’accès UDP et TCP au port 53 ; certaines réponses exigent TCP. Une politique egress peut bloquer DNS tout en autorisant HTTP vers une IP littérale. Les logs de requêtes ne sont pas nécessairement activés : l’absence d’un nom dans les logs CoreDNS ne prouve pas qu’aucune requête n’est arrivée. Ne modifiez pas la configuration partagée pour cet exercice isolé.",
    ),
    h("quiz", "Separate discovery and delivery", "Séparer découverte et acheminement"),
    quiz(
      question(
        l(
          "web resolves but has no ready EndpointSlice address. What should you inspect first?",
          "web est résolu mais n’a aucune adresse prête dans ses EndpointSlices. Que vérifier d’abord ?",
        ),
        [
          l("Public DNS delegation", "La délégation DNS publique"),
          l(
            "Service selector and Pod readiness",
            "Le sélecteur du Service et la readiness des Pods",
          ),
          l("The laptop's hosts file", "Le fichier hosts du poste"),
        ],
        1,
        l(
          "Normal Service records do not guarantee backends. Compare selectors, labels and endpoint readiness.",
          "Les noms des Services normaux ne garantissent aucun backend. Comparez sélecteurs, labels et readiness des endpoints.",
        ),
      ),
      question(
        l("What changes with a headless Service?", "Que change un Service headless ?"),
        [
          l(
            "DNS returns backend addresses instead of a Service virtual IP",
            "DNS retourne les adresses des backends au lieu d’une IP virtuelle de Service",
          ),
          l("Every client gets a public IP", "Chaque client obtient une IP publique"),
          l("DNS stops using caches", "DNS cesse d’utiliser des caches"),
        ],
        0,
        l(
          "The client discovers endpoints directly and must tolerate their changes; it does not get a public load balancer.",
          "Le client découvre directement les endpoints et doit tolérer leurs changements ; il n’obtient aucun load balancer public.",
        ),
      ),
      question(
        l(
          "Why can api resolve differently from two namespaces?",
          "Pourquoi api peut-il être résolu différemment dans deux namespaces ?",
        ),
        [
          l("Pod IPs decide the DNS zone", "Les IP des Pods décident de la zone DNS"),
          l(
            "Service names must be globally unique",
            "Les noms des Services doivent être globalement uniques",
          ),
          l(
            "The first search suffix includes the client's namespace",
            "Le premier suffixe de recherche inclut le namespace du client",
          ),
        ],
        2,
        l(
          "Short names are namespace-relative. Qualify the namespace or use the actual cluster FQDN for cross-namespace discovery.",
          "Les noms courts sont relatifs au namespace. Précisez le namespace ou le FQDN réel pour la découverte entre namespaces.",
        ),
      ),
    ),
    h("challenge", "Prove where the request fails", "Prouver où la requête échoue"),
    challenge(
      l("A misleading DNS incident", "Un incident DNS trompeur"),
      l(
        "Break only web's targetPort using 8080. Demonstrate that DNS, ready endpoints and HTTP are separate checks; then repair the Service without changing CoreDNS.",
        "Cassez uniquement targetPort de web en utilisant 8080. Démontrez que DNS, endpoints prêts et HTTP se vérifient séparément ; réparez ensuite le Service sans modifier CoreDNS.",
      ),
      [
        l(
          "Patch only the Service ports list, leaving its selector unchanged.",
          "Modifiez seulement la liste des ports du Service en conservant son sélecteur.",
        ),
        l(
          "Read endpoints with their ports, then compare the container's listening port.",
          "Lisez les endpoints et leurs ports, puis comparez le port écouté par le conteneur.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-dns patch service web --type=merge -p \'{"spec":{"ports":[{"name":"http","port":80,"targetPort":8080}]}}\'\nk -n lab-dns exec client -- nslookup web\nk -n lab-dns get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-dns exec client -- wget -T 3 -qO- http://web/\nk -n lab-dns apply -f lab/level-2/dns/discovery.yaml\nk -n lab-dns exec client -- wget -T 3 -qO- http://web/',
        ),
        p(
          "Expected: the name and Pod IPs remain valid, but the endpoint port becomes 8080 while nginx listens on 80. HTTP fails until the manifest restores the named targetPort. Endpoint readiness describes the Pod, not a proof that every arbitrary Service target port works.",
          "Attendu : le nom et les IP des Pods restent valides, mais le port des endpoints devient 8080 alors que nginx écoute sur 80. HTTP échoue jusqu’à restauration du targetPort nommé. La readiness décrit le Pod, sans prouver que tout port arbitraire d’un Service fonctionne.",
        ),
      ],
    ),
    note(
      "info",
      l("Boundary", "Limite"),
      l(
        "This exercise covers Linux Pod DNS in the documented local cluster. ExternalDNS, public domains, caching behavior in application runtimes and production DNS capacity require separate configuration and measurements.",
        "Cet exercice couvre le DNS des Pods Linux du cluster local documenté. ExternalDNS, domaines publics, caches des runtimes applicatifs et capacité DNS de production nécessitent des configurations et mesures distinctes.",
      ),
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-dns"),
  ],
};
