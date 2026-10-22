import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-3/pdb/availability.yaml?raw";

export const pdb: Chapter = {
  id: "pdb",
  level: 3,
  minutes: 30,
  title: {
    en: "PodDisruptionBudgets",
    fr: "PodDisruptionBudgets",
  },
  summary: {
    en: "Model voluntary eviction headroom, observe a refused eviction and separate maintenance policy from rollout and failure protection.",
    fr: "Modéliser la marge d’éviction volontaire, observer un refus et distinguer maintenance, rollout et protection contre les pannes.",
  },
  prerequisites: ["rollout-strategies", "probes"],
  related: ["ha", "advanced-scheduling"],
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Budget maintenance without blocking it blindly",
          fr: "Budgéter la maintenance sans la bloquer aveuglément",
        },
      },
      {
        type: "p",
        text: {
          en: "You will calculate allowed disruptions, use the eviction API on a dedicated workload and reason about recovery capacity. A PDB limits supported voluntary evictions, such as normal drain operations. It does not stop physical node failures, all deletion paths or a Deployment controller following its rollout strategy. Its promise is narrower than general application availability.",
          fr: "Vous calculerez les perturbations autorisées, utiliserez l’API d’éviction sur un workload dédié et raisonnerez sur la capacité de récupération. Un PDB limite les évictions volontaires prises en charge, comme un drain normal. Il n’empêche ni panne physique, ni toutes les suppressions, ni un Deployment suivant sa stratégie de rollout. Sa promesse est plus étroite que la disponibilité générale.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "Healthy replicas minus required replicas",
          fr: "Réplicas sains moins réplicas exigés",
        },
      },
      {
        type: "p",
        text: {
          en: "With three healthy selected Pods and minAvailable: 2, the nominal disruption allowance is one. If one Pod is already unhealthy, the allowance can become zero. PDB status reflects reconciled state, so inspect currentHealthy, desiredHealthy, disruptionsAllowed and observedGeneration rather than calculating from spec alone. Use either minAvailable or maxUnavailable, not both; percentages can round up in ways surprising for small workloads.",
          fr: "Avec trois Pods sains sélectionnés et minAvailable: 2, la marge nominale vaut un. Si un Pod est déjà défaillant, elle peut devenir nulle. Le statut reflète l’état réconcilié : examinez currentHealthy, desiredHealthy, disruptionsAllowed et observedGeneration, pas seulement spec. Utilisez minAvailable ou maxUnavailable, jamais les deux ; les pourcentages peuvent être arrondis au supérieur, ce qui surprend sur de petits effectifs.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-pdb"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-3/pdb/availability.yaml",
      },
      {
        type: "h2",
        id: "exercise",
        text: {
          en: "Start with measurable headroom",
          fr: "Commencer avec une marge mesurable",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-pdb apply -f lab/level-3/pdb/availability.yaml\nk -n lab-pdb rollout status deployment/protected --timeout=120s\nk -n lab-pdb wait --for=jsonpath='{.status.disruptionsAllowed}'=1 pdb/protected --timeout=120s\nk -n lab-pdb get pdb protected -o yaml\nk -n lab-pdb get pods -l app=protected -o wide",
      },
      {
        type: "p",
        text: {
          en: "Expected: three ready Pods and eventually disruptionsAllowed: 1. The selector must match only the intended workload in this namespace. An empty selector in policy/v1 matches all Pods in the namespace, unlike a selector that matches none: treat it as a serious configuration review point. A PDB does not spread replicas across nodes; placement constraints are a separate policy.",
          fr: "Attendu : trois Pods prêts et finalement disruptionsAllowed: 1. Le sélecteur doit viser seulement le workload prévu dans ce namespace. En policy/v1, un sélecteur vide sélectionne tous les Pods du namespace, pas aucun : c’est un point majeur de relecture. Un PDB ne répartit pas les réplicas sur les nœuds ; le placement reste distinct.",
        },
      },
      {
        type: "h2",
        id: "evict",
        text: {
          en: "Exercise the API rather than draining a shared node",
          fr: "Utiliser l’API sans drainer un nœud partagé",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'TARGET_POD="$(k -n lab-pdb get pods -l app=protected -o jsonpath=\'{.items[0].metadata.name}\')"\nprintf \'{"apiVersion":"policy/v1","kind":"Eviction","metadata":{"name":"%s","namespace":"lab-pdb"}}\' "$TARGET_POD" > /tmp/lab-eviction.json\nk create --raw "/api/v1/namespaces/lab-pdb/pods/$TARGET_POD/eviction" -f /tmp/lab-eviction.json\nk -n lab-pdb wait --for=delete "pod/$TARGET_POD" --timeout=120s\nk -n lab-pdb rollout status deployment/protected --timeout=120s\nk -n lab-pdb wait --for=jsonpath=\'{.status.disruptionsAllowed}\'=1 pdb/protected --timeout=120s\nk -n lab-pdb get pdb protected',
      },
      {
        type: "p",
        text: {
          en: "When the budget is available, eviction is accepted and the ReplicaSet replaces the Pod. Wait for actual deletion and restored budget headroom: an accepted request is not evidence of completed recovery, and rollout status alone can briefly read stale controller status. This tests one exercise Pod, not an entire worker with unrelated workloads. Authorization to create pods/eviction is required. Stop and inspect any timed-out wait; a stale target name can return NotFound and a concurrent disruption can produce TooManyRequests.",
          fr: "Quand le budget le permet, l’éviction est acceptée et le ReplicaSet remplace le Pod. Attendez suppression effective et retour de la marge : l’acceptation ne prouve pas la récupération, et rollout status seul peut brièvement lire un statut de contrôleur périmé. La requête vise un seul Pod d’exercice, pas un worker avec d’autres workloads. Il faut l’autorisation create sur pods/eviction. Examinez toute attente expirée ; un nom périmé peut donner NotFound, une perturbation concurrente TooManyRequests.",
        },
      },
      {
        type: "h2",
        id: "blocked",
        text: {
          en: "Make the requirement impossible for a voluntary eviction",
          fr: "Rendre l’éviction incompatible avec l’exigence",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-pdb scale deployment/protected --replicas=2\nk -n lab-pdb rollout status deployment/protected --timeout=120s\nk -n lab-pdb get pdb protected --watch",
      },
      {
        type: "p",
        text: {
          en: "Stop the watch after status shows two currentHealthy, two desiredHealthy and zero disruptionsAllowed. Scaling the Deployment itself is not blocked by the PDB. Select a fresh current Pod name and submit the same eviction request again: expected HTTP 429 because removing one would violate minAvailable: 2. This controlled refusal is the observation, not a failure to hide with force flags.",
          fr: "Arrêtez l’observation quand le statut indique deux currentHealthy, deux desiredHealthy et zéro disruptionsAllowed. Réduire le Deployment n’est pas bloqué par le PDB. Choisissez un nom de Pod actuel et resoumettez la requête : HTTP 429 est attendu, car retirer un Pod violerait minAvailable: 2. Ce refus contrôlé est le résultat, pas une erreur à masquer par des options force.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'TARGET_POD="$(k -n lab-pdb get pods -l app=protected -o jsonpath=\'{.items[0].metadata.name}\')"\nprintf \'{"apiVersion":"policy/v1","kind":"Eviction","metadata":{"name":"%s","namespace":"lab-pdb"}}\' "$TARGET_POD" > /tmp/lab-eviction.json\nk create --raw "/api/v1/namespaces/lab-pdb/pods/$TARGET_POD/eviction" -f /tmp/lab-eviction.json',
      },
      {
        type: "h2",
        id: "tradeoffs",
        text: {
          en: "Do not solve every maintenance block by lowering safety",
          fr: "Ne pas résoudre chaque blocage en abaissant la sûreté",
        },
      },
      {
        type: "p",
        text: {
          en: "First inspect unhealthy Pods, insufficient replacement capacity, selectors and overlapping budgets. A spare replica can preserve the service requirement while restoring maintenance headroom. minAvailable equal to desired replicas intentionally allows no healthy voluntary eviction; with a single replica that can permanently block maintenance. unhealthyPodEvictionPolicy changes behavior for unhealthy Pods and must be chosen according to recovery goals, not pasted blindly.",
          fr: "Examinez d’abord Pods défaillants, capacité de remplacement, sélecteurs et budgets superposés. Un réplica supplémentaire peut préserver l’exigence tout en restaurant la marge de maintenance. minAvailable égal aux réplicas désirés interdit volontairement toute éviction saine ; avec un seul réplica cela peut bloquer durablement la maintenance. unhealthyPodEvictionPolicy modifie le traitement des Pods défaillants et se choisit selon l’objectif de récupération, pas par copier-coller.",
        },
      },
      {
        type: "p",
        text: {
          en: "Direct Pod deletion can bypass the eviction budget, and involuntary failures still reduce healthy count. Deployment rolling updates follow maxSurge/maxUnavailable rather than being constrained by PDB. Use these controls together and test traffic behavior; a healthy count is not proof every request succeeds. Do not execute drain or force deletion against nodes containing other exercises just to demonstrate this distinction.",
          fr: "Une suppression directe de Pod peut contourner le budget, et les pannes involontaires réduisent malgré tout l’effectif sain. Les rollouts de Deployment suivent maxSurge/maxUnavailable sans être contraints par le PDB. Combinez ces contrôles et testez le trafic : un effectif sain ne prouve pas le succès de chaque requête. Ne lancez pas de drain ni de suppression forcée sur des nœuds contenant d’autres exercices pour démontrer cette distinction.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Predict the refusal",
          fr: "Prédire le refus",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "Three healthy replicas and minAvailable=2 normally allow how many evictions?",
              fr: "Trois réplicas sains et minAvailable=2 autorisent normalement combien d’évictions ?",
            },
            options: [
              {
                en: "One",
                fr: "Une",
              },
              {
                en: "Two",
                fr: "Deux",
              },
              {
                en: "Three",
                fr: "Trois",
              },
            ],
            correct: 0,
            explanation: {
              en: "One can be unavailable while retaining the required two.",
              fr: "Un peut manquer en conservant les deux exigés.",
            },
          },
          {
            question: {
              en: "Does a PDB stop a physical host failure?",
              fr: "Un PDB empêche-t-il une panne physique de l’hôte ?",
            },
            options: [
              {
                en: "Always",
                fr: "Toujours",
              },
              {
                en: "No",
                fr: "Non",
              },
              {
                en: "Only if maxUnavailable is zero",
                fr: "Seulement avec maxUnavailable à zéro",
              },
            ],
            correct: 1,
            explanation: {
              en: "A policy cannot veto an involuntary hardware failure.",
              fr: "Une politique ne peut pas opposer un veto à une panne matérielle.",
            },
          },
          {
            question: {
              en: "What controls Deployment rollout availability?",
              fr: "Qu’est-ce qui contrôle la disponibilité du rollout Deployment ?",
            },
            options: [
              {
                en: "Only the PDB",
                fr: "Seulement le PDB",
              },
              {
                en: "The Service name",
                fr: "Le nom du Service",
              },
              {
                en: "Its rollout strategy and readiness",
                fr: "Sa stratégie de rollout et sa readiness",
              },
            ],
            correct: 2,
            explanation: {
              en: "PDB is not the rollout controller budget.",
              fr: "Le PDB n’est pas le budget du contrôleur de rollout.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Keep two healthy and allow maintenance",
          fr: "Garder deux Pods sains et permettre la maintenance",
        },
        task: {
          en: "The two-replica workload must retain two healthy during maintenance. Restore one unit of voluntary headroom without lowering minAvailable.",
          fr: "Le workload à deux réplicas doit conserver deux Pods sains pendant maintenance. Restaurez une unité de marge volontaire sans baisser minAvailable.",
        },
        hints: [
          {
            en: "A policy cannot create replacement capacity.",
            fr: "Une politique ne crée pas de capacité de remplacement.",
          },
          {
            en: "Add and wait before asking for eviction.",
            fr: "Ajoutez et attendez avant l’éviction.",
          },
        ],
        solution: [
          {
            type: "code",
            lang: "bash",
            code: "k -n lab-pdb scale deployment/protected --replicas=3\nk -n lab-pdb rollout status deployment/protected --timeout=120s\nk -n lab-pdb get pdb protected -o yaml",
          },
          {
            type: "p",
            text: {
              en: "Verify all three ready and disruptionsAllowed: 1 before submitting a fresh eviction request. If the third Pod cannot schedule, resolve the capacity or placement constraint rather than pretending the maintenance promise is satisfied.",
              fr: "Vérifiez trois Pods prêts et disruptionsAllowed: 1 avant une nouvelle requête. Si le troisième ne peut pas être placé, résolvez capacité ou contrainte au lieu de prétendre l’exigence satisfaite.",
            },
          },
        ],
      },
      {
        type: "h2",
        id: "cleanup",
        text: {
          en: "Cleanup",
          fr: "Nettoyage",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k delete namespace lab-pdb",
      },
    ] satisfies Block[]),
  ],
};
