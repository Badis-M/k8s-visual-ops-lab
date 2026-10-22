import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Terminal, FileCode2 } from "lucide-react";
import type { CodeKind, CodeLang } from "@/content/types";
import { ui, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

function highlightLine(line: string, lang: CodeLang, key: number): ReactNode {
  const out: ReactNode[] = [];
  const push = (text: string, cls?: string) =>
    out.push(
      cls ? (
        <span key={out.length} className={cls}>
          {text}
        </span>
      ) : (
        text
      ),
    );

  const commentIdx = (() => {
    if (!["bash", "yaml", "python", "dockerfile", "makefile", "go"].includes(lang)) return -1;
    const marker = lang === "go" ? "//" : "#";
    let inS = false;
    let inD = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i] ?? "";
      if (c === "'" && !inD) inS = !inS;
      else if (c === '"' && !inS) inD = !inD;
      else if (
        !inS &&
        !inD &&
        line.startsWith(marker, i) &&
        (i === 0 || /\s/.test(line[i - 1] ?? ""))
      )
        return i;
    }
    return -1;
  })();
  const code = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const comment = commentIdx >= 0 ? line.slice(commentIdx) : "";

  if (lang === "yaml") {
    const m = code.match(/^(\s*-?\s*)([\w./-]+)(:)(.*)$/);
    if (m) {
      push(m[1] ?? "");
      push(m[2] ?? "", "syn-key");
      push(m[3] ?? "");
      const rest = m[4] ?? "";
      if (/^\s*["'].*["']\s*$/.test(rest)) push(rest, "syn-string");
      else if (/^\s*-?\d+(\.\d+)?[a-zA-Z]*\s*$/.test(rest)) push(rest, "syn-number");
      else push(rest);
    } else push(code);
  } else if (lang === "bash") {
    const tokens = code.split(/(\s+)/);
    let first = true;
    for (const tok of tokens) {
      if (/^\s+$/.test(tok) || tok === "") {
        push(tok);
        continue;
      }
      if (first && !tok.startsWith("-")) {
        push(tok, "syn-cmd");
        first = false;
      } else if (/^--?[\w-]+/.test(tok)) push(tok, "syn-flag");
      else if (/^["'].*["']$/.test(tok)) push(tok, "syn-string");
      else push(tok);
      if (tok === "|" || tok === "&&" || tok === ";" || tok === "||") first = true;
    }
  } else push(code);

  if (comment) push(comment, "syn-comment");
  return <span key={key}>{out}</span>;
}

const languageLabels: Record<CodeLang, string> = {
  bash: "Shell",
  yaml: "YAML",
  text: "Text",
  go: "Go",
  python: "Python",
  dockerfile: "Dockerfile",
  helm: "Helm template",
  makefile: "Makefile",
  promql: "PromQL",
  json: "JSON",
};

export function CodeBlock({
  code,
  lang,
  title,
  output,
  kind,
}: {
  code: string;
  lang: CodeLang;
  title?: string | undefined;
  output?: boolean;
  kind?: CodeKind | undefined;
}) {
  const { tr } = useLang();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Keep every character, including CRLF and the absence of a final newline.
  const lines = code.split(/(\r\n|\n|\r)/);
  const resolvedKind =
    kind ??
    (title && /(?:\.(?:ya?ml|py|go|sh|tpl|json|txt)$|Makefile$|Dockerfile$)/.test(title)
      ? "file"
      : lang === "bash"
        ? "command"
        : "snippet");
  const roleLabel = output
    ? tr({ en: "Expected output · example", fr: "Sortie attendue · exemple" })
    : resolvedKind === "command"
      ? tr({ en: "Terminal commands", fr: "Commandes terminal" })
      : resolvedKind === "file"
        ? tr({ en: "File", fr: "Fichier" })
        : tr({ en: "Example / excerpt", fr: "Exemple / extrait" });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      clearTimeout(timer.current);
      setCopyState("failed");
    }
  };

  const Icon = !output && resolvedKind === "command" ? Terminal : FileCode2;

  return (
    <div
      data-code-language={lang}
      className="group my-5 min-w-0 overflow-hidden rounded-xl border border-border bg-code shadow-card"
    >
      <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
          <Icon className="size-3.5 shrink-0 text-primary/80" />
          <div className="min-w-0">
            <span className="block break-all">{title ?? languageLabels[lang]}</span>
            <span className="mt-0.5 block text-[10px]">
              {roleLabel}
              {title ? ` · ${languageLabels[lang]}` : ""}
            </span>
          </div>
        </div>
        {!output && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label={tr(ui.copy)}
          >
            {copyState === "copied" ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copyState === "copied" ? tr(ui.copied) : tr(ui.copy)}
          </Button>
        )}
      </div>
      {copyState === "failed" && (
        <p role="alert" className="px-4 pt-3 text-sm text-warning">
          {tr({
            en: "Copy failed. Select the code and copy it manually.",
            fr: "La copie a échoué. Sélectionnez le code et copiez-le manuellement.",
          })}
        </p>
      )}
      <span role="status" className="sr-only">
        {copyState === "copied" ? tr(ui.copied) : ""}
      </span>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed text-foreground/90">
        <code className={`language-${lang}`}>
          {output ? code : lines.map((l, i) => highlightLine(l, lang, i))}
        </code>
      </pre>
    </div>
  );
}
