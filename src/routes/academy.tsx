import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, Hourglass } from "lucide-react";
import { chaptersOf, isAvailable, levels } from "@/content/curriculum";
import { ui, useLang } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { levelBg, levelText } from "@/components/academy/LevelBadge";
import { BeforeYouBegin } from "@/components/academy/BeforeYouBegin";
import { ScrollProgress } from "@/components/academy/ScrollProgress";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Curriculum — Kubernetes Academy" },
      {
        name: "description",
        content:
          "The full Kubernetes curriculum: Foundations, Operating, Production and Internals & Extensibility, with durations and progress.",
      },
      { property: "og:title", content: "Kubernetes Academy curriculum" },
      {
        property: "og:description",
        content: "Four levels from Pods to Operators, with hands-on labs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Academy,
});

function Academy() {
  const { tr, lang } = useLang();
  const { done } = useProgress();
  return (
    <div className="mx-auto max-w-5xl py-16 pr-4 pl-16 sm:pr-6 sm:pl-36 xl:px-6">
      <ScrollProgress />
      <div className="eyebrow">{tr(ui.academy)}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        {lang === "fr" ? "Le programme complet" : "The complete curriculum"}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {lang === "fr"
          ? "Rien n'est verrouillé : les prérequis sont des recommandations. Un chapitre n'est publié que lorsque ses explications, son lab et ses solutions sont complets ; les autres sont marqués « à venir »."
          : "Nothing is locked: prerequisites are recommendations. A chapter is published only when its explanations, lab and solutions are complete; the rest are marked “upcoming”."}
      </p>
      <BeforeYouBegin />
      <div className="mt-12 space-y-14">
        {levels.map((lv) => {
          const list = chaptersOf(lv.level);
          const completed = list.filter((c) => done.has(c.id)).length;
          return (
            <section key={lv.level} id={`level-${lv.level}`} className="scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`font-mono text-sm ${levelText[lv.level]}`}>
                    {tr(ui.level)} {lv.level} · {tr(lv.name)}
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold">{tr(lv.tagline)}</h2>
                </div>
                <div className="w-40 text-right font-mono text-xs text-muted-foreground">
                  {completed}/{list.length}
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={`h-full ${levelBg[lv.level]}`}
                      style={{ width: `${(completed / list.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <ol className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/50">
                {list.map((c, i) => {
                  const avail = isAvailable(c);
                  const isDone = done.has(c.id);
                  const inner = (
                    <>
                      <span className="w-6 font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : avail ? (
                        <Circle className="size-4 shrink-0 text-primary/70" />
                      ) : (
                        <Hourglass className="size-4 shrink-0 text-muted-foreground/60" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-medium ${avail ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {tr(c.title)}
                        </div>
                        {avail && (
                          <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {tr(c.summary)}
                          </div>
                        )}
                      </div>
                      <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex">
                        <Clock className="size-3" />
                        {c.minutes} {tr(ui.minutes)}
                      </span>
                      {!avail && (
                        <span className="hidden rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase sm:inline-flex">
                          {tr(ui.upcoming)}
                        </span>
                      )}
                    </>
                  );
                  return (
                    <li key={c.id}>
                      {avail ? (
                        <Link
                          to="/learn/$chapterId"
                          params={{ chapterId: c.id }}
                          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2/60"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
