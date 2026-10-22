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
import manifest from "../../../lab/level-2/daemonsets/reporter.yaml?raw";

export const daemonsets: Chapter = {
  id: "daemonsets",
  level: 2,
  minutes: 45,
  title: l("DaemonSets: one agent per eligible node", "DaemonSets : un agent par nœud éligible"),
  summary: l(
    "Manage node-local workloads through selectors and tolerations, distinguish desired placement from healthy execution, and clean up cluster-scoped labels.",
    "Gérer des workloads locaux aux nœuds par sélecteurs et tolérances, distinguer placement désiré et exécution saine, et nettoyer les labels de cluster.",
  ),
  prerequisites: ["deployments", "labels-selectors"],
  related: ["scheduling", "observability", "security-hardening"],
  blocks: [
    h(
      "objectives",
      "Think in nodes rather than replicas",
      "Raisonner en nœuds plutôt qu’en réplicas",
    ),
    list(
      l(
        "Explain why a Deployment with three replicas does not guarantee one agent on each of three nodes.",
        "Expliquer pourquoi trois réplicas d’un Deployment ne garantissent pas un agent sur chacun de trois nœuds.",
      ),
      l(
        "Change a DaemonSet's node eligibility deliberately and diagnose why desired, current and ready counts differ.",
        "Modifier explicitement l’éligibilité des nœuds et diagnostiquer des compteurs desired, current et ready différents.",
      ),
    ),
    h(
      "mental-model",
      "The node set determines the desired population",
      "L’ensemble des nœuds détermine l’effectif désiré",
    ),
    p(
      "A DaemonSet asks for one steady-state copy of its Pod on each eligible node, not a configurable global replica count. Typical uses include node log collectors, network agents and storage daemons. The controller reconciles eligible nodes; the scheduler places each generated Pod using the intended node affinity. A Deployment with the same number of replicas can concentrate several copies on one node and does not automatically express this per-node responsibility.",
      "Un DaemonSet demande une copie de son Pod en régime stable sur chaque nœud éligible, plutôt qu’un nombre global de réplicas configurable. Collecteurs de logs, agents réseau et démons de stockage sont des usages classiques. Le contrôleur réconcilie les nœuds éligibles ; le scheduler place chaque Pod généré selon l’affinité vers le nœud visé. Un Deployment avec le même effectif peut concentrer plusieurs copies sur un nœud et n’exprime pas cette responsabilité par nœud.",
    ),
    p(
      "Eligible does not mean every visible node. Node selectors and required affinity restrict the target set, while taints require matching tolerations. Tolerating a taint permits placement; it does not attract a Pod or bypass resource requirements. A node can match placement constraints while its Pod still fails on image download or application startup. Separate controller intent from successful execution when reading the status counters. During a surge-enabled rollout, old and new copies can temporarily coexist; our fixture deliberately uses maxSurge: 0.",
      "Éligible ne signifie pas chaque nœud visible. Sélecteurs et affinité requise limitent les cibles, tandis que les taints nécessitent des tolérances compatibles. Tolérer un taint autorise le placement ; cela n’attire pas le Pod et ne supprime pas ses besoins en ressources. Un nœud peut correspondre au placement alors que son Pod échoue au téléchargement d’image ou au démarrage. Séparez intention du contrôleur et exécution réussie en lisant les compteurs. Un rollout avec surge peut temporairement juxtaposer anciennes et nouvelles copies ; notre manifest impose maxSurge: 0.",
    ),
    note(
      "info",
      l("Automatic tolerations are specific", "Les tolérances automatiques sont ciblées"),
      l(
        "DaemonSet Pods receive automatic tolerations for conditions such as not-ready, unreachable, pressure and unschedulable. The unschedulable toleration allows node agents to run on cordoned nodes; cordon is not an agent shutdown tool. These defaults do not grant a blanket tolerance of custom taints or the control-plane NoSchedule taint. Review the actual Pod spec rather than assuming the template lists every effective toleration.",
        "Les Pods de DaemonSet reçoivent des tolérances automatiques pour des conditions comme not-ready, unreachable, les pressions et unschedulable. Cette dernière permet aux agents de fonctionner sur un nœud cordonné ; cordon n’est pas une commande d’arrêt des agents. Ces valeurs ne donnent pas une tolérance générale aux taints personnalisés ni au NoSchedule du control-plane. Examinez le Pod réel plutôt que de supposer que le template énumère toutes ses tolérances effectives.",
      ),
    ),
    ...labContext("lab-daemon"),
    h(
      "manifest",
      "A deliberately unprivileged reporter",
      "Un rapporteur volontairement non privilégié",
    ),
    code("yaml", manifest, "lab/level-2/daemonsets/reporter.yaml"),
    p(
      "The container prints NODE_NAME from the Downward API. It does not read host logs, inspect the host network, collect real node metrics or require Kubernetes API credentials. No hostPath, hostNetwork or privileged mode is needed for this learning objective. Production node agents sometimes need narrowly scoped host access; copying their privileges into every DaemonSet would make an unnecessary security expansion. Total requests grow with node count, so budget per-node overhead before adding many agents.",
      "Le conteneur affiche NODE_NAME fourni par la Downward API. Il ne lit pas les logs hôtes, n’inspecte pas le réseau hôte, ne collecte pas de métriques réelles et n’a pas besoin d’identifiants API Kubernetes. Aucun hostPath, hostNetwork ou mode privilégié n’est nécessaire ici. Certains agents de production exigent un accès hôte ciblé ; copier leurs privilèges dans chaque DaemonSet élargirait inutilement les droits. Les requests totales augmentent avec le nombre de nœuds : prévoyez ce coût avant de multiplier les agents.",
    ),
    {
      type: "fields",
      rows: [
        {
          field: "spec.selector.matchLabels",
          text: l(
            "Selects Pods managed by this controller and must match the template labels. It does not select nodes.",
            "Sélectionne les Pods gérés par le contrôleur et doit correspondre aux labels du template. Il ne sélectionne pas les nœuds.",
          ),
        },
        {
          field: "spec.template.spec.nodeSelector",
          text: l(
            "Selects Linux nodes explicitly opted into this exercise with a dedicated label.",
            "Sélectionne les nœuds Linux explicitement inscrits à l’exercice par un label dédié.",
          ),
        },
        {
          field: "rollingUpdate.maxUnavailable: 1",
          text: l(
            "Allows one target agent to be unavailable during this controller's rollout. It is not a cluster-wide service availability guarantee.",
            "Autorise un agent cible indisponible durant le rollout du contrôleur. Cela ne garantit pas la disponibilité globale d’un service.",
          ),
        },
        {
          field: "status.desiredNumberScheduled / numberReady",
          text: l(
            "Compare desired placements with Pods considered ready. Without an application probe, Ready does not prove log delivery or useful work.",
            "Compare placements désirés et Pods considérés prêts. Sans probe applicative, Ready ne prouve ni livraison des logs ni travail utile.",
          ),
        },
      ],
    },
    h("exercise", "Grow and shrink the eligible set", "Agrandir et réduire l’ensemble éligible"),
    steps(
      {
        title: l(
          "Inspect the disposable nodes and create intent",
          "Examiner les nœuds jetables et créer l’intention",
        ),
        code: {
          lang: "bash",
          code: "k get nodes --show-labels\nk get nodes -L lab.k8svisual.dev/agent\nk -n lab-daemon apply -f lab/level-2/daemonsets/reporter.yaml\nk -n lab-daemon get daemonset node-reporter",
        },
        explain: l(
          "Use the one-control-plane, two-worker kind baseline. The dedicated label must be absent initially; if it belongs to another experiment, do not overwrite it. The listed worker names come from that cluster name. Adapt them only after inspecting your actual disposable nodes.",
          "Utilisez la base kind à un control-plane et deux workers. Le label dédié doit être absent au départ ; s’il appartient à un autre exercice, ne l’écrasez pas. Les noms de workers suivent le nom de ce cluster. Adaptez-les seulement après inspection de vos nœuds jetables réels.",
        ),
        expected: {
          text: l(
            "Expected initially: desired/current/ready are zero because no node opts in. A zero desired population is not an image or scheduler failure.",
            "Attendu au départ : desired/current/ready valent zéro puisqu’aucun nœud n’est inscrit. Un effectif désiré nul n’est pas une panne d’image ou de scheduler.",
          ),
        },
      },
      {
        title: l("Opt workers in one at a time", "Inscrire les workers un par un"),
        code: {
          lang: "bash",
          code: "k label node k8s-ops-lab-worker lab.k8svisual.dev/agent=enabled\nk -n lab-daemon rollout status daemonset/node-reporter --timeout=120s\nk -n lab-daemon get pods -o wide\nk label node k8s-ops-lab-worker2 lab.k8svisual.dev/agent=enabled\nk -n lab-daemon rollout status daemonset/node-reporter --timeout=120s\nk -n lab-daemon get daemonset,pods -o wide\nk -n lab-daemon logs -l app=node-reporter --prefix=true --tail=3",
        },
        explain: l(
          "The desired population follows the selected node set from one to two. Compare each Pod's NODE column with its log value. No replicas field was changed.",
          "L’effectif désiré suit l’ensemble sélectionné de un à deux. Comparez la colonne NODE de chaque Pod à sa valeur de log. Aucun champ replicas n’a changé.",
        ),
        expected: {
          text: l(
            "Expected: one reporter per opted-in worker, with matching node names in logs. Timing varies with image download and scheduling.",
            "Attendu : un rapporteur par worker inscrit, avec des noms concordants dans les logs. Le délai dépend du téléchargement d’image et de l’ordonnancement.",
          ),
        },
      },
      {
        title: l(
          "Replace a copy, then remove a target",
          "Remplacer une copie puis retirer une cible",
        ),
        code: {
          lang: "bash",
          code: "LAB_DAEMON_POD=$(k -n lab-daemon get pod -l app=node-reporter -o jsonpath='{.items[0].metadata.name}')\nk -n lab-daemon delete pod \"$LAB_DAEMON_POD\"\nk -n lab-daemon rollout status daemonset/node-reporter --timeout=120s\nk label node k8s-ops-lab-worker2 lab.k8svisual.dev/agent-\nk -n lab-daemon rollout status daemonset/node-reporter --timeout=120s\nk -n lab-daemon get pods -o wide",
        },
        explain: l(
          "Deletion alone causes a replacement on the same intended node. Removing eligibility changes the desired set: that node's agent is removed rather than transferred as a second replica to the other worker. Node labels are cluster-scoped changes and require cleanup even though the DaemonSet is namespaced.",
          "La suppression seule entraîne un remplaçant sur le même nœud cible. Retirer l’éligibilité change l’ensemble désiré : l’agent de ce nœud est supprimé au lieu d’être transféré comme deuxième réplica sur l’autre worker. Les labels de nœud sont des changements de cluster à nettoyer même si le DaemonSet appartient à un namespace.",
        ),
      },
    ),
    h(
      "diagnosis",
      "Read intent, scheduling, then process state",
      "Lire intention, placement puis état du processus",
    ),
    code(
      "bash",
      "k -n lab-daemon describe daemonset node-reporter\nk -n lab-daemon get pods -o wide\nk -n lab-daemon get events --sort-by=.metadata.creationTimestamp\nk get nodes -L lab.k8svisual.dev/agent",
    ),
    p(
      "If desired is zero, inspect selectors and taints before looking for container logs that cannot exist. If desired exceeds ready, inspect the specific generated Pod: Pending points to placement or resources, ImagePullBackOff to registry or image problems, and CrashLoopBackOff to a process repeatedly failing. Tolerations are not the remedy for a misspelled label or missing image. For a rollout, compare generation and observedGeneration to ensure status reflects the new template. An OnDelete strategy would wait for manual Pod deletion; RollingUpdate reconciles replacements automatically.",
      "Si desired vaut zéro, inspectez sélecteurs et taints avant de chercher des logs inexistants. Si desired dépasse ready, examinez le Pod généré précis : Pending oriente vers placement ou ressources, ImagePullBackOff vers registre ou image, CrashLoopBackOff vers un processus en échec répété. Les tolérances ne corrigent ni un label mal écrit ni une image absente. Pour un rollout, comparez generation et observedGeneration pour vérifier que le statut reflète le nouveau template. Avec OnDelete, il faudrait supprimer manuellement les Pods ; RollingUpdate réconcilie les remplacements automatiquement.",
    ),
    h("quiz", "Check node-level reasoning", "Vérifier le raisonnement par nœud"),
    quiz(
      question(
        l(
          "There are three nodes but only two match the selector and tolerations. What is the intended steady-state population?",
          "Il existe trois nœuds mais deux seulement satisfont sélecteur et tolérances. Quel effectif stable est visé ?",
        ),
        [
          l("Two copies, one per eligible node", "Deux copies, une par nœud éligible"),
          l("Three copies automatically", "Trois copies automatiquement"),
          l("One global copy", "Une copie globale"),
        ],
        0,
        l(
          "The eligible node set determines the DaemonSet target, not the total node inventory.",
          "L’ensemble éligible définit la cible du DaemonSet, pas l’inventaire total des nœuds.",
        ),
      ),
      question(
        l(
          "Does adding a control-plane toleration force the Pod onto the control plane?",
          "Ajouter une tolérance control-plane force-t-il ce placement ?",
        ),
        [
          l("Yes, toleration is a selector", "Oui, une tolérance est un sélecteur"),
          l(
            "No, it permits the taint while selectors and other constraints still apply",
            "Non, cela autorise le taint ; sélecteurs et autres contraintes s’appliquent encore",
          ),
          l("It removes all node taints", "Cela retire tous les taints du nœud"),
        ],
        1,
        l(
          "Toleration removes one obstacle; it neither attracts workloads nor mutates the Node.",
          "Une tolérance retire un obstacle ; elle n’attire pas les workloads et ne modifie pas le Node.",
        ),
      ),
      question(
        l(
          "Why does deleting the namespace not fully undo this exercise?",
          "Pourquoi supprimer le namespace n’annule-t-il pas complètement l’exercice ?",
        ),
        [
          l(
            "DaemonSet Pods can never be deleted",
            "Les Pods DaemonSet ne peuvent jamais être supprimés",
          ),
          l(
            "Namespaces do not contain workloads",
            "Les namespaces ne contiennent pas de workloads",
          ),
          l("Node labels are cluster-scoped", "Les labels de nœuds sont à l’échelle du cluster"),
        ],
        2,
        l(
          "The namespaced workload disappears, while labels on Node objects remain until explicitly removed.",
          "Le workload du namespace disparaît, mais les labels des objets Node restent jusqu’à leur retrait explicite.",
        ),
      ),
    ),
    h(
      "challenge",
      "Permit a control-plane agent deliberately",
      "Autoriser explicitement un agent du control-plane",
    ),
    challenge(
      l("Eligibility has two gates", "L’éligibilité a deux portes"),
      l(
        "In this disposable kind cluster only, inspect the control-plane taint, add the exercise label to that node and explain why no reporter appears there yet. Add a narrowly scoped toleration, then verify the extra agent. If your inspected node has no control-plane NoSchedule taint, explain the difference instead of adding a taint just to force this scenario.",
        "Uniquement dans ce cluster kind jetable, inspectez le taint du control-plane, ajoutez-lui le label d’exercice et expliquez pourquoi aucun rapporteur n’y apparaît encore. Ajoutez une tolérance ciblée puis vérifiez l’agent supplémentaire. Si le nœud inspecté n’a pas ce taint NoSchedule, expliquez la différence au lieu d’en ajouter un artificiellement.",
      ),
      [
        l(
          "A matching selector cannot override an untolerated NoSchedule taint.",
          "Un sélecteur concordant ne neutralise pas un taint NoSchedule non toléré.",
        ),
        l(
          "Use key node-role.kubernetes.io/control-plane with effect NoSchedule; a wildcard Exists toleration is unnecessary.",
          "Utilisez la clé node-role.kubernetes.io/control-plane avec l’effet NoSchedule ; une tolérance Exists générale est inutile.",
        ),
      ],
      [
        code(
          "bash",
          `k describe node k8s-ops-lab-control-plane\nk label node k8s-ops-lab-control-plane lab.k8svisual.dev/agent=enabled\nk -n lab-daemon get daemonset,pods -o wide\nk -n lab-daemon patch daemonset node-reporter --type=merge -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"node-role.kubernetes.io/control-plane","operator":"Exists","effect":"NoSchedule"}]}}}}'\nk -n lab-daemon rollout status daemonset/node-reporter --timeout=120s\nk -n lab-daemon get pods -o wide`,
        ),
        p(
          "With worker2 still opted out, the final intended population is two: worker and control-plane. The patch also rolls the already eligible worker's Pod because it changes the template. To return to the original template, reapply reporter.yaml; to undo the entire exercise, remove both the namespace and its dedicated node labels below. Do not copy this control-plane permission into a production agent without reviewing its purpose and resource budget.",
          "Si worker2 reste retiré, l’effectif final désiré est deux : worker et control-plane. Le patch renouvelle aussi le Pod du worker déjà éligible car le template change. Réappliquez reporter.yaml pour rétablir le template initial ; pour annuler tout l’exercice, retirez namespace et labels dédiés ci-dessous. Ne transposez pas cette permission du control-plane en production sans examiner son utilité et son budget de ressources.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove the labels as well as the workload",
      "Retirer les labels avec le workload",
    ),
    code(
      "bash",
      "k delete namespace lab-daemon\nk label nodes -l lab.k8svisual.dev/agent=enabled lab.k8svisual.dev/agent-\nk get nodes -L lab.k8svisual.dev/agent",
    ),
    p(
      "Expected: no exercise value remains on the nodes. This lesson demonstrates reconciliation and placement on existing nodes, not cluster autoscaling, host observability or multi-host resilience. The reporter's Ready state only reflects its simple container lifecycle; a real agent needs a meaningful health and delivery contract.",
      "Attendu : aucune valeur d’exercice ne reste sur les nœuds. Ce chapitre démontre réconciliation et placement sur des nœuds existants, pas autoscaling du cluster, observabilité hôte ou résilience multi-hôte. Le Ready du rapporteur reflète seulement son cycle de vie simple ; un agent réel nécessite un contrat de santé et de livraison pertinent.",
    ),
  ],
};
