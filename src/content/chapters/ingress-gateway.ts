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
import routing from "../../../lab/level-2/ingress-gateway/routing.yaml?raw";

export const ingressGateway: Chapter = {
  id: "ingress-gateway",
  level: 2,
  minutes: 65,
  title: l("Ingress controllers and Gateway API", "Ingress controllers et Gateway API"),
  summary: l(
    "Separate routing declarations from their controller and data plane, then route a real HTTP request through a local Gateway.",
    "Séparer déclarations de routage, contrôleur et plan de données, puis faire passer une requête HTTP par une Gateway locale.",
  ),
  prerequisites: ["services", "dns", "helm-basics"],
  related: ["network-policies", "helm-basics", "security-hardening"],
  heavy: l(
    "Optional controller installation needs Helm, cluster-admin permissions in a disposable lab, image downloads and about 1 GiB extra RAM.",
    "L’installation optionnelle du contrôleur exige Helm, des droits cluster-admin sur un lab jetable, des téléchargements d’images et environ 1 Gio de RAM supplémentaire.",
  ),
  blocks: [
    h("objectives", "Follow the whole request", "Suivre toute la requête"),
    list(
      l(
        "Distinguish an Ingress resource, its controller, the proxy and external address provisioning.",
        "Distinguer une ressource Ingress, son contrôleur, le proxy et la fourniture d’une adresse externe.",
      ),
      l(
        "Read Gateway/Route conditions, test hostname matching and isolate a backend error.",
        "Lire les conditions Gateway/Route, tester le hostname et isoler une erreur de backend.",
      ),
    ),
    p(
      "Ingress is a stable Kubernetes HTTP routing API whose feature set is frozen. Creating an Ingress without a matching controller does not expose a Service. ingressClassName selects an IngressClass and its implementation; annotations often add implementation-specific behavior. The controller watches resources and configures a proxy; the proxy handles requests. A Service of type LoadBalancer is a separate request for infrastructure, not a guarantee that kind will allocate a public address.",
      "Ingress est une API Kubernetes stable de routage HTTP dont les fonctionnalités sont figées. Créer un Ingress sans contrôleur correspondant n’expose aucun Service. ingressClassName sélectionne une IngressClass et son implémentation ; les annotations ajoutent souvent des comportements spécifiques. Le contrôleur observe les ressources et configure un proxy ; le proxy traite les requêtes. Un Service LoadBalancer demande séparément une infrastructure, sans garantir que kind alloue une adresse publique.",
    ),
    p(
      "Gateway API separates responsibilities: GatewayClass chooses a controller, Gateway defines listeners and attachment policy, and HTTPRoute matches traffic and references backend Services. The operator owns infrastructure while application teams can own Routes. A Route must request a parent that allows attachment; cross-namespace backend references also require permission such as ReferenceGrant. These CRDs are not built into the Kubernetes API server, and installing them without an implementation provides no traffic handling.",
      "Gateway API sépare les responsabilités : GatewayClass choisit un contrôleur, Gateway définit listeners et autorisations d’attachement, HTTPRoute sélectionne le trafic et référence des Services backend. L’opérateur possède l’infrastructure tandis que les équipes applicatives peuvent gérer les Routes. Une Route doit demander un parent qui l’autorise ; les références backend entre namespaces exigent aussi une permission telle que ReferenceGrant. Ces CRD ne sont pas intégrées à l’API server, et les installer sans implémentation ne traite aucun trafic.",
    ),
    ...labContext("lab-gateway"),
    h(
      "controller",
      "Opt into a pinned local implementation",
      "Choisir une implémentation locale versionnée",
    ),
    note(
      "warn",
      l("Learner action with cluster scope", "Action de l’apprenant à portée cluster"),
      l(
        "The following Helm command installs a controller, CRDs and permissions cluster-wide. Use it only on the disposable lab after checking no Gateway API/controller already exists. Do not overwrite provider-managed CRDs. This website has not executed the installation.",
        "La commande Helm suivante installe contrôleur, CRD et permissions à portée cluster. Utilisez-la uniquement sur le lab jetable après avoir vérifié l’absence de Gateway API/contrôleur existant. N’écrasez pas les CRD gérées par un fournisseur. Le site n’a pas exécuté cette installation.",
      ),
    ),
    code(
      "bash",
      "helm version\nk get crd gatewayclasses.gateway.networking.k8s.io gateways.gateway.networking.k8s.io httproutes.gateway.networking.k8s.io\nk get namespace envoy-gateway-system\nhelm --kube-context kind-k8s-ops-lab list -A",
    ),
    p(
      "NotFound for these CRDs and the envoy-gateway-system namespace is expected on a fresh baseline. Stop if any already exists: the installation and cleanup below assume these names are owned exclusively by this exercise. Inspect its owner instead of running a competing install or deleting shared resources. This exercise pins Envoy Gateway v1.9.2, whose matrix includes Kubernetes 1.35 and Gateway API v1.6.1. Use the chart's bundled CRDs rather than mixing arbitrary latest releases. Read the Helm fundamentals chapter if releases are new to you.",
      "NotFound pour ces CRD et le namespace envoy-gateway-system est attendu sur une base vierge. Arrêtez-vous si l’un existe déjà : installation et nettoyage supposent ces noms détenus exclusivement par l’exercice. Examinez son propriétaire au lieu d’installer un concurrent ou de supprimer des ressources partagées. L’exercice fixe Envoy Gateway v1.9.2, dont la matrice inclut Kubernetes 1.35 et Gateway API v1.6.1. Utilisez les CRD incluses dans le chart au lieu de mélanger des versions latest. Consultez les bases de Helm si les releases vous sont inconnues.",
    ),
    code(
      "bash",
      "helm --kube-context kind-k8s-ops-lab install lab-eg oci://docker.io/envoyproxy/gateway-helm --version v1.9.2 --namespace envoy-gateway-system --create-namespace --wait --timeout 5m\nk -n envoy-gateway-system wait --for=condition=Available deployment/envoy-gateway --timeout=300s\nk get crd gateways.gateway.networking.k8s.io httproutes.gateway.networking.k8s.io",
    ),
    h(
      "manifest",
      "Declare listener, route and ready backends",
      "Déclarer listener, route et backends prêts",
    ),
    code("yaml", routing, "lab/level-2/ingress-gateway/routing.yaml"),
    p(
      "The listener and Route both match academy.example.invalid. sectionName binds the Route to the http listener; allowedRoutes limits attachment to the same namespace. backendRefs.port is the Service port 80, not an arbitrary container port. PathPrefix / matches every path. GatewayClass is cluster-scoped even though the other resources are in lab-gateway. No public DNS or TLS certificate is created.",
      "Le listener et la Route sélectionnent academy.example.invalid. sectionName rattache la Route au listener http ; allowedRoutes limite l’attachement au même namespace. backendRefs.port est le port 80 du Service, pas un port arbitraire du conteneur. PathPrefix / sélectionne tous les chemins. GatewayClass est à portée cluster, les autres objets dans lab-gateway. Aucun DNS public ni certificat TLS n’est créé.",
    ),
    steps(
      {
        title: l(
          "Inspect reconciliation, not just object creation",
          "Examiner la réconciliation, pas seulement la création",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-gateway apply -f lab/level-2/ingress-gateway/routing.yaml\nk -n lab-gateway rollout status deployment/web --timeout=120s\nk get gatewayclass lab-envoy -o yaml\nk -n lab-gateway get gateway public -o yaml\nk -n lab-gateway get httproute web -o yaml\nk -n envoy-gateway-system get deployments,services,pods",
        },
        explain: l(
          "Inspect observedGeneration as well as condition values. GatewayClass Accepted means the controller accepts the class. Route status.parents conditions Accepted and ResolvedRefs describe attachment and references; they do not prove backend application health. Gateway Programmed reports configuration progress, not an end-to-end HTTP test.",
          "Examinez observedGeneration et les conditions. Accepted sur GatewayClass signifie que le contrôleur accepte la classe. Les conditions Accepted et ResolvedRefs dans status.parents de la Route décrivent attachement et références, sans prouver la santé applicative. Programmed de Gateway signale la progression de configuration, pas un test HTTP complet.",
        ),
        expected: {
          text: l(
            "Expected after reconciliation: the class and Route are accepted, references resolve and proxy resources appear. A pending external LoadBalancer address is normal on plain kind and may affect Gateway conditions; inspect their reasons.",
            "Attendu après réconciliation : classe et Route acceptées, références résolues et ressources proxy créées. Une adresse LoadBalancer externe en attente est normale sur kind et peut affecter les conditions Gateway ; lisez leurs raisons.",
          ),
        },
      },
      {
        title: l("Send traffic through Envoy", "Envoyer le trafic via Envoy"),
        code: {
          lang: "bash",
          code: "k -n envoy-gateway-system wait --for=condition=Available deployment -l gateway.envoyproxy.io/owning-gateway-namespace=lab-gateway,gateway.envoyproxy.io/owning-gateway-name=public --timeout=300s\nLAB_ENVOY_SERVICE=$(kubectl --context kind-k8s-ops-lab -n envoy-gateway-system get services -l gateway.envoyproxy.io/owning-gateway-namespace=lab-gateway,gateway.envoyproxy.io/owning-gateway-name=public -o jsonpath='{.items[0].metadata.name}')\nk -n envoy-gateway-system port-forward service/\"$LAB_ENVOY_SERVICE\" 8888:80",
        },
        explain: l(
          "Keep this terminal running. The selected Service belongs to the proxy, not the controller or application. Port-forward avoids needing a LoadBalancer implementation while still exercising HTTP routing. In a second terminal run the curl commands below.",
          "Laissez ce terminal ouvert. Le Service sélectionné appartient au proxy, pas au contrôleur ni à l’application. Le port-forward évite une implémentation LoadBalancer tout en testant le routage HTTP. Exécutez curl ci-dessous dans un second terminal.",
        ),
      },
    ),
    code(
      "bash",
      "curl --fail-with-body -i -H 'Host: academy.example.invalid' http://127.0.0.1:8888/\ncurl -i -H 'Host: wrong.example.invalid' http://127.0.0.1:8888/",
    ),
    p(
      "Expected: the matching host receives nginx HTML with HTTP 200; an unmatched host normally receives 404 from the proxy. A browser request to localhost lacks the required Host value. Port-forward tests only this local tunnel, not public DNS, firewall exposure, load-balancer health or TLS. An accepted Route with a 503 still needs ready EndpointSlices and a working backend listener.",
      "Attendu : le bon host reçoit le HTML nginx avec HTTP 200 ; un host non sélectionné reçoit normalement 404 du proxy. Une requête navigateur à localhost n’a pas le Host requis. Le tunnel teste seulement ce chemin local, pas DNS public, pare-feu, santé du load balancer ou TLS. Une Route acceptée avec 503 exige encore des EndpointSlices prêts et un backend à l’écoute.",
    ),
    h(
      "diagnosis",
      "Turn a missing reference into evidence",
      "Transformer une référence absente en preuve",
    ),
    code(
      "bash",
      'k -n lab-gateway patch httproute web --type=json -p \'[{"op":"replace","path":"/spec/rules/0/backendRefs/0/name","value":"missing-web"}]\'\nk -n lab-gateway get httproute web -o yaml\nk -n lab-gateway get endpointslices -l kubernetes.io/service-name=web\nk -n envoy-gateway-system logs deployment/envoy-gateway --tail=50\nk -n lab-gateway apply -f lab/level-2/ingress-gateway/routing.yaml',
    ),
    p(
      "After reconciliation, expect ResolvedRefs=False with a reason identifying the missing backend. The original Service may still be healthy: the Route points elsewhere. If Accepted=False, inspect listener name, hostname intersection and allowedRoutes before debugging Pod networking. If no status appears, check the controller name, CRD installation and controller logs. Restore the manifest and repeat the successful curl; do not regard an unchanged previous response as proof that new configuration converged.",
      "Après réconciliation, attendez ResolvedRefs=False avec une raison identifiant le backend absent. Le Service original peut rester sain : la Route vise ailleurs. Si Accepted=False, vérifiez nom du listener, intersection des hostnames et allowedRoutes avant le réseau des Pods. Si aucun statut n’apparaît, vérifiez controllerName, CRD et logs. Restaurez le manifest puis répétez le curl réussi ; une ancienne réponse inchangée ne prouve pas la convergence de la nouvelle configuration.",
    ),
    h("quiz", "Read the contracts", "Lire les contrats"),
    quiz(
      question(
        l(
          "Why does an installed Gateway CRD not expose an app?",
          "Pourquoi une CRD Gateway installée n’expose-t-elle pas l’application ?",
        ),
        [
          l(
            "CRDs only define the API; an implementation must reconcile and run a proxy",
            "Les CRD définissent seulement l’API ; une implémentation doit réconcilier et lancer un proxy",
          ),
          l("Every Gateway requires public DNS first", "Toute Gateway exige d’abord un DNS public"),
          l("A Gateway always replaces Service", "Une Gateway remplace toujours Service"),
        ],
        0,
        l(
          "API storage alone performs no forwarding; controller and data plane supply behavior.",
          "Le stockage de l’API seul ne transmet aucun paquet ; contrôleur et plan de données fournissent le comportement.",
        ),
      ),
      question(
        l("ResolvedRefs=True proves what?", "Que prouve ResolvedRefs=True ?"),
        [
          l("Every backend request succeeds", "Toutes les requêtes backend réussissent"),
          l(
            "The referenced objects and permissions are valid",
            "Les objets référencés et permissions sont valides",
          ),
          l(
            "The TLS certificate is trusted by all browsers",
            "Tous les navigateurs font confiance au certificat TLS",
          ),
        ],
        1,
        l(
          "Reference validity is distinct from endpoint readiness, network reachability and business correctness.",
          "La validité des références se distingue de la readiness, de la connectivité et de la justesse métier.",
        ),
      ),
      question(
        l(
          "Why does localhost return 404 while curl with the matching Host works?",
          "Pourquoi localhost retourne-t-il 404 alors que curl avec le bon Host fonctionne ?",
        ),
        [
          l("DNS round-robin failed", "Le DNS round-robin a échoué"),
          l("Port-forward skips all routing", "Le port-forward contourne tout routage"),
          l(
            "The listener/Route hostname does not match localhost",
            "Le hostname du listener/de la Route ne sélectionne pas localhost",
          ),
        ],
        2,
        l(
          "HTTP host matching happens in the proxy even over a local TCP tunnel.",
          "La sélection HTTP du host se fait dans le proxy, même via un tunnel TCP local.",
        ),
      ),
    ),
    h("challenge", "Limit the public route", "Limiter la route exposée"),
    challenge(
      l("Expose one path", "Exposer un seul chemin"),
      l(
        "Restrict the Route to the exact path /. Prove that / still returns the backend page while /private does not match. Keep the hostname restriction.",
        "Limitez la Route au chemin exact /. Prouvez que / retourne toujours la page backend et que /private n’est pas sélectionné. Conservez la restriction de hostname.",
      ),
      [
        l("PathPrefix / includes every path.", "PathPrefix / inclut tous les chemins."),
        l(
          "Change the path match type to Exact; do not modify backendRefs.",
          "Passez le type de sélection du chemin à Exact sans modifier backendRefs.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-gateway patch httproute web --type=json -p \'[{"op":"replace","path":"/spec/rules/0/matches/0/path/type","value":"Exact"}]\'\nk -n lab-gateway get httproute web -o yaml\ncurl -i -H \'Host: academy.example.invalid\' http://127.0.0.1:8888/\ncurl -i -H \'Host: academy.example.invalid\' http://127.0.0.1:8888/private',
        ),
        p(
          "Expected after observedGeneration catches up: / returns 200 and /private has no matching route, normally 404. A route match is not authorization: use authentication, application access control and network restrictions for confidential data.",
          "Attendu après mise à jour d’observedGeneration : / retourne 200 et /private n’a aucune route correspondante, normalement 404. La sélection d’une route n’est pas une autorisation : authentification, contrôle applicatif et restrictions réseau protègent les données confidentielles.",
        ),
      ],
    ),
    h("cleanup", "Remove the route before its controller", "Retirer la route avant son contrôleur"),
    p(
      "Stop port-forward with Ctrl+C. Delete the exercise while the controller can process finalizers, then uninstall only the release created here. Helm may retain CRDs: inspect them and leave shared definitions intact. Completely discarding the dedicated disposable cluster, following lab/README.md, is the full cleanup for retained cluster-scoped definitions.",
      "Arrêtez le port-forward avec Ctrl+C. Supprimez l’exercice pendant que le contrôleur peut traiter les finalizers, puis désinstallez seulement la release créée ici. Helm peut conserver des CRD : examinez-les et préservez les définitions partagées. Supprimer entièrement le cluster dédié jetable selon lab/README.md assure le nettoyage complet des définitions à portée cluster restantes.",
    ),
    code(
      "bash",
      "k -n lab-gateway delete -f lab/level-2/ingress-gateway/routing.yaml\nk delete namespace lab-gateway\nhelm --kube-context kind-k8s-ops-lab uninstall lab-eg --namespace envoy-gateway-system\nk delete namespace envoy-gateway-system\nk get crd",
    ),
  ],
};
