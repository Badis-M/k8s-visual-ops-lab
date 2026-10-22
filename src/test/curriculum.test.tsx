import { describe, expect, it } from "vitest";
import { chapters, isAvailable, levels } from "@/content/curriculum";

describe("curriculum", () => {
  it("has four levels", () => {
    expect(levels.map((l) => l.level)).toEqual([1, 2, 3, 4]);
  });

  it("marks chapters without content as upcoming", () => {
    const upcoming = {
      id: "future-lesson",
      level: 2 as const,
      title: { en: "Future", fr: "À venir" },
      summary: { en: "", fr: "" },
      minutes: 30,
    };
    const available = chapters.find((c) => c.id === "architecture");
    expect(upcoming && isAvailable(upcoming)).toBe(false);
    expect(available && isAvailable(available)).toBe(true);
  });

  it("every available chapter ends with a challenge that has a solution", () => {
    for (const c of chapters.filter(isAvailable)) {
      const ch = c.blocks?.find((b) => b.type === "challenge");
      expect(ch, c.id).toBeDefined();
      if (ch?.type === "challenge") expect(ch.solution.length, c.id).toBeGreaterThan(0);
    }
  });
});
