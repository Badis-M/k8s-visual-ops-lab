import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-3/hpa/scaling.yaml?raw";

export const hpa: Chapter = {
  id: "hpa",
  level: 3,
  minutes: 45,
  title: {
    en: "Horizontal Pod Autoscaling",
    fr: "Horizontal Pod Autoscaling",
  },
  summary: {
    en: "Follow the metrics-to-replicas feedback loop, calculate a utilization decision and diagnose missing signals before trusting autoscaling.",
    fr: "Suivre la boucle métriques-réplicas, calculer une décision d’utilisation et diagnostiquer les signaux manquants avant de compter sur l’autoscaling.",
  },
  prerequisites: ["resources", "probes"],
  related: ["vertical-cluster-scaling", "observability"],
  heavy: {
    en: "Requires a working Metrics Server 0.8.x resource-metrics API in addition to kind; each busy-loop container is capped at 0.1 CPU, about 0.3 CPU for three steady-state replicas. Rollout overlap can temporarily add containers.",
    fr: "Nécessite une API resource-metrics fonctionnelle via Metrics Server 0.8.x en plus de kind ; chaque boucle est plafonnée à 0,1 CPU, soit environ 0,3 CPU pour trois réplicas stables. Un rollout peut temporairement ajouter des conteneurs.",
  },
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Scale from an explicit signal",
          fr: "Dimensionner à partir d’un signal explicite",
        },
      },
      {
        type: "p",
        text: {
          en: "You will distinguish CPU usage from CPU utilization, compute a replica recommendation, observe a bounded scaling experiment and recognize metric failures. HPA adjusts replicas on a target scale subresource; it does not allocate nodes, fix an overloaded database or make a non-parallel workload parallel. Validate that adding replicas actually improves the user-facing bottleneck.",
          fr: "Vous distinguerez usage CPU et utilisation relative, calculerez une recommandation, observerez une expérience bornée et reconnaîtrez les métriques manquantes. HPA ajuste les réplicas via le sous-objet scale ; il n’ajoute pas de nœuds et ne corrige pas une base saturée ni un workload non parallélisable. Vérifiez que davantage de réplicas améliorent réellement le goulot utilisateur.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "A sampled feedback loop, not an instant switch",
          fr: "Une boucle échantillonnée, pas un interrupteur instantané",
        },
      },
      {
        type: "p",
        text: {
          en: "For a CPU utilization target, the percentage is measured usage divided by requested CPU. At 100m usage on a 200m request, utilization is 50%, regardless of the limit. A simplified recommendation is ceil(currentReplicas × observedUtilization / targetUtilization). With two replicas at 80% against a 50% target, that gives four before bounds and controller adjustments. Tolerance, missing samples, startup readiness and stabilization make real decisions more conservative.",
          fr: "Pour une cible d’utilisation CPU, le pourcentage vaut usage mesuré divisé par request CPU. Un usage de 100m pour une request de 200m donne 50 %, quelle que soit la limite. La recommandation simplifiée vaut ceil(réplicas × utilisation observée / cible). Deux réplicas à 80 % pour une cible de 50 % donnent quatre avant bornes et ajustements. Tolérance, échantillons manquants, readiness initiale et stabilisation rendent la décision réelle plus prudente.",
        },
      },
    ] satisfies Block[]),
    { type: "diagram", name: "autoscaling-feedback" },
    ...labContext("lab-hpa"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-3/hpa/scaling.yaml",
      },
      {
        type: "h2",
        id: "prerequisite",
        text: {
          en: "Check the metrics pipeline first",
          fr: "Vérifier d’abord la chaîne de métriques",
        },
      },
      {
        type: "p",
        text: {
          en: "Metrics Server is an additional cluster component, not built into a bare kind cluster. This course targets 0.8.0, which supports the pinned Kubernetes 1.35 baseline. Its API aggregation and authenticated kubelet connectivity must work. Follow the pinned upstream installation and requirements linked in docs/content-sources.md; do not bypass certificate validation to make a dashboard turn green. Self-signed kind kubelet serving certificates need deliberate lab provisioning or an explicitly isolated test-only exception reviewed by the learner, never a production default. Stop here until the following checks succeed.",
          fr: "Metrics Server est un composant supplémentaire, absent d’un kind nu. Le cours cible 0.8.0, compatible avec Kubernetes 1.35. Agrégation d’API et connexion authentifiée aux kubelets doivent fonctionner. Suivez l’installation et les prérequis amont épinglés dans docs/content-sources.md ; ne contournez pas les certificats pour obtenir un voyant vert. Les certificats kubelet autosignés de kind exigent une préparation dédiée ou une exception de test isolée examinée par l’apprenant, jamais un défaut de production. Arrêtez-vous tant que les contrôles suivants échouent.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k get apiservice v1beta1.metrics.k8s.io\nk wait --for=condition=Available apiservice/v1beta1.metrics.k8s.io --timeout=90s\nk top nodes\nk get --raw /apis/metrics.k8s.io/v1beta1/nodes",
      },
      {
        type: "h2",
        id: "exercise",
        text: {
          en: "Observe an intentionally saturated worker",
          fr: "Observer un worker volontairement saturé",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-hpa apply -f lab/level-3/hpa/scaling.yaml\nk -n lab-hpa rollout status deployment/cpu-demo --timeout=120s\nk -n lab-hpa get hpa cpu-demo --watch",
      },
      {
        type: "p",
        text: {
          en: "The tight shell loop is deliberately CPU-bound and each container is capped at 100m. Its 50m request means utilization may approach 200%, so a 50% target asks for more replicas until maxReplicas: 3 is reached. This synthetic workload does not distribute real requests: it demonstrates the controller signal and ceiling, not the effectiveness of production scaling. Ctrl+C stops the watch without stopping the workload.",
          fr: "La boucle shell est volontairement CPU-bound et chaque conteneur est plafonné à 100m. Avec une request de 50m, l’utilisation peut approcher 200 % : la cible de 50 % demande davantage de réplicas jusqu’à maxReplicas: 3. Cette charge synthétique ne répartit pas des requêtes réelles : elle démontre signal et plafond, pas l’efficacité d’une mise à l’échelle de production. Ctrl+C arrête l’observation, pas le workload.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-hpa describe hpa cpu-demo\nk -n lab-hpa top pods\nk -n lab-hpa get deployment cpu-demo\nk -n lab-hpa get events --sort-by=.metadata.creationTimestamp",
      },
      {
        type: "p",
        text: {
          en: "Expected observations include valid current metrics, ScalingActive=True and possibly ScalingLimited=True when the desired recommendation exceeds three. A Pending replica indicates placement capacity or constraints, not necessarily an HPA error. Missing requests or an unavailable metrics API produce Unknown targets or FailedGetResourceMetric Events. Read those conditions before changing thresholds.",
          fr: "Les observations attendues incluent des métriques courantes, ScalingActive=True et éventuellement ScalingLimited=True si la recommandation dépasse trois. Un réplica Pending indique un manque de capacité ou une contrainte, pas nécessairement une erreur HPA. Requests manquantes ou API absente produisent des cibles Unknown ou des Events FailedGetResourceMetric. Lisez ces conditions avant de changer les seuils.",
        },
      },
      {
        type: "h2",
        id: "cooldown",
        text: {
          en: "Remove load without fighting the controller",
          fr: "Retirer la charge sans combattre le contrôleur",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'k -n lab-hpa patch deployment cpu-demo --type=strategic -p \'{"spec":{"template":{"spec":{"containers":[{"name":"worker","command":["sleep","3600"]}]}}}}\'\nk -n lab-hpa rollout status deployment/cpu-demo --timeout=120s\nk -n lab-hpa get hpa cpu-demo --watch',
      },
      {
        type: "p",
        text: {
          en: "The new template sleeps; after fresh low samples and the 60-second downscale stabilization window, replicas should trend toward one. Stabilization is not an exact timer from your command. Avoid repeatedly applying a manifest with spec.replicas while HPA owns scale: the two writers can cause oscillation. In production assess latency, queues and error rates as well as CPU; custom/external metrics require their own adapters.",
          fr: "Le nouveau template dort ; après de nouveaux échantillons faibles et la fenêtre de stabilisation de 60 secondes, les réplicas doivent tendre vers un. La stabilisation n’est pas un chronomètre exact démarrant à votre commande. Évitez de réappliquer spec.replicas pendant que HPA possède scale : les deux écritures peuvent osciller. En production, examinez latence, files et erreurs, pas seulement CPU ; les métriques personnalisées ou externes nécessitent leurs adaptateurs.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Reason from the denominator",
          fr: "Raisonner sur le dénominateur",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "Two replicas at 80% with a target of 50% suggest what simplified count?",
              fr: "Deux réplicas à 80 % pour une cible de 50 % suggèrent quel effectif simplifié ?",
            },
            options: [
              {
                en: "Two",
                fr: "Deux",
              },
              {
                en: "Four",
                fr: "Quatre",
              },
              {
                en: "Eight",
                fr: "Huit",
              },
            ],
            correct: 1,
            explanation: {
              en: "ceil(2 × 80 / 50) is four before stabilization and bounds.",
              fr: "ceil(2 × 80 / 50) vaut quatre avant stabilisation et bornes.",
            },
          },
          {
            question: {
              en: "What is the denominator for CPU Utilization?",
              fr: "Quel est le dénominateur de CPU Utilization ?",
            },
            options: [
              {
                en: "CPU request",
                fr: "La request CPU",
              },
              {
                en: "CPU limit",
                fr: "La limit CPU",
              },
              {
                en: "Host core count",
                fr: "Les cœurs de l’hôte",
              },
            ],
            correct: 0,
            explanation: {
              en: "Changing a request changes utilization even at the same measured usage.",
              fr: "Changer une request change l’utilisation relative même à usage constant.",
            },
          },
          {
            question: {
              en: "Will HPA add a kind worker when Pods stay Pending?",
              fr: "HPA ajoute-t-il un worker kind si les Pods restent Pending ?",
            },
            options: [
              {
                en: "Yes",
                fr: "Oui",
              },
              {
                en: "Only after 60 seconds",
                fr: "Seulement après 60 secondes",
              },
              {
                en: "No",
                fr: "Non",
              },
            ],
            correct: 2,
            explanation: {
              en: "Node capacity is a separate control loop and provider capability.",
              fr: "La capacité des nœuds relève d’une autre boucle et d’un fournisseur.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Predict the effect of right-sizing",
          fr: "Prédire l’effet du right-sizing",
        },
        task: {
          en: "At unchanged usage of 40m, compare a 50m request and a 100m request with a target of 50%. Explain why increasing requests can reduce the HPA signal while consuming more schedulable reservation.",
          fr: "À usage constant de 40m, comparez requests de 50m et 100m pour une cible de 50 %. Expliquez pourquoi augmenter les requests réduit le signal HPA tout en réservant davantage de capacité.",
        },
        hints: [
          {
            en: "Divide usage by request, not limit.",
            fr: "Divisez l’usage par request, pas limit.",
          },
          {
            en: "Scheduling and utilization use the same declaration for different decisions.",
            fr: "Placement et utilisation emploient la même déclaration pour des décisions différentes.",
          },
        ],
        solution: [
          {
            type: "p",
            text: {
              en: "40/50 = 80%; 40/100 = 40%. The former encourages scale-up and the latter can encourage scale-down. Neither request should be chosen to manipulate a graph: use measured needs and coordinate VPA/HPA policies. More replicas also consume memory, connections and minimum reserved resources.",
              fr: "40/50 = 80 % ; 40/100 = 40 %. Le premier favorise la hausse, le second peut favoriser la baisse. Ne choisissez pas les requests pour manipuler un graphe : mesurez les besoins et coordonnez VPA/HPA. Plus de réplicas consomment aussi mémoire, connexions et ressources minimales réservées.",
            },
          },
        ],
      },
      {
        type: "h2",
        id: "cleanup",
        text: {
          en: "Stop the synthetic load",
          fr: "Arrêter la charge synthétique",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k delete namespace lab-hpa",
      },
      {
        type: "p",
        text: {
          en: "This removes the workload and HPA, not a shared Metrics Server installation. Remove external components only if you installed them solely for this disposable lab and have reviewed their cluster-scoped resources.",
          fr: "Cela retire workload et HPA, pas une installation partagée de Metrics Server. Retirez les composants externes seulement si vous les avez installés exclusivement pour ce lab et après examen de leurs objets à portée cluster.",
        },
      },
    ] satisfies Block[]),
  ],
};
