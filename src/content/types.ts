export type Lang = "en" | "fr";
/** A bilingual string. Commands, YAML fields and API names stay untranslated. */
export type L = { en: string; fr: string };

export type CodeLang = "bash" | "yaml" | "text" | "go" | "python" | "dockerfile";

export type DiagramName =
  | "architecture"
  | "reconcile"
  | "deployment-tree"
  | "vm-vs-container"
  | "pod-lifecycle";

export type LabStep = {
  title: L;
  why?: L;
  code?: { lang: CodeLang; code: string };
  explain: L;
  expected?: { text: L; output?: string };
  mistake?: L;
};

export type QuizQuestion = {
  question: L;
  options: L[];
  correct: number;
  explanation: L;
};

export type Block =
  | { type: "p"; text: L }
  | { type: "h2"; id: string; text: L }
  | { type: "h3"; text: L }
  | { type: "list"; items: L[]; ordered?: boolean }
  | { type: "code"; lang: CodeLang; code: string; title?: string; caption?: L; output?: boolean }
  | { type: "callout"; tone: "info" | "warn" | "tip"; title: L; text: L }
  | { type: "diagram"; name: DiagramName }
  | { type: "steps"; steps: LabStep[] }
  | { type: "fields"; title?: L; rows: { field: string; text: L }[] }
  | { type: "table"; head: L[]; rows: L[][] }
  | { type: "quiz"; questions: QuizQuestion[] }
  | { type: "challenge"; title: L; task: L; hints: L[]; solution: Block[] };

export type Level = 1 | 2 | 3 | 4;

export type Chapter = {
  id: string;
  level: Level;
  title: L;
  summary: L;
  minutes: number;
  /** ids of chapters worth reading first — informational, never locks content */
  prerequisites?: string[];
  related?: string[];
  heavy?: L;
  blocks?: Block[];
};

export const t = (s: L, lang: Lang) => s[lang];
