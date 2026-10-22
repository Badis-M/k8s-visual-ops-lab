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
import manifest from "../../../lab/level-2/rollout-strategies/web.yaml?raw";

export const rolloutStrategies: Chapter = {
  id: "rollout-strategies",
  level: 2,
  minutes: 45,
  title: l(
    "Deployment strategies: RollingUpdate & Recreate",
    "Stratégies : RollingUpdate & Recreate",
  ),
  summary: l(
    "Control how old and new Pods coexist, observe a stalled rollout, and choose a strategy according to capacity and application compatibility.",
    "Contrôler la coexistence des anciens et nouveaux Pods, observer un rollout bloqué et choisir une stratégie selon la capacité et la compatibilité applicative.",
  ),
  prerequisites: ["deployments", "services"],
  related: ["rollbacks", "probes", "pdb"],
  blocks: [
    h("objectives", "What you will be able to decide", "Ce que vous saurez décider"),
    list(
      l(
        "Compute the rollout capacity budget and explain why readiness gates progress.",
        "Calculer le budget de capacité du rollout et expliquer pourquoi la readiness conditionne sa progression.",
      ),
      l(
        "Choose RollingUpdate or Recreate without promising zero downtime from configuration alone.",
        "Choisir RollingUpdate ou Recreate sans promettre l’absence d’interruption sur la seule base de la configuration.",
      ),
    ),
    h("mental-model", "One template, several ReplicaSets", "Un template, plusieurs ReplicaSets"),
    p(
      "A Deployment reconciles a desired Pod template through ReplicaSets. Changing spec.template creates a new revision; scaling replicas alone does not. RollingUpdate gradually scales the new ReplicaSet up and the old one down. The Service selects ready endpoints, not Deployment revisions. During an update both application versions can receive traffic: backward-compatible API and database changes remain your responsibility.",
      "Un Deployment réconcilie un template de Pod via des ReplicaSets. Modifier spec.template crée une nouvelle révision ; changer uniquement le nombre de réplicas ne le fait pas. RollingUpdate augmente progressivement le nouveau ReplicaSet et réduit l’ancien. Le Service sélectionne des endpoints prêts, pas des révisions de Deployment. Les deux versions peuvent recevoir du trafic : la compatibilité des API et migrations de données reste votre responsabilité.",
    ),
    p(
      "For three desired replicas, maxSurge: 1 allows one extra non-terminating Pod and maxUnavailable: 0 asks the controller to retain three available replicas during its rollout. Terminating Pods may temporarily consume additional resources. With percentages, surge rounds up and unavailable rounds down. The two budgets cannot both be zero.",
      "Pour trois réplicas désirés, maxSurge: 1 autorise un Pod supplémentaire non terminé et maxUnavailable: 0 demande au contrôleur de conserver trois réplicas disponibles pendant son rollout. Des Pods en cours de terminaison peuvent temporairement consommer davantage de ressources. Pour les pourcentages, surge est arrondi au supérieur et unavailable à l’inférieur. Les deux budgets ne peuvent pas être simultanément nuls.",
    ),
    note(
      "warn",
      l("Availability is conditional", "La disponibilité est conditionnelle"),
      l(
        "Readiness must reflect real service capability, surge needs schedulable capacity, and shutdown must drain existing connections. These fields do not protect against node loss, an invalid Service selector or incompatible versions.",
        "La readiness doit refléter la capacité réelle à servir, surge nécessite des ressources disponibles et l’arrêt doit terminer les connexions existantes. Ces champs ne protègent ni d’une perte de nœud, ni d’un mauvais sélecteur de Service, ni de versions incompatibles.",
      ),
    ),
    ...labContext("lab-rollout"),
    h("manifest", "Inspect the rollout contract", "Examiner le contrat du rollout"),
    code("yaml", manifest, "lab/level-2/rollout-strategies/web.yaml"),
    p(
      "minReadySeconds requires five continuous ready seconds before a Pod counts as available. progressDeadlineSeconds reports a ProgressDeadlineExceeded condition after a stalled progression; it does not automatically roll back the Deployment. A readiness failure removes an endpoint but does not restart the container. Image tags here are fixed exercise inputs, not a production patch policy.",
      "minReadySeconds impose cinq secondes continues à l’état prêt avant de compter un Pod comme disponible. progressDeadlineSeconds signale la condition ProgressDeadlineExceeded si la progression reste bloquée ; il ne déclenche pas de rollback automatique. Un échec de readiness retire un endpoint mais ne redémarre pas le conteneur. Les tags d’image sont des entrées fixes d’exercice, pas une politique de mises à jour de production.",
    ),
    h("exercise", "Observe a controlled update", "Observer une mise à jour contrôlée"),
    steps(
      {
        title: l("Create the initial revision", "Créer la révision initiale"),
        code: {
          lang: "bash",
          code: "k -n lab-rollout apply -f lab/level-2/rollout-strategies/web.yaml\nk -n lab-rollout rollout status deployment/web --timeout=120s",
        },
        explain: l(
          "Wait until three replicas become available before starting the experiment.",
          "Attendez trois réplicas disponibles avant de commencer l’expérience.",
        ),
        expected: {
          text: l(
            "Expected: the rollout completes; inspect actual values rather than relying on Pod names.",
            "Attendu : le rollout se termine ; examinez les valeurs réelles sans dépendre des noms de Pods.",
          ),
        },
      },
      {
        title: l("Watch a template change", "Observer une modification du template"),
        code: {
          lang: "bash",
          code: "k -n lab-rollout set env deployment/web RELEASE=two\nk -n lab-rollout get replicasets,pods -l app=rollout-web\nk -n lab-rollout rollout status deployment/web --timeout=120s\nk -n lab-rollout describe deployment web",
        },
        explain: l(
          "RELEASE changes the template without changing nginx behavior. For live transitions run get pods --watch in a second terminal with the same explicit context. Observe old and new ReplicaSets, their desired counts, and Available conditions.",
          "RELEASE change le template sans changer le comportement de nginx. Pour suivre les transitions, lancez get pods --watch dans un second terminal avec le même contexte explicite. Observez anciens et nouveaux ReplicaSets, leurs effectifs désirés et les conditions Available.",
        ),
      },
    ),
    h("failure", "Make progress stop safely", "Bloquer volontairement la progression"),
    code(
      "bash",
      "k -n lab-rollout set image deployment/web web=nginx:missing-lab-tag\nk -n lab-rollout rollout status deployment/web --timeout=30s\nk -n lab-rollout get pods\nk -n lab-rollout describe deployment web\nk -n lab-rollout get events --sort-by=.metadata.creationTimestamp",
    ),
    p(
      "The deliberately missing image makes the new Pod fail to start. The 30-second CLI timeout is not the controller's 120-second deadline. Old available replicas should be retained by the update budget. Inspect Events to distinguish image lookup failures from an unschedulable surge Pod. Recover with rollout undo, then wait for completion. A bad version that passes readiness can still cause user errors; rollout budgets cannot detect business correctness.",
      "L’image volontairement absente empêche le nouveau Pod de démarrer. Le délai CLI de 30 secondes n’est pas le délai de 120 secondes du contrôleur. Les anciens réplicas disponibles doivent être conservés par le budget. Les Events distinguent une erreur d’image d’un Pod surge impossible à ordonnancer. Récupérez avec rollout undo puis attendez la fin. Une mauvaise version qui passe la readiness peut encore produire des erreurs : les budgets ne vérifient pas la justesse métier.",
    ),
    code(
      "bash",
      "k -n lab-rollout rollout undo deployment/web\nk -n lab-rollout rollout status deployment/web --timeout=120s",
    ),
    h("recreate", "When Recreate is the deliberate choice", "Quand Recreate est un choix assumé"),
    p(
      "Recreate scales down the old revision before creating the new one during a template update. Use it for a planned interruption when versions must not coexist, not as a distributed lock or a database migration system. It does not guarantee exclusive execution across manual Pod deletion and unrelated controllers. Remove rollingUpdate when changing strategy type, or the API rejects the incompatible fields.",
      "Recreate réduit l’ancienne révision avant de créer la nouvelle lors d’une modification du template. Utilisez-le pour une interruption planifiée si les versions ne doivent pas coexister, pas comme verrou distribué ni outil de migration de base de données. Il ne garantit pas une exécution exclusive lors de suppressions manuelles ou face à d’autres contrôleurs. Retirez rollingUpdate en changeant de type, sinon l’API rejette ces champs incompatibles.",
    ),
    code(
      "bash",
      `k -n lab-rollout patch deployment web --type=merge -p '{"spec":{"strategy":{"type":"Recreate","rollingUpdate":null}}}'\nk -n lab-rollout set env deployment/web RELEASE=three\nk -n lab-rollout rollout status deployment/web --timeout=120s`,
    ),
    h("quiz", "Check your reasoning", "Vérifier votre raisonnement"),
    quiz(
      question(
        l(
          "Three replicas and maxSurge: 25% allow how many additional non-terminating Pods?",
          "Trois réplicas et maxSurge: 25% autorisent combien de Pods supplémentaires non terminés ?",
        ),
        [l("Zero", "Zéro"), l("One", "Un"), l("Three", "Trois")],
        1,
        l(
          "25% of three is 0.75; surge rounds up to one.",
          "25 % de trois valent 0,75 ; surge est arrondi au supérieur, soit un.",
        ),
      ),
      question(
        l(
          "Does ProgressDeadlineExceeded undo the release?",
          "ProgressDeadlineExceeded annule-t-il la livraison ?",
        ),
        [
          l("Yes, always", "Oui, toujours"),
          l("Only for Recreate", "Seulement pour Recreate"),
          l("No; remediation is separate", "Non ; la remédiation est distincte"),
        ],
        2,
        l(
          "The controller reports stalled progress; an operator or delivery system decides recovery.",
          "Le contrôleur signale le blocage ; l’opérateur ou le système de livraison décide de la récupération.",
        ),
      ),
      question(
        l(
          "Why can two Ready versions still break requests?",
          "Pourquoi deux versions Ready peuvent-elles encore casser les requêtes ?",
        ),
        [
          l(
            "They may be incompatible at the API or data layer",
            "Elles peuvent être incompatibles côté API ou données",
          ),
          l(
            "Services select exactly one ReplicaSet",
            "Un Service sélectionne exactement un ReplicaSet",
          ),
          l(
            "Readiness forces schema compatibility",
            "La readiness impose la compatibilité des schémas",
          ),
        ],
        0,
        l(
          "Probes measure a declared signal, not every business contract.",
          "Les probes mesurent un signal déclaré, pas tous les contrats métier.",
        ),
      ),
    ),
    h(
      "challenge",
      "Choose a budget under a capacity constraint",
      "Choisir un budget sous contrainte de capacité",
    ),
    challenge(
      l("No room for a fourth Pod", "Pas de place pour un quatrième Pod"),
      l(
        "Return to RollingUpdate. You have capacity for only three Pods and accept losing one available replica during updates. Configure the strategy and explain the compromise, then trigger a new revision.",
        "Revenez à RollingUpdate. Vous avez une capacité de trois Pods seulement et acceptez de perdre un réplica disponible pendant les mises à jour. Configurez la stratégie, expliquez le compromis puis déclenchez une révision.",
      ),
      [
        l("Surge is an extra-capacity budget.", "Surge est un budget de capacité supplémentaire."),
        l("At least one budget must be nonzero.", "Au moins un budget doit être non nul."),
      ],
      [
        code(
          "bash",
          `k -n lab-rollout patch deployment web --type=merge -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxSurge":0,"maxUnavailable":1}}}}'\nk -n lab-rollout set env deployment/web RELEASE=four\nk -n lab-rollout rollout status deployment/web --timeout=120s`,
        ),
        p(
          "The controller can remove one old replica before starting a replacement, keeping at least two available under normal rollout conditions. This trades capacity for temporary redundancy loss; it is not a guarantee against simultaneous failures.",
          "Le contrôleur peut retirer un ancien réplica avant de démarrer son remplaçant, avec au moins deux disponibles dans les conditions normales du rollout. Ce choix économise de la capacité contre une baisse temporaire de redondance ; il ne garantit rien face à des pannes simultanées.",
        ),
      ],
    ),
    h("cleanup", "Cleanup", "Nettoyage"),
    code("bash", "k delete namespace lab-rollout"),
  ],
};
