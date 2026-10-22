import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Boxes, FlaskConical, Network } from "lucide-react";
import { chapters, chaptersOf, isAvailable, levels } from "@/content/curriculum";
import { ui, useLang } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { levelBg, levelText } from "@/components/academy/LevelBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "K8s Visual Ops Lab — Learn Kubernetes from zero to Operators" },
      { name: "description", content: "A free, visual, hands-on Kubernetes academy in English and French: architecture, guided labs on kind, Helm, GitOps, CRDs and Operators." },
      { property: "og:title", content: "K8s Visual Ops Lab — Learn Kubernetes visually" },
      { property: "og:description", content: "Interactive architecture diagrams and real hands-on labs, from beginner to expert." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { tr, lang } = useLang();
  const { done } = useProgress();
  const fr = lang === "fr";
  const firstOpen = chapters.find((c) => isAvailable(c) && !done.has(c.id)) ?? chapters[0]!;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-aura absolute inset-0" />
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
          <div className="animate-rise eyebrow">Kubernetes · {fr ? "de débutant à expert" : "beginner to expert"}</div>
          <h1 className="animate-rise mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-6xl">
            {fr ? "Comprenez Kubernetes en le voyant fonctionner." : "Understand Kubernetes by watching it work."}
          </h1>
          <p className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {fr
              ? "Une académie gratuite et visuelle : schémas d'architecture interactifs, explications rigoureuses et labs pratiques dans votre propre terminal, sur un cluster kind local."
              : "A free, visual academy: interactive architecture diagrams, rigorous explanations, and hands-on labs in your own terminal on a local kind cluster."}
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3">
            <Link to="/learn/$chapterId" params={{ chapterId: firstOpen.id }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
              {done.size ? tr(ui.continue) : tr(ui.start)} <ArrowRight className="size-4" />
            </Link>
            <Link to="/academy" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary/40">
              {tr(ui.explore)}
            </Link>
          </div>

          <div className="animate-rise mt-16">
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="eyebrow">{fr ? "Méthode" : "Method"}</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">{fr ? "La théorie et la pratique, entrelacées." : "Theory and practice, interleaved."}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            { Icon: BookOpen, t: fr ? "Le pourquoi" : "The why", d: fr ? "Chaque concept commence par le problème qu'il résout." : "Every concept starts with the problem it solves." },
            { Icon: Network, t: fr ? "Les internes" : "The internals", d: fr ? "Des schémas exacts : aucune flèche inventée." : "Accurate diagrams: no invented arrows." },
            { Icon: FlaskConical, t: fr ? "Le lab" : "The lab", d: fr ? "Commandes copiables, résultats attendus, erreurs fréquentes." : "Copyable commands, expected output, common mistakes." },
            { Icon: Boxes, t: fr ? "Le défi" : "The challenge", d: fr ? "Un exercice autonome, avec indices et solution." : "An independent task, with hints and a solution." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-5">
              <Icon className="size-5 text-primary" />
              <div className="mt-4 font-semibold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="eyebrow">{fr ? "Parcours" : "Curriculum"}</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">{fr ? "Quatre niveaux, entièrement libres d'accès." : "Four levels, all freely accessible."}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {levels.map((lv) => {
            const list = chaptersOf(lv.level);
            const avail = list.filter(isAvailable).length;
            const completed = list.filter((c) => done.has(c.id)).length;
            return (
              <Link key={lv.level} to="/academy" hash={`level-${lv.level}`}
                className="group glass relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5 hover:border-primary/30">
                <div className={`absolute inset-x-0 top-0 h-px ${levelBg[lv.level]} opacity-60`} />
                <div className="flex items-baseline justify-between">
                  <span className={`font-mono text-sm ${levelText[lv.level]}`}>0{lv.level} · {tr(lv.name)}</span>
                  <span className="font-mono text-xs text-muted-foreground">{avail}/{list.length} {tr(ui.available).toLowerCase()}</span>
                </div>
                <div className="mt-3 text-xl font-semibold">{tr(lv.tagline)}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(lv.description)}</p>
                <div className="mt-5 h-1 overflow-hidden rounded-full bg-foreground/10">
                  <div className={`h-full ${levelBg[lv.level]}`} style={{ width: `${(completed / list.length) * 100}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
