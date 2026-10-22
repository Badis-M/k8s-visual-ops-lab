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
import manifest from "../../../lab/level-2/scheduling/web.yaml?raw";

export const scheduling: Chapter = {
  id: "scheduling",
  level: 2,
  minutes: 45,
  title: l(
    "Taints, tolerations, affinity, nodeSelector",
    "Taints, tolerations, affinité, nodeSelector",
  ),
  summary: l(
    "Explain why a Pod remains Pending and combine attraction with admission to choose eligible nodes.",
    "Expliquer un Pod Pending et combiner attraction et admission pour sélectionner des nœuds éligibles.",
  ),
  prerequisites: ["resources", "labels-selectors"],
  related: ["advanced-scheduling", "daemonsets", "scheduler-internals"],
  blocks: [
    h("objectives", "Explain a placement decision", "Expliquer une décision de placement"),
    list(
      l(
        "Separate mandatory filters from placement preferences.",
        "Séparer les filtres obligatoires des préférences de placement.",
      ),
      l(
        "Create and remove an isolated scheduling constraint without touching control-plane taints.",
        "Créer puis retirer une contrainte isolée sans toucher aux taints du control plane.",
      ),
    ),
    h("mental-model", "Filter first, score afterwards", "Filtrer d’abord, classer ensuite"),
    p(
      "The scheduler considers unscheduled Pods and filters nodes against hard requirements: requests that fit allocatable capacity, selectors, required affinity, unschedulable state and untolerated taints. It then scores feasible nodes. A high preference cannot rescue a node rejected by a hard requirement. nodeSelector requires every listed label to match. Required node affinity supports expressions such as In; expressions inside a term are AND, while separate terms are OR.",
      "Le scheduler considère les Pods non affectés et filtre les nœuds selon les exigences strictes : requests compatibles avec la capacité allocatable, sélecteurs, affinité obligatoire, état non ordonnançable et taints non tolérés. Il classe ensuite les nœuds admissibles. Une forte préférence ne sauve pas un nœud rejeté par une exigence stricte. nodeSelector impose toutes les valeurs indiquées. L’affinité de nœud obligatoire permet des expressions comme In ; les expressions d’un terme sont combinées par ET, les termes distincts par OU.",
    ),
    p(
      "A taint repels Pods. A matching toleration removes that obstacle; it neither selects the node nor reserves it exclusively. NoSchedule blocks new placement but does not evict existing Pods. PreferNoSchedule is soft. NoExecute can evict existing untolerating Pods, so it is deliberately excluded here. Combining a reserved-node label and its taint provides both attraction for the intended workload and rejection of other untolerating workloads.",
      "Un taint repousse des Pods. Une toleration correspondante retire cet obstacle ; elle ne sélectionne pas le nœud et ne le réserve pas exclusivement. NoSchedule bloque les nouveaux placements sans expulser les Pods existants. PreferNoSchedule est souple. NoExecute peut expulser les Pods existants sans tolérance : il est volontairement exclu ici. Combiner le label d’un nœud réservé et son taint permet d’attirer le workload voulu et de repousser les autres workloads sans tolérance.",
    ),
    ...labContext("lab-scheduling"),
    note(
      "warn",
      l("Two disposable workers required", "Deux workers jetables nécessaires"),
      l(
        "This exercise mutates node metadata. Use lab/kind.yaml, verify both selected nodes are workers, and stop if the custom label or taint already belongs to another exercise. All nodes share your host: this demonstrates placement, not failure-domain availability. Never remove the standard control-plane taint to make an example schedule.",
        "Cet exercice modifie des métadonnées de nœuds. Utilisez lab/kind.yaml, vérifiez que les deux nœuds choisis sont des workers et arrêtez-vous si le label ou taint personnalisé appartient déjà à un autre exercice. Tous les nœuds partagent votre hôte : cela démontre le placement, pas la disponibilité entre domaines de panne. Ne retirez jamais le taint standard du control plane pour forcer un placement.",
      ),
    ),
    h("discover", "Discover before selecting", "Découvrir avant de sélectionner"),
    code(
      "bash",
      `k get nodes --show-labels\nk get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints\nworker_a=$(k get nodes -l '!node-role.kubernetes.io/control-plane' -o jsonpath='{.items[0].metadata.name}')\nworker_b=$(k get nodes -l '!node-role.kubernetes.io/control-plane' -o jsonpath='{.items[1].metadata.name}')\ntest -n "$worker_a" && test -n "$worker_b" && test "$worker_a" != "$worker_b"\nk get nodes "$worker_a" "$worker_b" -o wide`,
    ),
    p(
      "Continue only if the test succeeds and inspection shows two intended workers. Keep this shell open: cleanup reuses its variables. The custom label key is for this exercise only; unlike a guessed worker role label, the negative control-plane selector matches the default kind worker nodes.",
      "Continuez uniquement si le test réussit et si l’examen montre les deux workers attendus. Gardez ce shell ouvert : le nettoyage réutilise ses variables. La clé de label personnalisée est réservée à cet exercice ; contrairement à un hypothétique label de rôle worker, le sélecteur excluant le control plane correspond aux workers kind par défaut.",
    ),
    steps(
      {
        title: l("Create a reserved pool", "Créer un pool réservé"),
        code: {
          lang: "bash",
          code: 'k label node "$worker_a" lab.k8sops.dev/pool=general\nk label node "$worker_b" lab.k8sops.dev/pool=reserved\nk taint node "$worker_b" lab.k8sops.dev/dedicated=exercise:NoSchedule',
        },
        explain: l(
          "These commands do not overwrite existing labels. If any fails, inspect and undo only changes you just made before continuing.",
          "Ces commandes n’écrasent pas les labels existants. Si l’une échoue, examinez puis annulez uniquement vos modifications avant de continuer.",
        ),
      },
      {
        title: l("Observe an impossible intersection", "Observer une intersection impossible"),
        code: {
          lang: "bash",
          code: "k -n lab-scheduling apply -f lab/level-2/scheduling/web.yaml\nk -n lab-scheduling get pods -o wide\nk -n lab-scheduling describe pods -l app=scheduling-web",
        },
        explain: l(
          "The selector requires reserved, but the only matching worker repels Pods without a toleration. Read FailedScheduling Events instead of waiting for container logs that cannot exist yet.",
          "Le sélecteur impose reserved, mais le seul worker correspondant repousse les Pods sans tolérance. Lisez les Events FailedScheduling au lieu d’attendre des logs de conteneur encore inexistants.",
        ),
        expected: {
          text: l(
            "Expected: Pending Pods with selector/taint filtering reasons. Exact node counts and Event wording vary.",
            "Attendu : des Pods Pending avec des motifs de filtrage liés au sélecteur et au taint. Les effectifs et libellés exacts des Events varient.",
          ),
        },
      },
    ),
    code("yaml", manifest, "lab/level-2/scheduling/web.yaml"),
    h(
      "repair",
      "Grant admission without forcing nodeName",
      "Autoriser l’admission sans imposer nodeName",
    ),
    code(
      "bash",
      `k -n lab-scheduling patch deployment web --type=merge -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"lab.k8sops.dev/dedicated","operator":"Equal","value":"exercise","effect":"NoSchedule"}]}}}}'\nk -n lab-scheduling rollout status deployment/web --timeout=120s\nk -n lab-scheduling get pods -o wide`,
    ),
    p(
      "Expected: the new Pods use the reserved worker if resources and image retrieval succeed. Two replicas are allowed on the same node: this selector contains no spreading policy. Do not set nodeName to bypass the scheduler. If Pods still remain Pending, inspect requests, other taints and volume topology. ImagePullBackOff after binding is a different layer; changing affinity cannot repair a missing image.",
      "Attendu : les nouveaux Pods utilisent le worker réservé si les ressources et le téléchargement d’image le permettent. Deux réplicas peuvent partager le nœud : le sélecteur n’impose aucune répartition. Ne définissez pas nodeName pour contourner le scheduler. Si les Pods restent Pending, examinez requests, autres taints et topologie des volumes. Un ImagePullBackOff après affectation relève d’une autre couche ; modifier l’affinité ne corrige pas une image absente.",
    ),
    h("quiz", "Check the intersection", "Vérifier l’intersection"),
    quiz(
      question(
        l(
          "Does a toleration attract a Pod to its tainted node?",
          "Une toleration attire-t-elle un Pod vers le nœud portant le taint ?",
        ),
        [
          l("Yes, it overrides every selector", "Oui, elle annule tout sélecteur"),
          l("No, it removes one rejection reason", "Non, elle retire un motif de rejet"),
          l("Yes, when replicas exceed one", "Oui, avec plusieurs réplicas"),
        ],
        1,
        l(
          "Selection and toleration address different filters; combine them when placement must be specific.",
          "Sélection et tolérance concernent des filtres distincts ; combinez-les pour un placement ciblé.",
        ),
      ),
      question(
        l(
          "What happens to running Pods when NoSchedule is added?",
          "Que deviennent les Pods actifs à l’ajout de NoSchedule ?",
        ),
        [
          l("They are all evicted", "Ils sont tous expulsés"),
          l("They receive the label automatically", "Ils reçoivent automatiquement le label"),
          l("They are not evicted by that effect", "Cet effet ne les expulse pas"),
        ],
        2,
        l(
          "NoSchedule affects placement; NoExecute is the effect that can also evict.",
          "NoSchedule concerne le placement ; NoExecute peut également expulser.",
        ),
      ),
      question(
        l(
          "Can a preferred affinity overcome an unmatched nodeSelector?",
          "Une affinité préférée compense-t-elle un nodeSelector non satisfait ?",
        ),
        [
          l("No, filtering precedes scoring", "Non, le filtrage précède le classement"),
          l("Yes, with weight 100", "Oui, avec weight 100"),
          l("Only on workers", "Uniquement sur les workers"),
        ],
        0,
        l(
          "Only feasible nodes are scored; raising a preference's weight cannot make an ineligible node feasible.",
          "Seuls les nœuds admissibles sont classés ; augmenter un poids ne rend pas admissible un nœud exclu.",
        ),
      ),
    ),
    challenge(
      l("Prefer general, allow reserved", "Préférer general, permettre reserved"),
      l(
        "Replace the hard reserved selector with required affinity accepting both pools and a preference for general. Keep the reserved toleration. Explain why this still does not guarantee a worker choice or replica spread.",
        "Remplacez le sélecteur strict reserved par une affinité obligatoire acceptant les deux pools et une préférence pour general. Gardez la tolérance reserved. Expliquez pourquoi cela ne garantit ni un worker précis ni la répartition des réplicas.",
      ),
      [
        l(
          "Remove nodeSelector; otherwise hard requirements are combined.",
          "Retirez nodeSelector ; sinon les exigences strictes se combinent.",
        ),
        l(
          "Use In for both values and preferredDuringSchedulingIgnoredDuringExecution for the preference.",
          "Utilisez In pour les deux valeurs et preferredDuringSchedulingIgnoredDuringExecution pour la préférence.",
        ),
      ],
      [
        code(
          "bash",
          `k -n lab-scheduling patch deployment web --type=merge -p '{"spec":{"template":{"spec":{"nodeSelector":null,"affinity":{"nodeAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":{"nodeSelectorTerms":[{"matchExpressions":[{"key":"lab.k8sops.dev/pool","operator":"In","values":["general","reserved"]}]}]},"preferredDuringSchedulingIgnoredDuringExecution":[{"weight":50,"preference":{"matchExpressions":[{"key":"lab.k8sops.dev/pool","operator":"In","values":["general"]}]}}]}}}}}}'\nk -n lab-scheduling rollout status deployment/web --timeout=120s\nk -n lab-scheduling get pods -o wide`,
        ),
        p(
          "Both pools pass this affinity filter. General gains a preference score, while other scoring plugins and resource constraints still matter. IgnoredDuringExecution means a later label change does not itself evict a bound Pod. Use topology spread or Pod anti-affinity for replica separation; do not pretend a preference is an availability guarantee.",
          "Les deux pools passent ce filtre d’affinité. General gagne un score de préférence, mais les autres plugins de classement et les contraintes de ressources comptent encore. IgnoredDuringExecution signifie qu’un changement de label n’expulse pas à lui seul un Pod affecté. Utilisez topology spread ou l’anti-affinité de Pods pour séparer les réplicas ; une préférence n’est pas une garantie de disponibilité.",
        ),
      ],
    ),
    h("cleanup", "Undo cluster-scoped metadata too", "Annuler aussi les métadonnées globales"),
    code(
      "bash",
      'k delete namespace lab-scheduling\nk taint node "$worker_b" lab.k8sops.dev/dedicated:NoSchedule-\nk label node "$worker_a" "$worker_b" lab.k8sops.dev/pool-',
    ),
    p(
      "Deleting the namespace alone does not remove labels or taints from nodes. Verify the custom keys disappeared. Advanced scheduling adds topology and disruption trade-offs; these local virtual workers remain one physical failure domain.",
      "Supprimer le namespace seul ne retire ni labels ni taints des nœuds. Vérifiez la disparition des clés personnalisées. L’ordonnancement avancé ajoute les compromis de topologie et de disruption ; ces workers virtuels locaux restent un unique domaine de panne physique.",
    ),
  ],
};
