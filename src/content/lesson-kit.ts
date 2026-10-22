import type { Block, CodeLang, L, LabStep, QuizQuestion } from "./types";

export const l = (en: string, fr: string): L => ({ en, fr });
export const h = (id: string, en: string, fr: string): Block => ({
  type: "h2",
  id,
  text: l(en, fr),
});
export const p = (en: string, fr: string): Block => ({ type: "p", text: l(en, fr) });
export const code = (lang: CodeLang, source: string, title?: string): Block => ({
  type: "code",
  lang,
  code: source,
  ...(title ? { title } : {}),
});
export const note = (tone: "info" | "warn" | "tip", title: L, text: L): Block => ({
  type: "callout",
  tone,
  title,
  text,
});
export const list = (...items: L[]): Block => ({ type: "list", items });
export const steps = (...items: LabStep[]): Block => ({ type: "steps", steps: items });
export const quiz = (...questions: QuizQuestion[]): Block => ({ type: "quiz", questions });
export const question = (text: L, options: L[], correct: number, explanation: L): QuizQuestion => ({
  question: text,
  options,
  correct,
  explanation,
});
export const challenge = (title: L, task: L, hints: L[], solution: Block[]): Block => ({
  type: "challenge",
  title,
  task,
  hints,
  solution,
});

export const labContext = (namespace: string): Block[] => [
  h("lab-preparation", "Prepare an isolated exercise", "Préparer un exercice isolé"),
  p(
    "Use the disposable kind lab described in lab/README.md (Kubernetes 1.35). Run commands from the repository root. The following alias always targets its explicit context; it does not change your global kubectl context. Do not reuse a namespace containing your own resources.",
    "Utilisez le lab kind jetable décrit dans lab/README.md (Kubernetes 1.35). Exécutez les commandes depuis la racine du dépôt. L’alias suivant cible toujours son contexte explicite, sans changer votre contexte kubectl global. Ne réutilisez pas un namespace contenant vos propres ressources.",
  ),
  code(
    "bash",
    `kubectl --context kind-k8s-ops-lab cluster-info\nalias k='kubectl --context kind-k8s-ops-lab'\nk create namespace ${namespace}\nk get nodes -o wide`,
  ),
  note(
    "info",
    l("Validation boundary", "Limite de validation"),
    l(
      "Commands are exercises for the learner, not actions executed by this website. Expected results describe observations to verify, not recorded execution evidence. Additional components are identified by each chapter.",
      "Ces commandes sont des exercices pour l’apprenant, pas des actions exécutées par le site. Les résultats attendus décrivent les observations à vérifier, pas des preuves d’exécution enregistrées. Chaque chapitre indique ses composants supplémentaires.",
    ),
  ),
];
