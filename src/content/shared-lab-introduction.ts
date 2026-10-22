import type { Block } from "./types";

export const sharedLabIntroduction: Block[] = [
  {
    type: "callout",
    tone: "warn",
    title: {
      en: "Lab verification pending",
      fr: "Vérification du lab en attente",
    },
    text: {
      en: "Content integrated. This Kubernetes lab has not been executed or verified on a cluster. Completion is self-reported.",
      fr: "Contenu intégré. Ce lab Kubernetes n’a pas été exécuté ni vérifié sur un cluster. La progression est déclarée par vous-même.",
    },
  },
  {
    type: "h2",
    id: "working-environment",
    text: {
      en: "Working environment",
      fr: "Environnement de travail",
    },
  },
  {
    type: "p",
    text: {
      en: "These exercises use only your local, disposable kind cluster. Complete the environment setup first and have Docker, kind and kubectl available.",
      fr: "Ces exercices utilisent exclusivement votre cluster kind local et jetable. Vous devez avoir terminé la préparation de l’environnement et disposer de Docker, kind et kubectl.",
    },
  },
  {
    type: "p",
    text: {
      en: "Use Bash or Zsh on Linux/macOS, or Bash in Ubuntu on WSL2. These commands are not written for PowerShell.",
      fr: "Utilisez Bash ou Zsh sous Linux/macOS, ou Bash dans Ubuntu sous WSL2. Les commandes de ce chapitre ne sont pas prévues pour PowerShell.",
    },
  },
  {
    type: "p",
    text: {
      en: "Images are downloaded from public registries: Internet connectivity and disk space are required. Tags select a version but do not provide digest-level immutability.",
      fr: "Les images sont téléchargées depuis des registres publics : une connexion Internet et de l’espace disque sont nécessaires. Les tags fixent une version, mais ne garantissent pas l’immuabilité d’un digest.",
    },
  },
  {
    type: "p",
    text: {
      en: "First identify the cluster. `kind get clusters` lists kind cluster names; their contexts usually have a `kind-` prefix. Compare both lists. If you cannot identify your local cluster, stop here.",
      fr: "Commencez par identifier le cluster. `kind get clusters` affiche les noms des clusters kind ; leurs contextes portent généralement le préfixe `kind-`. Comparez les deux listes. Si vous ne pouvez pas identifier votre cluster local, arrêtez-vous ici.",
    },
  },
  {
    type: "code",
    lang: "bash",
    code: "kind get clusters\nkubectl config get-contexts",
  },
  {
    type: "h2",
    id: "choose-context",
    text: {
      en: "Explicitly choose the context",
      fr: "Choisir explicitement le contexte",
    },
  },
  {
    type: "p",
    text: {
      en: "Run the following block, then enter the exact local kind context identified above. `read` waits for your input.",
      fr: "Exécutez le bloc suivant, puis saisissez le nom exact du contexte kind local identifié précédemment. `read` attend votre saisie.",
    },
  },
  {
    type: "p",
    text: {
      en: "The `k` function is a shortcut defined for this lab: it always calls kubectl with that explicit context. It does not change your current context. The variable and function exist only in this terminal session.",
      fr: "La fonction `k` est un raccourci défini pour ce lab : elle appelle toujours kubectl avec ce contexte explicite. Elle ne modifie pas votre contexte courant. La variable et la fonction existent uniquement dans cette session du terminal.",
    },
  },
  {
    type: "p",
    text: {
      en: "Verify that the displayed nodes belong to your kind cluster. Repeat this preparation in any new terminal used for the exercises.",
      fr: "Vérifiez que les nœuds affichés appartiennent bien à votre cluster kind. Réexécutez cette préparation dans tout nouveau terminal utilisé pour les exercices.",
    },
  },
  {
    type: "code",
    lang: "bash",
    code: 'printf \'Enter your local kind context: \'\nIFS= read -r K8S_CONTEXT\nexport K8S_CONTEXT\n\nfunction k() {\n  case "$K8S_CONTEXT" in\n    kind-?*) kubectl --context "$K8S_CONTEXT" "$@" ;;\n    *) printf \'Select a nonempty local kind context first.\\n\' >&2; return 1 ;;\n  esac\n}\n\nk get nodes',
  },
  {
    type: "h2",
    id: "shared-rules",
    text: {
      en: "Shared rules",
      fr: "Règles communes",
    },
  },
  {
    type: "p",
    text: {
      en: "Each chapter uses a separate namespace. Before creating it, check that it does not exist using the supplied command. A `NotFound` message is expected; resolve other errors. If the namespace already exists, do not continue creating resources until you verify that it belongs to your previous lab and contains nothing you need to preserve.",
      fr: "Chaque chapitre utilise un namespace distinct. Avant de le créer, vérifiez son absence avec la commande fournie. Un message `NotFound` est attendu ; les autres erreurs doivent être résolues. Si le namespace existe déjà, ne poursuivez pas la création sans vérifier qu’il s’agit de votre ancien lab et qu’il ne contient rien à conserver.",
    },
  },
  {
    type: "p",
    text: {
      en: "Shown outputs are examples or success criteria: IP addresses, dates, generated names and timing vary. A timeout is not a successful result; inspect events and errors.",
      fr: "Les sorties montrées sont des exemples ou des critères de réussite : adresses IP, dates, noms générés et délais varient. Un délai dépassé n’est pas une preuve de réussite ; examinez les événements et les erreurs.",
    },
  },
  {
    type: "p",
    text: {
      en: "Cleanup deletes the chapter namespace and every resource inside it. Run cleanup only after verifying the context and namespace name.",
      fr: "Les nettoyages suppriment le namespace du chapitre et toutes ses ressources. Exécutez-les uniquement après avoir vérifié le contexte et le nom du namespace.",
    },
  },
];
