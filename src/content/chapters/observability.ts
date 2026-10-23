import type { Chapter } from "../types";
import { l, h, p, code, note, list, steps, quiz, question, challenge } from "../lesson-kit";
import collector from "../../../lab/level-3/observability/collector.yaml?raw";
import compose from "../../../lab/level-3/observability/compose.yaml?raw";
import app from "../../../lab/level-3/observability/app.py?raw";
import prometheus from "../../../lab/level-3/observability/prometheus.yaml?raw";
import datasource from "../../../lab/level-3/observability/grafana-datasource.yaml?raw";

export const observability: Chapter = {
  id: "observability",
  level: 3,
  minutes: 75,
  title: l("Prometheus, Grafana and OpenTelemetry", "Prometheus, Grafana et OpenTelemetry"),
  summary: l(
    "Generate real metrics, traces and correlated logs through OTLP, query Prometheus in Grafana and diagnose the telemetry pipeline itself.",
    "Générer métriques, traces et logs corrélés via OTLP, interroger Prometheus dans Grafana et diagnostiquer le pipeline lui-même.",
  ),
  prerequisites: ["services", "probes", "resources"],
  related: ["incidents", "hpa", "control-plane-scale"],
  heavy: l(
    "Optional Docker Compose lab downloads four images/build dependencies and needs roughly 2 CPU / 2 GiB extra RAM. No Kubernetes or cloud installation is required.",
    "Le lab Docker Compose optionnel télécharge quatre images/des dépendances de build et demande environ 2 CPU / 2 Gio de RAM supplémentaires. Aucune installation Kubernetes ou cloud n’est nécessaire.",
  ),
  blocks: [
    h(
      "objectives",
      "Observe both the application and its sensors",
      "Observer l’application et ses capteurs",
    ),
    list(
      l(
        "Distinguish request counters, latency distributions, event logs and span context.",
        "Distinguer compteurs de requêtes, distributions de latence, logs et contexte des spans.",
      ),
      l(
        "Trace one real request from SDK to Collector, metric storage and visualization.",
        "Suivre une vraie requête du SDK au Collector, au stockage métrique puis à la visualisation.",
      ),
    ),
    p(
      "Metrics summarize populations over time, logs describe events, and traces connect spans within a request. They answer different questions: how often, what happened, and where time was spent. OpenTelemetry supplies instrumentation, context and transport; it is not a storage product. The Collector receives, processes and exports signals. Prometheus stores scraped time series and evaluates PromQL. Grafana queries data sources and visualizes results; installing Grafana alone collects nothing.",
      "Les métriques résument des populations dans le temps, les logs décrivent des événements et les traces relient les spans d’une requête. Ils répondent à des questions différentes : combien, que s’est-il passé, où le temps est-il passé. OpenTelemetry fournit instrumentation, contexte et transport, sans être un produit de stockage. Le Collector reçoit, traite et exporte. Prometheus stocke les séries collectées et évalue PromQL. Grafana interroge des sources pour visualiser ; l’installer seul ne collecte rien.",
    ),
    p(
      "A counter grows until process restart; rate derives a per-second change across samples and handles resets. A histogram records observations into buckets for aggregate latency estimation. Labels multiply series cardinality: bounded route/status labels are appropriate here, raw user IDs or trace IDs are not. Traces may be sampled and logs dropped under pressure. Missing telemetry is uncertainty, not proof of zero errors; monitor the monitoring path itself.",
      "Un compteur augmente jusqu’au redémarrage ; rate dérive un débit entre échantillons et gère les remises à zéro. Un histogramme répartit les observations en buckets pour estimer la latence agrégée. Les labels multiplient la cardinalité : route/status bornés conviennent ici, les IDs utilisateurs ou traces non. Les traces peuvent être échantillonnées et les logs perdus sous pression. Une télémétrie absente est une incertitude, pas la preuve de zéro erreur ; surveillez aussi sa chaîne de collecte.",
    ),
    note(
      "warn",
      l("Local pipeline, explicit scope", "Pipeline local, périmètre explicite"),
      l(
        "This is a real Compose fixture for the learner to run, not a simulated dashboard. It observes a small HTTP app, not your Kubernetes control plane. Metrics persist in a local Prometheus volume for one hour; traces and logs reach the Collector debug output only, without a searchable durable backend. No agent has started this stack. All published ports bind to loopback; internal OTLP has no authentication or TLS and must not be exposed publicly.",
        "Ce fixture Compose est un vrai pipeline à exécuter par l’apprenant, pas un dashboard simulé. Il observe une petite application HTTP, pas votre control plane Kubernetes. Les métriques sont conservées une heure dans un volume Prometheus ; traces et logs arrivent seulement dans la sortie debug du Collector, sans backend durable interrogeable. Aucun agent n’a démarré cette stack. Les ports publiés écoutent en loopback ; OTLP interne sans authentification ni TLS ne doit pas être exposé publiquement.",
      ),
    ),
    h("components", "Inspect the concrete pipeline", "Examiner le pipeline concret"),
    code("yaml", compose, "lab/level-3/observability/compose.yaml"),
    code("yaml", collector, "lab/level-3/observability/collector.yaml"),
    p(
      "Each pipeline must explicitly enable its receiver, processors and exporters. memory_limiter bounds Collector pressure before batch groups exports. OTLP HTTP listens on the container network at 4318, with signal paths /v1/traces, /v1/metrics and /v1/logs. The Prometheus exporter exposes converted metrics at :8889/metrics. The suffix translation is explicit, so the lab_requests counter becomes lab_requests_total. The debug exporter is deliberately restricted to this low-volume teaching data; it can expose sensitive attributes in real workloads.",
      "Chaque pipeline doit activer explicitement receiver, processors et exporters. memory_limiter borne la pression du Collector avant que batch regroupe les exports. OTLP HTTP écoute sur le réseau des conteneurs en 4318, chemins /v1/traces, /v1/metrics et /v1/logs. L’exporter Prometheus expose les métriques converties à :8889/metrics. La traduction des suffixes est explicite : le compteur lab_requests devient lab_requests_total. L’exporter debug est réservé à ces données pédagogiques peu volumineuses ; il pourrait révéler des attributs sensibles avec de vrais workloads.",
    ),
    code("python", app, "lab/level-3/observability/app.py"),
    p(
      "The app creates a span, records a counter/histogram and emits a structured log while that span is current. The returned trace_id lets you find the corresponding Collector span and log. It is not a metric label. SDK/exporter 1.38.0 are intentionally paired to the checked example API, including its experimental logs API; upgrade both with compatibility review rather than treating them as latest. The HTTP server is a teaching fixture, not a production framework.",
      "L’application crée un span, enregistre compteur/histogramme et produit un log structuré pendant que le span est courant. Le trace_id retourné permet de retrouver le span et son log dans le Collector. Ce n’est pas un label métrique. SDK/exporter 1.38.0 sont associés volontairement à l’API vérifiée, dont les logs expérimentaux ; mettez-les à jour ensemble après examen de compatibilité, sans les considérer latest. Le serveur HTTP est pédagogique, pas un framework de production.",
    ),
    h(
      "startup",
      "Start only if you choose to run the lab",
      "Démarrer uniquement si vous choisissez le lab",
    ),
    steps({
      title: l(
        "Validate configuration and start locally",
        "Valider la configuration et démarrer localement",
      ),
      code: {
        lang: "bash",
        code: "docker compose version\nread -r -s LAB_GRAFANA_PASSWORD\nexport LAB_GRAFANA_PASSWORD\nalias obs='docker compose -p k8s-ops-observability -f lab/level-3/observability/compose.yaml'\nobs config --quiet\nobs up -d --build\nobs ps\nobs logs --tail=30 collector prometheus grafana",
      },
      explain: l(
        "Run from the repository root. When read waits, enter a temporary local Grafana password and press Enter; it is not echoed. Do not print the resolved Compose configuration, which contains that password. Check all services stay running before traffic generation. Keep the same shell for cleanup.",
        "Exécutez depuis la racine. Quand read attend, saisissez un mot de passe Grafana temporaire local puis Entrée ; il n’est pas affiché. N’affichez pas la configuration Compose résolue qui contient ce mot de passe. Vérifiez les services actifs avant le trafic. Gardez le shell pour le nettoyage.",
      ),
      expected: {
        text: l(
          "Expected after image/build startup: four running services. Connection refused during startup requires checking logs and readiness, not assuming a successful pipeline.",
          "Attendu après téléchargements/build : quatre services actifs. Un refus de connexion au démarrage exige d’examiner logs et disponibilité, sans supposer le pipeline fonctionnel.",
        ),
      },
    }),
    h("traffic", "Generate measurable data", "Générer des données mesurables"),
    code(
      "bash",
      "curl --fail-with-body http://127.0.0.1:8008/work\ncurl -i http://127.0.0.1:8008/fail\nfor attempt in $(seq 1 30); do curl -fsS http://127.0.0.1:8008/work >/dev/null; sleep 1; done\ncurl -fsS http://127.0.0.1:8889/metrics\nobs logs --tail=100 collector",
    ),
    p(
      "Expected: /work returns 200, /fail intentionally returns 503, and both include a trace_id. After SDK export and scrape intervals, the metrics endpoint exposes lab_requests_total and latency buckets; Collector output includes spans and request.completed logs with matching trace context. The error request is a controlled signal, not an actual service incident. Values depend on the number of requests you send; do not copy an invented rate into a report.",
      "Attendu : /work retourne 200, /fail volontairement 503, avec trace_id dans les deux cas. Après export SDK et collecte, l’endpoint expose lab_requests_total et des buckets de latence ; les sorties Collector contiennent spans et logs request.completed avec le même contexte de trace. La requête en erreur est un signal contrôlé, pas un incident réel. Les valeurs dépendent du trafic envoyé : n’inventez aucun débit dans un compte rendu.",
    ),
    code("yaml", prometheus, "lab/level-3/observability/prometheus.yaml"),
    code("yaml", datasource, "lab/level-3/observability/grafana-datasource.yaml"),
    p(
      "Open Prometheus at http://127.0.0.1:9090 and verify the lab-collector target is UP. Open Grafana at http://127.0.0.1:3001, sign in as lab-admin with your chosen password, and choose Explore → Lab Prometheus. The provisioned URL uses prometheus:9090 because Grafana queries from its container, not your browser's localhost. Run the following expressions separately after enough samples exist. Their rates may fall to zero after traffic stops; generate more requests to inspect a changing graph.",
      "Ouvrez Prometheus à http://127.0.0.1:9090 et vérifiez la cible lab-collector UP. Ouvrez Grafana à http://127.0.0.1:3001, connectez lab-admin avec votre mot de passe puis Explore → Lab Prometheus. L’URL provisionnée utilise prometheus:9090 car Grafana interroge depuis son conteneur, pas le localhost du navigateur. Lancez les expressions séparément après plusieurs échantillons. Les débits peuvent retomber à zéro après le trafic ; générez des requêtes pour observer un graphe variable.",
    ),
    code(
      "promql",
      'up{job="lab-collector"}\nsum by (status) (rate(lab_requests_total{job="lab-collector"}[1m]))\nhistogram_quantile(0.95, sum by (le) (rate(lab_request_duration_seconds_bucket{job="lab-collector"}[1m])))',
    ),
    h("diagnosis", "No data is a pipeline question", "L’absence de données concerne le pipeline"),
    p(
      "Check each boundary: app SDK export errors, Collector receiver protocol/path, enabled pipelines, scrape target, actual exported metric name, then Grafana datasource and time range. UP=1 proves that Prometheus scraped an endpoint, not that the app produced recent data. A histogram quantile can be absent or NaN without observations. This fixture has no kube-state-metrics, node exporter, trace database or log database: queries using their metric names would be unsupported. Production alerting requires a defined user-facing SLI and a tested notification path, not simply a dashboard.",
      "Vérifiez chaque frontière : erreurs d’export SDK, protocole/chemin receiver, pipelines activés, cible de collecte, vrai nom de métrique, source Grafana et plage temporelle. UP=1 prouve qu’un endpoint a été collecté, pas que l’application a produit récemment. Un quantile peut être absent ou NaN sans observations. Ce fixture n’a ni kube-state-metrics, node exporter, base de traces ou de logs : leurs métriques ne sont pas disponibles. L’alerting de production exige un SLI utilisateur défini et une notification testée, pas seulement un dashboard.",
    ),
    h("quiz", "Interpret a signal honestly", "Interpréter honnêtement un signal"),
    quiz(
      question(
        l(
          "Why avoid trace_id as a metric label?",
          "Pourquoi éviter trace_id comme label métrique ?",
        ),
        [
          l(
            "It creates a new high-cardinality series per request",
            "Il crée des séries de forte cardinalité par requête",
          ),
          l("It prevents all tracing", "Il empêche tout tracing"),
          l(
            "Prometheus cannot store strings in labels",
            "Prometheus ne permet pas de chaînes dans les labels",
          ),
        ],
        0,
        l(
          "Use trace context in logs/traces; metrics should aggregate bounded dimensions.",
          "Gardez le contexte dans logs/traces ; les métriques agrègent des dimensions bornées.",
        ),
      ),
      question(
        l("up=1 but no request metric proves what?", "up=1 sans métrique de requête prouve quoi ?"),
        [
          l("No user errors happened", "Aucune erreur utilisateur"),
          l("The app has zero traffic forever", "L’application n’aura jamais de trafic"),
          l(
            "The scrape endpoint answered; inspect upstream production/export of data",
            "L’endpoint répond ; examinez production et export en amont",
          ),
        ],
        2,
        l(
          "Scrape health and application telemetry freshness are different contracts.",
          "Santé de collecte et fraîcheur des données applicatives sont deux contrats distincts.",
        ),
      ),
      question(
        l(
          "Where are this lab's traces stored durably?",
          "Où les traces de ce lab sont-elles conservées durablement ?",
        ),
        [
          l("In Grafana by default", "Dans Grafana par défaut"),
          l(
            "Nowhere; debug output is an inspection endpoint",
            "Nulle part ; la sortie debug sert à l’inspection",
          ),
          l("In every Prometheus counter", "Dans chaque compteur Prometheus"),
        ],
        1,
        l(
          "A durable trace backend would need an additional exporter, storage and retention configuration.",
          "Un backend durable de traces exigerait exporter, stockage et rétention supplémentaires.",
        ),
      ),
    ),
    h(
      "challenge",
      "Make the sensor fail without stopping the app",
      "Faire tomber le capteur sans arrêter l’application",
    ),
    challenge(
      l("A telemetry outage", "Une panne de télémétrie"),
      l(
        "Stop only the Collector, send a /work request, and compare application response with Prometheus scrape health. Restart the Collector and prove fresh data flows. Do not promise all missing telemetry was recovered.",
        "Arrêtez uniquement le Collector, envoyez /work et comparez réponse applicative et santé de collecte Prometheus. Redémarrez-le puis prouvez le retour de données fraîches. Ne promettez pas la récupération de toute la télémétrie manquante.",
      ),
      [
        l(
          "Collector availability and HTTP serving are separate.",
          "Disponibilité du Collector et service HTTP sont distincts.",
        ),
        l(
          "Allow at least two scrape intervals, inspect SDK errors and create new requests after recovery.",
          "Attendez au moins deux collectes, examinez les erreurs SDK puis créez de nouvelles requêtes après récupération.",
        ),
      ],
      [
        code(
          "bash",
          "obs stop collector\ncurl -i http://127.0.0.1:8008/work\nobs logs --tail=30 app",
        ),
        p(
          'Keep the Collector stopped while inspecting Prometheus. After at least two five-second scrape intervals, evaluate up{job="lab-collector"} and inspect the target\'s actual scrape error. Confirm the application response independently. Only then run the recovery block below; restarting immediately would make the intended sensor failure difficult to observe.',
          'Gardez le Collector arrêté pendant l’inspection de Prometheus. Après au moins deux intervalles de collecte de cinq secondes, évaluez up{job="lab-collector"} et examinez l’erreur réelle de la cible. Vérifiez séparément la réponse applicative. Lancez ensuite seulement le bloc de récupération : un redémarrage immédiat rendrait la panne du capteur difficile à observer.',
        ),
        code(
          "bash",
          "obs start collector\ncurl --fail-with-body http://127.0.0.1:8008/work\nobs logs --tail=50 collector",
        ),
        p(
          "Expected: the app can continue returning 200 while the target becomes DOWN after scrape failure. After restart and new exports, UP and fresh records recover. SDK queues are bounded and the debug exporter is not durable: some observations may be lost. Correlate timestamps instead of treating old graph samples as current health.",
          "Attendu : l’application peut rester à 200 tandis que la cible devient DOWN après échec de collecte. Après redémarrage et nouveaux exports, UP et les enregistrements frais reviennent. Les files SDK sont bornées et debug n’est pas durable : des observations peuvent être perdues. Comparez les timestamps au lieu de prendre d’anciens échantillons pour l’état présent.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Delete only the dedicated local stack",
      "Retirer seulement la stack locale dédiée",
    ),
    p(
      "The following removes this Compose project's containers and named data volumes, including saved Grafana configuration and metric history. It does not touch Kubernetes. Do not add broad Docker prune commands. Unset the temporary password afterwards.",
      "La commande retire les conteneurs et volumes nommés de ce projet Compose, dont configuration Grafana et historique métrique. Elle ne touche pas Kubernetes. N’ajoutez aucun prune Docker global. Retirez ensuite le mot de passe temporaire du shell.",
    ),
    code("bash", "obs down --volumes\nunset LAB_GRAFANA_PASSWORD"),
  ],
};
