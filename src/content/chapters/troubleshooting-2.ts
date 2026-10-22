import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import app from "../../../lab/level-2/troubleshooting-2/app.yaml?raw";
import storage from "../../../lab/level-2/troubleshooting-2/broken-storage.yaml?raw";

export const troubleshooting2: Chapter = {
  id: "troubleshooting-2",
  level: 2,
  minutes: 60,
  title: l(
    "Troubleshooting Pods, Services, network & storage",
    "Dépanner Pods, Services, réseau et stockage",
  ),
  summary: l(
    "Break one layer at a time, collect evidence before changing it and verify recovery from the caller's point of view.",
    "Casser une couche à la fois, collecter des preuves avant modification et vérifier le retour au service depuis l’appelant.",
  ),
  prerequisites: ["kubectl-troubleshooting", "probes", "dns", "storage"],
  related: ["incidents", "observability", "network-policies"],
  blocks: [
    h("objectives", "Build an evidence chain", "Construire une chaîne de preuves"),
    list(
      l(
        "Distinguish unscheduled, waiting, repeatedly crashing and unready containers.",
        "Distinguer conteneurs non placés, en attente, en crash répété et non prêts.",
      ),
      l(
        "Test DNS, Service selection and application response as separate claims.",
        "Tester DNS, sélection du Service et réponse applicative comme des affirmations distinctes.",
      ),
    ),
    h("mental-model", "Start with the failing request", "Partir de la requête défaillante"),
    p(
      "Record the namespace, caller, target, symptom and last change. Then work through placement, startup, readiness, endpoint selection, routing and application behavior. kubectl get gives a summary; describe adds conditions and Events; logs explains a process that actually started. CrashLoopBackOff is a restart backoff, not a root cause. A Pod phase of Running does not promise Ready, and a Pod phase of Pending includes more than scheduling failures. Change one hypothesis at a time and retest the original request.",
      "Notez namespace, appelant, cible, symptôme et dernière modification. Examinez ensuite placement, démarrage, readiness, sélection des endpoints, routage et comportement applicatif. kubectl get résume ; describe ajoute conditions et Events ; logs explique un processus qui a effectivement démarré. CrashLoopBackOff est un délai entre redémarrages, pas une cause. La phase Running ne garantit pas Ready et Pending couvre davantage que les seuls échecs de placement. Changez une hypothèse à la fois et retestez la requête initiale.",
    ),
    ...labContext("lab-triage"),
    note(
      "warn",
      l("Controlled interruption", "Interruption contrôlée"),
      l(
        "Every failure below affects only lab-triage. Recreate is intentional so there is only one application revision during log diagnosis; it interrupts service. Run and recover each scenario before starting the next. No DNS server, node or shared controller is modified. Registry access is needed for nginx and BusyBox.",
        "Chaque panne ci-dessous ne concerne que lab-triage. Recreate est volontaire pour ne garder qu’une révision applicative lors du diagnostic des logs ; il interrompt le service. Exécutez puis réparez chaque scénario avant le suivant. Aucun serveur DNS, nœud ou contrôleur partagé n’est modifié. L’accès aux registres est nécessaire pour nginx et BusyBox.",
      ),
    ),
    h("baseline", "Establish a known working path", "Établir un chemin fonctionnel connu"),
    code("yaml", app, "lab/level-2/troubleshooting-2/app.yaml"),
    code(
      "bash",
      "k -n lab-triage apply -f lab/level-2/troubleshooting-2/app.yaml\nk -n lab-triage rollout status deployment/web --timeout=120s\nk -n lab-triage wait --for=condition=Ready pod/client --timeout=120s\nk -n lab-triage exec client -- nslookup web.lab-triage.svc.cluster.local\nk -n lab-triage exec client -- wget -qO- -T 3 http://web",
    ),
    p(
      "Expected: DNS resolves the Service and HTTP returns the nginx welcome page. cluster.local is this kind lab's default suffix, not universal. The client sleeps for one hour per container run and then restarts under the default Always policy. If the Pod was deleted, reapply the supplied manifest and wait for client readiness before resuming. Capture actual Pod states and Events rather than treating this expected description as recorded evidence.",
      "Attendu : le DNS résout le Service et HTTP renvoie la page d’accueil nginx. cluster.local est le suffixe par défaut de ce lab kind, pas une constante universelle. Le client dort une heure par exécution puis redémarre avec la politique Always par défaut. Si le Pod a été supprimé, réappliquez le manifest fourni puis attendez sa readiness avant de reprendre. Relevez les états et Events réels sans prendre cette description attendue pour une preuve enregistrée.",
    ),
    h(
      "pending",
      "1. Pending: prove whether placement happened",
      "1. Pending : prouver si le placement a eu lieu",
    ),
    code(
      "bash",
      `k -n lab-triage patch deployment web --type=merge -p '{"spec":{"template":{"spec":{"nodeSelector":{"lab.k8sops.dev/triage":"missing"}}}}}'\nk -n lab-triage rollout status deployment/web --timeout=30s\nk -n lab-triage get pods -o wide\nk -n lab-triage describe pods -l app=triage-web\nk -n lab-triage get events --sort-by=.metadata.creationTimestamp\nk -n lab-triage patch deployment web --type=merge -p '{"spec":{"template":{"spec":{"nodeSelector":null}}}}'\nk -n lab-triage rollout status deployment/web --timeout=120s`,
    ),
    p(
      "The 30-second rollout timeout is expected; inspect the failed scheduling evidence before running the repair at the end of the block. Expected: no node matches the invented label, so the replacement has no node assignment and Events report FailedScheduling. Logs cannot diagnose a container that never started. If your actual Events instead mention requests, taints or unbound PVCs, follow that evidence. The repair removes only the injected selector; it does not weaken cluster-wide scheduling policy.",
      "Le délai de rollout de 30 secondes doit expirer ; examinez les preuves d’échec de placement avant la correction en fin de bloc. Attendu : aucun nœud ne correspond au label inventé ; le remplaçant n’a donc pas d’affectation et les Events signalent FailedScheduling. Les logs ne diagnostiquent pas un conteneur jamais démarré. Si vos Events réels mentionnent requests, taints ou PVC non liés, suivez cette preuve. La correction retire uniquement le sélecteur injecté, sans affaiblir une politique globale.",
    ),
    h(
      "image",
      "2. ImagePullBackOff: inspect retrieval",
      "2. ImagePullBackOff : examiner le téléchargement",
    ),
    code(
      "bash",
      "k -n lab-triage set image deployment/web web=nginx:missing-lab-tag\nk -n lab-triage rollout status deployment/web --timeout=30s\nk -n lab-triage describe pods -l app=triage-web\nk -n lab-triage set image deployment/web web=nginx:1.28.0-alpine\nk -n lab-triage rollout status deployment/web --timeout=120s",
    ),
    p(
      "The deliberate timeout is expected. Distinguish a nonexistent tag from denied registry credentials, DNS failure or registry throttling using Events. Restarting repeatedly does not publish the missing image. Verify the image reference and pull policy before changing network configuration.",
      "Le délai d’attente dépassé est attendu. Distinguez tag absent, refus d’identifiants, panne DNS ou limitation du registre via les Events. Redémarrer en boucle ne publie pas l’image manquante. Vérifiez référence d’image et pull policy avant de toucher au réseau.",
    ),
    h(
      "crash",
      "3. CrashLoopBackOff: inspect the last process",
      "3. CrashLoopBackOff : examiner le dernier processus",
    ),
    code(
      "bash",
      `k -n lab-triage patch deployment web --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"web","command":["sh","-c","echo simulated-configuration-error >&2; exit 42"]}]}}}}'\nk -n lab-triage rollout status deployment/web --timeout=30s\nk -n lab-triage get pods\nk -n lab-triage describe pods -l app=triage-web\nk -n lab-triage logs deployment/web --previous\nk -n lab-triage patch deployment web --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"web","command":null}]}}}}'\nk -n lab-triage rollout status deployment/web --timeout=120s`,
    ),
    p(
      "Expected: exit code 42 and the explicit simulated message. --previous reads the previous terminated container instance, not an older Deployment revision; if no prior instance exists yet, wait for a restart and retry. In a real case correlate exit code, termination reason, probe Events and logs. OOMKilled points toward memory pressure; a probe-driven restart is different from an application exiting itself. The strategic patch addresses the named container and retains its other fields; removing command restores the image's default entrypoint.",
      "Attendu : code de sortie 42 et message simulé explicite. --previous lit l’instance précédente terminée du conteneur, pas une ancienne révision du Deployment ; sans instance précédente, attendez un redémarrage puis réessayez. En cas réel, corrélez code de sortie, motif de terminaison, Events des probes et logs. OOMKilled oriente vers la mémoire ; un redémarrage par probe diffère d’un arrêt spontané de l’application. Le strategic patch cible le conteneur nommé et conserve ses autres champs ; retirer command rétablit le point d’entrée de l’image.",
    ),
    h("service", "4. Resolved name, missing endpoints", "4. Nom résolu, endpoints absents"),
    code(
      "bash",
      `k -n lab-triage patch service web --type=merge -p '{"spec":{"selector":{"app":"wrong-label"}}}'\nk -n lab-triage exec client -- nslookup web.lab-triage.svc.cluster.local\nk -n lab-triage get service web -o yaml\nk -n lab-triage get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-triage get pods --show-labels\nk -n lab-triage exec client -- wget -qO- -T 3 http://web\nk -n lab-triage patch service web --type=merge -p '{"spec":{"selector":{"app":"triage-web"}}}'\nk -n lab-triage exec client -- wget -qO- -T 3 http://web`,
    ),
    p(
      "DNS can return a ClusterIP while no ready endpoint matches the Service. Expected: resolution succeeds, HTTP fails, and endpoint inspection explains why. If endpoints exist, compare targetPort, listener and readiness, then test the Pod IP from the client. If a Pod IP works but Service routing fails, investigate the service dataplane; if both fail, inspect application binding, policies and CNI. A failed external lookup alone does not prove CoreDNS itself is broken.",
      "Le DNS peut retourner une ClusterIP alors qu’aucun endpoint prêt ne correspond au Service. Attendu : résolution réussie, HTTP en échec et inspection des endpoints explicative. Si des endpoints existent, comparez targetPort, port d’écoute et readiness, puis testez l’IP de Pod depuis le client. Si l’IP de Pod fonctionne mais pas le Service, examinez son dataplane ; si les deux échouent, vérifiez écoute applicative, politiques et CNI. Un seul nom externe non résolu ne prouve pas une panne de CoreDNS.",
    ),
    h(
      "storage",
      "5. PVC dependency before container startup",
      "5. Dépendance PVC avant le démarrage",
    ),
    code("yaml", storage, "lab/level-2/troubleshooting-2/broken-storage.yaml"),
    code(
      "bash",
      "k -n lab-triage apply -f lab/level-2/troubleshooting-2/broken-storage.yaml\nk -n lab-triage get pod/storage-check pvc/data\nk -n lab-triage describe pvc data\nk -n lab-triage describe pod storage-check\nk get storageclasses\nk -n lab-triage delete -f lab/level-2/troubleshooting-2/broken-storage.yaml",
    ),
    p(
      "Expected: the claim cannot provision using the deliberately nonexistent class and the Pod cannot mount its required volume. Do not edit an established PVC's immutable storageClassName or delete a production claim as a repair. Here the empty disposable claim is removed. In real storage triage inspect binding mode, capacity, access mode, volume topology and provisioner Events; WaitForFirstConsumer can intentionally defer binding. A Bound claim does not by itself prove successful mounting or application permissions.",
      "Attendu : le claim ne peut pas être provisionné avec la classe volontairement absente et le Pod ne peut monter son volume requis. Ne modifiez pas le storageClassName immuable d’un PVC établi et ne supprimez pas un claim de production comme réparation. Ici le claim jetable et vide est retiré. Pour un diagnostic réel, examinez binding mode, capacité, access mode, topologie et Events du provisioner ; WaitForFirstConsumer peut différer volontairement le binding. Un claim Bound ne prouve à lui seul ni montage réussi ni permissions applicatives.",
    ),
    h("quiz", "Choose the next evidence", "Choisir la prochaine preuve"),
    quiz(
      question(
        l(
          "DNS resolves but the Service has no ready endpoints. What comes first?",
          "Le DNS résout mais le Service n’a aucun endpoint prêt. Que vérifier d’abord ?",
        ),
        [
          l("Restart CoreDNS", "Redémarrer CoreDNS"),
          l(
            "Compare selector, Pod labels and readiness",
            "Comparer sélecteur, labels et readiness",
          ),
          l("Increase the PVC size", "Augmenter le PVC"),
        ],
        1,
        l(
          "Name resolution already worked. Endpoint selection is the next unproven link.",
          "La résolution a fonctionné. La sélection des endpoints est le prochain maillon non démontré.",
        ),
      ),
      question(
        l("What does logs --previous target?", "Que cible logs --previous ?"),
        [
          l("The previous Deployment revision", "La révision précédente du Deployment"),
          l("Every deleted Pod", "Tous les Pods supprimés"),
          l(
            "The previous container instance in that Pod",
            "L’instance précédente du conteneur dans ce Pod",
          ),
        ],
        2,
        l(
          "Restart history is scoped to a Pod/container; rollout history is a different mechanism.",
          "L’historique des redémarrages concerne un Pod/conteneur ; celui des rollouts est distinct.",
        ),
      ),
      question(
        l(
          "Why does Pending not prove insufficient CPU?",
          "Pourquoi Pending ne prouve-t-il pas un manque de CPU ?",
        ),
        [
          l(
            "Scheduling, image setup and volume dependencies need conditions and Events",
            "Placement, préparation d’image et dépendances de volume exigent conditions et Events",
          ),
          l("Pending is always a DNS failure", "Pending est toujours une panne DNS"),
          l("CPU is unlimited in kind", "Le CPU est illimité dans kind"),
        ],
        0,
        l(
          "A summary phase is not a root cause; inspect assignment, waiting reasons and dependent resources.",
          "Une phase résumée n’est pas une cause ; examinez affectation, motifs d’attente et ressources dépendantes.",
        ),
      ),
    ),
    challenge(
      l("Prove recovery, not just Ready", "Prouver le retour au service, au-delà de Ready"),
      l(
        "After all injections are repaired, write a four-check recovery sequence proving desired replicas, ready endpoints, DNS and HTTP. Explain one thing each check cannot prove alone.",
        "Après réparation des injections, écrivez quatre vérifications prouvant réplicas désirés, endpoints prêts, DNS et HTTP. Expliquez une limite de chacune prise seule.",
      ),
      [
        l(
          "Start with the controller, then follow the same request path as the client.",
          "Commencez par le contrôleur puis suivez le chemin de requête du client.",
        ),
        l(
          "Use EndpointSlices and execute DNS/HTTP from client rather than your laptop.",
          "Utilisez EndpointSlices et exécutez DNS/HTTP depuis client, pas depuis votre ordinateur.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-triage rollout status deployment/web --timeout=120s\nk -n lab-triage get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-triage exec client -- nslookup web.lab-triage.svc.cluster.local\nk -n lab-triage exec client -- wget -qO- -T 3 http://web",
        ),
        p(
          "Expected: available rollout, a ready address, resolved name and HTTP content. Availability does not prove routing, endpoints do not prove DNS, DNS does not prove HTTP, and one successful HTTP request does not prove sustained reliability. Record the actual root cause, minimal repair and a prevention action before closing the incident.",
          "Attendu : rollout disponible, adresse prête, nom résolu et contenu HTTP. La disponibilité ne prouve pas le routage, les endpoints ne prouvent pas le DNS, le DNS ne prouve pas HTTP et une requête réussie ne prouve pas une fiabilité durable. Consignez cause réelle, correction minimale et action préventive avant de clore l’incident.",
        ),
      ],
    ),
    h("cleanup", "Remove the isolated exercise", "Retirer l’exercice isolé"),
    code("bash", "k delete namespace lab-triage"),
    p(
      "No cluster-scoped resources were created. The storage scenario does not demonstrate successful CSI provisioning, backups or data recovery; those require a real compatible storage system and separate tests.",
      "Aucune ressource globale n’a été créée. Le scénario stockage ne démontre ni provisionnement CSI réussi, ni sauvegarde, ni récupération de données : ils exigent un système de stockage compatible et des tests distincts.",
    ),
  ],
};
