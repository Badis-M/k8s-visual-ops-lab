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
import manifest from "../../../lab/level-4/controllers-internals/reporters.yaml?raw";

export const controllersInternals: Chapter = {
  id: "controllers-internals",
  level: 4,
  minutes: 60,
  title: l("How controllers work internally", "Le fonctionnement interne des contrôleurs"),
  summary: l(
    "Connect list/watch caches, work queues and level-based reconciliation to visible resources, retries and ownership.",
    "Relier caches list/watch, files de travail et réconciliation par état aux ressources, reprises et responsabilités observables.",
  ),
  prerequisites: ["reconciliation", "api-architecture"],
  related: ["custom-controllers", "operators", "control-plane-scale"],
  blocks: [
    h("objectives", "Reason about repeated execution", "Raisonner sur l’exécution répétée"),
    list(
      l(
        "Explain why one event is not one guaranteed business operation and why reconcile starts from current state.",
        "Expliquer pourquoi un événement n’est pas une opération métier garantie et pourquoi reconcile relit l’état courant.",
      ),
      l(
        "Follow ownership across Deployment, ReplicaSet and Pod, then locate delayed convergence without confusing controller responsibilities.",
        "Suivre les propriétaires Deployment, ReplicaSet et Pod puis localiser une convergence lente sans confondre les responsabilités.",
      ),
    ),
    h(
      "model",
      "Notifications schedule work; state determines action",
      "Les notifications planifient ; l’état décide",
    ),
    p(
      "An informer establishes a local cache from list/watch observations. Event handlers enqueue a resource key, commonly namespace/name. A work queue can coalesce repeated notifications for the same key; it is not an exactly-once ledger of every change. A worker later reads current desired and observed state and computes the smallest useful action. The controller must converge even if startup misses an earlier event or another event arrives while it is working. This is level-based reconciliation rather than a script that assumes a particular transition occurred.",
      "Un informer construit un cache local depuis list/watch. Les handlers mettent en file une clé, souvent namespace/name. La file peut regrouper les notifications répétées d’une clé ; elle n’est pas un registre garantissant chaque changement une fois. Un worker lit ensuite états désiré et observé puis calcule l’action utile minimale. Le contrôleur doit converger même si son démarrage manque un ancien événement ou si un autre arrive pendant son travail. C’est une réconciliation par état, pas un script présumant une transition particulière.",
    ),
    p(
      "Caches trade lower API load for potentially stale reads. Successful writes are not guaranteed to appear immediately in the cached client. Kubernetes resourceVersion conflicts protect updates against stale objects; returning an error lets the queue retry with backoff. A positive RequeueAfter requests a future observation without blocking a worker on sleep. NotFound for a deleted primary resource is often a normal terminal outcome. Never swallow an authorization or transport error as if the resource simply disappeared.",
      "Le cache réduit la charge API au prix de lectures potentiellement anciennes. Une écriture réussie n’apparaît pas forcément immédiatement dans le client cache. Les conflits resourceVersion protègent les mises à jour ; renvoyer l’erreur permet une reprise avec backoff. Un RequeueAfter positif demande une observation future sans immobiliser le worker dans sleep. NotFound pour une ressource primaire supprimée est souvent une fin normale. Ne transformez jamais une erreur de droits ou de transport en disparition supposée.",
    ),
    {
      type: "fields",
      rows: [
        {
          field: "Desired state",
          text: l(
            "A user owns the Deployment replica count; the ReplicaSet controller does not rewrite that intent after a Pod deletion.",
            "L’utilisateur porte l’effectif désiré du Deployment ; le contrôleur ReplicaSet ne réécrit pas cette intention après suppression d’un Pod.",
          ),
        },
        {
          field: "Owner references",
          text: l(
            "A Pod belongs to a ReplicaSet, itself owned by a Deployment. UID-based ownership distinguishes replacement objects with reused names.",
            "Un Pod appartient à un ReplicaSet, lui-même au Deployment. La propriété par UID distingue les objets recréés sous le même nom.",
          ),
        },
        {
          field: "Status and conditions",
          text: l(
            "Report what a controller observed, with the relevant generation. Reporting success must not mutate desired input or create a self-triggered update loop.",
            "Rapportent l’observation et sa génération. Publier un succès ne doit ni modifier l’entrée désirée ni produire une boucle d’écriture auto-déclenchée.",
          ),
        },
      ],
    },
    ...labContext("lab-controllers"),
    h(
      "exercise",
      "Observe a chain of independent loops",
      "Observer une chaîne de boucles indépendantes",
    ),
    code("yaml", manifest, "lab/level-4/controllers-internals/reporters.yaml"),
    steps(
      {
        title: l("Start and trace ownership", "Démarrer et retracer les propriétaires"),
        code: {
          lang: "bash",
          code: "k -n lab-controllers apply -f lab/level-4/controllers-internals/reporters.yaml\nk -n lab-controllers rollout status deployment/reporters --timeout=120s\nk -n lab-controllers get deployment,replicasets,pods -o wide\nk -n lab-controllers get pods -l app=reconcile-reporter -o custom-columns='POD:.metadata.name,UID:.metadata.uid,OWNER:.metadata.ownerReferences[0].name'\nk -n lab-controllers get replicasets -l app=reconcile-reporter -o yaml",
        },
        explain: l(
          "The Deployment controller manages ReplicaSets; their controller creates Pods. The scheduler assigns nodes and kubelet starts containers. Neither controller itself directly runs the container process.",
          "Le contrôleur Deployment gère les ReplicaSets ; leur contrôleur crée les Pods. Le scheduler affecte les nœuds et kubelet démarre les conteneurs. Aucun de ces contrôleurs ne lance directement le processus conteneur.",
        ),
        expected: {
          text: l(
            "Expected: two running reporter Pods with the same ReplicaSet owner. A readiness-free sleep container only proves basic lifecycle, not useful service health.",
            "Attendu : deux Pods reporter actifs avec le même propriétaire ReplicaSet. Un conteneur sleep sans readiness prouve seulement le cycle de vie, pas une santé de service utile.",
          ),
        },
      },
      {
        title: l(
          "Delete an observation, keep the intent",
          "Supprimer une observation en conservant l’intention",
        ),
        code: {
          lang: "bash",
          code: "LAB_REPORTER_POD=$(k -n lab-controllers get pod -l app=reconcile-reporter -o jsonpath='{.items[0].metadata.name}')\nk -n lab-controllers delete pod \"$LAB_REPORTER_POD\"\nk -n lab-controllers rollout status deployment/reporters --timeout=120s\nk -n lab-controllers get pods -l app=reconcile-reporter\nk -n lab-controllers describe replicasets -l app=reconcile-reporter",
        },
        explain: l(
          "Observe a replacement with a new UID. You did not tell the controller 'create one Pod after this exact event'; it recomputed the gap against two desired replicas. Events are useful diagnostics but have finite retention and are not the authoritative desired-state database.",
          "Observez un remplacement au nouvel UID. Vous n’avez pas ordonné « créer un Pod après cet événement exact » ; le contrôleur a recalculé l’écart avec deux réplicas désirés. Les Events aident au diagnostic mais expirent et ne constituent pas la base de l’état désiré.",
        ),
      },
      {
        title: l(
          "Change the actual desired generation",
          "Changer la génération réellement désirée",
        ),
        code: {
          lang: "bash",
          code: "k -n lab-controllers scale deployment/reporters --replicas=3\nk -n lab-controllers get deployment reporters -o yaml\nk -n lab-controllers rollout status deployment/reporters --timeout=120s",
        },
        explain: l(
          "Compare metadata.generation with status.observedGeneration and desired versus ready replicas. A short lag is normal. Scaling does not change spec.template, so it need not create a new ReplicaSet revision even though the Deployment's desired-state generation changes.",
          "Comparez metadata.generation et status.observedGeneration puis réplicas désirés et prêts. Un bref décalage est normal. Le scaling ne modifie pas spec.template : il ne crée donc pas nécessairement de nouvelle révision ReplicaSet même si la génération désirée du Deployment change.",
        ),
      },
    ),
    h(
      "failure",
      "Idempotence includes side effects and status",
      "L’idempotence inclut effets de bord et statut",
    ),
    p(
      "A repeated reconciliation should find the same desired objects and avoid unnecessary writes. Never create a random child name on every call. Check the child's controller UID before updating it; matching a name is not permission to adopt someone else's object. Compare status before writing so a status event does not generate an endless update loop. External effects, such as charging an account or creating a cloud database, need their own stable idempotency keys and recovery state; an in-memory boolean is lost on process restart.",
      "Une réconciliation répétée doit retrouver les mêmes objets désirés et éviter les écritures inutiles. Ne créez pas un nom enfant aléatoire à chaque appel. Vérifiez l’UID du propriétaire avant toute mise à jour : un nom identique n’autorise pas à adopter un objet étranger. Comparez le statut avant écriture pour éviter une boucle infinie. Les effets externes, comme facturer ou créer une base cloud, exigent leurs propres clés d’idempotence et état de récupération ; un booléen mémoire disparaît au redémarrage.",
    ),
    note(
      "warn",
      l(
        "Finalizers require an actual cleanup contract",
        "Un finalizer exige un véritable contrat de nettoyage",
      ),
      l(
        "A finalizer delays object deletion while its responsible controller completes cleanup. It is useful for external resources the garbage collector cannot manage; it is not automatically needed for ordinary owned child objects. If the controller is absent or cleanup fails, deletion can remain blocked. Removing finalizers blindly can leak resources or violate recovery assumptions.",
        "Un finalizer retarde la suppression pendant le nettoyage du contrôleur responsable. Il est utile pour des ressources externes hors garbage collector ; il n’est pas automatiquement nécessaire pour des enfants ordinaires possédés. Si le contrôleur manque ou si le nettoyage échoue, la suppression reste bloquée. Retirer aveuglément les finalizers peut abandonner des ressources ou casser les hypothèses de récupération.",
      ),
    ),
    h("quiz", "Check the reconciliation model", "Vérifier le modèle de réconciliation"),
    quiz(
      question(
        l(
          "Three updates enqueue the same key before a worker runs. Must it replay all three transitions?",
          "Trois mises à jour placent la même clé avant le worker. Doit-il rejouer les trois transitions ?",
        ),
        [
          l("No, it reconciles the current state", "Non, il réconcilie l’état courant"),
          l(
            "Yes, every intermediate event is a transaction",
            "Oui, chaque événement est une transaction",
          ),
          l("It must recreate the cluster", "Il doit recréer le cluster"),
        ],
        0,
        l(
          "Queues can coalesce keys; correctness must not rely on an exact event sequence.",
          "La file peut regrouper les clés ; la justesse ne doit pas dépendre d’une séquence exacte.",
        ),
      ),
      question(
        l(
          "Why avoid sleep inside Reconcile while waiting for a child?",
          "Pourquoi éviter sleep dans Reconcile en attendant un enfant ?",
        ),
        [
          l("Go forbids timers", "Go interdit les timers"),
          l(
            "It blocks a worker; a watch or RequeueAfter schedules observation efficiently",
            "Cela bloque un worker ; watch ou RequeueAfter planifie l’observation",
          ),
          l("It changes the namespace", "Cela change le namespace"),
        ],
        1,
        l(
          "Workers should make bounded progress and release capacity rather than hold it during long waits.",
          "Les workers doivent progresser de manière bornée puis libérer leur capacité durant les longues attentes.",
        ),
      ),
      question(
        l(
          "A child name matches but its controller UID differs. What is safe?",
          "Le nom enfant correspond mais l’UID propriétaire diffère. Que faire ?",
        ),
        [
          l("Silently replace ownership", "Remplacer discrètement le propriétaire"),
          l("Delete the child immediately", "Supprimer immédiatement l’enfant"),
          l(
            "Report the ownership conflict and preserve the foreign object",
            "Signaler le conflit et conserver l’objet étranger",
          ),
        ],
        2,
        l(
          "Resource naming is not authorization to steal ownership.",
          "Le nom d’une ressource n’autorise pas à voler sa propriété.",
        ),
      ),
    ),
    h("challenge", "Describe a safe reconcile transaction", "Décrire une réconciliation sûre"),
    challenge(
      l("A controller crash after a write", "Un crash après écriture"),
      l(
        "The controller creates an owned child, then crashes before recording success. Describe the next reconciliation and explain why it must neither duplicate the child nor claim success solely from a remembered event.",
        "Le contrôleur crée un enfant puis crashe avant de publier le succès. Décrivez la réconciliation suivante et expliquez pourquoi elle ne doit ni dupliquer l’enfant ni déclarer un succès à partir d’un événement mémorisé.",
      ),
      [
        l(
          "Use a deterministic child name and verify owner UID.",
          "Utilisez un nom enfant déterministe et vérifiez l’UID propriétaire.",
        ),
        l(
          "Desired-object existence and actual workload readiness are separate observations.",
          "Existence de l’objet désiré et readiness du workload sont deux observations.",
        ),
      ],
      [
        p(
          "Read the primary resource and the deterministic child again. If the child is owned by this primary UID, compare and reconcile only managed fields. Handle a stale-create AlreadyExists or update Conflict by returning an error for a fresh retry. Recompute conditions from current child state and patch status only if changed. The next custom-controller chapter implements these boundaries and tests repeated reconciliations without a cluster.",
          "Relisez la ressource primaire et l’enfant déterministe. Si cet enfant appartient à son UID, comparez puis réconciliez seulement les champs gérés. Traitez AlreadyExists d’une création périmée ou Conflict d’une mise à jour par une erreur donnant lieu à une reprise fraîche. Recalculez les conditions depuis l’état enfant et ne modifiez le statut que s’il change. Le chapitre de contrôleur personnalisé implémente ces frontières et teste les répétitions sans cluster.",
        ),
      ],
    ),
    h("cleanup", "Cleanup and evidence boundary", "Nettoyage et frontière de preuve"),
    code("bash", "k delete namespace lab-controllers"),
    p(
      "Observed replacement demonstrates the standard workload loops. It does not expose private controller memory, prove exactly-once external effects or benchmark queue throughput. A fake-client test, a real API integration test and a runtime failure experiment establish different properties.",
      "Le remplacement observé démontre les boucles standard. Il n’expose pas leur mémoire interne, ne prouve pas l’unicité des effets externes et ne mesure pas le débit de file. Un faux client, un test API réel et une expérience de panne établissent des propriétés différentes.",
    ),
  ],
};
