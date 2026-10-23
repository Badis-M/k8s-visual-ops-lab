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
import spread from "../../../lab/level-3/advanced-scheduling/spread.yaml?raw";
import strict from "../../../lab/level-3/advanced-scheduling/strict.yaml?raw";

export const advancedScheduling: Chapter = {
  id: "advanced-scheduling",
  level: 3,
  minutes: 55,
  title: l("Advanced scheduling strategies", "Stratégies d’ordonnancement avancées"),
  summary: l(
    "Compare hard anti-affinity and bounded topology imbalance, then reason about priority without treating it as extra capacity.",
    "Comparer anti-affinité stricte et déséquilibre topologique borné, puis raisonner sur la priorité sans la confondre avec de la capacité.",
  ),
  prerequisites: ["scheduling", "resources"],
  related: ["ha", "pdb", "scheduler-internals"],
  blocks: [
    h("objectives", "Choose what may remain Pending", "Choisir ce qui peut rester Pending"),
    list(
      l(
        "Translate an availability intention into eligible domains and measurable skew.",
        "Traduire une intention de disponibilité en domaines admissibles et skew mesurable.",
      ),
      l(
        "Explain why priority cannot overcome an impossible placement constraint.",
        "Expliquer pourquoi la priorité ne résout pas une contrainte de placement impossible.",
      ),
    ),
    p(
      "Placement is a capacity contract. Node affinity filters which nodes qualify; Pod affinity/anti-affinity relates placement to other Pods; topology spread balances matching Pods across labeled domains. Hard constraints can protect separation while leaving capacity unused. Soft preferences improve placement when feasible but permit co-location under pressure. Neither rewrites already bound Pods into a perfect layout: changing policy usually affects new scheduling decisions, and a descheduler is a separate component.",
      "Le placement constitue un contrat de capacité. L’affinité de nœud filtre les nœuds admissibles ; affinité/anti-affinité de Pods relient le placement à d’autres Pods ; topology spread équilibre les Pods correspondants entre domaines portant des labels. Les contraintes strictes protègent la séparation tout en pouvant laisser de la capacité inutilisée. Les préférences améliorent le placement si possible mais autorisent la cohabitation sous pression. Aucun de ces mécanismes ne redistribue parfaitement les Pods déjà affectés : une nouvelle politique concerne généralement les décisions futures, le descheduler est un composant distinct.",
    ),
    p(
      "With maxSkew: 1, DoNotSchedule and two eligible hostname domains, three replicas may form 2/1. Strict hostname anti-affinity instead permits at most one matching Pod per host, leaving a third replica Pending on two hosts. minDomains: 2 changes the global minimum used by the skew calculation when fewer eligible domains exist; it does not create a missing node. Select the same labels that actually identify your replica group, and remember namespace selection determines which Pods are counted.",
      "Avec maxSkew: 1, DoNotSchedule et deux domaines hostname admissibles, trois réplicas peuvent former 2/1. L’anti-affinité stricte par hostname permet au contraire un seul Pod correspondant par hôte : le troisième reste Pending avec deux hôtes. minDomains: 2 change le minimum global utilisé dans le calcul du skew si les domaines admissibles deviennent insuffisants ; il ne crée aucun nœud. Sélectionnez les vrais labels du groupe de réplicas et rappelez-vous que le namespace détermine quels Pods sont comptés.",
    ),
    ...labContext("lab-spread"),
    note(
      "warn",
      l("Bounded local experiment", "Expérience locale bornée"),
      l(
        "Use the two disposable workers in lab/kind.yaml. No node cordon, drain or taint change is needed. The custom PriorityClass is cluster-scoped but explicitly non-default and non-preempting, so it cannot evict other workloads. Stop if lab-spread-priority already belongs to another exercise. Hostnames inside one laptop do not represent independent physical zones.",
        "Utilisez les deux workers jetables de lab/kind.yaml. Aucun cordon, drain ou changement de taint n’est nécessaire. La PriorityClass personnalisée est globale mais explicitement non par défaut et sans préemption : elle ne peut expulser d’autres workloads. Arrêtez-vous si lab-spread-priority appartient déjà à un autre exercice. Les hostnames d’un même ordinateur ne représentent pas des zones physiques indépendantes.",
      ),
    ),
    h("manifest", "Read the domain contract", "Lire le contrat de domaine"),
    code("yaml", spread, "lab/level-3/advanced-scheduling/spread.yaml"),
    p(
      "The required node affinity excludes the control plane using its actual kind label. topologyKey uses the built-in hostname label, not an invented cloud zone. The labelSelector counts only app: spread-web in this namespace. value: 1000 controls queue priority relative to lower classes; preemptionPolicy: Never prevents this class from removing victims. Priority does not reserve CPU, overcome affinity or make an unhealthy node usable.",
      "L’affinité obligatoire exclut le control plane avec son vrai label kind. topologyKey utilise le hostname intégré, pas une zone cloud inventée. labelSelector compte seulement app: spread-web dans ce namespace. value: 1000 définit la priorité en file par rapport aux classes inférieures ; preemptionPolicy: Never empêche cette classe d’expulser des victimes. La priorité ne réserve pas de CPU, n’annule pas l’affinité et ne rend pas utilisable un nœud défaillant.",
    ),
    steps({
      title: l("Measure the distribution", "Mesurer la répartition"),
      code: {
        lang: "bash",
        code: "k get nodes -L kubernetes.io/hostname,node-role.kubernetes.io/control-plane\nk get priorityclass lab-spread-priority\nk -n lab-spread apply -f lab/level-3/advanced-scheduling/spread.yaml\nk -n lab-spread rollout status deployment/spread-web --timeout=120s\nk -n lab-spread get pods -l app=spread-web -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,PRIORITY:.spec.priority\nk -n lab-spread describe deployment spread-web",
      },
      explain: l(
        "NotFound for the custom PriorityClass before applying is expected. Count actual Pods on each eligible worker. If a Pod is Pending, read its Events for requests, labels, topology and unrelated taints before weakening policy.",
        "NotFound pour la classe personnalisée avant application est attendu. Comptez les Pods par worker admissible. Si un Pod reste Pending, lisez ses Events : requests, labels, topologie et autres taints, avant d’assouplir la politique.",
      ),
      expected: {
        text: l(
          "Expected on two healthy workers with sufficient capacity: three replicas distributed 2/1, priority 1000. Which worker holds two replicas is not guaranteed.",
          "Attendu avec deux workers sains et suffisamment de capacité : trois réplicas répartis 2/1, priorité 1000. Aucun worker précis n’est garanti pour les deux réplicas.",
        ),
      },
    }),
    h(
      "strict",
      "Observe the cost of stronger separation",
      "Observer le coût d’une séparation plus stricte",
    ),
    code("yaml", strict, "lab/level-3/advanced-scheduling/strict.yaml"),
    code(
      "bash",
      "k -n lab-spread apply -f lab/level-3/advanced-scheduling/strict.yaml\nk -n lab-spread get pods -l app=strict-web -o wide\nk -n lab-spread describe pods -l app=strict-web\nk -n lab-spread get events --sort-by=.metadata.creationTimestamp",
    ),
    p(
      "Expected after scheduling: two strict-web Pods can run, one remains Pending because both workers already contain a matching Pod. CPU may still be available. Changing requests does not solve hostname anti-affinity, and the excluded control plane is not an emergency third worker. Increasing priority would not remove the need for a distinct domain. Soft anti-affinity trades this strict exclusion for a score; evaluate whether reduced replicas or co-location better fits your failure budget.",
      "Attendu après ordonnancement : deux strict-web fonctionnent, un reste Pending car chaque worker contient déjà un Pod correspondant. Du CPU peut rester disponible. Changer les requests ne résout pas l’anti-affinité hostname, et le control plane exclu n’est pas un troisième worker de secours. Augmenter la priorité ne supprime pas le besoin d’un domaine distinct. L’anti-affinité souple remplace l’exclusion par un score : choisissez entre moins de réplicas et cohabitation selon votre budget de panne.",
    ),
    h(
      "preemption",
      "Know what a preemption decision can change",
      "Savoir ce que la préemption peut changer",
    ),
    p(
      "A preempting high-priority Pod may cause lower-priority victims to be removed if that makes a node feasible; scheduling and graceful victim termination are asynchronous. It is not a universal escape from affinity, volume topology or cross-node constraints. PDB consideration is best effort during preemption, so a budget is not absolute protection against it. This exercise intentionally does not induce preemption or demonstrate eviction of unrelated Pods: review it architecturally before using custom classes in a shared cluster.",
      "Un Pod prioritaire avec préemption peut faire retirer des victimes moins prioritaires si cela rend un nœud admissible ; placement et terminaison gracieuse des victimes sont asynchrones. Ce n’est pas une solution universelle à l’affinité, à la topologie des volumes ou aux contraintes entre nœuds. La prise en compte du PDB pendant la préemption reste au mieux : un budget n’offre pas une protection absolue. Cet exercice ne provoque volontairement aucune préemption ni expulsion de Pods tiers : étudiez le mécanisme avant des classes personnalisées sur un cluster partagé.",
    ),
    h("quiz", "Choose the right constraint", "Choisir la bonne contrainte"),
    quiz(
      question(
        l(
          "Three replicas must occupy two hosts with skew at most one. Which shape is valid?",
          "Trois réplicas doivent occuper deux hôtes avec un skew maximal de un. Quelle répartition est valide ?",
        ),
        [
          l("3/0", "3/0"),
          l("2/1", "2/1"),
          l("Only 1/1 with a Pending replica", "Seulement 1/1 avec un réplica Pending"),
        ],
        1,
        l(
          "Topology spread permits controlled imbalance; strict anti-affinity would limit one per host.",
          "Topology spread permet un déséquilibre borné ; l’anti-affinité stricte limiterait à un par hôte.",
        ),
      ),
      question(
        l(
          "Can a larger priority overcome a missing required hostname domain?",
          "Une priorité plus forte compense-t-elle un domaine hostname obligatoire absent ?",
        ),
        [
          l(
            "No, the placement must still become feasible",
            "Non, le placement doit encore devenir admissible",
          ),
          l("Yes, priority creates a virtual domain", "Oui, la priorité crée un domaine virtuel"),
          l("Only with value above 1000", "Seulement au-dessus de 1000"),
        ],
        0,
        l(
          "Priority changes ordering and possibly victims, not the meaning of hard topology requirements.",
          "La priorité change l’ordre et éventuellement les victimes, pas le sens des exigences topologiques strictes.",
        ),
      ),
      question(
        l(
          "Does changing a required affinity automatically move existing Pods?",
          "Changer une affinité obligatoire déplace-t-il automatiquement les Pods existants ?",
        ),
        [
          l("Always", "Toujours"),
          l("Only when CPU is idle", "Seulement si le CPU est libre"),
          l(
            "Not by itself with IgnoredDuringExecution",
            "Pas à lui seul avec IgnoredDuringExecution",
          ),
        ],
        2,
        l(
          "New scheduling decisions apply the requirement; a rollout may replace Pods, but label changes alone do not rebalance bound ones.",
          "Les décisions nouvelles appliquent l’exigence ; un rollout peut remplacer des Pods, mais les labels seuls ne rééquilibrent pas ceux déjà affectés.",
        ),
      ),
    ),
    h(
      "challenge",
      "Keep a hard guarantee with honest capacity",
      "Conserver une garantie stricte avec une capacité honnête",
    ),
    challenge(
      l("Two eligible hostnames, not three", "Deux hostnames admissibles, pas trois"),
      l(
        "Resolve strict-web's Pending replica while retaining strict hostname separation and without editing nodes. Explain what is lost compared with three desired replicas and why spread-web still allows three.",
        "Résolvez le réplica Pending de strict-web en gardant la séparation hostname stricte, sans modifier de nœud. Expliquez ce qui est perdu par rapport à trois réplicas désirés et pourquoi spread-web en permet toujours trois.",
      ),
      [
        l(
          "The number of eligible hosts bounds the number of strict matching Pods.",
          "Le nombre d’hôtes admissibles borne le nombre de Pods stricts correspondants.",
        ),
        l(
          "Scale strict-web to two and inspect placement before claiming recovery.",
          "Réduisez strict-web à deux puis inspectez le placement avant de conclure.",
        ),
      ],
      [
        code(
          "bash",
          "k -n lab-spread scale deployment/strict-web --replicas=2\nk -n lab-spread rollout status deployment/strict-web --timeout=120s\nk -n lab-spread get pods -l app=strict-web -o wide",
        ),
        p(
          "Expected: two ready replicas on distinct workers and no desired third Pod. You reduced aggregate capacity and replica redundancy, while retaining host separation. spread-web accepts 2/1 and can therefore fit three. Neither arrangement survives loss of the laptop; real zones require real independent infrastructure.",
          "Attendu : deux réplicas prêts sur des workers distincts, sans troisième Pod désiré. Vous réduisez capacité globale et redondance, tout en conservant la séparation des hôtes. spread-web accepte 2/1 et peut donc placer trois réplicas. Aucune disposition ne survit à la perte de l’ordinateur ; des zones réelles exigent une infrastructure indépendante.",
        ),
      ],
    ),
    h(
      "cleanup",
      "Remove namespaced and global exercise objects",
      "Retirer les objets locaux et globaux de l’exercice",
    ),
    code("bash", "k delete namespace lab-spread\nk delete priorityclass lab-spread-priority"),
  ],
};
