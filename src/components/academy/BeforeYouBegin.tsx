import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { beforeYouBegin as content } from "@/content/before-you-begin";
import { useLang } from "@/lib/i18n";

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BeforeYouBegin() {
  const { tr } = useLang();

  return (
    <section
      id="level-0"
      aria-labelledby="before-you-begin-title"
      className="mt-10 scroll-mt-28 rounded-2xl border border-primary/25 bg-surface/50 p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="before-you-begin-title" className="text-2xl font-semibold tracking-tight">
          {tr(content.title)}
        </h2>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 font-mono text-xs text-primary">
          {tr(content.optional)}
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {tr(content.introduction)}
      </p>
      <a href="#level-1" className={linkClass}>
        {tr(content.skip)}
      </a>
      <div className="mt-5 grid gap-7 md:grid-cols-2 md:gap-10">
        <div className="min-w-0">
          <h3 className="font-semibold">{tr(content.basicsTitle)}</h3>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {content.basics.map((item) => (
              <li key={item.title.en}>
                <strong className="font-medium text-foreground">{tr(item.title)}</strong>
                {" — "}
                {tr(item.text)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{tr(content.review)}</p>
          <Button
            asChild
            size="lg"
            className="mt-3 h-auto min-h-12 w-full max-w-full whitespace-normal rounded-xl px-5 py-3 text-base font-semibold sm:w-auto"
          >
            <a href="https://academy.badismerakchi.com/">
              <span>{tr(content.academyLink)}</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">{tr(content.machineTitle)}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {tr(content.browsing)}
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {content.tools.map((item) => (
              <li key={item.title.en}>
                <strong className="font-medium text-foreground">{tr(item.title)}</strong>
                {" — "}
                {tr(item.text)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {tr(content.details)}
          </p>
          <div className="flex flex-wrap gap-x-5 text-sm">
            <Link to="/prerequisites" className={linkClass}>
              {tr(content.prerequisitesLink)}
            </Link>
            <Link to="/learn/$chapterId" params={{ chapterId: "setup-kind" }} className={linkClass}>
              {tr(content.installationLink)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
