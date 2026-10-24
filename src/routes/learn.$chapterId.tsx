import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Cpu, Hourglass } from "lucide-react";
import { chaptersOf, getChapter, isAvailable, levels, neighbours } from "@/content/curriculum";
import { ui, useLang } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { Blocks, Callout } from "@/components/academy/Blocks";
import { LevelBadge } from "@/components/academy/LevelBadge";

export const Route = createFileRoute("/learn/$chapterId")({
  loader: ({ params }) => {
    const c = getChapter(params.chapterId);
    if (!c) throw notFound();
    return { id: c.id };
  },
  head: ({ params }) => {
    const c = getChapter(params.chapterId);
    const title = c ? `${c.title.en} — Kubernetes Academy` : "Chapter — Kubernetes Academy";
    const desc = c?.summary.en || "A Kubernetes chapter in the Kubernetes Academy academy.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Reader,
});

function Reader() {
  const { id } = Route.useLoaderData();
  const chapter = getChapter(id);
  const { tr } = useLang();
  const { isDone, toggle, done } = useProgress();
  if (!chapter) throw notFound();
  const avail = isAvailable(chapter);
  const { prev, next } = neighbours(chapter.id);
  const level = levels.find((l) => l.level === chapter.level);
  if (!level) throw notFound();
  const toc = (chapter.blocks ?? []).filter(
    (b): b is Extract<typeof b, { type: "h2" }> => b.type === "h2",
  );
  const finished = isDone(chapter.id);

  return (
    <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[15rem_1fr] xl:grid-cols-[15rem_1fr_13rem]">
      {/* Curriculum sidebar */}
      <aside className="hidden lg:block">
        <nav className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pb-10 pr-2 text-sm">
          {levels.map((lv) => (
            <div key={lv.level}>
              <div className="eyebrow mb-2 !text-muted-foreground">
                L{lv.level} · {tr(lv.name)}
              </div>
              <ul className="space-y-0.5">
                {chaptersOf(lv.level).map((c) =>
                  isAvailable(c) ? (
                    <li key={c.id}>
                      <Link
                        to="/learn/$chapterId"
                        params={{ chapterId: c.id }}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                        activeProps={{
                          className:
                            "flex items-center gap-2 rounded-md px-2 py-1.5 bg-primary/10 text-primary",
                        }}
                      >
                        {done.has(c.id) ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                        ) : (
                          <span className="size-3.5 shrink-0 rounded-full border border-current opacity-50" />
                        )}
                        <span className="line-clamp-1">{tr(c.title)}</span>
                      </Link>
                    </li>
                  ) : lv.level === chapter.level ? (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground/50"
                    >
                      <Hourglass className="size-3.5 shrink-0" />
                      <span className="line-clamp-1">{tr(c.title)}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 max-w-3xl">
        <Link
          to="/academy"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="size-3.5" /> {tr(ui.curriculum)}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <LevelBadge level={chapter.level} label={tr(level.name)} />
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Clock className="size-3" />
            {chapter.minutes} {tr(ui.minutes)}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2.6rem] sm:leading-[1.1]">
          {tr(chapter.title)}
        </h1>
        {avail && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {tr(chapter.summary)}
          </p>
        )}

        {chapter.prerequisites?.length ? (
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{tr(ui.prereq)}:</span>
            {chapter.prerequisites.map((p) => {
              const pc = getChapter(p);
              return pc ? (
                <Link
                  key={p}
                  to="/learn/$chapterId"
                  params={{ chapterId: p }}
                  className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-foreground/90 hover:border-primary/40"
                >
                  {tr(pc.title)}
                </Link>
              ) : null;
            })}
          </div>
        ) : null}

        {chapter.heavy && (
          <div className="mt-6 flex gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-sm text-foreground/85">
            <Cpu className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              <span className="font-medium text-warning">{tr(ui.heavy)}: </span>
              {tr(chapter.heavy)}
            </span>
          </div>
        )}

        <div className="mt-10">
          {avail ? (
            <Blocks key={chapter.id} blocks={chapter.blocks ?? []} />
          ) : (
            <Callout tone="info" title={tr(ui.upcoming)} text={tr(ui.upcomingNote)} />
          )}
        </div>

        {avail && (
          <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {finished ? tr(ui.done) : tr(ui.progress)}
            </div>
            <button
              type="button"
              onClick={() => toggle(chapter.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${finished ? "border border-success/40 bg-success/10 text-success" : "bg-primary text-primary-foreground hover:opacity-90"}`}
            >
              <CheckCircle2 className="size-4" />
              {finished ? tr(ui.undo) : tr(ui.markDone)}
            </button>
          </div>
        )}

        {chapter.related?.length ? (
          <div className="mt-8 text-sm">
            <span className="text-muted-foreground">{tr(ui.related)}: </span>
            {chapter.related.map((r, i) => {
              const rc = getChapter(r);
              return rc ? (
                <span key={r}>
                  {i > 0 && ", "}
                  {isAvailable(rc) ? (
                    <Link
                      to="/learn/$chapterId"
                      params={{ chapterId: r }}
                      className="text-primary hover:underline"
                    >
                      {tr(rc.title)}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      {tr(rc.title)} ({tr(ui.upcoming).toLowerCase()})
                    </span>
                  )}
                </span>
              ) : null;
            })}
          </div>
        ) : null}

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              to="/learn/$chapterId"
              params={{ chapterId: prev.id }}
              className="glass rounded-xl p-4 transition hover:border-primary/40"
            >
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="size-3" />
                {tr(ui.prev)}
              </div>
              <div className="mt-1 font-medium">{tr(prev.title)}</div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to="/learn/$chapterId"
              params={{ chapterId: next.id }}
              className="glass rounded-xl p-4 text-right transition hover:border-primary/40"
            >
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                {tr(ui.next)}
                <ArrowRight className="size-3" />
              </div>
              <div className="mt-1 font-medium">{tr(next.title)}</div>
            </Link>
          )}
        </div>
      </article>

      {/* TOC */}
      <aside className="hidden xl:block">
        {toc.length > 0 && (
          <nav className="sticky top-20 text-sm">
            <div className="eyebrow mb-3 !text-muted-foreground">{tr(ui.onThisPage)}</div>
            <ul className="space-y-2 border-l border-border">
              {toc.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="-ml-px block border-l border-transparent pl-3 text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    {tr(h.text)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>
    </div>
  );
}
