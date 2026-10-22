import type { Chapter, L, Level } from "./types";
import { whyKubernetes } from "./chapters/why-kubernetes";
import { architecture } from "./chapters/architecture";
import { reconciliation } from "./chapters/reconciliation";
import { setupKind } from "./chapters/setup-kind";
import { pods } from "./chapters/pods";
import { deployments } from "./chapters/deployments";
import { namespacesContexts } from "./chapters/namespaces-contexts";
import { services } from "./chapters/services";
import { labelsSelectors } from "./chapters/labels-selectors";
import { configmapsSecrets } from "./chapters/configmaps-secrets";
import { kubectlTroubleshooting } from "./chapters/kubectl-troubleshooting";

export const levels: { level: Level; name: L; tagline: L; description: L }[] = [
  {
    level: 1,
    name: { en: "Beginner", fr: "Débutant" },
    tagline: { en: "Kubernetes Foundations", fr: "Les fondations de Kubernetes" },
    description: {
      en: "Zero prior knowledge. Understand what a cluster is, how its components talk, and deploy your first application on a local kind cluster.",
      fr: "Aucun prérequis Kubernetes. Comprendre ce qu'est un cluster, comment ses composants communiquent, et déployer une première application sur un cluster kind local.",
    },
  },
  {
    level: 2,
    name: { en: "Intermediate", fr: "Intermédiaire" },
    tagline: { en: "Operating Kubernetes", fr: "Exploiter Kubernetes" },
    description: {
      en: "Rollouts, probes, storage, stateful workloads, networking, RBAC, scheduling and Helm on realistic multi-component apps.",
      fr: "Déploiements progressifs, probes, stockage, workloads stateful, réseau, RBAC, ordonnancement et Helm sur des applications réalistes.",
    },
  },
  {
    level: 3,
    name: { en: "Advanced", fr: "Avancé" },
    tagline: { en: "Production Kubernetes", fr: "Kubernetes en production" },
    description: {
      en: "Helm chart engineering, Kustomize, GitOps, autoscaling, security hardening, observability and incident response.",
      fr: "Conception de charts Helm, Kustomize, GitOps, autoscaling, durcissement sécurité, observabilité et gestion d'incidents.",
    },
  },
  {
    level: 4,
    name: { en: "Expert", fr: "Expert" },
    tagline: { en: "Internals & Extensibility", fr: "Internes & extensibilité" },
    description: {
      en: "API machinery, controllers, CRDs, Operators with Kubebuilder, admission webhooks, etcd, CRI/CNI/CSI and platform engineering.",
      fr: "Mécanique de l'API, contrôleurs, CRD, Operators avec Kubebuilder, webhooks d'admission, etcd, CRI/CNI/CSI et platform engineering.",
    },
  },
];

const up = (id: string, level: Level, en: string, fr: string, minutes = 45): Chapter => ({
  id,
  level,
  title: { en, fr },
  summary: { en: "", fr: "" },
  minutes,
});

export const chapters: Chapter[] = [
  // Level 1
  whyKubernetes,
  architecture,
  reconciliation,
  setupKind,
  namespacesContexts,
  pods,
  deployments,
  services,
  labelsSelectors,
  configmapsSecrets,
  kubectlTroubleshooting,
  // Level 2
  up("rollout-strategies", 2, "Deployment strategies: RollingUpdate & Recreate", "Stratégies : RollingUpdate & Recreate"),
  up("rollbacks", 2, "Rollbacks and revision history", "Rollbacks et historique des révisions", 30),
  up("resources", 2, "Resource requests and limits", "Requests et limits de ressources"),
  up("probes", 2, "Liveness, readiness and startup probes", "Probes liveness, readiness et startup"),
  up("init-sidecars", 2, "Init containers and sidecars", "Init containers et sidecars"),
  up("storage", 2, "PersistentVolumes, PVCs and StorageClasses", "PersistentVolumes, PVC et StorageClasses", 60),
  up("statefulsets", 2, "StatefulSets", "StatefulSets"),
  up("daemonsets", 2, "DaemonSets", "DaemonSets", 30),
  up("jobs", 2, "Jobs and CronJobs", "Jobs et CronJobs", 35),
  up("dns", 2, "Cluster DNS and service discovery", "DNS du cluster et découverte de services"),
  up("ingress-gateway", 2, "Ingress controllers and Gateway API", "Ingress controllers et Gateway API", 60),
  up("network-policies", 2, "NetworkPolicies", "NetworkPolicies"),
  up("rbac", 2, "RBAC, ServiceAccounts and authorization", "RBAC, ServiceAccounts et autorisation", 55),
  up("scheduling", 2, "Taints, tolerations, affinity, nodeSelector", "Taints, tolerations, affinité, nodeSelector"),
  up("helm-basics", 2, "Helm fundamentals", "Les bases de Helm", 55),
  up("troubleshooting-2", 2, "Troubleshooting Pods, Services, network & storage", "Dépanner Pods, Services, réseau et stockage", 60),
  // Level 3
  up("helm-charts", 3, "Helm chart development and reusable templates", "Développer des charts Helm et des templates réutilisables", 70),
  up("helm-releases", 3, "Helm dependencies, upgrades and releases", "Dépendances Helm, upgrades et releases"),
  up("kustomize", 3, "Kustomize and environment overlays", "Kustomize et overlays d'environnement"),
  up("gitops", 3, "GitOps with Argo CD and Flux", "GitOps avec Argo CD et Flux", 70),
  up("hpa", 3, "Horizontal Pod Autoscaling", "Horizontal Pod Autoscaling"),
  up("vertical-cluster-scaling", 3, "Vertical and cluster autoscaling", "Autoscaling vertical et du cluster", 35),
  up("pdb", 3, "PodDisruptionBudgets", "PodDisruptionBudgets", 30),
  up("ha", 3, "High availability architecture", "Architecture haute disponibilité", 55),
  up("advanced-scheduling", 3, "Advanced scheduling strategies", "Stratégies d'ordonnancement avancées"),
  up("security-hardening", 3, "Kubernetes security hardening", "Durcissement de la sécurité", 60),
  up("pod-security", 3, "Pod Security Admission", "Pod Security Admission", 35),
  up("rbac-advanced", 3, "Advanced RBAC design", "Conception RBAC avancée"),
  up("cni-internals", 3, "Networking and CNI internals", "Réseau et internes CNI", 60),
  up("observability", 3, "Prometheus, Grafana and OpenTelemetry", "Prometheus, Grafana et OpenTelemetry", 70),
  up("incidents", 3, "Troubleshooting production incidents", "Dépanner des incidents de production", 60),
  up("backup-dr", 3, "Backups and disaster recovery", "Sauvegardes et reprise après sinistre", 50),
  // Level 4
  up("api-architecture", 4, "Kubernetes API architecture in depth", "L'architecture de l'API en profondeur", 60),
  up("controllers-internals", 4, "How controllers work internally", "Le fonctionnement interne des contrôleurs", 60),
  up("crds", 4, "CustomResourceDefinitions", "CustomResourceDefinitions", 60),
  up("custom-controllers", 4, "Writing custom controllers", "Écrire des contrôleurs personnalisés", 75),
  up("operators", 4, "The Operator pattern", "Le pattern Operator", 50),
  up("kubebuilder-operator", 4, "Build an Operator with Kubebuilder", "Construire un Operator avec Kubebuilder", 120),
  up("admission-webhooks", 4, "Admission webhooks and policy", "Webhooks d'admission et politiques", 60),
  up("api-extension", 4, "API extension and conversion", "Extension d'API et conversion", 50),
  up("scheduler-internals", 4, "Scheduler architecture and custom scheduling", "Architecture du scheduler et ordonnancement personnalisé", 60),
  up("etcd", 4, "etcd architecture, consistency and recovery", "etcd : architecture, cohérence et reprise", 60),
  up("cri", 4, "Container runtime internals and CRI", "Internes du runtime et CRI", 50),
  up("cni-advanced", 4, "CNI architecture and advanced networking", "Architecture CNI et réseau avancé", 60),
  up("csi", 4, "CSI and storage architecture", "CSI et architecture du stockage", 50),
  up("control-plane-scale", 4, "Control plane performance and scalability", "Performance et scalabilité du control plane", 50),
  up("multi-cluster", 4, "Multi-cluster and fleet management", "Multi-cluster et gestion de flotte", 50),
  up("failure-scenarios", 4, "Advanced failure scenarios", "Scénarios de panne avancés", 60),
  up("platform-engineering", 4, "Platform engineering patterns", "Patterns de platform engineering", 50),
];

export const isAvailable = (c: Chapter) => !!c.blocks?.length;
export const getChapter = (id: string) => chapters.find((c) => c.id === id);
export const chaptersOf = (level: Level) => chapters.filter((c) => c.level === level);
export const availableChapters = () => chapters.filter(isAvailable);

export function neighbours(id: string) {
  const list = availableChapters();
  const i = list.findIndex((c) => c.id === id);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 ? list[i + 1] : undefined };
}
