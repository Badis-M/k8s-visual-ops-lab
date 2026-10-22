import type { Level } from "@/content/types";

const cls: Record<Level, string> = {
  1: "text-level-1 border-level-1/40 bg-level-1/10",
  2: "text-level-2 border-level-2/40 bg-level-2/10",
  3: "text-level-3 border-level-3/40 bg-level-3/10",
  4: "text-level-4 border-level-4/40 bg-level-4/10",
};
export const levelText: Record<Level, string> = { 1: "text-level-1", 2: "text-level-2", 3: "text-level-3", 4: "text-level-4" };
export const levelBg: Record<Level, string> = { 1: "bg-level-1", 2: "bg-level-2", 3: "bg-level-3", 4: "bg-level-4" };

export function LevelBadge({ level, label }: { level: Level; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${cls[level]}`}>
      L{level} · {label}
    </span>
  );
}
