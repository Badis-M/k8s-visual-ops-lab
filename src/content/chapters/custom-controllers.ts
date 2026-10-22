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
import reconciler from "../../../lab/level-4/custom-controllers/greeting-operator/internal/controller/greeting_controller.go?raw";
import sample from "../../../lab/level-4/crds/hello.yaml?raw";

const reconcilePath = reconciler.slice(
  reconciler.indexOf("func (r *GreetingReconciler) Reconcile("),
  reconciler.indexOf("\nfunc labels("),
);
const ownershipPath = reconciler.slice(
  reconciler.indexOf("func (r *GreetingReconciler) own("),
  reconciler.indexOf("\nfunc (r *GreetingReconciler) ensureChildren("),
);
const statusPath = reconciler.slice(
  reconciler.indexOf("func (r *GreetingReconciler) publishStatus("),
  reconciler.indexOf("\nfunc (r *GreetingReconciler) SetupWithManager("),
);

export const customControllers: Chapter = {
  id: "custom-controllers",
  level: 4,
  minutes: 90,
  title: l(
    "Writing an idempotent custom controller",
    "Écrire un contrôleur personnalisé idempotent",
  ),
  summary: l(
    "Build and test a complete typed Greeting reconciler that owns a web workload, reports observed state, preserves foreign objects and returns errors for safe retries.",
    "Construire et tester un réconciliateur Greeting typé complet qui possède un workload web, publie l’observation, conserve les objets étrangers et renvoie les erreurs à reprendre.",
  ),
  prerequisites: ["crds", "controllers-internals"],
  related: ["operators", "kubebuilder-operator", "api-extension"],
  heavy: l(
    "Go module downloads and compilation need disk, CPU and network on first use. Unit tests use a fake client and never start a cluster.",
    "Téléchargements Go et compilation demandent disque, CPU et réseau au premier passage. Les tests utilisent un faux client sans démarrer de cluster.",
  ),
  blocks: [
    h(
      "objectives",
      "Turn the reconcile contract into code",
      "Transformer le contrat de réconciliation en code",
    ),
    list(
      l(
        "Implement deterministic owned children with explicit managed fields and a separate status path.",
        "Implémenter des enfants déterministes possédés, des champs gérés explicites et une voie de statut distincte.",
      ),
      l(
        "Test repeated calls, foreign ownership, readiness generations and conflict recovery without inventing a running application.",
        "Tester répétitions, propriété étrangère, générations de readiness et récupération d’un conflit sans inventer une application exécutée.",
      ),
    ),
    h(
      "project",
      "One complete project, shared across three lessons",
      "Un projet complet partagé entre trois leçons",
    ),
    p(
      "The checked-in project lives in lab/level-4/custom-controllers/greeting-operator. It contains typed API registration and generated deepcopy code, a full reconciler, executable manager, resource helpers, fake-client tests, pinned go.mod/go.sum, generation Makefile, Dockerfile and namespaced deployment/RBAC. The next Operator and Kubebuilder lessons reuse it instead of maintaining three divergent copies. The deliberate baseline is Go 1.25.3+, controller-runtime 0.23.1 and Kubernetes libraries 0.35.0.",
      "Le projet versionné se trouve dans lab/level-4/custom-controllers/greeting-operator. Il comprend enregistrement API typé, deepcopy généré, réconciliateur complet, manager exécutable, helpers, tests fake, go.mod/go.sum fixés, génération, Dockerfile et déploiement/RBAC de namespace. Les leçons Operator et Kubebuilder réutilisent ce projet plutôt que trois copies divergentes. La base choisie est Go 1.25.3+, controller-runtime 0.23.1 et bibliothèques Kubernetes 0.35.0.",
    ),
    h(
      "implementation",
      "Read the real reconciliation path",
      "Lire le vrai parcours de réconciliation",
    ),
    p(
      "Read these three exact excerpts in order: orchestration, ownership, then status. Each is extracted from the complete checked-in Go file; the snippets are not standalone programs. The resource-building helpers, imports and manager remain in the shared project. First follow where Reconcile returns, then identify which branches can write.",
      "Lisez ces trois extraits exacts dans l’ordre : orchestration, propriété, puis statut. Ils proviennent du fichier Go complet versionné ; ce ne sont pas des programmes autonomes. Helpers de ressources, imports et manager restent dans le projet partagé. Suivez d’abord les retours de Reconcile puis repérez les branches capables d’écrire.",
    ),
    code(
      "go",
      reconcilePath,
      "lab/level-4/custom-controllers/greeting-operator/internal/controller/greeting_controller.go (Reconcile)",
    ),
    p(
      "Start with the primary object's current state. NotFound after deletion is normal; other read errors are returned. A deleting primary causes no new writes. paused explicitly stops child mutations and marks readiness unmaintained. Defensive validation mirrors important schema constraints because a fake client does not enforce OpenAPI. The CR name is bounded and Service-compatible, and message is treated as plain text escaped before being written to index.html.",
      "Commencez par l’état courant de la ressource primaire. NotFound après suppression est normal ; les autres erreurs sont renvoyées. Une primaire en suppression ne provoque aucune nouvelle écriture. paused arrête explicitement les mutations et indique une readiness non maintenue. La validation défensive reprend des contraintes importantes car le faux client n’applique pas OpenAPI. Le nom est borné et compatible Service ; le message est du texte échappé avant index.html.",
    ),
    code(
      "go",
      ownershipPath,
      "lab/level-4/custom-controllers/greeting-operator/internal/controller/greeting_controller.go (own)",
    ),
    p(
      "CreateOrUpdate reads or creates a deterministic ConfigMap, Deployment and Service. The mutation callback first checks the existing controller UID. An unowned or differently owned object with the same name is preserved, not silently adopted. The Deployment keeps stable selectors and a message hash in its template; changes therefore trigger a rollout. API-defaulted container fields are explicit so repeated reconciliation does not continuously remove defaults that the server restores. Service allocation fields are retained rather than overwritten.",
      "CreateOrUpdate lit ou crée ConfigMap, Deployment et Service aux noms déterministes. Le callback vérifie d’abord l’UID propriétaire existant. Un objet sans propriétaire ou d’un autre propriétaire est conservé, pas adopté discrètement. Le Deployment garde des sélecteurs stables et un hash du message dans son template pour déclencher les rollouts. Les champs conteneur avec défaut API sont explicites afin de ne pas retirer en boucle les valeurs rétablies par le serveur. Les champs d’allocation du Service sont conservés.",
    ),
    code(
      "go",
      statusPath,
      "lab/level-4/custom-controllers/greeting-operator/internal/controller/greeting_controller.go (publishStatus)",
    ),
    p(
      "Ready is not equivalent to child existence. The Deployment must have observed its current generation, with all desired replicas updated, ready and available. The Greeting status records the generation evaluated and patches only when observations differ, using an optimistic-lock patch. A progressing workload gets RequeueAfter rather than sleeping in the worker. Owned-child watches also schedule observations. Conflicts and transport failures are returned for queue backoff; failure to publish status is not swallowed behind a false success.",
      "Ready ne signifie pas seulement qu’un enfant existe. Le Deployment doit avoir observé sa génération courante, avec tous les réplicas désirés mis à jour, prêts et disponibles. Le statut Greeting indique la génération évaluée et change seulement si l’observation diffère, avec verrou optimiste. Un workload en progression reçoit RequeueAfter plutôt qu’un sleep du worker. Les watches enfants planifient aussi des observations. Conflits et erreurs de transport sont renvoyés au backoff ; un échec de statut n’est pas masqué par un faux succès.",
    ),
    h("offline", "Compile and test before a real API", "Compiler et tester avant une vraie API"),
    code(
      "bash",
      'umask 077\nLAB_OPERATOR_BUILD_DIR=$(mktemp -d)\nprintf \'Private build directory: %s\\n\' "$LAB_OPERATOR_BUILD_DIR"\ncd lab/level-4/custom-controllers/greeting-operator\nGOTOOLCHAIN=local go version\nGOTOOLCHAIN=local GOMAXPROCS=2 go test -p 2 ./...\nGOTOOLCHAIN=local GOMAXPROCS=2 go build -o "$LAB_OPERATOR_BUILD_DIR/greeting-controller" ./cmd\ncd ../../../..',
    ),
    note(
      "info",
      l("What fake tests establish", "Ce que prouvent les tests fake"),
      l(
        "Tests check desired objects, direct write-call idempotence, missing primaries, HTML escaping, invalid child names, ownership preservation, current-generation readiness, pause and an injected Conflict followed by a successful retry. A fake does not validate CRD schema, default API fields, elect a leader, deliver informer events or run garbage collection and Pods. envtest would add a real API server but still no kubelet; those are separate validation layers.",
        "Les tests vérifient objets désirés, absence d’appels d’écriture inutiles, primaire absente, échappement HTML, noms invalides, propriété, readiness de génération courante, pause et Conflict injecté suivi d’une reprise. Un fake ne valide ni schéma CRD, défauts API, élection, événements informer, garbage collection ou Pods. envtest ajouterait une vraie API mais toujours aucun kubelet : ce sont des niveaux distincts de validation.",
      ),
    ),
    ...labContext("lab-operator"),
    h("live", "Optional runtime observation", "Observation réelle optionnelle"),
    code("yaml", sample, "lab/level-4/crds/hello.yaml"),
    steps(
      {
        title: l(
          "Prepare the reviewed type and run one manager",
          "Préparer le type examiné et un manager",
        ),
        code: {
          lang: "bash",
          code: 'k apply -f lab/level-4/crds/greetings.yaml\nk wait --for=condition=Established crd/greetings.learning.k8svisual.dev --timeout=60s\n"$LAB_OPERATOR_BUILD_DIR/greeting-controller" --context kind-k8s-ops-lab --namespace lab-operator',
        },
        explain: l(
          "First apply the CRD ownership check from the preceding chapter. This foreground process uses your explicitly selected kubeconfig identity and watches one namespace. A namespaced cache does not reduce that identity's underlying permissions. Stop it with Ctrl+C when finished.",
          "Appliquez d’abord le contrôle de propriété de CRD du chapitre précédent. Ce processus utilise votre identité kubeconfig explicitement choisie et observe un namespace. Le cache ciblé ne réduit pas ses droits sous-jacents. Arrêtez-le avec Ctrl+C à la fin.",
        ),
      },
      {
        title: l(
          "Create intent from another terminal",
          "Créer l’intention depuis un autre terminal",
        ),
        code: {
          lang: "bash",
          code: "alias k='kubectl --context kind-k8s-ops-lab'\nkubectl --context kind-k8s-ops-lab -n lab-operator apply -f lab/level-4/crds/hello.yaml\nkubectl --context kind-k8s-ops-lab -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s\nkubectl --context kind-k8s-ops-lab -n lab-operator get greeting hello -o yaml\nkubectl --context kind-k8s-ops-lab -n lab-operator port-forward service/hello 8082:8080",
        },
        explain: l(
          "Use curl --fail http://127.0.0.1:8082/ from a third terminal. Port 8081 belongs to the local manager's health endpoint and 8080 may belong to this website.",
          "Lancez curl --fail http://127.0.0.1:8082/ depuis un troisième terminal. Le port 8081 appartient à la santé du manager local et 8080 peut servir ce site.",
        ),
        expected: {
          text: l(
            "Expected: hello-content, Deployment hello and Service hello share hello's owner UID; Ready becomes true after workload convergence and the page contains the declared greeting.",
            "Attendu : hello-content, Deployment hello et Service hello partagent l’UID propriétaire de hello ; Ready devient true après convergence et la page contient le message déclaré.",
          ),
        },
      },
    ),
    h(
      "diagnosis",
      "Fix the contract that actually failed",
      "Corriger le contrat réellement en échec",
    ),
    p(
      "For ReconcileFailed, inspect the returned cause, controller logs and child owner references. Do not remove another owner's reference as a repair. Forbidden needs a reviewed permission change; image or readiness problems belong to workload diagnosis. A stale observedGeneration means the latest intent is not yet reflected. Process health is only an HTTP responsiveness check, not evidence that this Greeting is Ready. The checked-in in-cluster alternative supplies a namespaced Role and a projected token; choose one manager path and follow its README instead of running arbitrary cluster-admin code.",
      "Pour ReconcileFailed, examinez cause, logs et propriétaires enfants. Ne retirez pas le propriétaire étranger pour réparer. Forbidden exige une revue des droits ; image et readiness relèvent du workload. Un observedGeneration ancien indique une intention non reflétée. La santé du processus teste seulement la réponse HTTP, pas Ready de ce Greeting. L’alternative embarquée fournit Role ciblé et token projeté ; choisissez un seul parcours selon le README plutôt qu’un code arbitraire en cluster-admin.",
    ),
    h("quiz", "Check controller safety", "Vérifier la sûreté du contrôleur"),
    quiz(
      question(
        l(
          "CreateOrUpdate finds a matching name with no owner. What does this project do?",
          "CreateOrUpdate trouve le même nom sans propriétaire. Que fait ce projet ?",
        ),
        [
          l("Reports a conflict and preserves it", "Signale un conflit et le conserve"),
          l("Automatically adopts it", "L’adopte automatiquement"),
          l("Deletes the namespace", "Supprime le namespace"),
        ],
        0,
        l(
          "An unowned existing object may belong to a human or another system; deterministic naming does not grant ownership.",
          "Un objet existant peut appartenir à un humain ou autre système ; un nom déterministe ne donne pas sa propriété.",
        ),
      ),
      question(
        l("Why compare status before patching?", "Pourquoi comparer le statut avant le patch ?"),
        [
          l("Status is forbidden on CRDs", "Le statut est interdit sur CRD"),
          l(
            "Avoid useless writes and self-triggered update loops",
            "Éviter écritures inutiles et boucles auto-déclenchées",
          ),
          l("To stop all child watches", "Pour arrêter tous les watches enfants"),
        ],
        1,
        l(
          "Stable observations should converge to no write, including unchanged conditions and timestamps.",
          "Une observation stable doit converger sans écriture, y compris conditions et horodatages inchangés.",
        ),
      ),
      question(
        l(
          "What does the fake-client readiness test not prove?",
          "Que ne prouve pas le test fake de readiness ?",
        ),
        [
          l(
            "The branch reacts to supplied Deployment status",
            "Que la branche réagit au statut fourni",
          ),
          l("The status generation is inspected", "Que la génération est inspectée"),
          l("A real HTTP Pod started successfully", "Qu’un vrai Pod HTTP a démarré"),
        ],
        2,
        l(
          "The test supplies observations; it never runs a kubelet or pulls the workload image.",
          "Le test fournit les observations sans exécuter kubelet ni télécharger l’image du workload.",
        ),
      ),
    ),
    h("challenge", "Repair a drifted owned child", "Réparer la dérive d’un enfant possédé"),
    challenge(
      l("The replica owner remains the Greeting", "Greeting reste responsable de l’effectif"),
      l(
        "With an optional live manager running, change only Greeting.spec.replicas to two and observe convergence. Explain why scaling its Deployment directly is a temporary drift and why an independent HPA would conflict with this controller's ownership.",
        "Avec un manager optionnel actif, passez seulement Greeting.spec.replicas à deux et observez la convergence. Expliquez pourquoi modifier directement le Deployment produit une dérive temporaire et pourquoi un HPA indépendant entrerait en conflit.",
      ),
      [
        l(
          "Change the public desired API instead of bypassing it.",
          "Modifiez l’API publique désirée au lieu de la contourner.",
        ),
        l(
          "The controller explicitly owns child spec.replicas.",
          "Le contrôleur possède explicitement spec.replicas enfant.",
        ),
      ],
      [
        code(
          "bash",
          `LAB_GREETING_GENERATION=$(k -n lab-operator patch greeting hello --type=merge -p '{"spec":{"replicas":2}}' -o jsonpath='{.metadata.generation}')\nk -n lab-operator wait --for=jsonpath='{.status.observedGeneration}'="$LAB_GREETING_GENERATION" greeting/hello --timeout=180s\nk -n lab-operator wait --for=condition=Ready greeting/hello --timeout=180s\nk -n lab-operator get greeting hello -o yaml\nk -n lab-operator rollout status deployment/hello --timeout=180s`,
        ),
        p(
          "Expected: two updated ready replicas and a status condition for the new Greeting generation. First wait for the exact generation returned by the patch: rollout status alone could finish against the previous Deployment before the custom controller updates it. Direct child scaling is repaired on reconciliation because desired replicas still come from Greeting. Supporting autoscaling needs an explicit scale API/ownership design rather than two controllers continuously undoing each other.",
          "Attendu : deux réplicas mis à jour et prêts avec une condition portant la nouvelle génération Greeting. Attendez d’abord la génération exacte retournée par le patch : rollout status seul pourrait réussir sur l’ancien Deployment avant sa modification par le contrôleur. Un scaling enfant direct est réparé car l’intention vient toujours de Greeting. Ajouter l’autoscaling exige une API scale et une responsabilité explicites plutôt que deux contrôleurs s’annulant continuellement.",
        ),
      ],
    ),
    h("cleanup", "Stop reconciliation before cleanup", "Arrêter la réconciliation avant nettoyage"),
    p(
      "Stop the local manager and port-forward with Ctrl+C. Delete only the dedicated namespace; it removes the sample instances and their children. The CRD is shared with the other extension lessons: remove it only after the cluster-wide instance check described in the CRD chapter. Compilation and unit tests require no such runtime cleanup. After stopping the manager, inspect and manually remove only LAB_OPERATOR_BUILD_DIR, the printed private build directory.",
      "Arrêtez manager et port-forward avec Ctrl+C. Supprimez seulement le namespace dédié avec ses instances et enfants. La CRD est partagée : ne la retirez qu’après le contrôle global d’instances décrit au chapitre CRD. Compilation et tests unitaires ne nécessitent aucun nettoyage réel. Après arrêt du manager, examinez puis retirez uniquement LAB_OPERATOR_BUILD_DIR, le dossier de build privé affiché.",
    ),
    code("bash", "k delete namespace lab-operator"),
  ],
};
