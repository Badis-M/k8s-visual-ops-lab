import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { chapters, getChapter, isAvailable, neighbours } from "@/content/curriculum";
import type { Block } from "@/content/types";
import { Blocks } from "@/components/academy/Blocks";
import { AutoscalingDiagram } from "@/components/diagrams/AutoscalingDiagram";
import { LangProvider } from "@/lib/i18n";

function inspect(value: unknown, path: string): void {
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    return;
  }
  const record = value as Record<string, unknown>;
  if ("en" in record || "fr" in record) {
    expect(typeof record["en"], path).toBe("string");
    expect(typeof record["fr"], path).toBe("string");
    expect(String(record["en"]).trim().length, path).toBeGreaterThan(0);
    expect(String(record["fr"]).trim().length, path).toBeGreaterThan(0);
  }
  if (record["lang"] === "bash" && typeof record["code"] === "string") {
    const result = spawnSync("bash", ["-n"], { input: record["code"], encoding: "utf8" });
    expect(result.status, `${path}: ${result.stderr}`).toBe(0);
    for (const match of record["code"].matchAll(/(?:--patch|-p)\s+'(\{[^']*\})'/g)) {
      expect(() => JSON.parse(match[1] ?? ""), `${path}: invalid JSON patch`).not.toThrow();
    }
  }
  if (record["type"] === "quiz") {
    expect((record["questions"] as unknown[]).length, path).toBeGreaterThanOrEqual(3);
    for (const question of record["questions"] as { options: unknown[]; correct: number }[]) {
      expect(question.options.length, path).toBeGreaterThanOrEqual(2);
      expect(Number.isInteger(question.correct), path).toBe(true);
      expect(question.correct, path).toBeGreaterThanOrEqual(0);
      expect(question.correct, path).toBeLessThan(question.options.length);
      expect(new Set(question.options.map((o) => JSON.stringify(o))).size, path).toBe(
        question.options.length,
      );
    }
  }
  if (record["type"] === "table") {
    const width = (record["head"] as unknown[]).length;
    for (const row of record["rows"] as unknown[][]) expect(row.length, path).toBe(width);
  }
  if (record["type"] === "challenge") {
    expect((record["hints"] as unknown[]).length, path).toBeGreaterThan(0);
    expect((record["solution"] as unknown[]).length, path).toBeGreaterThan(0);
  }
  Object.entries(record).forEach(([key, child]) => inspect(child, `${path}.${key}`));
}

// jsdom 20 under Node 26 does not expose a usable browser storage object.
// Keep persistence behavior deterministic without relying on Node's file storage.
beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    } satisfies Storage,
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("curriculum integrity", () => {
  it("preserves chapter counts and unique persistent identifiers", () => {
    expect(new Set(chapters.map((c) => c.id)).size).toBe(chapters.length);
    expect(chapters.filter(isAvailable)).toHaveLength(60);
    expect([1, 2, 3, 4].map((level) => chapters.filter((c) => c.level === level).length)).toEqual([
      11, 16, 16, 17,
    ]);
  });

  it("resolves prerequisites and related links without self references or prerequisite cycles", () => {
    const visit = (id: string, trail: string[]): void => {
      expect(trail.includes(id), [...trail, id].join(" -> ")).toBe(false);
      const chapter = getChapter(id);
      expect(chapter, id).toBeDefined();
      chapter?.prerequisites?.forEach((next) => visit(next, [...trail, id]));
    };
    for (const chapter of chapters) {
      [...(chapter.prerequisites ?? []), ...(chapter.related ?? [])].forEach((id) => {
        expect(id, chapter.id).not.toBe(chapter.id);
        expect(getChapter(id), `${chapter.id} -> ${id}`).toBeDefined();
      });
      visit(chapter.id, []);
    }
  });

  it("validates nested bilingual blocks, answers and chapter anchors", () => {
    for (const chapter of chapters.filter((c) => c.level > 1 && isAvailable(c))) {
      inspect(chapter, chapter.id);
      const anchors =
        chapter.blocks
          ?.filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2")
          .map((b) => b.id) ?? [];
      expect(new Set(anchors).size, chapter.id).toBe(anchors.length);
      expect(
        chapter.blocks?.some((b) => b.type === "quiz"),
        chapter.id,
      ).toBe(true);
      expect(
        chapter.blocks?.some((b) => b.type === "challenge"),
        chapter.id,
      ).toBe(true);
    }
  });

  it("keeps next and previous navigation reciprocal across available levels", () => {
    for (const chapter of chapters.filter(isAvailable)) {
      const { next, prev } = neighbours(chapter.id);
      if (next) expect(neighbours(next.id).prev?.id).toBe(chapter.id);
      if (prev) expect(neighbours(prev.id).next?.id).toBe(chapter.id);
    }
  });
});

describe("advanced lesson interaction", () => {
  it("renders a French chapter and keeps hints and corrections hidden until requested", () => {
    window.localStorage.setItem("k8slab.lang", "fr");
    const chapter = getChapter("rollout-strategies");
    if (!chapter?.blocks) throw new Error("Missing rollout chapter");
    const challenge = chapter.blocks.find((b) => b.type === "challenge");
    if (challenge?.type !== "challenge") throw new Error("Missing challenge");
    render(
      <LangProvider>
        <Blocks blocks={chapter.blocks} />
      </LangProvider>,
    );
    expect(screen.getByRole("heading", { name: "Ce que vous saurez décider" })).toBeInTheDocument();
    expect(screen.queryByText(challenge.hints[0]?.fr ?? "missing")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Indice 1\// }));
    expect(screen.getByText(challenge.hints[0]?.fr ?? "missing")).toBeInTheDocument();
    const reveal = screen.getByRole("button", { name: "Afficher la solution détaillée" });
    expect(reveal).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(reveal);
    expect(screen.getByRole("button", { name: /Masquer la solution/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

describe("HPA denominator diagram", () => {
  it("recomputes nominal replicas when only the request changes", () => {
    window.localStorage.setItem("k8slab.lang", "fr");
    render(
      <LangProvider>
        <AutoscalingDiagram />
      </LangProvider>,
    );
    const request = screen.getByRole("slider", { name: /Request CPU par réplica/ });
    expect(screen.getByRole("status")).toHaveTextContent("2");
    fireEvent.change(request, { target: { value: "50" } });
    expect(screen.getByRole("status")).toHaveTextContent("4");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
