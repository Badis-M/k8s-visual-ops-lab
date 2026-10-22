import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { getChapter, isAvailable } from "@/content/curriculum";
import { gradeQuiz } from "@/content/quiz";
import { sharedLabIntroduction } from "@/content/shared-lab-introduction";
import { Quiz } from "@/components/academy/Quiz";
import { Blocks } from "@/components/academy/Blocks";
import type { Block } from "@/content/types";

const ids = ["namespaces-contexts", "services", "labels-selectors", "configmaps-secrets", "kubectl-troubleshooting"];
const keys = [[1, 0, 2], [0, 1, 2], [1, 0, 2], [1, 2, 0], [1, 0, 2]];
const minutes = [35, 50, 35, 50, 50];

describe("supplied beginner lessons", () => {
  ids.forEach((id, index) => {
    it(`${id} is complete with the supplied quiz answers and shared preparation`, () => {
      const chapter = getChapter(id);
      expect(chapter).toBeDefined();
      if (!chapter) throw new Error(id);
      expect(isAvailable(chapter)).toBe(true);
      expect(chapter.minutes).toBe(minutes[index]);
      expect(chapter.blocks?.slice(0, sharedLabIntroduction.length)).toEqual(sharedLabIntroduction);
      const quiz = chapter.blocks?.find((b) => b.type === "quiz");
      if (quiz?.type !== "quiz") throw new Error("Missing quiz");
      expect(quiz.questions.map((q) => q.correct)).toEqual(keys[index]);
      expect(gradeQuiz(quiz.questions, keys[index] ?? [])).toEqual([true, true, true]);
      expect(gradeQuiz(quiz.questions, [])).toEqual([false, false, false]);
      const challenge = chapter.blocks?.find((b) => b.type === "challenge");
      if (challenge?.type !== "challenge") throw new Error("Missing challenge");
      expect(challenge.hints).toHaveLength(2);
      expect(challenge.solution.some((b) => b.type === "code")).toBe(true);
      expect(chapter.blocks?.some((b) => b.type === "h2" && b.id === "cleanup")).toBe(true);
    });
  });

  it("requires all answers and explicit submission, then allows retry", () => {
    const quiz = getChapter("services")?.blocks?.find((b) => b.type === "quiz");
    if (quiz?.type !== "quiz") throw new Error("Missing quiz");
    render(<Quiz questions={quiz.questions} />);
    const submit = screen.getByRole("button", { name: "Submit answers" });
    expect(submit).toBeDisabled();
    const radios = screen.getAllByRole("radio");
    [0, 4, 8].forEach((i) => { const radio = radios[i]; if (radio) fireEvent.click(radio); });
    expect(submit).toBeEnabled();
    expect(screen.queryByText(quiz.questions[0]?.explanation.en ?? "missing")).not.toBeInTheDocument();
    fireEvent.click(submit);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByRole("button", { name: "Submit answers" })).toBeDisabled();
    cleanup();
  });

  it("does not reveal hints or solutions before requested", () => {
    const block: Block = { type: "challenge", title: { en: "Test", fr: "Test" }, task: { en: "Task", fr: "Tâche" }, hints: [{ en: "Private hint", fr: "Indice" }], solution: [{ type: "p", text: { en: "Private solution", fr: "Solution" } }] };
    render(<Blocks blocks={[block]} />);
    expect(screen.queryByText("Private hint")).not.toBeInTheDocument();
    expect(screen.queryByText("Private solution")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hint 1/1" }));
    expect(screen.getByText("Private hint")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show the detailed solution" }));
    expect(screen.getByText("Private solution")).toBeInTheDocument();
    cleanup();
  });
});