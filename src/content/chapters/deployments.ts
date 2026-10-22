import { foundationLab } from "../foundation-lab";
import { h, code } from "../lesson-kit";
import type { Chapter } from "../types";

export const deployments: Chapter = {
  id: "deployments",
  level: 1,
  minutes: 50,
  title: { en: "Deployments and ReplicaSets", fr: "Deployments et ReplicaSets" },
  summary: {
    en: "Run replaceable replicated Pods and understand the availability conditions of a rolling update.",
    fr: "Exécuter des Pods répliqués et remplaçables et comprendre les conditions de disponibilité d’un rolling update.",
  },
  prerequisites: ["pods", "reconciliation"],
  related: ["architecture"],
  blocks: [
    {
      type: "h2",
      id: "three-layers",
      text: { en: "Three layers of ownership", fr: "Trois niveaux de propriété" },
    },
    {
      type: "p",
      text: {
        en: "A ReplicaSet has one job: keep N Pods matching a label selector alive. A Deployment sits on top and manages ReplicaSets — one per version of your Pod template. When you change the template (for example a new image), the Deployment creates a new ReplicaSet and shifts replicas from the old to the new one step by step. You interact with the Deployment; the ReplicaSets are implementation details you can observe.",
        fr: "Un ReplicaSet a un seul travail : maintenir en vie N Pods correspondant à un sélecteur de labels. Un Deployment se place au-dessus et gère des ReplicaSets — un par version du template de Pod. Quand vous changez le template (par exemple une nouvelle image), le Deployment crée un nouveau ReplicaSet et transfère progressivement les réplicas de l'ancien vers le nouveau. Vous interagissez avec le Deployment ; les ReplicaSets sont des détails d'implémentation que vous pouvez observer.",
      },
    },
    { type: "diagram", name: "deployment-tree" },
    {
      type: "h2",
      id: "manifest",
      text: { en: "The manifest, field by field", fr: "Le manifeste, champ par champ" },
    },
    {
      type: "code",
      lang: "yaml",
      title: "web-deployment.yaml",
      code: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\n  labels:\n    app: web\nspec:\n  replicas: 3\n  revisionHistoryLimit: 5\n  selector:\n    matchLabels:\n      app: web\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1\n      maxUnavailable: 0\n  template:\n    metadata:\n      labels:\n        app: web\n    spec:\n      containers:\n        - name: web\n          image: nginx:1.26\n          ports:\n            - containerPort: 80\n          readinessProbe:\n            httpGet:\n              path: /\n              port: 80",
    },
    {
      type: "fields",
      rows: [
        {
          field: "spec.replicas",
          text: { en: "Desired number of Pods.", fr: "Nombre de Pods désiré." },
        },
        {
          field: "spec.selector.matchLabels",
          text: {
            en: "Which Pods this Deployment owns. Must match `template.metadata.labels`, and is immutable after creation.",
            fr: "Les Pods possédés par ce Deployment. Doit correspondre à `template.metadata.labels`, et n'est plus modifiable après création.",
          },
        },
        {
          field: "spec.template",
          text: {
            en: "A full Pod spec used to stamp out Pods. Any change here triggers a new rollout (a new ReplicaSet).",
            fr: "Une spec de Pod complète servant de modèle. Toute modification déclenche un nouveau déploiement (un nouveau ReplicaSet).",
          },
        },
        {
          field: "strategy.rollingUpdate.maxSurge",
          text: {
            en: "The rollout budget for extra non-terminating Pods above replicas. Terminating Pods may still consume resources.",
            fr: "Budget de Pods supplémentaires hors terminaison au-delà de replicas. Les Pods en terminaison peuvent encore consommer des ressources.",
          },
        },
        {
          field: "strategy.rollingUpdate.maxUnavailable",
          text: {
            en: "How many Pods may be unavailable during an update. 0 prevents the rollout controller from intentionally reducing available replicas below the target; independent failures remain possible.",
            fr: "Combien de Pods peuvent être indisponibles pendant une mise à jour. 0 empêche le contrôleur de réduire volontairement les réplicas disponibles sous la cible ; des pannes indépendantes restent possibles.",
          },
        },
        {
          field: "readinessProbe",
          text: {
            en: "Tells Kubernetes when a new Pod can receive traffic. The rollout only proceeds when new Pods are Ready — so a broken version stalls instead of replacing everything.",
            fr: "Indique quand un nouveau Pod peut recevoir du trafic. Le déploiement n'avance que lorsque les nouveaux Pods sont Ready — une version cassée bloque au lieu de tout remplacer.",
          },
        },
        {
          field: "revisionHistoryLimit",
          text: {
            en: "How many old ReplicaSets (scaled to 0) are kept for rollbacks.",
            fr: "Combien d'anciens ReplicaSets (à 0 réplica) sont conservés pour les rollbacks.",
          },
        },
      ],
    },
    {
      type: "callout",
      tone: "warn",
      title: { en: "The classic selector mistake", fr: "L'erreur classique du sélecteur" },
      text: {
        en: "If `selector.matchLabels` doesn't match the template labels, the API server rejects the Deployment: `selector does not match template labels`. Keep one label (like `app: web`) consistent in both places.",
        fr: "Si `selector.matchLabels` ne correspond pas aux labels du template, l'API server rejette le Deployment : `selector does not match template labels`. Gardez un label (comme `app: web`) cohérent aux deux endroits.",
      },
    },
    ...foundationLab("lab-deployments"),
    {
      type: "h2",
      id: "lab",
      text: {
        en: "Lab: self-healing, scaling and a rolling update",
        fr: "Lab : auto-réparation, mise à l'échelle et rolling update",
      },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "Create the Deployment", fr: "Créer le Deployment" },
          code: {
            lang: "bash",
            code: "k apply -f web-deployment.yaml\nk rollout status deployment/web --timeout=180s\nk get deploy,rs,pods -l app=web",
          },
          explain: {
            en: "`rollout status` blocks until all replicas are updated and available. The `get` lists the three layers at once: note the ReplicaSet name is the Deployment name plus a hash of the Pod template.",
            fr: "`rollout status` attend que tous les réplicas soient à jour et disponibles. Le `get` liste les trois niveaux d'un coup : le nom du ReplicaSet est celui du Deployment suivi d'un hash du template.",
          },
          expected: {
            text: {
              en: "1 Deployment (3/3), 1 ReplicaSet (3 ready), 3 Pods whose names start with the ReplicaSet name.",
              fr: "1 Deployment (3/3), 1 ReplicaSet (3 prêts), 3 Pods dont le nom commence par celui du ReplicaSet.",
            },
          },
        },
        {
          title: { en: "Self-healing", fr: "Auto-réparation" },
          code: {
            lang: "bash",
            code: "k delete pod -l app=web --wait=false\nk get pods -l app=web",
          },
          explain: {
            en: "Deleting all three Pods at once: the ReplicaSet immediately creates three replacements.",
            fr: "Les trois Pods sont supprimés d'un coup : le ReplicaSet crée immédiatement trois remplaçants.",
          },
          expected: {
            text: {
              en: "Old Pods Terminating, new Pods ContainerCreating then Running.",
              fr: "Anciens Pods en Terminating, nouveaux en ContainerCreating puis Running.",
            },
          },
        },
        {
          title: { en: "Scale", fr: "Mettre à l'échelle" },
          code: { lang: "bash", code: "k scale deployment web --replicas=5\nk get rs -l app=web" },
          explain: {
            en: "Scaling changes only `replicas`, not the template, so no new ReplicaSet is created — the existing one grows.",
            fr: "La mise à l'échelle ne change que `replicas`, pas le template : aucun nouveau ReplicaSet, l'existant grandit.",
          },
        },
        {
          title: { en: "Rolling update", fr: "Rolling update" },
          code: {
            lang: "bash",
            code: "k set image deployment/web web=nginx:1.27\nk rollout status deployment/web --timeout=180s\nk get rs -l app=web",
          },
          explain: {
            en: "`set image` patches the template. Watch the new ReplicaSet scale up one Pod at a time (maxSurge 1) while the old one scales down only when a new Pod is Ready (maxUnavailable 0).",
            fr: "`set image` modifie le template. Observez le nouveau ReplicaSet monter d'un Pod à la fois (maxSurge 1) pendant que l'ancien ne descend que lorsqu'un nouveau Pod est Ready (maxUnavailable 0).",
          },
          expected: {
            text: {
              en: "Two ReplicaSets: the new one at 5, the old one at 0 (kept for rollback).",
              fr: "Deux ReplicaSets : le nouveau à 5, l'ancien à 0 (conservé pour un rollback).",
            },
          },
        },
        {
          title: { en: "History and rollback", fr: "Historique et rollback" },
          code: {
            lang: "bash",
            code: "k rollout history deployment/web\nk rollout undo deployment/web\nk rollout status deployment/web --timeout=180s\nk get deploy web -o jsonpath='{.spec.template.spec.containers[0].image}{\"\\n\"}'",
          },
          explain: {
            en: "`undo` reverts the template to the previous revision; the Deployment scales the old ReplicaSet back up. It's just another rolling update.",
            fr: "`undo` remet le template de la révision précédente ; le Deployment fait remonter l'ancien ReplicaSet. C'est simplement un autre rolling update.",
          },
          expected: { text: { en: "`nginx:1.26`", fr: "`nginx:1.26`" } },
        },
      ],
    },
    {
      type: "challenge",
      title: { en: "Survive a bad release", fr: "Survivre à une mauvaise release" },
      task: {
        en: "Roll out the image `nginx:9.99-broken` (it doesn't exist). Observe how many old Pods are still serving, explain why the rollout doesn't take the app down, then recover. Finally delete the Deployment.",
        fr: "Déployez l'image `nginx:9.99-broken` (elle n'existe pas). Observez combien d'anciens Pods servent encore, expliquez pourquoi le déploiement ne casse pas l'application, puis rétablissez. Supprimez enfin le Deployment.",
      },
      hints: [
        {
          en: "`kubectl rollout status` will hang; interrupt it with Ctrl+C.",
          fr: "`kubectl rollout status` restera bloqué ; interrompez-le avec Ctrl+C.",
        },
        {
          en: "Look at READY counts on both ReplicaSets.",
          fr: "Regardez la colonne READY des deux ReplicaSets.",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "bash",
          code: "k set image deployment/web web=nginx:9.99-broken\nk get rs -l app=web        # new RS: 1 desired, 0 ready; old RS: all ready\nk get pods -l app=web      # one Pod in ImagePullBackOff\nk rollout undo deployment/web\nk rollout status deployment/web --timeout=180s\nk delete deployment web",
        },
        {
          type: "p",
          text: {
            en: "With `maxSurge: 1` and `maxUnavailable: 0`, the Deployment creates one extra new Pod and waits for it to become Ready before removing any old Pod. The new Pod never becomes Ready (it can't even pull its image), so all the old Pods keep serving and the rollout simply stalls. After `progressDeadlineSeconds` (600 s by default) the Deployment reports `ProgressDeadlineExceeded`, but it does not roll back on its own: you do, with `rollout undo`.",
            fr: "Avec `maxSurge: 1` et `maxUnavailable: 0`, le Deployment crée un nouveau Pod supplémentaire et attend qu'il soit Ready avant de retirer un ancien Pod. Le nouveau Pod ne devient jamais Ready (il ne peut même pas télécharger son image), donc tous les anciens Pods continuent de servir et le déploiement se bloque simplement. Après `progressDeadlineSeconds` (600 s par défaut), le Deployment signale `ProgressDeadlineExceeded`, mais ne revient pas en arrière seul : c'est à vous de le faire avec `rollout undo`.",
          },
        },
      ],
    },
    h("cleanup", "Finish this isolated exercise", "Terminer cet exercice isolé"),
    code("bash", "k delete namespace lab-deployments"),
  ],
};
