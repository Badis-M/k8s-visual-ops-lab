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
import batch from "../../../lab/level-2/jobs/batch.yaml?raw";
import schedule from "../../../lab/level-2/jobs/schedule.yaml?raw";
import failing from "../../../lab/level-2/jobs/failing.yaml?raw";

export const jobs: Chapter = {
  id: "jobs",
  level: 2,
  minutes: 45,
  title: l("Jobs and CronJobs", "Jobs et CronJobs"),
  summary: l(
    "Run finite work, bound retries and runtime, and reason about missed schedules and duplicate side effects.",
    "Exécuter un travail fini, borner ses reprises et sa durée, raisonner sur les échéances manquées et les effets en double.",
  ),
  prerequisites: ["pods", "deployments"],
  related: ["resources", "observability", "troubleshooting-2"],
  blocks: [
    h(
      "objectives",
      "From a process to a completion contract",
      "Du processus au contrat de terminaison",
    ),
    list(
      l(
        "Distinguish a Pod restart, a replacement Pod and a new scheduled Job.",
        "Distinguer le redémarrage d’un conteneur, un Pod de remplacement et un nouveau Job planifié.",
      ),
      l(
        "Choose retry, deadline and concurrency controls without promising exactly-once processing.",
        "Choisir les contrôles de reprise, délai et concurrence sans promettre un traitement exactement une fois.",
      ),
    ),
    p(
      "A Deployment maintains serving replicas; a Job seeks successful completion. A CronJob creates Jobs according to a schedule. The resulting ownership chain is CronJob → Job → Pod. Process exit code 0 normally signals success; a process that prints an error and exits 0 still looks successful to Kubernetes. Completion therefore depends on an honest application contract, not the meaning of its logs.",
      "Un Deployment maintient des réplicas en service ; un Job vise une terminaison réussie. Un CronJob crée des Jobs selon un calendrier. La chaîne de propriété devient CronJob → Job → Pod. Un code de sortie 0 signale normalement le succès ; un processus qui affiche une erreur puis sort avec 0 paraît quand même réussi à Kubernetes. La terminaison dépend donc d’un contrat applicatif honnête, pas du sens des logs.",
    ),
    p(
      "completions is a success target, parallelism a concurrency ceiling. Indexed mode assigns a partition number through JOB_COMPLETION_INDEX; it does not make external writes transactional. A replacement may repeat work after an ambiguous failure. Use an application idempotency key, such as report-date plus partition, and an atomic uniqueness constraint at the destination. An in-memory flag inside the Pod disappears with that Pod.",
      "completions est une cible de réussites, parallelism un plafond de concurrence. Le mode Indexed attribue un numéro de partition via JOB_COMPLETION_INDEX ; il ne rend pas les écritures externes transactionnelles. Un remplacement peut répéter un traitement après un échec ambigu. Utilisez une clé d’idempotence applicative, par exemple date du rapport plus partition, et une contrainte d’unicité atomique à destination. Un drapeau en mémoire disparaît avec son Pod.",
    ),
    ...labContext("lab-jobs"),
    h("manifest", "Read the finite-work budget", "Lire le budget du traitement fini"),
    code("yaml", batch, "lab/level-2/jobs/batch.yaml"),
    p(
      "restartPolicy: Never leaves failed containers stopped and lets the Job controller create replacement Pods. OnFailure instead allows container restarts inside a Pod. backoffLimit bounds retries with increasing delays; activeDeadlineSeconds caps the overall Job duration, including waiting and retrying. A failed Job does not automatically start over after its terminal condition. ttlSecondsAfterFinished removes finished Jobs and their dependent Pods, so collect logs before the ten-minute retention expires.",
      "restartPolicy: Never laisse les conteneurs échoués arrêtés et permet au contrôleur du Job de créer des Pods de remplacement. OnFailure autorise plutôt des redémarrages dans le même Pod. backoffLimit borne les reprises, espacées progressivement ; activeDeadlineSeconds plafonne la durée globale du Job, attente et reprises comprises. Un Job échoué ne repart pas automatiquement après sa condition terminale. ttlSecondsAfterFinished supprime les Jobs terminés et leurs Pods dépendants : recueillez les logs avant les dix minutes de rétention.",
    ),
    steps({
      title: l("Complete three partitions", "Terminer trois partitions"),
      code: {
        lang: "bash",
        code: "k -n lab-jobs apply -f lab/level-2/jobs/batch.yaml\nk -n lab-jobs wait --for=condition=Complete job/report-batch --timeout=150s\nk -n lab-jobs get job report-batch -o yaml\nk -n lab-jobs logs -l batch.kubernetes.io/job-name=report-batch --prefix=true",
      },
      explain: l(
        "Compare succeeded, completedIndexes and the Pod labels. The workload only prints partition identifiers; it neither stores a report nor proves durable processing.",
        "Comparez succeeded, completedIndexes et les labels des Pods. Le traitement affiche seulement les partitions ; il ne stocke aucun rapport et ne prouve aucun traitement durable.",
      ),
      expected: {
        text: l(
          "Expected: Complete=True and indexes 0,1,2 after all three partitions succeed. Pod names and timing vary.",
          "Attendu : Complete=True et les index 0,1,2 après réussite des trois partitions. Les noms des Pods et les délais varient.",
        ),
      },
    }),
    h("failure", "Observe failure instead of hiding it", "Observer l’échec sans le masquer"),
    code("yaml", failing, "lab/level-2/jobs/failing.yaml"),
    code(
      "bash",
      "k -n lab-jobs apply -f lab/level-2/jobs/failing.yaml\nk -n lab-jobs wait --for=condition=Failed job/invalid-report --timeout=90s\nk -n lab-jobs describe job invalid-report\nk -n lab-jobs logs -l batch.kubernetes.io/job-name=invalid-report --prefix=true\nk -n lab-jobs get pods -l batch.kubernetes.io/job-name=invalid-report -o 'custom-columns=NAME:.metadata.name,PHASE:.status.phase,EXIT:.status.containerStatuses[0].state.terminated.exitCode'",
    ),
    p(
      "Expected: a Failed condition and exit code 42 in the failed container status. A Pending Pod with FailedScheduling is a resource or placement problem, not application failure. ErrImagePull happens before the program runs. For an actual input error, more retries waste time; correct the input and create a new named Job. Most Job Pod-template fields are immutable, and applying the same completed Job does not rerun it.",
      "Attendu : une condition Failed et le code 42 dans le statut du conteneur échoué. Un Pod Pending avec FailedScheduling indique un problème de ressources ou placement, pas un échec applicatif. ErrImagePull survient avant le programme. Pour une entrée invalide, augmenter les reprises gaspille du temps : corrigez l’entrée puis créez un Job avec un nouveau nom. La plupart des champs du template sont immuables, et appliquer le même Job terminé ne le relance pas.",
    ),
    h("schedules", "Scheduling is approximate", "La planification est approximative"),
    code("yaml", schedule, "lab/level-2/jobs/schedule.yaml"),
    p(
      "This schedule is suspended initially so applying it starts no recurring work. timeZone makes its clock explicit. Forbid avoids overlapping Jobs created by this one CronJob; it is neither a cluster-wide mutex nor a ban on manually created Jobs. startingDeadlineSeconds defines acceptable lateness, while the Job deadline limits runtime. History limits retain objects, not an archival audit trail. A schedule can miss a run or produce duplicates: financial or irreversible actions still need deduplication.",
      "Le calendrier est initialement suspendu : l’appliquer ne démarre aucun traitement récurrent. timeZone explicite son horloge. Forbid évite le chevauchement des Jobs créés par ce seul CronJob ; ce n’est ni un mutex global ni une interdiction des Jobs manuels. startingDeadlineSeconds définit le retard acceptable, tandis que le délai du Job limite son exécution. Les historiques conservent des objets, pas une archive d’audit. Un calendrier peut manquer une échéance ou produire des doublons : une action irréversible exige encore une déduplication.",
    ),
    code(
      "bash",
      'k -n lab-jobs apply -f lab/level-2/jobs/schedule.yaml\nk -n lab-jobs create job report-manual --from=cronjob/scheduled-report\nk -n lab-jobs wait --for=condition=Complete job/report-manual --timeout=200s\nk -n lab-jobs patch cronjob scheduled-report --type=merge -p \'{"spec":{"suspend":false}}\'\nk -n lab-jobs get jobs --watch',
    ),
    p(
      "Observe for two or three minute boundaries, then stop the watch with Ctrl+C and suspend below. The 70-second execution spans a minute boundary, so a scheduled overlap should be skipped while the previous scheduled Job runs. Inspect lastScheduleTime, active references and Events rather than expecting an exact launch second. Suspension prevents new scheduling; it does not terminate an already running Job.",
      "Observez deux ou trois passages de minute, arrêtez le suivi avec Ctrl+C puis suspendez ci-dessous. Les 70 secondes d’exécution traversent une minute : un chevauchement planifié doit être évité pendant le Job précédent. Examinez lastScheduleTime, les références active et les Events sans attendre un lancement à la seconde exacte. Suspendre empêche les prochaines créations, sans arrêter un Job déjà démarré.",
    ),
    code(
      "bash",
      'k -n lab-jobs patch cronjob scheduled-report --type=merge -p \'{"spec":{"suspend":true}}\'\nk -n lab-jobs describe cronjob scheduled-report',
    ),
    h("quiz", "Reason about reliability", "Raisonner sur la fiabilité"),
    quiz(
      question(
        l(
          "Can parallelism: 1 guarantee a payment happens once?",
          "parallelism: 1 garantit-il un paiement unique ?",
        ),
        [
          l("Yes, one Pod means one payment", "Oui, un Pod signifie un paiement"),
          l(
            "No, repeated execution needs application deduplication",
            "Non, les reprises exigent une déduplication applicative",
          ),
          l("Only with restartPolicy: Never", "Seulement avec restartPolicy: Never"),
        ],
        1,
        l(
          "A process can commit remotely and fail before success is observed. Retrying needs an atomic idempotency key.",
          "Un processus peut valider à distance puis échouer avant l’observation du succès. La reprise exige une clé d’idempotence atomique.",
        ),
      ),
      question(
        l(
          "Which field limits how late a scheduled Job may start?",
          "Quel champ limite le retard de lancement d’un Job planifié ?",
        ),
        [
          l("startingDeadlineSeconds", "startingDeadlineSeconds"),
          l("activeDeadlineSeconds", "activeDeadlineSeconds"),
          l("ttlSecondsAfterFinished", "ttlSecondsAfterFinished"),
        ],
        0,
        l(
          "The CronJob starting deadline bounds lateness; the Job active deadline bounds runtime; TTL bounds object retention.",
          "Le délai de démarrage du CronJob borne le retard ; le délai actif du Job borne sa durée ; TTL borne la rétention des objets.",
        ),
      ),
      question(
        l(
          "Why does applying a completed Job not run it again?",
          "Pourquoi réappliquer un Job terminé ne le relance-t-il pas ?",
        ),
        [
          l("The image is cached", "L’image est en cache"),
          l("The namespace is locked", "Le namespace est verrouillé"),
          l(
            "Its desired completion target is already satisfied",
            "Sa cible de terminaison désirée est déjà satisfaite",
          ),
        ],
        2,
        l(
          "Reconciliation sees completed work. Create a new Job identity to request a separate execution.",
          "La réconciliation constate le travail terminé. Une nouvelle identité de Job demande une exécution distincte.",
        ),
      ),
    ),
    h("challenge", "Design a daily report", "Concevoir un rapport quotidien"),
    challenge(
      l("A slow daily export", "Un export quotidien lent"),
      l(
        "Create a suspended CronJob at 02:15 UTC. Permit a five-minute scheduling delay, stop execution after ten minutes, forbid overlapping scheduled runs, and retain one success. Explain how you prevent duplicate report publication.",
        "Créez un CronJob suspendu à 02:15 UTC. Autorisez cinq minutes de retard, arrêtez l’exécution après dix minutes, interdisez les chevauchements planifiés et conservez une réussite. Expliquez comment éviter de publier deux fois le rapport.",
      ),
      [
        l(
          "Schedule and runtime deadlines belong to different objects.",
          "Les délais de calendrier et d’exécution appartiennent à des objets différents.",
        ),
        l(
          "Change spec.jobTemplate.spec for the runtime budget; use a destination uniqueness key for side effects.",
          "Modifiez spec.jobTemplate.spec pour la durée ; utilisez une clé unique à destination pour les effets externes.",
        ),
      ],
      [
        code(
          "bash",
          'k -n lab-jobs patch cronjob scheduled-report --type=merge -p \'{"spec":{"schedule":"15 2 * * *","timeZone":"Etc/UTC","suspend":true,"startingDeadlineSeconds":300,"concurrencyPolicy":"Forbid","successfulJobsHistoryLimit":1,"jobTemplate":{"spec":{"activeDeadlineSeconds":600}}}}\'\nk -n lab-jobs get cronjob scheduled-report -o yaml',
        ),
        p(
          "The patch changes only future Jobs. A unique report-date key checked and committed atomically at the publication destination prevents duplicate publication; Forbid alone cannot. Keep the CronJob suspended until real inputs, storage and monitoring exist.",
          "Le patch change uniquement les futurs Jobs. Une clé unique de date du rapport, vérifiée et validée atomiquement à destination, empêche une double publication ; Forbid seul ne le peut pas. Gardez le CronJob suspendu avant de disposer d’entrées, stockage et supervision réels.",
        ),
      ],
    ),
    note(
      "info",
      l("Boundary", "Limite"),
      l(
        "This lab demonstrates controller behavior, not a durable batch-processing platform. Queues, transactions and remote data recovery require application-specific design.",
        "Ce lab démontre le comportement des contrôleurs, pas une plateforme de batch durable. Files de messages, transactions et récupération distante exigent une conception propre à l’application.",
      ),
    ),
    h(
      "cleanup",
      "Stop scheduling and remove the exercise",
      "Arrêter la planification et retirer l’exercice",
    ),
    code("bash", "k delete namespace lab-jobs"),
  ],
};
