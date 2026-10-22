import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import objects from "../../../lab/level-4/control-plane-scale/objects.yaml?raw";
import paginate from "../../../lab/level-4/control-plane-scale/paginate.py?raw";
import sample from "../../../lab/level-4/control-plane-scale/sample-api.sh?raw";

export const controlPlaneScale: Chapter = {
  id: "control-plane-scale",
  level: 4,
  minutes: 60,
  title: l(
    "Control plane performance and scalability",
    "Performance et scalabilité du control plane",
  ),
  summary: l(
    "Understand API request cost, pagination, watch and APF, then collect bounded evidence without benchmarking the user's cluster.",
    "Comprendre coût API, pagination, watch et APF, puis recueillir des preuves bornées sans benchmarker le cluster de l’utilisateur.",
  ),
  prerequisites: ["api-architecture", "etcd", "observability"],
  related: ["controllers-internals", "scheduler-internals", "incidents"],
  blocks: [
    h(
      "objectives",
      "Optimize the request shape before increasing limits",
      "Optimiser la requête avant d’augmenter les limites",
    ),
    list(
      l(
        "Explain how repeated full lists, large objects and slow storage affect API latency.",
        "Expliquer l’effet des listes complètes répétées, gros objets et stockage lent sur la latence API.",
      ),
      l(
        "Read bounded metric samples and separate API fairness from Pod priority.",
        "Lire des échantillons bornés et distinguer équité API et priorité des Pods.",
      ),
    ),
    p(
      "The API server authenticates, authorizes, admits and serves requests while coordinating storage/cache work. Controllers and clients create load through request frequency, object size and watch fan-out. A cluster with few nodes but many large objects or aggressive relisting can stress the API. Increasing apiserver replicas may improve request capacity, but etcd quorum, storage latency, admission webhooks and client behavior can remain bottlenecks. Worker count is not a complete capacity model.",
      "L’API server authentifie, autorise, admet et sert les requêtes en coordonnant stockage/cache. Contrôleurs et clients produisent de la charge par fréquence, taille d’objet et diffusion watch. Peu de nœuds avec beaucoup de gros objets ou des relistings agressifs peuvent saturer l’API. Ajouter des API servers peut aider sans résoudre quorum etcd, latence disque, webhooks ou comportement client. Le nombre de workers ne suffit pas comme modèle de capacité.",
    ),
    p(
      "A list can be paginated with limit and continue while preserving one collection snapshot. Treat resourceVersion as an opaque consistency marker, never a numeric clock. A watch follows changes from an appropriate version; expiration requires a correct relist/restart strategy, not a tight retry loop. Informers share local caches and queues so reconcilers avoid repeatedly listing every object. Pagination bounds each response, but does not make fetching an entire population free or eliminate total work.",
      "Une liste se pagine avec limit et continue en conservant un instantané de collection. resourceVersion est un marqueur opaque, jamais une horloge numérique. Un watch suit les changements depuis une version appropriée ; l’expiration exige une stratégie relist/reprise, pas une boucle serrée. Les informers partagent caches locaux et files pour éviter de relister tout à chaque réconciliation. Paginer borne les réponses sans rendre gratuite une population complète ni éliminer le travail total.",
    ),
    p(
      "API Priority and Fairness classifies requests with FlowSchema into PriorityLevelConfiguration queues and concurrency seats. It protects request classes from starvation; it does not schedule Pods or create CPU. A slow request can occupy seats longer, causing queues and rejection without a rise in request count. Lists may consume several seats and watch initialization has its own cost. The kind admin identity may be exempt, so this lesson does not pretend its few requests demonstrate fairness under contention.",
      "API Priority and Fairness classe les requêtes par FlowSchema vers files et sièges de concurrence des PriorityLevelConfiguration. APF protège des classes de requêtes sans ordonnancer les Pods ni créer du CPU. Une requête lente occupe ses sièges plus longtemps, provoquant files et rejets sans hausse du nombre de requêtes. Une liste peut consommer plusieurs sièges et l’initialisation watch a un coût. L’admin kind peut être exempt : ces quelques requêtes ne démontrent pas l’équité sous contention.",
    ),
    ...labContext("lab-api-scale"),
    note(
      "warn",
      l("Bounded observation only", "Observation bornée uniquement"),
      l(
        "This is not a load test. Create only three small ConfigMaps, read at most ten list pages, open a short watch and optionally take two metric snapshots. Do not change APF defaults, API concurrency flags, etcd membership or admission settings. One-host kind timings cannot establish production capacity or physical high availability.",
        "Ce n’est pas un test de charge. Créez seulement trois petites ConfigMaps, lisez au plus dix pages, ouvrez un watch court puis éventuellement deux échantillons métriques. Ne changez ni APF, concurrence API, membres etcd ou admission. Les temps kind sur un seul hôte ne mesurent ni capacité de production ni disponibilité physique.",
      ),
    ),
    h("pagination", "Read one tiny collection in pages", "Lire une petite collection par pages"),
    code("yaml", objects, "lab/level-4/control-plane-scale/objects.yaml"),
    code("python", paginate, "lab/level-4/control-plane-scale/paginate.py"),
    code(
      "bash",
      "k -n lab-api-scale apply -f lab/level-4/control-plane-scale/objects.yaml\npython3 lab/level-4/control-plane-scale/paginate.py",
    ),
    p(
      "Python 3 uses only its standard library and the existing kubectl binary. Expected: three objects across one-item pages, no duplicates, and the same collection resourceVersion on each page. The continuation token is URL-encoded, opaque and time-limited; an expired/invalid token fails explicitly. The page limit of one is intentionally inefficient for learning, not a recommended production size. Use measured object sizes and latency to choose real page sizes.",
      "Python 3 utilise seulement sa bibliothèque standard et kubectl existant. Attendu : trois objets par pages d’un élément, sans doublon, avec le même resourceVersion de collection. Le token continue, encodé dans l’URL, est opaque et limité dans le temps ; son expiration échoue explicitement. Une page d’un élément est volontairement inefficace pour apprendre, pas une taille conseillée en production. Mesurez taille des objets et latence avant de choisir.",
    ),
    h(
      "watch",
      "Observe changes without repeated full lists",
      "Observer les changements sans listes répétées",
    ),
    code(
      "bash",
      "k -n lab-api-scale get configmaps -l app=api-sampling --watch --request-timeout=20s",
    ),
    p(
      "While the watch runs, use a second terminal for the command below. Expected: the item-a update appears without a manual relist. The bounded watch can exit on its timeout; that is the intended stop, not evidence of control-plane failure. An informer would manage reconnection and caching continuously, which this single CLI observation does not implement.",
      "Pendant le watch, utilisez un second terminal pour la commande ci-dessous. Attendu : item-a modifiée apparaît sans relisting manuel. Le watch peut s’arrêter au timeout : arrêt voulu, pas preuve d’une panne. Un informer gérerait reprise et cache en continu, ce que cette observation CLI n’implémente pas.",
    ),
    code(
      "bash",
      "kubectl --context kind-k8s-ops-lab -n lab-api-scale annotate configmap item-a lab.k8sops.dev/observed=one --overwrite",
    ),
    h(
      "metrics",
      "Inspect request classes and two snapshots",
      "Examiner classes de requêtes et deux échantillons",
    ),
    code(
      "bash",
      "k get flowschemas.flowcontrol.apiserver.k8s.io\nk get prioritylevelconfigurations.flowcontrol.apiserver.k8s.io\nk auth can-i get /metrics\nbash lab/level-4/control-plane-scale/sample-api.sh",
    ),
    code("bash", sample, "lab/level-4/control-plane-scale/sample-api.sh"),
    p(
      "Run the optional sampler only if /metrics access is already allowed; otherwise retain the architecture exercise without broadening RBAC. The script prints the exact private temporary directory containing two files ten seconds apart. Inspect apiserver_request_duration_seconds histogram buckets/counts, APF current queues/seats and rejected request counters. APF metrics are BETA in 1.35; API-side etcd_request_duration_seconds is ALPHA and can change. No series or nonzero rejection is guaranteed to exist in a quiet lab.",
      "Lancez l’échantillonneur optionnel seulement si /metrics est déjà autorisé ; sinon gardez l’étude sans élargir RBAC. Le script affiche le dossier temporaire privé exact contenant deux fichiers à dix secondes d’intervalle. Examinez histogrammes/counts apiserver_request_duration_seconds, files/sièges APF et compteurs de rejets. Les métriques APF sont BETA en 1.35 ; etcd_request_duration_seconds côté API est ALPHA et peut changer. Un lab calme ne garantit ni chaque série ni rejet non nul.",
    ),
    h("diagnosis", "Interpret evidence before tuning", "Interpréter avant de régler"),
    p(
      "Compare counter differences over elapsed time, not lifetime totals; one histogram snapshot is not a latency timeline. APF rejection with rising queue time and slow etcd calls suggests storage or downstream latency as one hypothesis. Admission latency with healthy storage suggests another. Increasing inflight limits can amplify the overloaded dependency instead of fixing it. WAL fsync and backend commit metrics belong to etcd's own telemetry and require separately configured authorized collection; they are not invented by this API sample. Do not compact, defragment or change quorum as a reaction to a chart alone.",
      "Comparez les différences de compteurs dans le temps, pas leurs totaux ; un histogramme unique n’est pas une chronologie. Rejets APF avec attente croissante et appels etcd lents suggèrent un stockage/aval lent parmi les hypothèses. Admission lente avec stockage sain en suggère une autre. Augmenter inflight peut amplifier la dépendance saturée. WAL fsync et backend commit appartiennent à la télémétrie etcd, à collecter séparément avec autorisation ; cet échantillon API ne les invente pas. Ne compactez/défragmentez ni ne changez le quorum sur un seul graphe.",
    ),
    h("quiz", "Separate request shape from capacity", "Séparer forme des requêtes et capacité"),
    quiz(
      question(
        l(
          "Does API fairness use Pod PriorityClass?",
          "L’équité API utilise-t-elle PriorityClass des Pods ?",
        ),
        [
          l("Yes, the same queue", "Oui, la même file"),
          l(
            "No, it uses request classification and priority levels",
            "Non, elle classe les requêtes et niveaux API",
          ),
          l("Only on workers", "Seulement sur les workers"),
        ],
        1,
        l(
          "APF governs API requests; scheduler priority governs candidate Pods.",
          "APF gouverne les requêtes ; la priorité scheduler gouverne les Pods candidats.",
        ),
      ),
      question(
        l(
          "Why can rejection rise without more requests?",
          "Pourquoi les rejets augmentent-ils sans davantage de requêtes ?",
        ),
        [
          l(
            "Slower execution holds concurrency seats longer",
            "Une exécution lente occupe les sièges plus longtemps",
          ),
          l(
            "Every watch always consumes a seat forever",
            "Chaque watch consomme toujours un siège à vie",
          ),
          l("resourceVersion is a timestamp", "resourceVersion est une date"),
        ],
        0,
        l(
          "Concurrency pressure depends on service time as well as arrival rate.",
          "La pression de concurrence dépend de la durée et du débit d’arrivée.",
        ),
      ),
      question(
        l("What does consistent pagination preserve?", "Que conserve une pagination cohérente ?"),
        [
          l("The same physical API process forever", "Le même processus API à vie"),
          l("A permanent continuation token", "Un token continue permanent"),
          l("A collection snapshot across pages", "Un instantané de collection entre pages"),
        ],
        2,
        l(
          "The token continues one snapshot; it expires and is not a durable bookmark.",
          "Le token poursuit un instantané ; il expire et n’est pas un repère durable.",
        ),
      ),
    ),
    h("challenge", "Improve a noisy controller design", "Améliorer un contrôleur bavard"),
    challenge(
      l("One full list per object change", "Une liste complète par changement"),
      l(
        "A proposed controller relists every Pod cluster-wide after any ConfigMap change, with immediate retries on 429. Propose a bounded alternative and demonstrate a namespace/label-scoped CLI query on this fixture. Explain why higher API limits are not the first fix.",
        "Un contrôleur proposé reliste tous les Pods du cluster à chaque changement de ConfigMap et reprend immédiatement sur 429. Proposez une alternative bornée puis démontrez une requête ciblée sur le fixture. Expliquez pourquoi augmenter les limites n’est pas la première correction.",
      ),
      [
        l(
          "Use shared informer caches, relevant indexes and a rate-limited work queue.",
          "Utilisez caches d’informers, index pertinents et file de travail limitée.",
        ),
        l(
          "Scope reads, paginate initialization, back off errors and respect cancellation.",
          "Ciblez les lectures, paginez l’initialisation, espacez les erreurs et respectez l’annulation.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-api-scale get configmaps -l app=api-sampling --chunk-size=2\npython3 lab/level-4/control-plane-scale/paginate.py",
        ),
        p(
          "Expected: only the three exercise objects are returned. In code, an informer and index map relevant keys to reconciliation work instead of relisting everything; bounded retries with backoff avoid a storm. This CLI demonstrates read scoping, not a complete controller benchmark. First reduce unnecessary work, then measure the remaining bottleneck before capacity changes.",
          "Attendu : seuls les trois objets de l’exercice sont retournés. En code, informer et index associent les clés utiles aux réconciliations au lieu de tout relister ; les reprises bornées avec backoff évitent une tempête. Le CLI démontre le ciblage, pas un benchmark de contrôleur. Réduisez d’abord le travail inutile puis mesurez le goulot restant avant de changer la capacité.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove the fixture and exact local samples",
      "Retirer fixture et échantillons locaux précis",
    ),
    code("bash", "k delete namespace lab-api-scale"),
    p(
      "Remove only the exact temporary directory printed by the sampler after you finish reviewing it, never a wildcard under /tmp. No APF object, component setting or etcd state was changed. Production scalability requires realistic workloads and an authorized isolated test environment beyond this lesson.",
      "Retirez seulement le dossier temporaire exact affiché après analyse, jamais un wildcard sous /tmp. Aucun objet APF, réglage composant ou état etcd n’a changé. La scalabilité de production exige des workloads réalistes et un environnement isolé autorisé au-delà de ce cours.",
    ),
  ],
};
