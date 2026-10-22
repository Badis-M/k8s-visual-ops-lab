import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-3/ha/spread.yaml?raw";

export const ha: Chapter = {
  id: "ha",
  level: 3,
  minutes: 55,
  title: {
    en: "High availability architecture",
    fr: "Architecture haute disponibilité",
  },
  summary: {
    en: "Locate correlated failures across Pods, nodes, storage and control plane, and test limited replica placement without claiming one-host kind is physically resilient.",
    fr: "Localiser les pannes corrélées entre Pods, nœuds, stockage et control plane, et tester le placement sans présenter kind sur un hôte comme physiquement résilient.",
  },
  prerequisites: ["scheduling", "pdb", "storage"],
  related: ["advanced-scheduling", "backup-dr", "multi-cluster"],
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Draw the failure domains before adding replicas",
          fr: "Dessiner les domaines de panne avant les réplicas",
        },
      },
      {
        type: "p",
        text: {
          en: "You will distinguish component redundancy from end-to-end availability, inspect replica placement and trace a request through its shared dependencies. Three healthy Pods on one host can survive a process crash but cannot survive losing that host. An availability design starts with an explicit failure scenario and recovery objective, not a replica count.",
          fr: "Vous distinguerez redondance de composants et disponibilité de bout en bout, examinerez le placement et suivrez une requête à travers ses dépendances partagées. Trois Pods sur un hôte résistent à un crash de processus, pas à la perte de l’hôte. Une conception commence par un scénario de panne et un objectif de récupération, pas un nombre de réplicas.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "Availability is the whole dependency path",
          fr: "La disponibilité concerne tout le chemin de dépendances",
        },
      },
      {
        type: "p",
        text: {
          en: "A user request can depend on DNS, edge routing, Service dataplane, ready application replicas and a data service. Adding stateless replicas does not remove a single database primary, local-only volume or one external identity provider as a dependency. The Kubernetes control plane reconciles desired state; existing workloads can sometimes continue during a control-plane outage while scheduling and updates stop. This degraded state is not equivalent to a healthy platform.",
          fr: "Une requête peut dépendre du DNS, du routage d’entrée, du dataplane de Service, des réplicas prêts et des données. Ajouter des réplicas stateless ne supprime pas la dépendance à un primaire de base, un volume local ou un fournisseur d’identité unique. Le control plane réconcilie l’état ; des workloads peuvent parfois continuer pendant sa panne alors que placement et mises à jour s’arrêtent. Cet état dégradé n’équivaut pas à une plateforme saine.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-ha"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-3/ha/spread.yaml",
      },
      {
        type: "h2",
        id: "placement",
        text: {
          en: "What topology spread actually constrains",
          fr: "Ce que contraint réellement topology spread",
        },
      },
      {
        type: "p",
        text: {
          en: "The manifest spreads matching Pods over eligible hostname domains with maxSkew: 1 and DoNotSchedule. nodeTaintsPolicy: Honor excludes nodes whose taints the Pod cannot tolerate from that calculation. It does not create nodes or reserve capacity. In the baseline there are two schedulable workers, so three replicas can normally distribute as two plus one. Control-plane taints and other eligibility rules matter. Zone labels in a local cluster would only simulate zones; inventing labels does not create independent power or network paths.",
          fr: "Le manifeste répartit les Pods correspondants sur les domaines hostname éligibles avec maxSkew: 1 et DoNotSchedule. nodeTaintsPolicy: Honor exclut du calcul les nœuds dont le Pod ne tolère pas les taints. Il ne crée ni nœuds ni capacité réservée. Les deux workers ordonnançables de la base permettent normalement une répartition deux plus un. Taints du control plane et règles d’éligibilité comptent. Des labels de zones locales ne feraient que simuler des zones ; ils ne créent pas des alimentations ou réseaux indépendants.",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k get nodes -L kubernetes.io/hostname\nk -n lab-ha apply -f lab/level-3/ha/spread.yaml\nk -n lab-ha rollout status deployment/spread-web --timeout=120s\nk -n lab-ha get pods -l app=spread-web -o wide\nk -n lab-ha get endpointslices -l kubernetes.io/service-name=spread-web -o yaml",
      },
      {
        type: "p",
        text: {
          en: "Expected: three ready endpoints with placements across the two eligible workers, subject to resource availability. If a replica is Pending, use describe and Events to distinguish topology restrictions from resources or taints. With DoNotSchedule, strict spread can deliberately trade schedulability for placement quality. Preferred rules trade the other way and may co-locate more replicas during pressure.",
          fr: "Attendu : trois endpoints prêts répartis sur les deux workers éligibles, selon la capacité. Si un réplica est Pending, describe et Events distinguent topologie, ressources et taints. DoNotSchedule échange volontairement l’ordonnançabilité contre la qualité du placement. Les règles préférentielles font le compromis inverse et peuvent regrouper davantage de réplicas sous pression.",
        },
      },
      {
        type: "h2",
        id: "experiment",
        text: {
          en: "Observe one controlled application loss",
          fr: "Observer une perte applicative contrôlée",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'TARGET_POD="$(k -n lab-ha get pods -l app=spread-web -o jsonpath=\'{.items[0].metadata.name}\')"\nk -n lab-ha delete pod "$TARGET_POD"\nk -n lab-ha get pods -l app=spread-web -o wide\nk -n lab-ha rollout status deployment/spread-web --timeout=120s',
      },
      {
        type: "p",
        text: {
          en: "This deletes only one exercise Pod and demonstrates controller replacement, not a host or zone outage. Inspect endpoints during replacement and use an in-cluster client to check requests if you want dataplane evidence. A single successful curl does not establish a percentage SLO or absence of short interruptions. Measure a stream of requests and their errors before making that stronger claim.",
          fr: "Cela supprime un seul Pod d’exercice et démontre son remplacement, pas une panne d’hôte ou de zone. Examinez les endpoints pendant le remplacement et utilisez un client interne pour obtenir une preuve réseau. Un curl réussi ne démontre ni SLO chiffré ni absence d’interruptions brèves. Mesurez un flux de requêtes et ses erreurs avant une affirmation plus forte.",
        },
      },
      {
        type: "h2",
        id: "control-plane",
        text: {
          en: "Quorum and independence are separate requirements",
          fr: "Quorum et indépendance sont deux exigences distinctes",
        },
      },
      {
        type: "p",
        text: {
          en: "An HA control plane usually needs redundant API endpoints, a load-balancing path and an etcd topology retaining a majority under the target failure. Three etcd members tolerate one member loss, but three VMs on one physical host lose quorum together if the host fails. Adding voters has write-latency and operational costs; backups and tested restore remain necessary even with quorum. Managed control planes remove some operations, not your responsibility for workload and dependency design.",
          fr: "Un control plane HA exige généralement API redondantes, chemin de répartition et topologie etcd conservant une majorité face à la panne visée. Trois membres etcd tolèrent une perte, mais trois VM sur le même hôte perdent leur quorum ensemble si celui-ci tombe. Ajouter des votants coûte en latence et exploitation ; sauvegarde et restauration testée restent nécessaires. Un control plane managé retire certaines opérations, pas la responsabilité des workloads et dépendances.",
        },
      },
      {
        type: "h2",
        id: "data",
        text: {
          en: "Replica identity does not replicate data",
          fr: "L’identité d’un réplica ne réplique pas les données",
        },
      },
      {
        type: "p",
        text: {
          en: "StatefulSets provide stable identities and storage associations, not a database replication protocol. A PVC bound to local-path storage depends on one node and the host disk; a replacement Pod on another node cannot magically read that directory. Production designs need storage fault-domain guarantees, application replication and tested consistency/recovery behavior. Distinguish failover RTO from acceptable data loss RPO and document what happens during partition, not only during clean shutdown.",
          fr: "Les StatefulSets fournissent identités stables et associations de stockage, pas un protocole de réplication de base. Un PVC local-path dépend d’un nœud et du disque hôte ; un remplacement ailleurs ne lit pas magiquement ce répertoire. La production exige garanties des domaines de panne, réplication applicative et récupération cohérente testée. Distinguez RTO de bascule et RPO de perte acceptable, et documentez les partitions, pas seulement les arrêts propres.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Match each promise to evidence",
          fr: "Associer promesse et preuve",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "What does this Pod deletion prove?",
              fr: "Que prouve la suppression de Pod de cet exercice ?",
            },
            options: [
              {
                en: "Physical-zone failover",
                fr: "Bascule de zone physique",
              },
              {
                en: "Controller replacement of one replica",
                fr: "Remplacement d’un réplica par le contrôleur",
              },
              {
                en: "Zero data loss",
                fr: "Aucune perte de données",
              },
            ],
            correct: 1,
            explanation: {
              en: "The failure injected is process/workload scoped, not host scoped.",
              fr: "La panne injectée concerne le workload, pas l’hôte.",
            },
          },
          {
            question: {
              en: "Do three local kind nodes give independent physical domains?",
              fr: "Trois nœuds kind donnent-ils des domaines physiques indépendants ?",
            },
            options: [
              {
                en: "No",
                fr: "Non",
              },
              {
                en: "Yes",
                fr: "Oui",
              },
              {
                en: "Only with labels",
                fr: "Seulement avec des labels",
              },
            ],
            correct: 0,
            explanation: {
              en: "Containers still share one host and its underlying dependencies.",
              fr: "Les conteneurs partagent toujours un hôte et ses dépendances.",
            },
          },
          {
            question: {
              en: "Does a StatefulSet implement database replication?",
              fr: "Un StatefulSet implémente-t-il la réplication de base ?",
            },
            options: [
              {
                en: "Always",
                fr: "Toujours",
              },
              {
                en: "Only with three replicas",
                fr: "Seulement avec trois réplicas",
              },
              {
                en: "No, the application must provide it",
                fr: "Non, l’application doit la fournir",
              },
            ],
            correct: 2,
            explanation: {
              en: "Stable identity is distinct from data replication and consistency.",
              fr: "Identité stable, réplication et cohérence sont distinctes.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Review a misleading architecture claim",
          fr: "Relire une affirmation trompeuse",
        },
        task: {
          en: "A design has three application replicas on two workers, a single local-path database and one control plane, all on one laptop. Identify what it can survive and the next evidence needed for a host-failure availability claim.",
          fr: "Une conception possède trois réplicas sur deux workers, une base local-path et un control plane, tous sur un portable. Identifiez les pannes tolérables et les preuves nécessaires pour revendiquer une résistance à la perte d’hôte.",
        },
        hints: [
          {
            en: "Trace the shared physical and stateful dependencies.",
            fr: "Suivez les dépendances physiques et stateful partagées.",
          },
          {
            en: "Separate a design improvement from a tested claim.",
            fr: "Distinguez amélioration de conception et affirmation testée.",
          },
        ],
        solution: [
          {
            type: "p",
            text: {
              en: "It can demonstrate replacement of a stateless replica and some logical-node placement. It cannot survive laptop loss and may lose access to local data after a logical-node loss. A host-failure claim needs independent hosts, redundant ingress/control plane, application-aware replicated storage and a controlled failure test measuring requests, recovery time and data integrity. A diagram alone does not supply that evidence.",
              fr: "Elle démontre remplacement stateless et placement sur nœuds logiques. Elle ne résiste pas à la perte du portable et peut perdre l’accès aux données après perte d’un nœud logique. Revendiquer la tolérance d’hôte exige hôtes indépendants, entrée/control plane redondants, réplication des données adaptée et test contrôlé mesurant requêtes, temps de récupération et intégrité. Un diagramme ne fournit pas ces preuves.",
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
        code: "k delete namespace lab-ha",
      },
    ] satisfies Block[]),
  ],
};
