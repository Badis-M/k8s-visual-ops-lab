import { foundationLab } from "../foundation-lab";
import { h, code } from "../lesson-kit";
import type { Chapter } from "../types";

export const reconciliation: Chapter = {
  id: "reconciliation",
  level: 1,
  minutes: 30,
  title: {
    en: "Declarative state and reconciliation loops",
    fr: "État déclaratif et boucles de réconciliation",
  },
  summary: {
    en: "The single idea behind all of Kubernetes: describe what you want, and controllers continuously converge reality toward it.",
    fr: "L'idée unique derrière tout Kubernetes : décrire ce que l'on veut, et des contrôleurs font converger la réalité en continu.",
  },
  prerequisites: ["architecture"],
  related: ["deployments", "pods"],
  blocks: [
    {
      type: "h2",
      id: "imperative-vs-declarative",
      text: { en: "Imperative vs declarative", fr: "Impératif vs déclaratif" },
    },
    {
      type: "p",
      text: {
        en: "An imperative instruction says how: “start a container, then start another one”. If the second command fails, or a container dies later, the instructions are already finished — nobody re-runs them. A declarative specification says what: “there should be 2 replicas”. It stays true over time, and something is responsible for keeping it true.",
        fr: "Une instruction impérative dit comment : « démarre un conteneur, puis un autre ». Si la deuxième commande échoue, ou qu'un conteneur meurt plus tard, les instructions sont déjà terminées — personne ne les relance. Une spécification déclarative dit quoi : « il doit y avoir 2 réplicas ». Elle reste vraie dans le temps, et quelque chose est chargé de la maintenir vraie.",
      },
    },
    {
      type: "p",
      text: {
        en: "Almost every Kubernetes object has two parts: `spec` — the desired state you write — and `status` — the observed state that controllers and kubelets write. Your job is to edit `spec`. The system's job is to make `status` match it.",
        fr: "Presque chaque objet Kubernetes a deux parties : `spec` — l'état désiré que vous écrivez — et `status` — l'état observé écrit par les contrôleurs et les kubelets. Votre travail est de modifier `spec`. Celui du système est de faire correspondre `status`.",
      },
    },
    {
      type: "h2",
      id: "the-loop",
      text: { en: "Anatomy of a control loop", fr: "Anatomie d'une boucle de contrôle" },
    },
    {
      type: "p",
      text: {
        en: "A controller repeats three steps forever: observe the current state (via watches on the API server), diff it against the desired state, and act to reduce the difference (create, update or delete objects). It then goes back to observing. Crucially, controllers are level-triggered: they react to the current state, not to a single event. If a notification is missed or the controller restarts, the next pass still sees the difference and fixes it.",
        fr: "Un contrôleur répète trois étapes indéfiniment : observer l'état courant (via des watches sur l'API server), le comparer à l'état désiré, et agir pour réduire l'écart (créer, modifier ou supprimer des objets). Puis il recommence à observer. Point essentiel : les contrôleurs sont « level-triggered » : ils réagissent à l'état courant, pas à un événement isolé. Si une notification est manquée ou si le contrôleur redémarre, le passage suivant voit toujours l'écart et le corrige.",
      },
    },
    { type: "diagram", name: "reconcile" },
    {
      type: "callout",
      tone: "tip",
      title: { en: "Try it", fr: "Essayez" },
      text: {
        en: "Change the desired replicas, or delete a Pod, and watch the ReplicaSet controller converge. This simulation follows the same logic as the real controller: count matching Pods, then create or delete the difference.",
        fr: "Changez le nombre de réplicas désiré, ou supprimez un Pod, et observez le contrôleur ReplicaSet converger. Cette simulation suit la même logique que le vrai contrôleur : compter les Pods correspondants puis créer ou supprimer la différence.",
      },
    },
    {
      type: "h2",
      id: "idempotence",
      text: { en: "Why kubectl apply is idempotent", fr: "Pourquoi kubectl apply est idempotent" },
    },
    {
      type: "p",
      text: {
        en: "Because you send a description rather than an action, applying the same file ten times produces the same result: the first apply creates the object, the next ones find nothing to change (`unchanged`). That property is what makes storing manifests in Git — and later GitOps — work.",
        fr: "Comme vous envoyez une description plutôt qu'une action, appliquer le même fichier dix fois donne le même résultat : le premier apply crée l'objet, les suivants n'ont rien à changer (`unchanged`). Cette propriété est ce qui permet de stocker les manifestes dans Git — et plus tard de faire du GitOps.",
      },
    },
    ...foundationLab("lab-reconciliation"),
    {
      type: "h2",
      id: "lab",
      text: {
        en: "Lab: fight the controller (and lose)",
        fr: "Lab : combattre le contrôleur (et perdre)",
      },
    },
    {
      type: "steps",
      steps: [
        {
          title: { en: "Declare 3 replicas", fr: "Déclarer 3 réplicas" },
          code: {
            lang: "bash",
            code: "k create deployment reconcile-demo --image=nginx:1.27 --replicas=3\nk get pods -l app=reconcile-demo",
          },
          explain: {
            en: "`kubectl create deployment` generates a Deployment whose Pods carry the label `app=reconcile-demo`; `-l` filters on that label.",
            fr: "`kubectl create deployment` génère un Deployment dont les Pods portent le label `app=reconcile-demo` ; `-l` filtre sur ce label.",
          },
          expected: {
            text: {
              en: "3 Pods, all Running after a few seconds.",
              fr: "3 Pods, tous Running après quelques secondes.",
            },
          },
        },
        {
          title: { en: "Delete a Pod by hand", fr: "Supprimer un Pod à la main" },
          code: {
            lang: "bash",
            code: "k get pods -l app=reconcile-demo\nk delete pod $(k get pods -l app=reconcile-demo -o jsonpath='{.items[0].metadata.name}')",
          },
          explain: {
            en: "The jsonpath expression extracts one Pod name. Compare the list before and after deletion; repeat get if reconciliation has not completed yet.",
            fr: "L’expression jsonpath extrait un nom de Pod. Comparez la liste avant et après suppression ; répétez get si la réconciliation n’est pas encore terminée.",
          },
          expected: {
            text: {
              en: "The deleted Pod goes Terminating, and a new Pod with a different random suffix appears almost immediately.",
              fr: "Le Pod supprimé passe en Terminating, et un nouveau Pod avec un suffixe aléatoire différent apparaît presque immédiatement.",
            },
          },
          mistake: {
            en: "Concluding that Pods “restart”. They don't: the old Pod is gone and the ReplicaSet created a new one with a new UID and usually a new name; its IP may be reused.",
            fr: "Conclure que les Pods « redémarrent ». Non : l'ancien Pod a disparu et le ReplicaSet en a créé un nouveau, avec un nouvel UID et généralement un nouveau nom ; son IP peut être réutilisée.",
          },
        },
        {
          title: { en: "Change the desired state", fr: "Changer l'état désiré" },
          code: {
            lang: "bash",
            code: "k scale deployment reconcile-demo --replicas=1\nk get deployment reconcile-demo -o jsonpath='{.spec.replicas} desired / {.status.readyReplicas} ready{\"\\n\"}'",
          },
          explain: {
            en: "`scale` edits `spec.replicas`. The jsonpath prints spec vs status side by side so you can see convergence.",
            fr: "`scale` modifie `spec.replicas`. Le jsonpath affiche spec et status côte à côte pour voir la convergence.",
          },
          expected: {
            text: {
              en: "After a moment: `1 desired / 1 ready`.",
              fr: "Après un instant : `1 desired / 1 ready`.",
            },
          },
        },
        {
          title: { en: "Clean up", fr: "Nettoyer" },
          code: { lang: "bash", code: "k delete deployment reconcile-demo" },
          explain: {
            en: "Removes only the exercise Deployment.",
            fr: "Supprime seulement le Deployment de l’exercice.",
          },
        },
      ],
    },
    {
      type: "challenge",
      title: { en: "Who wins: you or the ReplicaSet?", fr: "Qui gagne : vous ou le ReplicaSet ?" },
      task: {
        en: "With a Deployment of 2 replicas running, try to scale its ReplicaSet (not the Deployment) to 5 with `kubectl scale rs …`. Predict what happens, verify, and explain using the notion of owner and desired state.",
        fr: "Avec un Deployment de 2 réplicas, essayez de mettre son ReplicaSet (pas le Deployment) à 5 avec `kubectl scale rs …`. Prédisez, vérifiez, et expliquez avec les notions de propriétaire et d'état désiré.",
      },
      hints: [
        {
          en: "Find the ReplicaSet with `kubectl get rs -l app=<name>`.",
          fr: "Trouvez le ReplicaSet avec `kubectl get rs -l app=<nom>`.",
        },
        {
          en: "Look at `metadata.ownerReferences` on the ReplicaSet.",
          fr: "Regardez `metadata.ownerReferences` sur le ReplicaSet.",
        },
      ],
      solution: [
        {
          type: "code",
          lang: "bash",
          code: "k create deployment owner-demo --image=nginx:1.27 --replicas=2\nk rollout status deployment/owner-demo --timeout=120s\nRS=$(k get rs -l app=owner-demo -o jsonpath='{.items[0].metadata.name}')\nk scale rs $RS --replicas=5\nsleep 5\nk get rs \"$RS\"   # should converge back to 2\nk get rs $RS -o jsonpath='{.metadata.ownerReferences[0].kind}'  # Deployment\nk delete deployment owner-demo",
        },
        {
          type: "p",
          text: {
            en: "The ReplicaSet may briefly create extra Pods, but the Deployment controller owns it and its desired state still says 2. On its next reconcile it rewrites the ReplicaSet's `spec.replicas` to 2 and the extra Pods are deleted. Rule of thumb: always change the highest-level owner; editing children managed by a controller is overwritten.",
            fr: "Le ReplicaSet peut brièvement créer des Pods supplémentaires, mais le contrôleur Deployment en est propriétaire et son état désiré dit toujours 2. À la réconciliation suivante, il remet `spec.replicas` du ReplicaSet à 2 et les Pods en trop sont supprimés. Règle : modifiez toujours le propriétaire de plus haut niveau ; modifier des enfants gérés par un contrôleur est écrasé.",
          },
        },
      ],
    },
    h("cleanup", "Finish this isolated exercise", "Terminer cet exercice isolé"),
    code("bash", "k delete namespace lab-reconciliation"),
  ],
};
