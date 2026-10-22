import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-3/vertical-cluster-scaling/recommendation.yaml?raw";

export const verticalClusterScaling: Chapter = {
  id: "vertical-cluster-scaling",
  level: 3,
  minutes: 35,
  title: {
    en: "Vertical and cluster autoscaling",
    fr: "Autoscaling vertical et du cluster",
  },
  summary: {
    en: "Separate right-sizing a Pod from adding nodes, inspect bounded VPA recommendations and explain why a kind topology cannot demonstrate cloud node provisioning.",
    fr: "Distinguer le dimensionnement d’un Pod de l’ajout de nœuds, examiner des recommandations VPA bornées et expliquer pourquoi kind ne démontre pas le provisioning cloud.",
  },
  prerequisites: ["resources", "hpa"],
  related: ["scheduling", "control-plane-scale"],
  heavy: {
    en: "Requires Metrics Server and an independently installed VPA recommender/CRDs; a baseline kind cluster has neither.",
    fr: "Nécessite Metrics Server et un recommender VPA avec CRD installés séparément ; kind ne les fournit pas.",
  },
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Choose the loop that can solve the constraint",
          fr: "Choisir la boucle adaptée à la contrainte",
        },
      },
      {
        type: "p",
        text: {
          en: "You will inspect a VPA recommendation without applying it automatically, connect requests to scheduling and HPA utilization, and distinguish node provisioning from Pod replication. A larger Pod still runs on one node; a request larger than every node shape remains unschedulable even if more identical nodes are added.",
          fr: "Vous examinerez une recommandation VPA sans application automatique, relierez requests, placement et utilisation HPA, et distinguerez provisioning de nœuds et réplication de Pods. Un Pod plus grand reste sur un nœud ; une request supérieure à tous les types de nœuds reste impossible même si on ajoute des nœuds identiques.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "Three actuators with different costs",
          fr: "Trois actions aux coûts distincts",
        },
      },
      {
        type: "p",
        text: {
          en: "HPA changes replica count, VPA recommends or updates resource requests, and a node autoscaler changes infrastructure capacity through a supported provider. VPA is not a built-in Kubernetes controller: it uses CRDs and separately installed components. A recommender aggregates observed resource history; an updater/admission component can alter Pods depending on policy. Start in Off mode to inspect the reasoning before delegating disruption.",
          fr: "HPA change le nombre de réplicas, VPA recommande ou met à jour les requests, et un autoscaler de nœuds change la capacité via un fournisseur compatible. VPA n’est pas intégré : il emploie CRD et composants supplémentaires. Son recommender agrège l’historique de ressources ; updater et admission peuvent modifier les Pods selon la politique. Commencez en mode Off pour examiner les recommandations avant de déléguer des perturbations.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-vpa"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-3/vertical-cluster-scaling/recommendation.yaml",
      },
      {
        type: "h2",
        id: "prerequisites",
        text: {
          en: "Require a functioning recommendation service",
          fr: "Exiger un service de recommandation fonctionnel",
        },
      },
      {
        type: "p",
        text: {
          en: "The example targets the stable autoscaling.k8s.io/v1 API with VPA 1.5.1 and Kubernetes 1.35, using only Off mode rather than optional resize features. Install the pinned upstream stack separately according to its requirements; its cluster-scoped RBAC and webhook/certificate setup must be reviewed. The upstream installation is a learner prerequisite, not a command the website executes. If CRDs or metrics are absent, stop: a manifest alone cannot generate recommendations.",
          fr: "L’exemple cible autoscaling.k8s.io/v1 avec VPA 1.5.1 et Kubernetes 1.35, uniquement en mode Off, sans dépendre du resize optionnel. Installez séparément la pile amont épinglée selon ses prérequis ; examinez RBAC global, webhooks et certificats. Cette installation relève de l’apprenant, pas du site. En l’absence de CRD ou métriques, arrêtez-vous : un manifeste seul ne produit pas de recommandations.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k get crd verticalpodautoscalers.autoscaling.k8s.io\nk get apiservice v1beta1.metrics.k8s.io\nk top nodes\nk get deployments -A",
      },
      {
        type: "h2",
        id: "exercise",
        text: {
          en: "Observe without surrendering control",
          fr: "Observer en conservant le contrôle",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-vpa apply -f lab/level-3/vertical-cluster-scaling/recommendation.yaml\nk -n lab-vpa rollout status deployment/rightsize --timeout=120s\nk -n lab-vpa describe vpa rightsize\nk -n lab-vpa get vpa rightsize -o yaml",
      },
      {
        type: "p",
        text: {
          en: "Expected: when the recommender has enough samples, status.recommendation contains containerRecommendations with target, lowerBound and upperBound. It may initially be empty; inspect conditions and recommender logs rather than inventing a universal waiting time. The sleeper intentionally produces a small, unrepresentative sample: do not transfer its recommendation to a real service. Off mode must leave the Deployment requests unchanged.",
          fr: "Attendu : quand le recommender a suffisamment d’échantillons, status.recommendation contient containerRecommendations avec target, lowerBound et upperBound. Il peut être vide au début : examinez conditions et logs plutôt que d’inventer un délai universel. Le sleeper produit volontairement un petit échantillon non représentatif : ne transposez pas sa recommandation à un service réel. Off doit laisser les requests du Deployment inchangées.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-vpa get deployment rightsize -o jsonpath='{.spec.template.spec.containers[0].resources}{\"\\n\"}'\nk -n lab-vpa top pods\nk -n lab-vpa get pods -o wide",
      },
      {
        type: "h2",
        id: "policy",
        text: {
          en: "Read recommendations as bounded estimates",
          fr: "Lire des estimations bornées",
        },
      },
      {
        type: "p",
        text: {
          en: "minAllowed and maxAllowed constrain the recommendation range; they do not conjure node capacity. RequestsOnly leaves limits under your control, so ensure proposed requests never exceed the limits you keep. Recommendations reflect observed history and safety margins, not future traffic guarantees. Before applying them, include startup peaks, periodic jobs, headroom and an application SLO; measure again under representative load.",
          fr: "minAllowed et maxAllowed bornent les recommandations sans créer de capacité. RequestsOnly laisse les limites sous votre contrôle : veillez à ce que les requests proposées ne dépassent pas les limites conservées. L’historique et les marges ne garantissent pas le trafic futur. Avant application, considérez démarrage, tâches périodiques, marge et SLO, puis mesurez sous une charge représentative.",
        },
      },
      {
        type: "p",
        text: {
          en: "Updating resources may require eviction/recreation or supported in-place resizing depending on VPA version, mode and feature support. Do not assume every update is disruption-free. Avoid using VPA automatic CPU request changes alongside a CPU-utilization HPA without understanding that changing the denominator changes HPA decisions. Recommendation-only VPA plus a deliberately designed horizontal metric is easier to reason about.",
          fr: "Modifier les ressources peut nécessiter éviction/recréation ou resize en place selon version, mode et fonctionnalités. Ne supposez pas une absence d’interruption. Évitez les modifications automatiques des requests CPU avec un HPA d’utilisation CPU sans comprendre que le dénominateur change ses décisions. VPA consultatif et métrique horizontale délibérée sont plus faciles à maîtriser.",
        },
      },
      {
        type: "h2",
        id: "nodes",
        text: {
          en: "Why an autoscaler cannot invent a suitable node",
          fr: "Pourquoi l’autoscaler ne peut pas inventer un nœud adapté",
        },
      },
      {
        type: "p",
        text: {
          en: "A node autoscaler looks for unschedulable demand and evaluates possible node groups or provisionable shapes. Unsupported affinity, an impossible PVC zone, missing cloud quota or a Pod larger than any allowed shape can prevent scale-up. Scale-down also needs safe eviction, PDB headroom and movable workloads. More nodes can increase cost and blast radius; production needs budgets and tested limits.",
          fr: "Un autoscaler de nœuds cherche la demande non ordonnançable et évalue groupes ou types provisionnables. Une affinité impossible, une zone de PVC inadéquate, un quota absent ou un Pod trop grand peut empêcher l’ajout. Réduire les nœuds exige éviction sûre, marge PDB et workloads déplaçables. Plus de nœuds peut accroître coût et périmètre d’incident : budgets et limites testées sont nécessaires.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k get nodes -o wide\nk -n lab-vpa get events --sort-by=.metadata.creationTimestamp\nk describe nodes",
      },
      {
        type: "p",
        text: {
          en: "These commands inspect capacity; they do not demonstrate node autoscaling. kind creates a fixed local topology and has no cloud node-group provider by default. The reproducible local part is VPA observation and scheduling diagnosis. Cloud group provisioning and its failure cases remain an architectural extension requiring a separate environment; this course does not buy one.",
          fr: "Ces commandes inspectent la capacité sans démontrer l’autoscaling de nœuds. kind crée une topologie fixe sans fournisseur cloud par défaut. La partie locale reproductible concerne observation VPA et diagnostic de placement. Le provisioning de groupes cloud reste une extension architecturale nécessitant un autre environnement ; ce cours n’en achète aucun.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Choose the right lever",
          fr: "Choisir le bon levier",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "What changes automatically in VPA Off mode?",
              fr: "Que change automatiquement VPA en mode Off ?",
            },
            options: [
              {
                en: "Node count",
                fr: "Le nombre de nœuds",
              },
              {
                en: "Nothing in Pod requests; recommendations are reported",
                fr: "Rien dans les requests ; les recommandations sont publiées",
              },
              {
                en: "Every limit",
                fr: "Toutes les limits",
              },
            ],
            correct: 1,
            explanation: {
              en: "Off isolates recommendation from mutation.",
              fr: "Off sépare recommandation et mutation.",
            },
          },
          {
            question: {
              en: "Can adding 4Gi nodes fit a single Pod requesting 8Gi?",
              fr: "Ajouter des nœuds de 4Gi place-t-il un Pod demandant 8Gi ?",
            },
            options: [
              {
                en: "No",
                fr: "Non",
              },
              {
                en: "Yes, memory is pooled",
                fr: "Oui, la mémoire est mutualisée",
              },
              {
                en: "Only with three replicas",
                fr: "Seulement avec trois réplicas",
              },
            ],
            correct: 0,
            explanation: {
              en: "A Pod must fit one eligible node.",
              fr: "Un Pod doit tenir sur un nœud éligible.",
            },
          },
          {
            question: {
              en: "Why can VPA change a CPU HPA decision at constant usage?",
              fr: "Pourquoi VPA peut-il changer la décision HPA CPU à usage constant ?",
            },
            options: [
              {
                en: "It deletes metrics",
                fr: "Il efface les métriques",
              },
              {
                en: "It changes Service ports",
                fr: "Il change les ports",
              },
              {
                en: "It changes the CPU-request denominator",
                fr: "Il change le dénominateur request CPU",
              },
            ],
            correct: 2,
            explanation: {
              en: "Utilization depends on declared requests.",
              fr: "L’utilisation relative dépend des requests déclarées.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Review before applying",
          fr: "Relire avant d’appliquer",
        },
        task: {
          en: "Consider a separate hypothetical service, not the bounded sleeper above: its CPU limit is 100m, its policy permits up to 200m, and VPA recommends 150m. Write the decision sequence before changing its Deployment. Explain why accepting the recommendation blindly can fail validation or require more node headroom.",
          fr: "Considérez un autre service hypothétique, pas le sleeper borné ci-dessus : sa limite CPU vaut 100m, sa politique autorise 200m et VPA recommande 150m. Décrivez la décision avant modification et pourquoi une acceptation aveugle peut échouer à la validation ou nécessiter davantage de capacité.",
        },
        hints: [
          {
            en: "Check policy bounds and current request/limit pairs.",
            fr: "Vérifiez bornes et couples request/limit.",
          },
          {
            en: "Check scheduling and disruption, not only utilization.",
            fr: "Vérifiez placement et interruption, pas seulement utilisation.",
          },
        ],
        solution: [
          {
            type: "p",
            text: {
              en: "Confirm representative history, constrain policy or increase a justified limit, check namespace quotas and eligible allocatable capacity, then plan a controlled rollout. Retain the previous manifest and measure the SLO after the change. Off mode is useful precisely because it lets this review happen before mutation.",
              fr: "Vérifiez la représentativité de l’historique, bornez la politique ou augmentez une limite justifiée, contrôlez quotas et capacité allocatable éligible puis planifiez le rollout. Conservez le manifeste précédent et mesurez le SLO ensuite. Off permet précisément cette relecture avant mutation.",
            },
          },
        ],
      },
      {
        type: "h2",
        id: "cleanup",
        text: {
          en: "Remove the recommendation experiment",
          fr: "Retirer l’expérience de recommandation",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k delete namespace lab-vpa",
      },
      {
        type: "p",
        text: {
          en: "This leaves shared VPA and Metrics Server components intact. Their removal is a separate administrator operation that must account for other recommendations and CRDs.",
          fr: "Cela conserve les composants partagés VPA et Metrics Server. Leur retrait relève d’une opération distincte tenant compte des autres recommandations et CRD.",
        },
      },
    ] satisfies Block[]),
  ],
};
