import type { QuizQuestion } from "./types";

export function gradeQuiz(questions: QuizQuestion[], answers: (number | undefined)[]) {
  return questions.map((question, index) => answers[index] === question.correct);
}