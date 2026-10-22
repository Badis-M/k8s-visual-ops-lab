import type { Chapter } from "../types";
import { l, h, p, code, note, list, labContext, quiz, question, challenge } from "../lesson-kit";
import workload from "../../../lab/level-4/failure-scenarios/workload.yaml?raw";
import server from "../../../lab/level-4/failure-scenarios/server.py?raw";

export const failureScenarios: Chapter = {
  id: "failure-scenarios",
  level: 4,
  minutes: 60,
  title: l("Advanced failure scenarios", "Scénarios de panne avancés"),
  summary: l(
    "Run bounded failure experiments linking dependency health, endpoint removal, rollout capacity and disruption budgets, with explicit recovery evidence.",
    "Mener des expériences bornées reliant santé des dépendances, retrait des endpoints, capacité de rollout et budgets de disruption, avec preuves de récupération explicites.",
  ),
  prerequisites: ["incidents", "pdb", "resources", "probes"],
  related: ["etcd", "admission-webhooks", "multi-cluster"],
  blocks: [
    h(
      "objectives",
      "Test a causal chain, not a dramatic outage",
      "Tester une causalité, pas une panne spectaculaire",
    ),
    list(
      l(
        "State the steady state, smallest injection, predicted evidence, abort condition and exact rollback before a fault.",
        "Définir état stable, injection minimale, preuve attendue, condition d’arrêt et retour arrière avant la panne.",
      ),
      l(
        "Distinguish dependency failure, admission capacity rejection and Pod eviction policy without changing shared cluster services.",
        "Distinguer panne de dépendance, refus de capacité d’admission et politique d’éviction sans modifier les services partagés.",
      ),
    ),
    h(
      "mental-model",
      "Several correct controllers can still deadlock delivery",
      "Plusieurs contrôleurs corrects peuvent bloquer une livraison",
    ),
    p(
      "Kubernetes components reconcile different contracts: readiness selects traffic endpoints, liveness can restart a process, a Deployment controls revision replacement, a quota rejects excessive resource creation and a PDB constrains voluntary eviction. These mechanisms are not one global availability algorithm. A deployment can keep old replicas healthy yet be unable to create its surge Pod; a process can be alive yet intentionally removed from traffic because a dependency failed. Diagnose the missing transition and the controller responsible instead of restarting everything.",
      "Les composants réconcilient des contrats différents : readiness sélectionne les endpoints, liveness peut redémarrer le processus, Deployment remplace les révisions, un quota refuse la création excessive et PDB contraint l’éviction volontaire. Ils ne forment pas un algorithme global de disponibilité. Un déploiement peut garder les anciens réplicas sains tout en étant incapable de créer le Pod de surge ; un processus peut vivre mais être retiré du trafic à cause d’une dépendance. Diagnostiquez la transition manquante et son contrôleur au lieu de tout redémarrer.",
    ),
    p(
      "The hostname spread policy uses nodeTaintsPolicy: Honor so the untolerated control-plane node is excluded from the skew calculation. That leaves the two workers as eligible domains and lets a third surge Pod fit as two plus one once quota is restored.",
      "La répartition par hostname utilise nodeTaintsPolicy: Honor pour exclure du calcul le control plane dont les taints ne sont pas tolérés. Les deux workers restent les domaines éligibles et un troisième Pod de surge peut se placer en deux plus un après restauration du quota.",
    ),
    ...labContext("lab-failures"),
    note(
      "warn",
      l("A bounded game day", "Un exercice de panne borné"),
      l(
        "Use the two disposable workers from lab/kind.yaml, Docker, Python 3.13+ and this isolated namespace. Plan a ten-minute experiment window; stop and restore the last change if healthy baseline cannot be established or an unrelated namespace degrades. The fixture models a dependency with a ConfigMap, not a real network partition. No node stop, shared DNS mutation, disk fill, control-plane kill or production resource operation is needed.",
        "Utilisez les deux workers jetables de lab/kind.yaml, Docker, Python 3.13+ et ce namespace isolé. Prévoyez dix minutes ; arrêtez puis annulez le dernier changement si la base saine n’est pas établie ou si un autre namespace se dégrade. La dépendance est simulée par ConfigMap, pas par une vraie partition réseau. Aucun arrêt de nœud, modification DNS partagé, remplissage disque, arrêt du control plane ou opération de production n’est nécessaire.",
      ),
    ),
    h("baseline", "Establish observable steady state", "Établir un état stable observable"),
    code("python", server, "lab/level-4/failure-scenarios/server.py"),
    code("yaml", workload, "lab/level-4/failure-scenarios/workload.yaml"),
    code(
      "bash",
      "python3 -m unittest discover -s lab/level-4/failure-scenarios -p 'test_*.py'\ndocker build -t failure-fixture:local lab/level-4/failure-scenarios\nkind load docker-image failure-fixture:local --name k8s-ops-lab\nk -n lab-failures apply -f lab/level-4/failure-scenarios/workload.yaml\nk -n lab-failures rollout status deployment/web --timeout=180s\nk -n lab-failures get pods -o wide\nk -n lab-failures get endpointslices -l kubernetes.io/service-name=web\nk -n lab-failures get pdb,resourcequota",
    ),
    p(
      "Expected: two ready replicas spread across eligible workers, ready Service endpoints, quota allowing one surge Pod, and PDB disruptionsAllowed:0 because both replicas are required. Runtime capacity and image loading still need verification. Capture these actual values before injecting anything. The root endpoint, /ready and /live deliberately express different contracts; the unit tests prove their local decision table, not their Kubernetes integration.",
      "Attendu : deux réplicas prêts répartis sur les workers éligibles, endpoints prêts, quota laissant un Pod de surge et PDB disruptionsAllowed:0 car les deux réplicas sont requis. Capacité réelle et chargement de l’image restent à vérifier. Relevez ces valeurs avant injection. Racine, /ready et /live expriment volontairement des contrats distincts ; les tests prouvent leur table locale, pas l’intégration Kubernetes.",
    ),
    h(
      "dependency",
      "Experiment 1: dependency loss without restart storm",
      "Expérience 1 : perdre une dépendance sans tempête de redémarrages",
    ),
    code(
      "bash",
      `k -n lab-failures patch configmap dependency --type=merge -p '{"data":{"ready":"false"}}'\nk -n lab-failures wait --for=condition=Ready=false pod -l app=failure-web --timeout=180s\nk -n lab-failures get pods\nk -n lab-failures get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-failures describe pods -l app=failure-web`,
    ),
    p(
      "Expected after projected ConfigMap refresh: Pods keep running with unchanged restart counts, readiness fails and ready endpoints disappear. ConfigMap volume propagation is eventual, not instantaneous; a subPath mount would not refresh this way. /live remains successful because restarting a healthy process cannot repair the modeled dependency. Wiring dependency health into liveness could instead create a restart storm and amplify load. This injection demonstrates application health semantics; it does not test packets, CoreDNS or CNI failure.",
      "Attendu après rafraîchissement du ConfigMap projeté : les Pods restent actifs sans augmentation des redémarrages, readiness échoue et les endpoints prêts disparaissent. La propagation est éventuelle, pas instantanée ; un montage subPath ne se rafraîchirait pas ainsi. /live réussit car redémarrer un processus sain ne répare pas la dépendance simulée. Inclure celle-ci dans liveness pourrait créer une tempête et amplifier la charge. L’injection démontre la sémantique applicative, pas une panne paquets, CoreDNS ou CNI.",
    ),
    code(
      "bash",
      `k -n lab-failures patch configmap dependency --type=merge -p '{"data":{"ready":"true"}}'\nk -n lab-failures wait --for=condition=Ready pod -l app=failure-web --timeout=180s\nk -n lab-failures get endpointslices -l kubernetes.io/service-name=web -o yaml\nk -n lab-failures port-forward service/web 8081:80`,
    ),
    p(
      "Open http://localhost:8081, verify dependency available and stop with Ctrl+C. Do not proceed until both replicas and endpoints are ready again. An HTTP check plus endpoint recovery is stronger evidence than merely reverting the ConfigMap value; the process may still be consuming its previous projection.",
      "Ouvrez http://localhost:8081, vérifiez dependency available puis arrêtez avec Ctrl+C. Ne poursuivez pas avant retour des deux réplicas et endpoints prêts. HTTP et endpoints restaurés apportent davantage que le seul retour du ConfigMap : le processus peut encore consommer l’ancienne projection.",
    ),
    h(
      "quota",
      "Experiment 2: a healthy service with an impossible rollout",
      "Expérience 2 : un service sain avec un rollout impossible",
    ),
    code(
      "bash",
      `k -n lab-failures patch resourcequota workload-budget --type=merge -p '{"spec":{"hard":{"pods":"2"}}}'\nk -n lab-failures set env deployment/web EXPERIMENT=quota\nk -n lab-failures rollout status deployment/web --timeout=30s\nk -n lab-failures describe replicasets -l app=failure-web\nk -n lab-failures describe resourcequota workload-budget\nk -n lab-failures get deployment web -o yaml`,
    ),
    p(
      "Expected: the new ReplicaSet reports FailedCreate/exceeded quota, while two old available replicas can still serve. There may be no new Pending Pod: admission refused creating it. maxUnavailable:0 will not remove an old available replica just to make quota room, and maxSurge:1 cannot override a namespace quota. The 30-second CLI timeout is separate from the controller's 90-second progress deadline; neither automatically rolls back the release. PDB is not the controller blocking this rollout.",
      "Attendu : le nouveau ReplicaSet signale FailedCreate/quota dépassé tandis que deux anciens réplicas servent encore. Il peut n’exister aucun nouveau Pod Pending : l’admission a refusé sa création. maxUnavailable:0 ne retire pas un ancien réplica disponible pour libérer le quota ; maxSurge:1 ne le contourne pas. Le délai CLI de trente secondes diffère du délai contrôleur de quatre-vingt-dix secondes ; aucun n’annule automatiquement la livraison. Le PDB n’est pas le contrôleur qui bloque ce rollout.",
    ),
    code(
      "bash",
      `k -n lab-failures patch resourcequota workload-budget --type=merge -p '{"spec":{"hard":{"pods":"3"}}}'\nk -n lab-failures rollout status deployment/web --timeout=180s\nk -n lab-failures get replicasets,pods -l app=failure-web`,
    ),
    p(
      "Restoring the planned surge allowance unblocks delivery without deleting healthy old Pods or disabling every quota. Terminating Pods can occupy quota briefly, so observe reconciliation rather than assuming an immediate transition. In production, decide the capacity/availability trade-off before promotion; reducing maxUnavailable is not free capacity and raising quota does not add actual node resources.",
      "Rétablir le budget de surge prévu débloque la livraison sans supprimer les anciens Pods sains ni désactiver tous les quotas. Des Pods terminants peuvent encore occuper temporairement le quota : observez la réconciliation. En production, décidez du compromis capacité/disponibilité avant promotion ; réduire maxUnavailable ne crée pas de capacité et augmenter un quota ne crée pas de ressources de nœud.",
    ),
    h(
      "limits",
      "What these experiments cannot establish",
      "Ce que ces expériences n’établissent pas",
    ),
    p(
      "A PDB constrains the Eviction API, not every deletion, node crash or Deployment rollout. These two replicas do not prove zone redundancy on one host. A simulated dependency flag is not proof of retry behavior under real packet loss. API-server/etcd loss, webhook unavailability and restored watch history each need their own isolated environment and acceptance criteria; use the related chapters rather than stopping shared control-plane components. Keep an incident timeline of hypothesis, action, evidence, rollback duration and remaining uncertainty.",
      "Un PDB contraint l’API Eviction, pas toute suppression, panne de nœud ou rollout. Deux réplicas sur un hôte ne prouvent aucune redondance de zone. Un flag simulé ne prouve pas les retries sous vraie perte réseau. Perte API/etcd, indisponibilité de webhook et historique de watches restauré exigent chacun environnement isolé et critères propres ; utilisez les chapitres liés au lieu d’arrêter le control plane partagé. Conservez hypothèse, action, preuve, durée de retour arrière et incertitude dans la chronologie.",
    ),
    h("quiz", "Identify the responsible mechanism", "Identifier le mécanisme responsable"),
    quiz(
      question(
        l(
          "Why can a quota-blocked rollout have no new Pending Pod?",
          "Pourquoi un rollout bloqué par quota peut-il n’avoir aucun nouveau Pod Pending ?",
        ),
        [
          l(
            "The ReplicaSet's Pod creation was rejected before persistence",
            "La création du Pod a été refusée avant persistance",
          ),
          l("All Pods are hidden during rollouts", "Tous les Pods sont cachés pendant un rollout"),
          l("PDB deletes the evidence", "Le PDB supprime les preuves"),
        ],
        0,
        l(
          "Inspect FailedCreate Events on the creating controller, not only existing Pods.",
          "Examinez FailedCreate sur le contrôleur créateur, pas seulement les Pods existants.",
        ),
      ),
      question(
        l(
          "Should a healthy process always restart when its remote dependency fails?",
          "Un processus sain doit-il toujours redémarrer si une dépendance distante échoue ?",
        ),
        [
          l("Yes, retries require restarts", "Oui, les retries exigent des redémarrages"),
          l("No, that can amplify the dependency outage", "Non, cela peut amplifier la panne"),
          l("Only if replicas are two", "Seulement avec deux réplicas"),
        ],
        1,
        l(
          "Use distinct liveness/readiness contracts and bounded retry behavior suitable for the application.",
          "Séparez liveness/readiness et utilisez des retries bornés adaptés à l’application.",
        ),
      ),
      question(
        l(
          "Does minAvailable:2 prevent scaling a Deployment to one replica?",
          "minAvailable:2 empêche-t-il de réduire un Deployment à un réplica ?",
        ),
        [
          l("Yes, it is the replica controller", "Oui, c’est le contrôleur de réplicas"),
          l("Only when quota is three", "Seulement si le quota vaut trois"),
          l(
            "No, a PDB is not a replica-count enforcement policy",
            "Non, un PDB n’impose pas le nombre de réplicas",
          ),
        ],
        2,
        l(
          "PDB applies to voluntary eviction requests; direct controller scaling has a different path.",
          "Le PDB concerne les requêtes d’éviction volontaire ; le scaling du contrôleur suit un autre chemin.",
        ),
      ),
    ),
    challenge(
      l(
        "Prove the PDB boundary without node disruption",
        "Prouver la limite du PDB sans perturber un nœud",
      ),
      l(
        "On this disposable workload only, scale to one, observe that minAvailable remains two with no allowed disruptions, then restore two. Explain why this is not an eviction test and does not validate a drain procedure.",
        "Sur ce workload jetable seulement, réduisez à un, observez minAvailable à deux sans disruption autorisée puis rétablissez deux. Expliquez pourquoi ce n’est ni un test d’éviction ni une validation de drain.",
      ),
      [
        l(
          "The Deployment owns desired replica count; the PDB reports an eviction allowance.",
          "Le Deployment possède le nombre voulu ; le PDB expose un budget d’éviction.",
        ),
        l(
          "Observe both objects before restoring the baseline.",
          "Observez les deux objets avant de rétablir la base.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-failures scale deployment/web --replicas=1\nk -n lab-failures rollout status deployment/web --timeout=120s\nk -n lab-failures get deployment web\nk -n lab-failures describe pdb web\nk -n lab-failures scale deployment/web --replicas=2\nk -n lab-failures rollout status deployment/web --timeout=180s\nk -n lab-failures get endpointslices -l kubernetes.io/service-name=web",
        ),
        p(
          "Expected: one replica can exist despite minAvailable:2; disruptionsAllowed stays zero. Restore two ready replicas before acceptance. No node was drained, no Eviction request was made and no guarantee about involuntary disruption was tested.",
          "Attendu : un seul réplica peut exister malgré minAvailable:2 ; disruptionsAllowed reste nul. Rétablissez deux réplicas prêts avant acceptation. Aucun nœud n’a été drainé, aucune requête Eviction envoyée et aucune garantie sur les pannes involontaires testée.",
        ),
      ],
    ),
    h("cleanup", "End the experiment explicitly", "Terminer explicitement l’expérience"),
    code("bash", "k delete namespace lab-failures"),
    p(
      "All faults, quotas and PDBs were namespaced; no cluster-wide cleanup is needed. Record the observed outcomes honestly, including any failed restoration, before removing evidence. Local unit tests and manifest parsing are not proof these experiments ran on a real cluster.",
      "Pannes, quotas et PDB étaient namespacés ; aucun nettoyage global n’est nécessaire. Consignez honnêtement les résultats observés, y compris une restauration échouée, avant de retirer les preuves. Tests locaux et parsing ne prouvent pas l’exécution sur un vrai cluster.",
    ),
  ],
};
