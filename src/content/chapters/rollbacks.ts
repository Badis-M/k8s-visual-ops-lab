import type { Chapter, Block } from "../types";
import { labContext } from "../lesson-kit";
import manifest from "../../../lab/level-2/rollbacks/web.yaml?raw";

export const rollbacks: Chapter = {
  id: "rollbacks",
  level: 2,
  minutes: 30,
  title: {
    en: "Rollbacks and revision history",
    fr: "Rollbacks et historique des révisions",
  },
  summary: {
    en: "Recover a failed Deployment deliberately: identify a known revision, understand what undo restores, and reconcile the declarative source afterwards.",
    fr: "Récupérer un Deployment en échec : identifier une révision connue, comprendre ce que restaure undo puis réconcilier la source déclarative.",
  },
  prerequisites: ["rollout-strategies"],
  related: ["gitops", "helm-releases"],
  blocks: [
    ...([
      {
        type: "h2",
        id: "objectives",
        text: {
          en: "Recovery is a decision, not a time machine",
          fr: "La récupération est une décision, pas un voyage dans le temps",
        },
      },
      {
        type: "p",
        text: {
          en: "You will inspect revision history, create a controlled bad release, recover to a selected revision, and explain why undo cannot restore external data. Start from the rollout-strategies chapter: readiness and sufficient capacity are prerequisites for a safe recovery, not optional decorations.",
          fr: "Vous examinerez les révisions, créerez une mauvaise livraison contrôlée, reviendrez à une révision choisie et expliquerez pourquoi undo ne restaure pas les données externes. Partez du chapitre rollout-strategies : readiness et capacité suffisante sont des prérequis à une récupération sûre.",
        },
      },
      {
        type: "h2",
        id: "model",
        text: {
          en: "A revision stores a Pod template",
          fr: "Une révision conserve un template de Pod",
        },
      },
      {
        type: "p",
        text: {
          en: "A Deployment revision corresponds to a change in spec.template, represented by a ReplicaSet. Scaling replicas or changing the rollout strategy does not itself create a new Pod-template revision. The revision number is scoped to that Deployment; do not copy a number from another cluster or from a screenshot. revisionHistoryLimit bounds retained old ReplicaSets after cleanup, and deleting them removes rollback candidates.",
          fr: "Une révision de Deployment correspond à une modification de spec.template, représentée par un ReplicaSet. Modifier le nombre de réplicas ou la stratégie ne crée pas en soi une révision de template. Le numéro est propre au Deployment : ne le recopiez pas depuis un autre cluster ou une capture. revisionHistoryLimit limite les anciens ReplicaSets conservés après nettoyage ; leur suppression retire les possibilités de retour.",
        },
      },
    ] satisfies Block[]),
    ...labContext("lab-rollback"),
    ...([
      {
        type: "code",
        lang: "yaml",
        code: manifest,
        title: "lab/level-2/rollbacks/web.yaml",
      },
      {
        type: "h2",
        id: "create",
        text: {
          en: "Create and identify the known-good state",
          fr: "Créer et identifier l’état connu comme fonctionnel",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'k -n lab-rollback apply -f lab/level-2/rollbacks/web.yaml\nk -n lab-rollback rollout status deployment/web --timeout=120s\nk -n lab-rollback annotate deployment web --overwrite kubernetes.io/change-cause="baseline"\nk -n lab-rollback rollout history deployment/web\nk -n lab-rollback get deployment web -o jsonpath=\'{.metadata.annotations.deployment\\.kubernetes\\.io/revision}{"\\n"}\'',
      },
      {
        type: "p",
        text: {
          en: "Record the actual baseline revision. The change-cause annotation is human context, not proof a version passed tests. --overwrite permits replacing its previous value; it does not change the Pod template. Inspect the Pod template before calling a revision known-good: image, environment and probe fields all matter. Mutable image tags and externally referenced ConfigMaps can make a repeated template behave differently later.",
          fr: "Notez la révision réelle de référence. L’annotation change-cause fournit du contexte humain, pas une preuve de tests. --overwrite autorise le remplacement de sa valeur précédente sans modifier le template de Pod. Examinez image, environnement et probes avant de qualifier une révision de fonctionnelle. Les tags mutables et ConfigMaps externes peuvent faire varier le comportement d’un même template.",
        },
      },
      {
        type: "h2",
        id: "break",
        text: {
          en: "Introduce a reversible failure",
          fr: "Introduire une panne réversible",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: 'k -n lab-rollback set image deployment/web web=nginx:missing-lab-tag\nk -n lab-rollback annotate deployment web --overwrite kubernetes.io/change-cause="deliberate missing image"\nk -n lab-rollback rollout status deployment/web --timeout=30s\nk -n lab-rollback get pods\nk -n lab-rollback rollout history deployment/web',
      },
      {
        type: "p",
        text: {
          en: "The status command is expected to time out; this is a deliberate exercise failure, not a reason to ignore subsequent diagnostics. An ImagePullBackOff event points to image resolution or credentials; a Pending surge Pod may instead lack node resources. Inspect the failing Pod with describe. Do not undo a healthy rollout merely because it is slower than expected: first establish the failure mechanism.",
          fr: "La commande de statut doit atteindre son délai : c’est une panne d’exercice volontaire, pas une raison d’ignorer le diagnostic. ImagePullBackOff signale une résolution d’image ou des credentials ; un Pod surge Pending peut manquer de ressources. Examinez le Pod avec describe. N’annulez pas un rollout sain parce qu’il est lent : établissez d’abord la cause.",
        },
      },
      {
        type: "h2",
        id: "recover",
        text: {
          en: "Choose the revision explicitly",
          fr: "Choisir explicitement la révision",
        },
      },
      {
        type: "code",
        lang: "bash",
        code: "k -n lab-rollback rollout history deployment/web --revision=1\n# Replace 1 with your recorded known-good revision.\nk -n lab-rollback rollout undo deployment/web --to-revision=1\nk -n lab-rollback rollout status deployment/web --timeout=120s\nk -n lab-rollback get deployment web -o jsonpath='{.spec.template.spec.containers[0].image}{\"\\n\"}'\nk -n lab-rollback rollout history deployment/web",
      },
      {
        type: "p",
        text: {
          en: "For a fresh isolated Deployment the baseline is normally revision 1; verify yours before running undo. Undo without --to-revision selects the previous retained revision, which may not be the one you want after several failures. A rollback creates another reconciliation of the old template and advances history; it does not rewind the cluster. Check available replicas and an application request, not only the CLI success message.",
          fr: "Pour un Deployment neuf et isolé, la référence est normalement la révision 1 ; vérifiez avant undo. Sans --to-revision, undo choisit la révision précédente conservée, parfois différente de celle souhaitée après plusieurs échecs. Le retour réconcilie un ancien template et fait avancer l’historique ; il ne rembobine pas le cluster. Vérifiez les réplicas disponibles et une requête applicative, pas seulement le succès CLI.",
        },
      },
      {
        type: "h2",
        id: "limits",
        text: {
          en: "What is outside the revision",
          fr: "Ce qui reste hors de la révision",
        },
      },
      {
        type: "p",
        text: {
          en: "Undo restores neither database contents nor Service selectors, RBAC policies, Secrets or ConfigMap objects referenced by name. A destructive schema migration may prevent the previous binary from working. Prefer expand/contract schema changes and separately tested data recovery. In a GitOps-managed namespace, the reconciler can immediately reapply the bad desired version: revert or correct the authoritative Git source as part of recovery.",
          fr: "Undo ne restaure ni données de base, ni sélecteurs de Service, ni RBAC, ni objets Secrets ou ConfigMaps référencés par leur nom. Une migration destructive peut empêcher l’ancien binaire de fonctionner. Préférez les migrations expand/contract et une restauration des données testée séparément. Sous GitOps, le reconciler peut réappliquer immédiatement la mauvaise version : corrigez aussi la source Git autoritative.",
        },
      },
      {
        type: "h2",
        id: "quiz",
        text: {
          en: "Reason about recovery",
          fr: "Raisonner sur la récupération",
        },
      },
      {
        type: "quiz",
        questions: [
          {
            question: {
              en: "What creates a revision?",
              fr: "Qu’est-ce qui crée une révision ?",
            },
            options: [
              {
                en: "Changing replicas only",
                fr: "Changer seulement replicas",
              },
              {
                en: "Changing the Pod template",
                fr: "Changer le template de Pod",
              },
              {
                en: "Reading Events",
                fr: "Lire les Events",
              },
            ],
            correct: 1,
            explanation: {
              en: "A template change creates a new desired application version.",
              fr: "Une modification du template crée une nouvelle version désirée.",
            },
          },
          {
            question: {
              en: "Does undo restore a named ConfigMap?",
              fr: "Undo restaure-t-il un ConfigMap nommé ?",
            },
            options: [
              {
                en: "Yes",
                fr: "Oui",
              },
              {
                en: "Only if it has labels",
                fr: "Seulement s’il a des labels",
              },
              {
                en: "No",
                fr: "Non",
              },
            ],
            correct: 2,
            explanation: {
              en: "The template contains a reference, not a snapshot of the object.",
              fr: "Le template contient une référence, pas une copie de l’objet.",
            },
          },
          {
            question: {
              en: "Why correct Git after an emergency undo?",
              fr: "Pourquoi corriger Git après un undo d’urgence ?",
            },
            options: [
              {
                en: "The reconciler may reapply its desired version",
                fr: "Le reconciler peut réappliquer sa version désirée",
              },
              {
                en: "Git stores the cluster database",
                fr: "Git stocke la base du cluster",
              },
              {
                en: "Undo deletes Git history",
                fr: "Undo efface l’historique Git",
              },
            ],
            correct: 0,
            explanation: {
              en: "An imperative rollback does not change declarative authority.",
              fr: "Un retour impératif ne modifie pas la source déclarative.",
            },
          },
        ],
      },
      {
        type: "challenge",
        title: {
          en: "Design a recovery checklist",
          fr: "Construire une checklist de récupération",
        },
        task: {
          en: "Before running another bad rollout, record evidence that lets a teammate recover the intended version without guessing a revision.",
          fr: "Avant un autre mauvais rollout, relevez les preuves permettant à un collègue de retrouver la version voulue sans deviner la révision.",
        },
        hints: [
          {
            en: "Capture both history and the template.",
            fr: "Capturez historique et template.",
          },
          {
            en: "Separate application recovery from data recovery.",
            fr: "Distinguez récupération applicative et restauration des données.",
          },
        ],
        solution: [
          {
            type: "code",
            lang: "bash",
            code: "k -n lab-rollback rollout history deployment/web\nk -n lab-rollback get deployment web -o yaml\nk -n lab-rollback get replicasets -l app=rollout-web\nk -n lab-rollback get events --sort-by=.metadata.creationTimestamp",
          },
          {
            type: "p",
            text: {
              en: "Record the image digest when available, revision, configuration references, symptoms and decision time. Select a retained revision, wait for availability, verify the application, then correct the source manifest. Escalate to a data recovery procedure if the schema is incompatible.",
              fr: "Consignez digest si disponible, révision, références de configuration, symptômes et heure de décision. Choisissez une révision conservée, attendez sa disponibilité, vérifiez l’application puis corrigez le manifeste source. Utilisez une procédure distincte de récupération si le schéma est incompatible.",
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
        code: "k delete namespace lab-rollback",
      },
    ] satisfies Block[]),
  ],
};
