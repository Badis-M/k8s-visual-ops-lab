import { createFileRoute, Link } from "@tanstack/react-router";
import { labSteps } from "@/content/lab-steps";
import { CodeBlock } from "@/components/academy/CodeBlock";
import { RichText } from "@/components/academy/RichText";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Guided lab: deploy a FastAPI app on kind — Kubernetes Academy" },
      {
        name: "description",
        content:
          "Build a Docker image, create a kind cluster, load the image and apply Namespace, Deployment and Service manifests step by step.",
      },
      { property: "og:title", content: "Guided Kubernetes lab on kind" },
      {
        property: "og:description",
        content: "From a FastAPI app to a running Deployment and Service on a local cluster.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const { lang, tr } = useLang();
  const fr = lang === "fr";
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="eyebrow">{fr ? "Lab guidé · niveau 1" : "Guided lab · level 1"}</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">k8s-ops-lab</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {fr
          ? "Le projet fil rouge : une API FastAPI empaquetée avec Docker et déployée sur un cluster kind jetable."
          : "The running project: a FastAPI service packaged with Docker and deployed on a kind cluster."}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {fr
          ? "Exécutez les commandes depuis la racine du dépôt, dans un terminal Bash ou zsh. Prévoyez environ 4 CPU et 6 Go de RAM pour les trois nœuds. Les sorties décrites sont attendues, pas des preuves d’exécution. Le site n’exécute aucune commande."
          : "Run commands from the repository root in Bash or zsh. Allow roughly 4 CPU and 6 GiB RAM for the three nodes. Described outputs are expectations, not execution evidence. This website runs no commands."}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {fr ? "Prérequis : " : "Prerequisites: "}
        <Link
          to="/learn/$chapterId"
          params={{ chapterId: "setup-kind" }}
          className="text-primary hover:underline"
        >
          {fr ? "installer kubectl et kind" : "install kubectl and kind"}
        </Link>
        {" · "}
        <Link to="/source-files" className="text-primary hover:underline">
          {fr ? "fichiers source" : "source files"}
        </Link>
      </p>

      <ol className="prose-lesson mt-12 space-y-12">
        {labSteps.map((s) => (
          <li key={s.number} className="relative">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-primary">{s.number}</span>
              <h2 className="text-xl font-semibold text-foreground">{tr(s.title)}</h2>
            </div>
            <p className="mt-2 !text-[15px]">
              <span className="text-foreground">{tr(s.goal)}</span>{" "}
              <span className="text-muted-foreground">{tr(s.why)}</span>
            </p>
            <CodeBlock code={s.command} lang="bash" />
            <p className="!text-[15px]">
              <RichText text={tr(s.explanation)} />
            </p>
            <div className="mt-3 rounded-lg border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm">
              <div className="eyebrow !text-success">{fr ? "Résultat attendu" : "Expected"}</div>
              <p className="mt-1 !text-sm">{tr(s.expected)}</p>
            </div>
            <div className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3.5 py-2.5 text-sm">
              <div className="eyebrow !text-warning">
                {fr ? "Erreur fréquente" : "Common mistake"}
              </div>
              <p className="mt-1 !text-sm">{tr(s.mistake)}</p>
            </div>
            {"fix" in s && s.fix && (
              <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
                <div className="font-medium text-foreground">{tr(s.fix.title)}</div>
                <CodeBlock code={s.fix.command} lang="bash" />
                <p className="!text-sm">{tr(s.fix.explanation)}</p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
