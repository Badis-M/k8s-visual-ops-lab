import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "k8slab.progress.v1";

type Ctx = { done: Set<string>; toggle: (id: string) => void; isDone: (id: string) => boolean };
const ProgressCtx = createContext<Ctx>({ done: new Set(), toggle: () => {}, isDone: () => false });

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      window.localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <ProgressCtx.Provider value={{ done, toggle, isDone: (id) => done.has(id) }}>
      {children}
    </ProgressCtx.Provider>
  );
}

export const useProgress = () => useContext(ProgressCtx);
