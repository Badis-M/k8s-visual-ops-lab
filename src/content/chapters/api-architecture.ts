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
import counter from "../../../lab/level-4/api-architecture/counter.yaml?raw";

export const apiArchitecture: Chapter = {
  id: "api-architecture",
  level: 4,
  minutes: 60,
  title: l("Kubernetes API architecture in depth", "L’architecture de l’API en profondeur"),
  summary: l(
    "Trace a request to persisted intent, distinguish object versions and field ownership, and reproduce an optimistic-concurrency conflict.",
    "Suivre une requête jusqu’à l’intention persistée, distinguer versions et propriété des champs et reproduire un conflit de concurrence optimiste.",
  ),
  prerequisites: ["architecture", "rbac"],
  related: ["controllers-internals", "admission-webhooks", "etcd"],
  blocks: [
    h("objectives", "Read the API contract behind kubectl", "Lire le contrat API derrière kubectl"),
    list(
      l(
        "Distinguish API version, UID, resourceVersion, generation and observedGeneration.",
        "Distinguer version API, UID, resourceVersion, generation et observedGeneration.",
      ),
      l(
        "Explain why an accepted object can coexist with an unavailable workload, and recover a stale-write conflict safely.",
        "Expliquer pourquoi un objet accepté peut coexister avec un workload indisponible et récupérer une écriture périmée.",
      ),
    ),
    h(
      "request",
      "Accepted intent precedes convergence",
      "L’intention acceptée précède la convergence",
    ),
    p(
      "kubectl is an HTTP API client. API discovery maps a group/version/resource to a REST endpoint; namespaced resources include their namespace in that path. Authentication identifies the caller and authorization checks its permitted action. Admission and validation can reject or mutate a request before persistence. Once the API accepts and stores a desired state, controllers and kubelets still need to act. A successful apply therefore proves neither successful scheduling nor healthy business behavior. Observe those independent status signals afterward.",
      "kubectl est un client HTTP. La découverte associe groupe/version/ressource à un endpoint REST ; le chemin des ressources de namespace contient cet espace. L’authentification identifie l’appelant et l’autorisation vérifie son action. Admission et validation peuvent rejeter ou transformer la requête avant persistance. Après acceptation et stockage de l’état désiré, contrôleurs et kubelets doivent encore agir. Un apply réussi ne prouve donc ni ordonnancement ni comportement métier sain. Observez ensuite ces statuts indépendants.",
    ),
    {
      type: "fields",
      rows: [
        {
          field: "apiVersion",
          text: l(
            "Chooses an API representation such as apps/v1, not the revision of an individual object.",
            "Choisit une représentation comme apps/v1, pas la révision d’un objet particulier.",
          ),
        },
        {
          field: "metadata.uid",
          text: l(
            "Identifies one object lifetime. Deleting/recreating the same name produces another UID.",
            "Identifie une durée de vie d’objet. Supprimer/recréer le même nom produit un autre UID.",
          ),
        },
        {
          field: "metadata.resourceVersion",
          text: l(
            "An opaque concurrency/watch token. Do not parse it as a global timestamp or compare it numerically across arbitrary objects.",
            "Jeton opaque de concurrence/watch. Ne le traitez pas comme une date globale ou un nombre comparable entre objets arbitraires.",
          ),
        },
        {
          field: "metadata.generation",
          text: l(
            "Tracks desired-state generations according to the resource contract; status-only writes do not mean a new desired workload revision.",
            "Suit les générations désirées selon le contrat de ressource ; une écriture de statut ne signifie pas une nouvelle intention de workload.",
          ),
        },
        {
          field: "status.observedGeneration",
          text: l(
            "When provided by a controller, identifies the desired generation it has evaluated. Read it together with conditions, never as a universal success flag.",
            "Quand le contrôleur le fournit, indique la génération évaluée. Lisez-le avec les conditions, jamais comme drapeau universel de réussite.",
          ),
        },
      ],
    },
    ...labContext("lab-api"),
    h("exercise", "Make a stale replacement fail", "Faire échouer un remplacement périmé"),
    code("yaml", counter, "lab/level-4/api-architecture/counter.yaml"),
    steps(
      {
        title: l(
          "Discover and read a concrete resource",
          "Découvrir et lire une ressource concrète",
        ),
        code: {
          lang: "bash",
          code: "umask 077\nLAB_API_DIR=$(mktemp -d)\nk api-resources --api-group=''\nk explain configmap\nk -n lab-api apply -f lab/level-4/api-architecture/counter.yaml\nk -n lab-api get configmap counter -o json > \"$LAB_API_DIR/counter-stale.json\"\nk get --raw '/api/v1/namespaces/lab-api/configmaps?limit=1'",
        },
        explain: l(
          "Keep LAB_API_DIR in this shell: the private directory stores the stale object without overwriting a shared temporary path. The raw list may first contain the namespace's root CA ConfigMap rather than counter. limit bounds a page, not the total collection; inspect metadata.continue and resourceVersion. Clients must preserve a list/watch consistency strategy, not assume the first page is the whole inventory.",
          "Gardez LAB_API_DIR dans ce shell : le dossier privé conserve l’objet périmé sans écraser un chemin temporaire partagé. La liste brute peut commencer par la ConfigMap CA du namespace plutôt que counter. limit borne une page, pas toute la collection ; examinez metadata.continue et resourceVersion. Un client doit préserver sa stratégie de cohérence list/watch, pas prendre la première page pour l’inventaire complet.",
        ),
      },
      {
        title: l(
          "Advance the object, then attempt a stale write",
          "Faire évoluer l’objet puis tenter une écriture périmée",
        ),
        code: {
          lang: "bash",
          code: `k -n lab-api patch configmap counter --type=merge -p '{"data":{"value":"two"}}'\nk replace -f "$LAB_API_DIR/counter-stale.json"\nk -n lab-api get configmap counter -o yaml`,
        },
        explain: l(
          "replace must fail with a resourceVersion conflict because the saved object predates the patch. The server protects the intervening writer; do not force replacement to make the error disappear. The live value should remain two.",
          "replace doit échouer avec un conflit resourceVersion : l’objet sauvegardé précède le patch. Le serveur protège l’écriture intermédiaire ; ne forcez pas le remplacement pour effacer l’erreur. La valeur réelle doit rester two.",
        ),
        expected: {
          text: l(
            "Expected: HTTP/API Conflict, commonly 409, followed by live data.value: two. This is a deliberate concurrency test, not a broken cluster.",
            "Attendu : Conflict API/HTTP, généralement 409, puis data.value: two. C’est un test de concurrence volontaire, pas une panne du cluster.",
          ),
        },
      },
    ),
    h(
      "watch",
      "Watches are resumable observation, not an audit log",
      "Un watch est une observation reprenable, pas un journal d’audit",
    ),
    p(
      "Controllers commonly list to establish a snapshot, then watch from its resourceVersion. Connections can end and history can expire: an expired token can require a fresh list. Bookmarks advance an observation position without representing a business change. A watch notification tells a reconciler to inspect current state; it is not a promise that every intermediate transition will be processed exactly once. Audit logging is a separate API-server facility with its own configuration, storage and access policy.",
      "Les contrôleurs listent souvent un snapshot puis observent depuis son resourceVersion. Les connexions s’arrêtent et l’historique expire : un jeton périmé peut exiger une nouvelle liste. Les bookmarks avancent l’observation sans représenter un changement métier. Une notification demande d’examiner l’état courant ; elle ne promet pas le traitement unique de chaque transition intermédiaire. L’audit est une fonction distincte de l’API server avec configuration, stockage et politique d’accès propres.",
    ),
    note(
      "info",
      l("Two different conflict models", "Deux modèles de conflit distincts"),
      l(
        "resourceVersion protects whole-object read/modify/write updates from stale state. Server-Side Apply instead tracks declared field ownership in managedFields and can report a conflict between field managers. --force-conflicts deliberately takes ownership; it is not a generic repair for concurrency. Choose the smallest intended patch and coordinate ownership with other controllers.",
        "resourceVersion protège les mises à jour lecture/modification/écriture contre un état périmé. Server-Side Apply suit plutôt la propriété déclarée des champs dans managedFields et peut signaler un conflit entre gestionnaires. --force-conflicts prend volontairement cette propriété ; ce n’est pas une réparation générique. Choisissez le patch minimal voulu et coordonnez les responsabilités avec les contrôleurs.",
      ),
    ),
    h("quiz", "Check version semantics", "Vérifier la sémantique des versions"),
    quiz(
      question(
        l(
          "Does successful apply mean the application is ready?",
          "Un apply réussi signifie-t-il que l’application est prête ?",
        ),
        [
          l(
            "No, persistence and convergence are separate",
            "Non, persistance et convergence sont distinctes",
          ),
          l("Yes, etcd starts containers", "Oui, etcd démarre les conteneurs"),
          l("Yes, when metadata.generation exists", "Oui, si metadata.generation existe"),
        ],
        0,
        l(
          "Scheduling, startup and meaningful readiness happen after accepted desired state.",
          "Ordonnancement, démarrage et readiness utile suivent l’acceptation de l’état désiré.",
        ),
      ),
      question(
        l(
          "How should you handle a stale update conflict?",
          "Comment traiter un conflit d’écriture périmée ?",
        ),
        [
          l("Reuse the same old object forever", "Réutiliser indéfiniment l’objet ancien"),
          l(
            "Read fresh state, recompute the minimal intended change and retry boundedly",
            "Relire l’état, recalculer le changement minimal et réessayer de manière bornée",
          ),
          l("Delete the object immediately", "Supprimer immédiatement l’objet"),
        ],
        1,
        l(
          "A fresh read preserves intervening changes; automatic retries need backoff and error handling.",
          "Une relecture conserve les changements intervenus ; les reprises automatiques exigent backoff et gestion d’erreurs.",
        ),
      ),
      question(
        l(
          "What changes when the same name is deleted and recreated?",
          "Qu’est-ce qui change après suppression/recréation du même nom ?",
        ),
        [
          l("Its API group must change", "Son groupe API doit changer"),
          l("The namespace must change", "Son namespace doit changer"),
          l("The UID identifies a new lifetime", "L’UID identifie une nouvelle durée de vie"),
        ],
        2,
        l(
          "Name reuse must not make a controller mistake a new owner for an old one.",
          "Réutiliser un nom ne doit pas faire confondre au contrôleur un nouveau propriétaire et l’ancien.",
        ),
      ),
    ),
    h("challenge", "Preserve another writer's field", "Conserver le champ d’un autre responsable"),
    challenge(
      l("The retry must recompute", "La reprise doit recalculer"),
      l(
        "After the conflict, add a second key owned by another writer, then deliberately change only value to three. Explain how your operation preserves the unrelated key and why replaying the stale full JSON would not.",
        "Après le conflit, ajoutez une seconde clé d’un autre responsable puis changez seulement value en three. Expliquez comment conserver la clé indépendante et pourquoi rejouer le vieux JSON complet serait incorrect.",
      ),
      [
        l(
          "A merge patch can target one map key without replacing the whole data map.",
          "Un merge patch peut cibler une clé sans remplacer toute la map data.",
        ),
        l(
          "Explicit null would delete a key; absence leaves it untouched.",
          "Un null explicite supprime une clé ; son absence la conserve.",
        ),
      ],
      [
        code(
          "bash",
          `k -n lab-api patch configmap counter --type=merge -p '{"data":{"other":"keep-me"}}'\nk -n lab-api patch configmap counter --type=merge -p '{"data":{"value":"three"}}'\nk -n lab-api get configmap counter -o yaml`,
        ),
        p(
          "Expected: other remains keep-me and value becomes three. This small merge patch expresses the intended map change. In a controller performing read-dependent decisions, use a fresh read plus an optimistic concurrency guard rather than assuming any patch eliminates races.",
          "Attendu : other reste keep-me et value devient three. Le petit merge patch exprime le changement voulu. Si un contrôleur décide selon une lecture, utilisez une lecture fraîche et un garde de concurrence optimiste plutôt que de supposer qu’un patch élimine toute course.",
        ),
      ],
    ),
    h("cleanup", "Cleanup and limits", "Nettoyage et limites"),
    p(
      "The exercise uses only a non-secret ConfigMap. It observes public API semantics without reading etcd directly or inspecting credentials. Do not generalize a local conflict experiment into a performance, storage-consistency or authorization audit.",
      "L’exercice utilise seulement une ConfigMap sans secret. Il observe la sémantique API sans lire etcd directement ni inspecter des identifiants. Ne généralisez pas ce conflit local en audit de performance, de cohérence du stockage ou d’autorisation.",
    ),
    code(
      "bash",
      'k delete namespace lab-api\nprintf "Inspect and manually remove the private saved object directory: %s\\n" "$LAB_API_DIR"',
    ),
  ],
};
