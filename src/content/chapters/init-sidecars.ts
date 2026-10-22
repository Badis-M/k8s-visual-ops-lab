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
import manifest from "../../../lab/level-2/init-sidecars/web.yaml?raw";

export const initSidecars: Chapter = {
  id: "init-sidecars",
  level: 2,
  minutes: 50,
  title: l("Init containers and native sidecars", "Init containers et sidecars natifs"),
  summary: l(
    "Separate one-time preparation from supporting processes, inspect their lifecycle, and diagnose a Pod blocked before its application starts.",
    "Séparer la préparation initiale des processus de support, observer leur cycle de vie et diagnostiquer un Pod bloqué avant le démarrage applicatif.",
  ),
  prerequisites: ["pods", "configmaps-secrets", "probes"],
  related: ["probes", "storage", "jobs"],
  blocks: [
    h("objectives", "Choose the right lifecycle", "Choisir le bon cycle de vie"),
    list(
      l(
        "Distinguish a regular init container, a native sidecar and two ordinary application containers.",
        "Distinguer un init container classique, un sidecar natif et deux conteneurs applicatifs ordinaires.",
      ),
      l(
        "Use shared volumes deliberately and locate the failing container instead of restarting the whole Pod blindly.",
        "Partager des volumes explicitement et identifier le conteneur en échec au lieu de redémarrer aveuglément tout le Pod.",
      ),
    ),
    h(
      "mental-model",
      "Preparation is different from accompaniment",
      "Préparer et accompagner sont deux rôles distincts",
    ),
    p(
      "A regular init container is a prerequisite: it must exit successfully before the next init container starts. Once all required initialization has completed, the application can start. Use this for preparing configuration or checking a bounded dependency. Initialization can run again, so its effects must be repeatable. Blindly appending a migration on every retry can corrupt data; a distributed database migration usually needs a dedicated delivery process rather than one copy per replica.",
      "Un init container classique est un prérequis : il doit se terminer avec succès avant le démarrage du suivant. L’application peut démarrer quand toutes les initialisations requises sont terminées. Cela convient à la préparation d’une configuration ou à une vérification bornée de dépendance. L’initialisation peut être rejouée : ses effets doivent être répétables. Ajouter une migration à chaque tentative peut corrompre des données ; une migration distribuée nécessite généralement un processus de livraison dédié plutôt qu’une copie par réplica.",
    ),
    p(
      "A native sidecar lives in initContainers with restartPolicy: Always. It stays alive while application containers run. The next initialization stage proceeds once the sidecar has started; when a startupProbe exists, that probe must succeed first. This lifecycle is stable since Kubernetes 1.33 and available in this lesson's 1.35 baseline. Two ordinary containers under containers have no equivalent initialization ordering contract. Container list order alone does not establish dependency readiness.",
      "Un sidecar natif est déclaré dans initContainers avec restartPolicy: Always. Il reste actif pendant l’exécution des conteneurs applicatifs. L’étape d’initialisation suivante progresse lorsque le sidecar a démarré ; avec une startupProbe, celle-ci doit d’abord réussir. Ce cycle est stable depuis Kubernetes 1.33 et disponible dans notre base 1.35. Deux conteneurs ordinaires sous containers n’ont pas ce contrat d’ordonnancement initial. Leur ordre dans la liste n’établit pas une dépendance de disponibilité.",
    ),
    note(
      "info",
      l("Startup, readiness and shutdown", "Démarrage, readiness et arrêt"),
      l(
        "A sidecar readinessProbe contributes to Pod readiness. During normal termination, native sidecars stop after the main containers, in reverse initialization order, within the Pod's overall grace period. In a Job, a native sidecar does not prevent completion after the main work finishes; an ordinary endless companion container can. None of this guarantees delivery of buffered logs after a host crash.",
        "Une readinessProbe de sidecar contribue à la readiness du Pod. Lors d’un arrêt normal, les sidecars natifs s’arrêtent après les conteneurs principaux, dans l’ordre inverse d’initialisation, avec la période de grâce globale du Pod. Dans un Job, un sidecar natif n’empêche pas l’achèvement du travail principal ; un compagnon ordinaire infini peut le bloquer. Cela ne garantit pas la livraison de logs en mémoire après une panne hôte.",
      ),
    ),
    ...labContext("lab-sidecars"),
    h(
      "manifest",
      "A page initializer and a log companion",
      "Initialiser une page et suivre ses logs",
    ),
    code("yaml", manifest, "lab/level-2/init-sidecars/web.yaml"),
    p(
      "seed-page writes a temporary file then renames it, so repeated preparation replaces the page coherently. access-log creates the log file and follows it. Its startupProbe checks a concrete startup prerequisite; it does not claim that a remote logging system is healthy. nginx serves the page on unprivileged port 8080 and writes access logs into a shared emptyDir. The ConfigMap replaces the full nginx configuration so PID and temporary files use writable mounts while the image filesystem stays read-only.",
      "seed-page écrit un fichier temporaire puis le renomme : une préparation répétée remplace la page de manière cohérente. access-log crée le fichier de logs et le suit. Sa startupProbe vérifie un prérequis concret de démarrage ; elle ne prétend pas vérifier la santé d’un collecteur distant. nginx sert la page sur le port non privilégié 8080 et écrit les accès dans un emptyDir partagé. La ConfigMap remplace toute la configuration nginx pour placer PID et fichiers temporaires sur les volumes inscriptibles tout en gardant l’image en lecture seule.",
    ),
    {
      type: "fields",
      rows: [
        {
          field: "initContainers[].restartPolicy",
          text: l(
            "Always marks access-log as restartable; seed-page must finish instead.",
            "Always rend access-log redémarrable ; seed-page doit au contraire se terminer.",
          ),
        },
        {
          field: "volumeMounts",
          text: l(
            "Each container gets only its required paths. Sharing a Pod does not share its image filesystem.",
            "Chaque conteneur reçoit seulement ses chemins utiles. Partager un Pod ne partage pas le système de fichiers de son image.",
          ),
        },
        {
          field: "emptyDir",
          text: l(
            "Survives a container restart inside this Pod, but disappears with Pod deletion. It is not durable storage.",
            "Survit au redémarrage d’un conteneur dans ce Pod, mais disparaît à sa suppression. Ce stockage n’est pas durable.",
          ),
        },
        {
          field: "securityContext.fsGroup",
          text: l(
            "Provides a shared group for the exercise volumes without running the workload as root.",
            "Fournit un groupe commun aux volumes de l’exercice sans exécuter le workload en root.",
          ),
        },
      ],
    },
    h("exercise", "Follow the lifecycle with evidence", "Suivre le cycle avec des observations"),
    steps(
      {
        title: l("Start and inspect every container", "Démarrer et inspecter chaque conteneur"),
        code: {
          lang: "bash",
          code: "k -n lab-sidecars apply -f lab/level-2/init-sidecars/web.yaml\nk -n lab-sidecars wait --for=condition=Ready pod/sidecar-web --timeout=120s\nk -n lab-sidecars describe pod sidecar-web\nk -n lab-sidecars logs sidecar-web -c seed-page\nk -n lab-sidecars get pod sidecar-web -o jsonpath='{.status.initContainerStatuses}'",
        },
        explain: l(
          "Compare the completed seed-page state with the running access-log state. Empty initializer logs are normal: this initializer writes to a file rather than stdout.",
          "Comparez l’état terminé de seed-page avec l’état actif de access-log. Des logs d’initialisation vides sont normaux : ce conteneur écrit dans un fichier plutôt que sur stdout.",
        ),
        expected: {
          text: l(
            "Expected: seed-page terminates with exit code 0; access-log and web run. A running sidecar still appears under initContainerStatuses.",
            "Attendu : seed-page termine avec le code 0 ; access-log et web tournent. Le sidecar actif figure toujours dans initContainerStatuses.",
          ),
        },
      },
      {
        title: l("Generate an access and find its log", "Générer un accès et retrouver son log"),
        code: {
          lang: "bash",
          code: "k -n lab-sidecars port-forward pod/sidecar-web 8082:8080\n# In a second terminal:\ncurl --fail http://127.0.0.1:8082/\nkubectl --context kind-k8s-ops-lab -n lab-sidecars logs sidecar-web -c access-log --tail=10",
        },
        explain: l(
          "Keep port-forward running in the first terminal. The second command uses an explicit context because shell aliases do not automatically transfer between terminals.",
          "Laissez port-forward actif dans le premier terminal. La seconde commande utilise un contexte explicite car un alias ne se transmet pas automatiquement entre terminaux.",
        ),
        expected: {
          text: l(
            "Expected page: Prepared by the init container. Expected sidecar output: an HTTP access line. Readiness probes also produce access lines; find your request rather than assuming every line is curl.",
            "Page attendue : Prepared by the init container. Sortie attendue du sidecar : une ligne d’accès HTTP. Les probes produisent également des accès ; identifiez votre requête plutôt que d’attribuer toutes les lignes à curl.",
          ),
        },
      },
    ),
    h(
      "diagnosis",
      "A Pod that never reaches its app",
      "Un Pod qui n’atteint jamais son application",
    ),
    p(
      "Init:Error or Init:CrashLoopBackOff directs attention to initialization, not to the web process that may never have started. Read describe, Events and logs -c seed-page; after a retry, --previous can expose the previous attempt. For Permission denied, compare user/group, mount permissions and readOnly settings. For a blocked external dependency, check DNS and connectivity with a finite timeout; an endless wait can hide a configuration error indefinitely. Never use a successful sleep as proof that a database is ready.",
      "Init:Error ou Init:CrashLoopBackOff oriente vers l’initialisation, pas vers le processus web qui n’a peut-être jamais démarré. Lisez describe, les Events et logs -c seed-page ; après une nouvelle tentative, --previous peut exposer l’essai précédent. Pour Permission denied, comparez utilisateur/groupe, permissions du volume et réglages readOnly. Face à une dépendance externe bloquée, vérifiez DNS et connectivité avec un délai fini : une attente infinie masque durablement une erreur de configuration. Un sleep réussi ne prouve jamais qu’une base est prête.",
    ),
    h("quiz", "Check the lifecycle contract", "Vérifier le contrat du cycle de vie"),
    quiz(
      question(
        l(
          "A regular init container keeps tail running forever. What happens?",
          "Un init container classique exécute tail indéfiniment. Que se passe-t-il ?",
        ),
        [
          l("The application waits for it to complete", "L’application attend sa fin"),
          l("The application starts immediately", "L’application démarre immédiatement"),
          l("Kubernetes converts it to a sidecar", "Kubernetes le convertit en sidecar"),
        ],
        0,
        l(
          "Only the explicit native-sidecar lifecycle permits this initialization stage to remain running while startup proceeds.",
          "Seul le cycle explicite du sidecar natif autorise cette étape à rester active pendant que le démarrage progresse.",
        ),
      ),
      question(
        l(
          "A sidecar restarts inside the same Pod. What happens to emptyDir?",
          "Un sidecar redémarre dans le même Pod. Que devient emptyDir ?",
        ),
        [
          l("It is always erased", "Il est toujours effacé"),
          l("It remains until the Pod is removed", "Il subsiste jusqu’à la suppression du Pod"),
          l("It becomes a PVC", "Il devient un PVC"),
        ],
        1,
        l(
          "Volume lifetime is tied to the Pod, unlike the writable image layer of a particular container instance.",
          "La durée du volume est liée au Pod, contrairement à la couche inscriptible d’une instance de conteneur.",
        ),
      ),
      question(
        l(
          "Why is the startupProbe not a remote logging delivery guarantee?",
          "Pourquoi la startupProbe ne garantit-elle pas la livraison distante des logs ?",
        ),
        [
          l(
            "All probes are ignored on sidecars",
            "Toutes les probes sont ignorées sur les sidecars",
          ),
          l("tail automatically replicates files", "tail réplique automatiquement les fichiers"),
          l(
            "The probe only tests local file creation",
            "La probe teste seulement la création locale du fichier",
          ),
        ],
        2,
        l(
          "A probe establishes exactly its configured signal. This exercise has no remote collector, queue or persistence acknowledgment.",
          "Une probe établit seulement son signal configuré. Cet exercice ne contient ni collecteur distant, ni file, ni acquittement de persistance.",
        ),
      ),
    ),
    h("challenge", "Repair initialization deliberately", "Réparer l’initialisation explicitement"),
    challenge(
      l(
        "Turn the companion into a regular initializer",
        "Transformer le compagnon en init classique",
      ),
      l(
        "Copy web.yaml to a temporary local file, remove restartPolicy: Always and the entire startupProbe block from access-log, delete only sidecar-web, then apply your copy in lab-sidecars. Explain why web does not start. Restore the supplied manifest and verify the page again. Stop port-forward before deleting the Pod.",
        "Copiez web.yaml dans un fichier temporaire local, retirez restartPolicy: Always et tout le bloc startupProbe de access-log, supprimez seulement sidecar-web puis appliquez votre copie dans lab-sidecars. Expliquez pourquoi web ne démarre pas. Restaurez le manifest fourni et vérifiez à nouveau la page. Arrêtez port-forward avant la suppression.",
      ),
      [
        l(
          "A regular init container cannot declare startupProbe. Remove that probe as well as restartPolicy so the API accepts the experiment; tail then runs indefinitely.",
          "Un init classique ne peut pas déclarer startupProbe. Retirez cette probe avec restartPolicy pour que l’API accepte l’expérience ; tail tourne alors indéfiniment.",
        ),
        l(
          "Pod initialization fields cannot all be patched in place; recreate this disposable Pod.",
          "Les champs d’initialisation d’un Pod ne sont pas tous modifiables en place ; recréez ce Pod jetable.",
        ),
      ],
      [
        p(
          "With both sidecar-only settings removed, access-log becomes a valid regular initializer. Removing restartPolicy alone would instead cause API validation to reject startupProbe. Its successful startup does not satisfy completion, so nginx remains waiting. Delete the experimental Pod and reapply the original file; it recreates a new emptyDir and reruns seed-page. The recovery replaces the Pod rather than claiming to preserve its ephemeral logs.",
          "Sans les deux réglages propres au sidecar, access-log devient un init classique valide. Retirer seulement restartPolicy ferait au contraire rejeter startupProbe par la validation API. Son démarrage réussi ne satisfait pas la condition d’achèvement ; nginx reste donc en attente. Supprimez le Pod expérimental et réappliquez l’original : un nouvel emptyDir est créé et seed-page rejoué. La récupération remplace le Pod sans prétendre conserver ses logs éphémères.",
        ),
        code(
          "bash",
          "k -n lab-sidecars delete pod sidecar-web\nk -n lab-sidecars apply -f lab/level-2/init-sidecars/web.yaml\nk -n lab-sidecars wait --for=condition=Ready pod/sidecar-web --timeout=120s",
        ),
      ],
    ),
    h("limits-cleanup", "Limits and cleanup", "Limites et nettoyage"),
    p(
      "This Pod demonstrates local file sharing and lifecycle order, not a production log pipeline. Each supporting process consumes resources and couples deployment with the app; a cluster-wide collector may be better served by a DaemonSet. Stop port-forward with Ctrl+C, then remove the isolated namespace. Both page and access logs are intentionally discarded.",
      "Ce Pod démontre le partage local de fichiers et l’ordre du cycle de vie, pas une chaîne de logs de production. Chaque compagnon consomme des ressources et couple sa livraison à l’application ; un collecteur de cluster peut mieux relever d’un DaemonSet. Arrêtez port-forward avec Ctrl+C puis supprimez le namespace isolé. La page et les logs sont volontairement perdus.",
    ),
    code("bash", "k delete namespace lab-sidecars"),
  ],
};
