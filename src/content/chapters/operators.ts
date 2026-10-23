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
import paused from "../../../lab/level-4/operators/paused.yaml?raw";
import rbac from "../../../lab/level-4/custom-controllers/greeting-operator/config/rbac.yaml?raw";

export const operators: Chapter = {
  id: "operators",
  level: 4,
  minutes: 65,
  title: l(
    "The Operator pattern: encode an operational policy",
    "Le pattern Operator : encoder une politique opérationnelle",
  ),
  summary: l(
    "Turn a controller into an understandable operational API, exercise pause/resume and owned-child recovery, and state the limits of its lifecycle policy.",
    "Transformer un contrôleur en API opérationnelle compréhensible, exercer pause/reprise et récupération d’enfant et poser les limites de sa politique de cycle de vie.",
  ),
  prerequisites: ["custom-controllers", "rbac-advanced"],
  related: ["kubebuilder-operator", "backup-dr", "platform-engineering"],
  blocks: [
    h(
      "objectives",
      "Specify behavior before granting authority",
      "Spécifier le comportement avant de donner les droits",
    ),
    list(
      l(
        "Distinguish packaging resources from continually operating an application-specific contract.",
        "Distinguer empaquetage de ressources et exploitation continue d’un contrat applicatif.",
      ),
      l(
        "Define pause, readiness, drift repair, ownership and deletion semantics that a user can predict.",
        "Définir pause, readiness, réparation, propriété et suppression de manière prévisible.",
      ),
    ),
    h(
      "model",
      "Operational knowledge belongs in the API and loop",
      "La connaissance opérationnelle appartient à l’API et à la boucle",
    ),
    p(
      "An Operator applies the controller pattern to operational knowledge about a specific application. A CRD plus an empty reconcile function is not that knowledge. The Greeting project deliberately offers a small contract: serve a plain-text message with a bounded replica count, repair managed-child drift, expose current-generation readiness and allow an explicit pause. It does not operate a distributed database, perform backups or upgrade arbitrary software. The value is predictable policy, not the Operator label itself.",
      "Un Operator applique le pattern contrôleur à la connaissance opérationnelle d’une application. Une CRD avec un reconcile vide ne porte pas cette connaissance. Greeting offre volontairement un petit contrat : servir un texte avec effectif borné, réparer ses enfants, publier une readiness de génération courante et permettre une pause. Il n’exploite ni base distribuée, ni sauvegardes, ni mises à jour arbitraires. Sa valeur vient d’une politique prévisible, pas de son étiquette Operator.",
    ),
    {
      type: "table",
      head: [
        l("Input or event", "Entrée ou événement"),
        l("Defined behavior", "Comportement défini"),
      ],
      rows: [
        [
          l("Message or replica change", "Message ou effectif modifié"),
          l(
            "Reconcile owned objects; report Progressing until the current Deployment generation is available",
            "Réconcilier les objets possédés ; Progressing jusqu’à disponibilité de la génération Deployment courante",
          ),
        ],
        [
          l("paused: true", "paused: true"),
          l(
            "Leave children unchanged; Ready false/Paused; previous ready count may be stale",
            "Conserver les enfants ; Ready false/Paused ; l’ancien effectif prêt peut être périmé",
          ),
        ],
        [
          l("Matching name with foreign ownership", "Nom correspondant mais propriétaire étranger"),
          l(
            "Preserve the object and return/report a conflict",
            "Conserver l’objet puis renvoyer/signaler le conflit",
          ),
        ],
        [
          l("Delete the Greeting", "Supprimer Greeting"),
          l(
            "Stop creating children; owner references allow Kubernetes garbage collection",
            "Arrêter les créations ; les références permettent le garbage collector Kubernetes",
          ),
        ],
      ],
    },
    p(
      "observedGeneration records the desired generation the operator evaluated; it is not a promise that every requested action completed. The Ready condition carries the same generation and explains Progressing, Paused or failure. During pause, retaining a last observed replica count is more honest than fabricating zero; that observation is explicitly allowed to become stale. A process health endpoint only proves responsiveness. Users need per-resource conditions, useful errors and a recovery procedure as well as a running controller Pod.",
      "observedGeneration désigne la génération évaluée, pas la promesse que toute action demandée est achevée. La condition Ready porte cette génération et explique Progressing, Paused ou l’échec. En pause, conserver le dernier compte observé est plus honnête qu’inventer zéro ; l’observation peut explicitement devenir périmée. La santé HTTP du processus prouve seulement sa réponse. Les utilisateurs ont aussi besoin de conditions par ressource, d’erreurs utiles et d’une procédure de récupération.",
    ),
    h(
      "authority",
      "The manager and its operand have different permissions",
      "Le manager et son application ont des droits distincts",
    ),
    code("yaml", rbac, "lab/level-4/custom-controllers/greeting-operator/config/rbac.yaml"),
    p(
      "The controller account can observe Greeting, patch its status, reconcile three child kinds and maintain a leader-election Lease in one namespace. Permission on greetings/finalizers supports controller owner references with deletion blocking; this example still adds no custom finalizer. CRD installation is a separate administrator permission, not granted to the running controller. The HTTP workload receives no API token. Restricting the cache does not itself enforce RBAC, and a local manager using your kubeconfig retains that identity's rights.",
      "Le compte contrôleur peut observer Greeting, modifier son statut, réconcilier trois kinds et maintenir un Lease d’élection dans un namespace. Le droit greetings/finalizers permet les références propriétaires bloquant une suppression ; aucun finalizer personnalisé n’est ajouté. Installer la CRD demande des droits administrateur distincts, absents du contrôleur. Le workload HTTP ne reçoit pas de token API. Limiter le cache n’impose pas le RBAC ; un manager local conserve les droits de son identité kubeconfig.",
    ),
    ...labContext("lab-operator"),
    h(
      "exercise",
      "Run the shared implementation, then pause its policy",
      "Exécuter l’implémentation partagée puis suspendre sa politique",
    ),
    steps(
      {
        title: l(
          "Build and start the selected local manager",
          "Construire et démarrer le manager local choisi",
        ),
        code: {
          lang: "bash",
          code: 'umask 077\nLAB_OPERATOR_BUILD_DIR=$(mktemp -d)\nprintf \'Private build directory: %s\\n\' "$LAB_OPERATOR_BUILD_DIR"\nGOTOOLCHAIN=local GOMAXPROCS=2 go -C lab/level-4/custom-controllers/greeting-operator test -p 2 ./...\nGOTOOLCHAIN=local GOMAXPROCS=2 go -C lab/level-4/custom-controllers/greeting-operator build -o "$LAB_OPERATOR_BUILD_DIR/greeting-controller" ./cmd\nk apply -f lab/level-4/crds/greetings.yaml\nk wait --for=condition=Established crd/greetings.learning.k8svisual.dev --timeout=60s\n"$LAB_OPERATOR_BUILD_DIR/greeting-controller" --context kind-k8s-ops-lab --namespace lab-operator',
        },
        explain: l(
          "Review the shared CRD before applying, as in its chapter. Run this foreground process in one terminal. The full README also provides an in-cluster image path with the displayed restricted Role; choose one path, not both. Neither path is executed by the website.",
          "Examinez la CRD partagée avant application comme dans son chapitre. Gardez ce processus au premier plan. Le README fournit aussi un parcours image embarquée avec le Role affiché ; choisissez un seul parcours. Aucun n’est exécuté par le site.",
        ),
      },
      {
        title: l(
          "Create and observe the first healthy intent",
          "Créer puis observer la première intention saine",
        ),
        code: {
          lang: "bash",
          code: "alias k='kubectl --context kind-k8s-ops-lab'\nLAB_GREETING_GENERATION=$(kubectl --context kind-k8s-ops-lab -n lab-operator apply -f lab/level-4/crds/hello.yaml -o jsonpath='{.metadata.generation}')\nkubectl --context kind-k8s-ops-lab -n lab-operator wait --for=jsonpath='{.status.observedGeneration}'=\"$LAB_GREETING_GENERATION\" greeting/hello --timeout=180s\nkubectl --context kind-k8s-ops-lab -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s\nkubectl --context kind-k8s-ops-lab -n lab-operator get configmap hello-content -o yaml\nkubectl --context kind-k8s-ops-lab -n lab-operator apply -f lab/level-4/operators/paused.yaml\nkubectl --context kind-k8s-ops-lab -n lab-operator get greeting hello -o yaml\nkubectl --context kind-k8s-ops-lab -n lab-operator get deployment hello -o yaml",
        },
        explain: l(
          "Before pause, the generation returned by apply must be observed and Ready. This prevents a previous true condition from validating a newly applied spec. Read the old ConfigMap before pause. After reconciliation of the paused input, status should say Paused while message and replicas in the children remain the previous values. A small observation lag is normal; compare the condition's observedGeneration with metadata.generation.",
          "Avant la pause, la génération retournée par apply doit être observée et Ready. Une ancienne condition vraie ne valide ainsi pas une spec nouvellement appliquée. Lisez la ConfigMap avant pause. Après prise en compte de l’entrée suspendue, le statut doit indiquer Paused tandis que message et effectif enfants restent anciens. Un bref délai est normal ; comparez observedGeneration de la condition à metadata.generation.",
        ),
        expected: {
          text: l(
            "Expected: desired Greeting requests two replicas and the new message, but managed children retain the previous configuration while paused.",
            "Attendu : Greeting désire deux réplicas et un nouveau message, mais ses enfants conservent l’ancienne configuration pendant la pause.",
          ),
        },
      },
    ),
    code("yaml", paused, "lab/level-4/operators/paused.yaml"),
    h(
      "recovery",
      "Resume and verify the requested generation",
      "Reprendre et vérifier la génération demandée",
    ),
    code(
      "bash",
      `LAB_GREETING_GENERATION=$(k -n lab-operator patch greeting hello --type=merge -p '{"spec":{"paused":false}}' -o jsonpath='{.metadata.generation}')\nk -n lab-operator wait --for=jsonpath='{.status.observedGeneration}'="$LAB_GREETING_GENERATION" greeting/hello --timeout=180s\nk -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s\nk -n lab-operator rollout status deployment/hello --timeout=180s\nk -n lab-operator get greeting hello -o yaml\nk -n lab-operator port-forward service/hello 8082:8080`,
    ),
    p(
      "Use curl --fail http://127.0.0.1:8082/ in another terminal and inspect the new message. The generation wait first proves that the Operator observed this patch; Ready must then describe its current workload. rollout status alone can succeed before the Operator applies the new revision: confirm Greeting condition generation, child replica count and the HTTP result. If a foreign-object conflict appears, inspect owners and stop; do not make the operator more privileged or steal the object. Recovery should resolve the intended ownership boundary explicitly.",
      "Utilisez curl --fail http://127.0.0.1:8082/ dans un autre terminal et vérifiez le message. L’attente de génération établit d’abord que l’Operator a observé ce patch ; Ready doit ensuite décrire son workload courant. rollout status seul peut réussir avant que l’Operator applique la nouvelle révision. Confirmez génération de condition, effectif enfant et HTTP. Face à un conflit étranger, inspectez les propriétaires et arrêtez : n’augmentez pas les privilèges pour voler l’objet. La récupération doit résoudre explicitement cette frontière.",
    ),
    note(
      "warn",
      l(
        "An operational policy has deliberate omissions",
        "Une politique opérationnelle possède des limites explicites",
      ),
      l(
        "This stateless example has no backup/restore protocol, external credentials, schema migrations, conversion webhook or automatic dependency upgrade. Leader election serializes active managers but does not replicate application data or establish physical HA. A future stateful Operator needs tested recovery, upgrade compatibility and external cleanup idempotence; a finalizer must never be added without its failure and retry design.",
        "Cet exemple sans état n’a ni protocole de sauvegarde/restauration, identifiants externes, migrations, webhook de conversion ou mise à jour automatique. L’élection sérialise les managers sans répliquer des données ni établir une HA physique. Un futur Operator avec état exige récupération testée, compatibilité et nettoyage externe idempotent ; aucun finalizer ne doit être ajouté sans conception des échecs et reprises.",
      ),
    ),
    h("quiz", "Check the operational promises", "Vérifier les promesses opérationnelles"),
    quiz(
      question(
        l(
          "What does Paused mean for readyReplicas here?",
          "Que signifie Paused pour readyReplicas ici ?",
        ),
        [
          l(
            "It is the retained last observation and may be stale",
            "C’est la dernière observation conservée, potentiellement périmée",
          ),
          l("It proves zero running Pods", "Cela prouve zéro Pod actif"),
          l(
            "It proves all future generations are healthy",
            "Cela prouve la santé des générations futures",
          ),
        ],
        0,
        l(
          "Status must expose what is actually known; pause stops maintenance of child observations.",
          "Le statut doit exposer ce qui est connu ; la pause arrête la maintenance des observations enfants.",
        ),
      ),
      question(
        l(
          "Why not give the controller permission to install CRDs?",
          "Pourquoi ne pas autoriser ce contrôleur à installer des CRD ?",
        ),
        [
          l("CRDs have no schema", "Les CRD n’ont pas de schéma"),
          l(
            "It needs only its already-installed namespaced API and children",
            "Il a seulement besoin de son API déjà installée et des enfants",
          ),
          l(
            "A ServiceAccount cannot use any custom API",
            "Une ServiceAccount ne peut utiliser d’API personnalisée",
          ),
        ],
        1,
        l(
          "Separate installation authority from steady-state operational authority.",
          "Séparez droits d’installation et droits d’exploitation courante.",
        ),
      ),
      question(
        l(
          "Does a healthy manager Pod prove a database restore is available?",
          "Un Pod manager sain prouve-t-il qu’une restauration de base existe ?",
        ),
        [
          l("Yes, the Operator name guarantees it", "Oui, le nom Operator le garantit"),
          l("Yes, leader election performs backups", "Oui, l’élection sauvegarde"),
          l(
            "No, such a protocol must be explicitly implemented and tested",
            "Non, ce protocole doit être implémenté et testé explicitement",
          ),
        ],
        2,
        l(
          "Do not infer operational capabilities beyond the implemented contract.",
          "N’inférez aucune capacité au-delà du contrat implémenté.",
        ),
      ),
    ),
    h(
      "challenge",
      "Delete an owned child without changing intent",
      "Supprimer un enfant sans changer l’intention",
    ),
    challenge(
      l("A missing configuration is repaired", "Une configuration absente est réparée"),
      l(
        "After resuming, stop port-forward and delete only the operator-owned hello-content ConfigMap in this disposable namespace. Predict recovery and verify its owner UID, message and Greeting condition. Contrast this with deleting the Greeting itself.",
        "Après reprise, arrêtez port-forward puis supprimez seulement la ConfigMap possédée hello-content dans ce namespace jetable. Prédisez la réparation puis vérifiez propriétaire, message et condition. Comparez avec la suppression de Greeting.",
      ),
      [
        l(
          "The child watch requeues its owner; deterministic naming recreates the missing child.",
          "Le watch enfant remet son propriétaire en file ; le nom déterministe permet de recréer l’enfant.",
        ),
        l(
          "Deleting the owner removes the desired intent rather than creating another gap to repair.",
          "Supprimer le propriétaire retire l’intention au lieu de créer un écart à réparer.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-operator delete configmap hello-content\nk -n lab-operator get configmap hello-content -o yaml\nk -n lab-operator get greeting hello -o yaml",
        ),
        p(
          "The first read may briefly return NotFound; retry observation rather than assuming creation is synchronous. The controller should recreate owned content for the current message. A new ConfigMap UID is expected. Deleting Greeting instead makes its next Get return NotFound, so no new children are created; Kubernetes can collect its owned children. No finalizer is needed because this example owns no external resource requiring a separate teardown.",
          "La première lecture peut brièvement renvoyer NotFound : réessayez l’observation sans supposer une création synchrone. Le contrôleur doit recréer le contenu courant avec un nouvel UID de ConfigMap. Supprimer Greeting produit au contraire NotFound au prochain Get, donc aucune nouvelle création ; Kubernetes peut retirer ses enfants. Aucun finalizer n’est nécessaire car aucune ressource externe ne demande un démontage distinct.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Stop the chosen manager and remove the dedicated namespace",
      "Arrêter le manager choisi et retirer le namespace dédié",
    ),
    p(
      "Stop a local manager with Ctrl+C; an in-cluster manager disappears with its namespace. Stop any port-forward. Namespace deletion removes the sample, child objects, Lease and local Role bindings, but leaves the shared CRD. Follow the CRD chapter's global instance check before deleting that definition. After stopping the local manager, inspect and manually remove only the printed LAB_OPERATOR_BUILD_DIR.",
      "Arrêtez le manager local avec Ctrl+C ; le manager embarqué disparaît avec son namespace. Arrêtez les port-forward. Le namespace supprime exemple, enfants, Lease et droits locaux mais conserve la CRD partagée. Suivez l’inventaire global du chapitre CRD avant de supprimer cette définition. Après arrêt du manager local, examinez puis retirez uniquement LAB_OPERATOR_BUILD_DIR affiché.",
    ),
    code("bash", "k delete namespace lab-operator"),
  ],
};
