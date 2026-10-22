import { useState } from "react";
import { AlertTriangle, ChevronDown, Info, Lightbulb, Lock, Trophy, Unlock } from "lucide-react";
import type { Block, LabStep } from "@/content/types";
import { ui, useLang } from "@/lib/i18n";
import { CodeBlock } from "./CodeBlock";
import { RichText } from "./RichText";
import { Diagram } from "@/components/diagrams/Diagram";
import { Button } from "@/components/ui/button";
import { Quiz } from "./Quiz";

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-lesson">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block: b }: { block: Block }) {
  const { tr } = useLang();
  switch (b.type) {
    case "p":
      return (
        <p className="my-4 text-[15.5px]">
          <RichText text={tr(b.text)} />
        </p>
      );
    case "h2":
      return (
        <h2
          id={b.id}
          className="mt-14 mb-4 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground first:mt-0"
        >
          {tr(b.text)}
        </h2>
      );
    case "h3":
      return <h3 className="mt-8 mb-2 text-lg font-semibold text-foreground">{tr(b.text)}</h3>;
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className={`my-5 space-y-2.5 ${b.ordered ? "counter-reset-none" : ""}`}>
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 font-mono text-[11px] text-primary">
                {b.ordered ? i + 1 : "•"}
              </span>
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                <RichText text={tr(it)} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "code":
      return (
        <>
          <CodeBlock
            code={b.code}
            lang={b.lang}
            title={b.title}
            kind={b.kind}
            output={b.output ?? false}
          />
          {b.caption && <p className="-mt-2 text-sm text-muted-foreground">{tr(b.caption)}</p>}
        </>
      );
    case "callout":
      return <Callout tone={b.tone} title={tr(b.title)} text={tr(b.text)} />;
    case "diagram":
      return <Diagram name={b.name} />;
    case "steps":
      return <Steps steps={b.steps} />;
    case "fields":
      return (
        <div className="my-6 overflow-hidden rounded-xl border border-border">
          {b.rows.map((r, i) => (
            <div
              key={i}
              className="grid gap-1 border-b border-border px-4 py-3.5 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:gap-5"
            >
              <code className="h-fit w-fit">{r.field}</code>
              <p className="text-sm leading-relaxed text-foreground/80">
                <RichText text={tr(r.text)} />
              </p>
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-medium">
                    {tr(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((c, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 align-top ${j === 0 ? "font-medium text-foreground" : "text-foreground/80"}`}
                    >
                      <RichText text={tr(c)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "challenge":
      return <Challenge block={b} />;
    case "quiz":
      return <Quiz questions={b.questions} />;
  }
}

export function Callout({
  tone,
  title,
  text,
}: {
  tone: "info" | "warn" | "tip";
  title: string;
  text: string;
}) {
  const map = {
    info: { Icon: Info, cls: "border-worker/30 bg-worker-soft text-worker" },
    tip: { Icon: Lightbulb, cls: "border-success/30 bg-success/10 text-success" },
    warn: { Icon: AlertTriangle, cls: "border-warning/30 bg-warning/10 text-warning" },
  }[tone];
  return (
    <div className={`my-6 flex gap-3 rounded-xl border px-4 py-3.5 ${map.cls}`}>
      <map.Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-1 !text-sm !leading-relaxed text-foreground/80">
          <RichText text={text} />
        </p>
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: LabStep[] }) {
  const { tr } = useLang();
  return (
    <ol className="relative my-8 space-y-6 border-l border-border pl-8">
      {steps.map((s, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[2.85rem] top-0 flex size-7 items-center justify-center rounded-full border border-primary/40 bg-background font-mono text-xs text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="text-base font-semibold text-foreground">{tr(s.title)}</h3>
          {s.why && (
            <p className="mt-1 !text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{tr(ui.why)} — </span>
              <RichText text={tr(s.why)} />
            </p>
          )}
          {s.code && (
            <CodeBlock
              code={s.code.code}
              lang={s.code.lang}
              title={s.code.title}
              kind={s.code.kind}
            />
          )}
          <p className="!text-[15px]">
            <RichText text={tr(s.explain)} />
          </p>
          {s.expected && (
            <div className="mt-3 rounded-lg border border-success/25 bg-success/5 px-3.5 py-2.5">
              <div className="eyebrow !text-success">{tr(ui.expected)}</div>
              <p className="mt-1 !text-sm">
                <RichText text={tr(s.expected.text)} />
              </p>
              {s.expected.output && <CodeBlock code={s.expected.output} lang="text" output />}
            </div>
          )}
          {s.mistake && (
            <div className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3.5 py-2.5">
              <div className="eyebrow !text-warning">{tr(ui.mistake)}</div>
              <p className="mt-1 !text-sm">
                <RichText text={tr(s.mistake)} />
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Challenge({ block }: { block: Extract<Block, { type: "challenge" }> }) {
  const { tr } = useLang();
  const [hints, setHints] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <section className="my-12 overflow-hidden rounded-2xl border border-control/30 bg-control-soft">
      <div className="px-5 pt-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-control" />
          <span className="eyebrow !text-control">{tr(ui.challenge)}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-foreground">{tr(block.title)}</h3>
        <p className="whitespace-pre-line !text-[15px]">
          <RichText text={tr(block.task)} />
        </p>
      </div>
      <div className="space-y-2 px-5 py-4 sm:px-6">
        {block.hints.slice(0, hints).map((h, i) => (
          <div
            key={i}
            className="flex gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-foreground/85"
          >
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              <RichText text={tr(h)} />
            </span>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {hints < block.hints.length && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setHints((h) => h + 1)}
              className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-sm text-foreground/90 transition-colors hover:border-warning/40"
            >
              {tr(ui.hint)} {hints + 1}/{block.hints.length}
            </Button>
          )}
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-lg border border-control/40 bg-control/15 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-control/25"
          >
            {open ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
            {open ? tr(ui.hideSolution) : tr(ui.showSolution)}
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>
      {open && (
        <div className="animate-rise border-t border-control/20 bg-background/50 px-5 py-2 sm:px-6">
          <Blocks blocks={block.solution} />
        </div>
      )}
    </section>
  );
}
