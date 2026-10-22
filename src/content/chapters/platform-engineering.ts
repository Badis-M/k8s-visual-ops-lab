import type { Chapter } from "../types";
import { l, h, p, code, list, labContext, quiz, question, challenge } from "../lesson-kit";
import renderer from "../../../lab/level-4/platform-engineering/render.py?raw";

export const platformEngineering: Chapter = {
  id: "platform-engineering",
  level: 4,
  minutes: 50,
  title: l("Platform engineering patterns", "Patterns de platform engineering"),
  summary: l(
    "Turn infrastructure capabilities into a reviewed developer contract: choose defaults, expose a small interface and define the ownership and evidence behind a paved road.",
    "Transformer les capacités d’infrastructure en contrat développeur : choisir les défauts, exposer une petite interface et définir responsabilités et preuves derrière un parcours standard.",
  ),
  prerequisites: ["helm-charts", "gitops", "security-hardening", "crds"],
  related: ["operators", "observability", "multi-cluster"],
  blocks: [
    h(
      "objectives",
      "Reduce cognitive load without hiding responsibility",
      "Réduire la charge cognitive sans masquer les responsabilités",
    ),
    list(
      l(
        "Design an interface around developer needs instead of exposing every Kubernetes field.",
        "Concevoir une interface selon les besoins développeurs plutôt qu’exposer chaque champ Kubernetes.",
      ),
      l(
        "Validate a small workload contract locally, trace the generated resources and explain which controls still belong to the platform team.",
        "Valider localement un petit contrat de workload, suivre les ressources générées et expliquer les contrôles restant à l’équipe plateforme.",
      ),
    ),
    h(
      "model",
      "A platform is a product and an operating agreement",
      "Une plateforme est un produit et un accord d’exploitation",
    ),
    p(
      "A platform packages recurring capabilities into a supported path: application deployment, identity, secrets, networking, telemetry and recovery. A portal can be one interface, but installing a portal does not supply the underlying ownership or reliability. Start with a specific developer journey, such as publishing an internal HTTP service, and measure time to first useful deployment, failure recovery and support burden rather than counting templates.",
      "Une plateforme regroupe des capacités récurrentes dans un parcours supporté : déploiement, identité, secrets, réseau, télémétrie et récupération. Un portail peut servir d’interface, mais son installation ne crée ni responsabilités ni fiabilité. Commencez par un parcours précis, comme publier un service HTTP interne, et mesurez délai jusqu’au premier déploiement utile, récupération et charge de support plutôt que nombre de templates.",
    ),
    p(
      "A paved road provides defaults with a clear scope, documented escape hatches and an owner for exceptions. Too many options recreate infrastructure complexity; too few push teams toward unsupported workarounds. A useful contract separates what the application team supplies from what the platform guarantees and from what remains a best-effort teaching example. Version that contract and migrate its consumers rather than silently changing generated resources beneath them.",
      "Un parcours standard fournit des défauts au périmètre clair, des sorties documentées et un responsable des exceptions. Trop d’options recréent la complexité ; trop peu poussent vers des contournements. Le contrat distingue entrées de l’équipe applicative, garanties de la plateforme et simples exemples pédagogiques. Versionnez ce contrat et migrez ses consommateurs plutôt que changer silencieusement les ressources générées.",
    ),
    h(
      "contract",
      "A deliberately narrow service interface",
      "Une interface de service volontairement étroite",
    ),
    p(
      "The local renderer accepts a Service-compatible name beginning with a lowercase letter, a DNS-compatible owner, a resource tier, an environment and a lab namespace. It generates an internal Service, a non-root Deployment with probes and bounded resources, and a namespace quota. The caller cannot request a public load balancer, privileged container, arbitrary image or an unlimited resource budget. These limits demonstrate product choices; they are not a substitute for server-side authorization and admission policy.",
      "Le générateur local accepte un nom compatible Service commençant par une lettre minuscule, un propriétaire compatible DNS, un palier de ressources, un environnement et un namespace de lab. Il produit Service interne, Deployment non-root avec probes et ressources bornées, et quota. L’appelant ne choisit ni load balancer public, ni conteneur privilégié, ni image arbitraire, ni ressources illimitées. Ces bornes illustrent des choix produit, sans remplacer autorisation et admission côté serveur.",
    ),
    code("python", renderer, "lab/level-4/platform-engineering/render.py"),
    p(
      "JSON is a valid Kubernetes input format here, so the renderer needs only Python's standard library and avoids fragile string interpolation into YAML. Names and namespaces are validated before serialization. The owner label supports inventory and routing support requests; it does not grant RBAC permissions. The namespace must start with lab- to keep this teaching tool away from infrastructure namespaces, but a real platform also needs to authorize the requesting identity for that namespace.",
      "JSON est ici un format d’entrée Kubernetes valide : le générateur utilise seulement la bibliothèque standard Python et évite l’interpolation fragile dans YAML. Noms et namespaces sont validés avant sérialisation. Le label owner aide l’inventaire et le support ; il n’accorde aucun droit RBAC. Le préfixe lab- éloigne cet outil pédagogique des namespaces d’infrastructure, mais une vraie plateforme doit aussi autoriser l’identité appelante pour ce namespace.",
    ),
    h(
      "offline",
      "Render and test before contacting a cluster",
      "Rendre et tester avant de contacter un cluster",
    ),
    code(
      "bash",
      'umask 077\nLAB_PLATFORM_DIR=$(mktemp -d)\npython3 -m unittest discover -s lab/level-4/platform-engineering -v\npython3 lab/level-4/platform-engineering/render.py --name notes --owner learning --tier small --environment dev > "$LAB_PLATFORM_DIR/workload.json"\npython3 -m json.tool "$LAB_PLATFORM_DIR/workload.json"\npython3 lab/level-4/platform-engineering/render.py --name \'../escape\' --owner learning',
    ),
    p(
      "Keep LAB_PLATFORM_DIR in this shell for the optional apply and final cleanup. Expected: contract tests pass, JSON contains four objects, and the final invalid name exits nonzero before writing a resource document. The tests verify input boundaries, matching Service/Deployment selectors, named target ports and secure defaults. They do not prove image availability, admission acceptance or a successful startup. Inspect the image and resources before applying the result. The prod parameter only increases replicas; it does not create physical independence or a production service.",
      "Gardez LAB_PLATFORM_DIR dans ce shell pour l’application optionnelle puis le nettoyage. Attendu : tests du contrat réussis, JSON contenant quatre objets et dernier nom invalide refusé avant émission d’un document. Les tests vérifient entrées, sélecteurs concordants, ports nommés et défauts de sécurité. Ils ne prouvent ni disponibilité de l’image, ni admission, ni démarrage. Examinez image et ressources avant application. Le paramètre prod augmente seulement les réplicas : il ne crée ni indépendance physique ni service de production.",
    ),
    ...labContext("lab-platform"),
    h(
      "exercise",
      "Inspect how the contract becomes a workload",
      "Observer la traduction du contrat en workload",
    ),
    code(
      "bash",
      'k apply -f "$LAB_PLATFORM_DIR/workload.json"\nk -n lab-platform rollout status deployment/notes --timeout=120s\nk -n lab-platform get deployment,service,resourcequota\nk -n lab-platform describe resourcequota platform-budget\nk -n lab-platform get pods -l app.kubernetes.io/name=notes -o yaml\nk -n lab-platform port-forward service/notes 8081:80',
    ),
    p(
      "In another terminal, request http://localhost:8081/ and compare the desired JSON with live Pod fields. Expected: nginx listens as a non-root process on 8080 and the Service exposes it internally on 80. The writable /tmp volume supports nginx runtime files despite a read-only image filesystem. If startup fails, inspect Events and logs before relaxing security controls; the image contract and mounted paths must agree. Stop port-forward with Ctrl+C.",
      "Dans un autre terminal, interrogez http://localhost:8081/ et comparez JSON désiré et champs réels du Pod. Attendu : nginx non-root écoute sur 8080, exposé en interne sur 80. Le volume /tmp autorise ses fichiers temporaires malgré le système de fichiers en lecture seule. En cas d’échec, examinez Events et logs avant de relâcher la sécurité : contrat d’image et chemins montés doivent correspondre. Arrêtez le port-forward avec Ctrl+C.",
    ),
    h("operation", "Who owns each failure?", "Qui possède chaque panne ?"),
    p(
      "A rejected name is an interface validation problem; an exceeded quota is a namespace capacity/admission issue; a Pending Pod may be scheduling; an unready process is an application or runtime configuration problem. The platform should expose an actionable status that preserves these causes rather than collapsing them into deployment failed. Establish an application owner, platform on-call path and escalation boundary, and ensure support can inspect events without automatically reading every Secret.",
      "Un nom refusé relève de l’interface ; un quota dépassé de la capacité/admission ; un Pod Pending peut relever du placement ; un processus non prêt de l’application ou du runtime. La plateforme doit exposer un statut exploitable conservant ces causes plutôt que tout réduire à déploiement échoué. Définissez propriétaire applicatif, astreinte plateforme et escalade, avec accès aux Events sans lecture automatique de tous les Secrets.",
    ),
    p(
      "A renderer is a starting point. A controller can reconcile a higher-level CRD, GitOps can reconcile generated manifests, and CI can validate pull requests, but two controllers must not fight over the same fields. Choose one desired-state authority and a documented override policy. Store no credentials in generated bundles. Enforce tenant separation through identity, RBAC, admission and network/storage controls, not an owner label or a UI hiding dangerous buttons.",
      "Un générateur est un point de départ. Un contrôleur peut réconcilier une CRD de haut niveau, GitOps les manifests générés et CI valider les PR, mais deux contrôleurs ne doivent pas se disputer les mêmes champs. Choisissez une autorité d’état désiré et une politique d’exception. Ne stockez aucun credential dans les bundles. Isolez les tenants via identité, RBAC, admission et contrôles réseau/stockage, pas avec un label owner ni des boutons masqués.",
    ),
    h("quiz", "Review the platform promise", "Relire la promesse plateforme"),
    quiz(
      question(
        l(
          "Does an owner label authorize an API write?",
          "Un label owner autorise-t-il une écriture API ?",
        ),
        [
          l("Yes", "Oui"),
          l("No; authorization is separate", "Non ; l’autorisation est distincte"),
          l("Only with a Service", "Seulement avec un Service"),
        ],
        1,
        l(
          "Labels describe objects; RBAC and other authorizers decide allowed actions.",
          "Les labels décrivent les objets ; RBAC et les autres authorizers décident des actions.",
        ),
      ),
      question(
        l("What does the prod input guarantee here?", "Que garantit ici l’entrée prod ?"),
        [
          l("A rendered choice of two replicas", "Un choix rendu de deux réplicas"),
          l("Physical HA", "Une HA physique"),
          l("A production SLO", "Un SLO de production"),
        ],
        0,
        l(
          "The parameter does not change failure domains, operations or application resilience.",
          "Le paramètre ne change ni domaines de panne, ni exploitation, ni résilience applicative.",
        ),
      ),
      question(
        l("Why expose few resource tiers?", "Pourquoi exposer quelques paliers de ressources ?"),
        [
          l("To avoid measuring usage", "Pour éviter de mesurer l’usage"),
          l("To eliminate all exceptions", "Pour éliminer toutes les exceptions"),
          l(
            "To reduce choices while retaining reviewed bounds",
            "Pour réduire les choix avec des bornes relues",
          ),
        ],
        2,
        l(
          "A small supported interface reduces cognitive load but still needs evidence and an exception process.",
          "Une petite interface supportée réduit la charge cognitive, tout en exigeant preuves et processus d’exception.",
        ),
      ),
    ),
    h(
      "challenge",
      "Add an escape hatch without losing the contract",
      "Ajouter une exception sans perdre le contrat",
    ),
    challenge(
      l("A team needs more memory", "Une équipe a besoin de plus de mémoire"),
      l(
        "Propose how to support a workload exceeding the medium tier without letting every caller override arbitrary container fields. Identify who reviews the request and how to verify the rollout.",
        "Proposez le support d’un workload dépassant medium sans permettre à chaque appelant de modifier arbitrairement tous les champs. Identifiez relecteur et vérification du rollout.",
      ),
      [
        l(
          "Separate an approved capability from a free-form manifest escape.",
          "Distinguez capacité approuvée et échappatoire de manifeste libre.",
        ),
        l(
          "Quota, node capacity and ownership still apply.",
          "Quota, capacité des nœuds et responsabilités restent applicables.",
        ),
      ],
      [
        p(
          "Collect representative usage and the SLO impact, review a versioned new tier with capacity/security owners, add request-limit and selector tests, and document migration plus rollback. Keep special workloads in an explicitly supported exception path with an owner and expiry/review date. Do not silently turn off quota or non-root constraints for all consumers.",
          "Collectez usage représentatif et effet sur le SLO, faites relire un palier versionné par responsables capacité/sécurité, ajoutez tests request-limit et sélecteurs puis documentez migration et rollback. Placez les workloads particuliers dans une exception supportée avec propriétaire et date de revue. Ne désactivez pas silencieusement quota ou contraintes non-root pour tous les consommateurs.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code(
      "bash",
      'k delete namespace lab-platform\nprintf "Inspect and manually remove the private rendered document directory: %s\\n" "$LAB_PLATFORM_DIR"',
    ),
    p(
      "Deleting this namespace removes all objects rendered here and all other data you put in it. The renderer created no CRD, ClusterRole or external service. Keep the generated JSON for review only if it contains no private configuration.",
      "Supprimer ce namespace retire les objets générés et toute autre donnée que vous y avez placée. Le générateur n’a créé ni CRD, ni ClusterRole, ni service externe. Conservez le JSON pour relecture seulement s’il ne contient pas de configuration privée.",
    ),
  ],
};
