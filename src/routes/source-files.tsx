import { createFileRoute } from "@tanstack/react-router";
import { sourceFiles } from "@/content/source-files";
import { CodeBlock } from "@/components/academy/CodeBlock";
import type { CodeLang } from "@/content/types";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/source-files")({
  head: () => ({
    meta: [
      { title: "Lab source files — K8s Visual Ops Lab" },
      { name: "description", content: "The FastAPI app, Dockerfile and Kubernetes manifests used in the guided lab." },
      { property: "og:title", content: "Lab source files" },
      { property: "og:description", content: "main.py, Dockerfile, Namespace, Deployment and Service manifests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SourceFiles,
});

const langOf = (path: string): CodeLang =>
  path.endsWith(".yaml") ? "yaml" : path.endsWith(".py") ? "python" : path.endsWith("Dockerfile") ? "dockerfile" : "text";

function SourceFiles() {
  const { lang } = useLang();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="eyebrow">lab/</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{lang === "fr" ? "Fichiers source du lab" : "Lab source files"}</h1>
      <div className="mt-12 space-y-14">
        {sourceFiles.map((f) => (
          <section key={f.id} id={f.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold">{f.title}</h2>
            <p className="mt-2 text-muted-foreground">{f.purpose}</p>
            <CodeBlock code={f.code} lang={langOf(f.path)} title={f.path} />
            <ul className="space-y-1.5 text-sm text-foreground/80">
              {f.notice.map((n) => <li key={n} className="flex gap-2"><span className="text-primary">›</span>{n}</li>)}
            </ul>
            <div className="mt-3 font-mono text-xs text-muted-foreground">{f.relatedStep}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
