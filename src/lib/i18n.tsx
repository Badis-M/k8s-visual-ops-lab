import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { L, Lang } from "@/content/types";

const KEY = "k8slab.lang";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; tr: (s: L) => string }>({
  lang: "en",
  setLang: () => {},
  tr: (s) => s.en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "fr" || saved === "en") setLangState(saved);
    else if (navigator.language?.toLowerCase().startsWith("fr")) setLangState("fr");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(KEY, l);
  };

  return <LangCtx.Provider value={{ lang, setLang, tr: (s) => s[lang] }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** Interface strings. */
export const ui = {
  academy: { en: "Academy", fr: "Académie" },
  lab: { en: "Guided lab", fr: "Lab guidé" },
  source: { en: "Source files", fr: "Fichiers source" },
  start: { en: "Start learning", fr: "Commencer" },
  continue: { en: "Continue", fr: "Continuer" },
  explore: { en: "Explore the curriculum", fr: "Explorer le programme" },
  available: { en: "Available", fr: "Disponible" },
  upcoming: { en: "Upcoming", fr: "À venir" },
  minutes: { en: "min", fr: "min" },
  chapters: { en: "chapters", fr: "chapitres" },
  onThisPage: { en: "On this page", fr: "Sur cette page" },
  curriculum: { en: "Curriculum", fr: "Programme" },
  prev: { en: "Previous", fr: "Précédent" },
  next: { en: "Next", fr: "Suivant" },
  markDone: { en: "Mark chapter as complete", fr: "Marquer le chapitre comme terminé" },
  done: { en: "Completed", fr: "Terminé" },
  undo: { en: "Mark as not done", fr: "Marquer comme non terminé" },
  copy: { en: "Copy", fr: "Copier" },
  copied: { en: "Copied", fr: "Copié" },
  hint: { en: "Hint", fr: "Indice" },
  showSolution: { en: "Show the detailed solution", fr: "Afficher la solution détaillée" },
  hideSolution: { en: "Hide the solution", fr: "Masquer la solution" },
  challenge: { en: "Challenge", fr: "Défi" },
  why: { en: "Why", fr: "Pourquoi" },
  expected: { en: "Expected result", fr: "Résultat attendu" },
  mistake: { en: "Common mistake", fr: "Erreur fréquente" },
  prereq: { en: "Recommended first", fr: "À lire avant" },
  related: { en: "Related chapters", fr: "Chapitres liés" },
  progress: { en: "Your progress", fr: "Votre progression" },
  upcomingNote: {
    en: "This chapter is being written. It will be published only once its explanations, lab and solutions are complete.",
    fr: "Ce chapitre est en cours de rédaction. Il ne sera publié qu'une fois ses explications, son lab et ses solutions complets.",
  },
  heavy: { en: "Resource note", fr: "Note sur les ressources" },
  level: { en: "Level", fr: "Niveau" },
} satisfies Record<string, L>;
