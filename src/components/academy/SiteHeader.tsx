import { Link } from "@tanstack/react-router";
import { ui, useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { tr, lang, setLang } = useLang();
  const links = [
    { to: "/academy", label: tr(ui.academy) },
    { to: "/lab", label: tr(ui.lab) },
    { to: "/source-files", label: tr(ui.source) },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[90rem] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:flex-nowrap sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
          >
            <span className="relative flex size-7 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <span className="size-2.5 rotate-45 rounded-[3px] border-2 border-primary" />
            </span>
            <span>K8s Visual Ops Lab</span>
          </Link>
        </div>
        <nav
          className="flex w-full flex-wrap items-center justify-between gap-1 text-sm sm:w-auto sm:justify-start"
          aria-label="Main"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "rounded-md px-2.5 py-1.5 text-foreground bg-surface-2" }}
            >
              {l.label}
            </Link>
          ))}
          <div
            className="ml-2 flex rounded-lg border border-border p-0.5 font-mono text-[11px]"
            role="group"
            aria-label="Language"
          >
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-md px-2 py-1 uppercase transition ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { lang } = useLang();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground">
        <span>
          K8s Visual Ops Lab —{" "}
          {lang === "fr" ? "gratuit, open source, local" : "free, open source, local-first"}
        </span>
        <a
          href="https://github.com/Badis-M/k8s-visual-ops-lab"
          className="hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
