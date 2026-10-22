import { kubebuilderOperator } from "./chapters/kubebuilder-operator";
import { operators } from "./chapters/operators";
import { customControllers } from "./chapters/custom-controllers";
import { failureScenarios } from "./chapters/failure-scenarios";
import { multiCluster } from "./chapters/multi-cluster";
import { controlPlaneScale } from "./chapters/control-plane-scale";
import { csi } from "./chapters/csi";
import { etcd } from "./chapters/etcd";
import { apiExtension } from "./chapters/api-extension";
import { admissionWebhooks } from "./chapters/admission-webhooks";
import { crds } from "./chapters/crds";
import { controllersInternals } from "./chapters/controllers-internals";
import { apiArchitecture } from "./chapters/api-architecture";
import { cniAdvanced } from "./chapters/cni-advanced";
import { cri } from "./chapters/cri";
import { schedulerInternals } from "./chapters/scheduler-internals";
import { platformEngineering } from "./chapters/platform-engineering";
import { gitops } from "./chapters/gitops";
import { kustomize } from "./chapters/kustomize";
import { helmReleases } from "./chapters/helm-releases";
import { helmCharts } from "./chapters/helm-charts";
import { incidents } from "./chapters/incidents";
import { observability } from "./chapters/observability";
import { cniInternals } from "./chapters/cni-internals";
import { advancedScheduling } from "./chapters/advanced-scheduling";
import { backupDr } from "./chapters/backup-dr";
import { rbacAdvanced } from "./chapters/rbac-advanced";
import { podSecurity } from "./chapters/pod-security";
import { securityHardening } from "./chapters/security-hardening";
import { ha } from "./chapters/ha";
import { pdb } from "./chapters/pdb";
import { verticalClusterScaling } from "./chapters/vertical-cluster-scaling";
import { hpa } from "./chapters/hpa";
import { daemonsets } from "./chapters/daemonsets";
import { statefulsets } from "./chapters/statefulsets";
import { storage } from "./chapters/storage";
import { initSidecars } from "./chapters/init-sidecars";
import { networkPolicies } from "./chapters/network-policies";
import { ingressGateway } from "./chapters/ingress-gateway";
import { dns } from "./chapters/dns";
import { jobs } from "./chapters/jobs";
import { troubleshooting2 } from "./chapters/troubleshooting-2";
import { helmBasics } from "./chapters/helm-basics";
import { scheduling } from "./chapters/scheduling";
import { rbac } from "./chapters/rbac";
import { probes } from "./chapters/probes";
import { resources } from "./chapters/resources";
import { rollbacks } from "./chapters/rollbacks";
import { rolloutStrategies } from "./chapters/rollout-strategies";
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
  rolloutStrategies,
  rollbacks,
  resources,
  probes,
  initSidecars,
  storage,
  statefulsets,
  daemonsets,
  jobs,
  dns,
  ingressGateway,
  networkPolicies,
  rbac,
  scheduling,
  helmBasics,
  troubleshooting2,
  // Level 3
  helmCharts,
  helmReleases,
  kustomize,
  gitops,
  hpa,
  verticalClusterScaling,
  pdb,
  ha,
  advancedScheduling,
  securityHardening,
  podSecurity,
  rbacAdvanced,
  cniInternals,
  observability,
  incidents,
  backupDr,
  // Level 4
  apiArchitecture,
  controllersInternals,
  crds,
  customControllers,
  operators,
  kubebuilderOperator,
  admissionWebhooks,
  apiExtension,
  schedulerInternals,
  etcd,
  cri,
  cniAdvanced,
  csi,
  controlPlaneScale,
  multiCluster,
  failureScenarios,
  platformEngineering,
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
