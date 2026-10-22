import { useId, useState } from "react";
import { CheckCircle2, RotateCcw, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/content/types";
import { gradeQuiz } from "@/content/quiz";
import { useLang } from "@/lib/i18n";
import { RichText } from "./RichText";

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const { tr } = useLang();
  const id = useId();
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const results = gradeQuiz(questions, answers);
  const complete = questions.every((_, index) => answers[index] !== undefined);

  return (
    <form className="my-6 space-y-8" onSubmit={(event) => { event.preventDefault(); if (complete) setSubmitted(true); }}>
      {questions.map((question, index) => (
        <fieldset key={index} className="min-w-0 space-y-3" disabled={submitted}>
          <legend className="mb-3 text-base font-medium text-foreground">
            {index + 1}. <RichText text={tr(question.question)} />
          </legend>
          {question.options.map((option, choice) => (
            <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-ring">
              <input type="radio" className="mt-1 shrink-0 accent-primary" name={`${id}-${index}`} value={choice}
                checked={answers[index] === choice}
                onChange={() => setAnswers((current) => { const next = [...current]; next[index] = choice; return next; })} />
              <span className="min-w-0 break-words"><span className="font-mono text-muted-foreground">{String.fromCharCode(65 + choice)}. </span><RichText text={tr(option)} /></span>
            </label>
          ))}
          {submitted && (
            <div className="flex items-start gap-2 border-l-2 border-primary pl-3 text-sm" role="status">
              {results[index] ? <CheckCircle2 className="mt-1 size-4 shrink-0 text-success" /> : <XCircle className="mt-1 size-4 shrink-0 text-warning" />}
              <div>
                <p className="!my-0 font-medium">{tr(results[index] ? { en: "Correct", fr: "Correct" } : { en: "Incorrect", fr: "Incorrect" })} · {tr({ en: "Correct answer", fr: "Bonne réponse" })}: {String.fromCharCode(65 + question.correct)}</p>
                <p className="!mt-1 !mb-0"><RichText text={tr(question.explanation)} /></p>
              </div>
            </div>
          )}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        {submitted ? (
          <>
            <p className="!my-0 font-mono text-sm" role="status">{results.filter(Boolean).length} / {questions.length}</p>
            <Button type="button" variant="outline" onClick={() => { setAnswers([]); setSubmitted(false); }}>
              <RotateCcw />{tr({ en: "Retry", fr: "Réessayer" })}
            </Button>
          </>
        ) : (
          <Button type="submit" disabled={!complete}><Send />{tr({ en: "Submit answers", fr: "Valider les réponses" })}</Button>
        )}
      </div>
    </form>
  );
}