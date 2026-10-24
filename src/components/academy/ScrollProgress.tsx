import { useEffect, useState } from "react";
import { ui, useLang } from "@/lib/i18n";

const sections = [0, 1, 2, 3, 4];

export function ScrollProgress() {
  const { tr } = useLang();
  const [percent, setPercent] = useState(0);
  const [activeLevel, setActiveLevel] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let frame: number | undefined;

    const update = () => {
      frame = undefined;
      const page = document.scrollingElement ?? document.documentElement;
      const distance = page.scrollHeight - window.innerHeight;
      const fraction = distance > 0 ? window.scrollY / distance : 1;
      setPercent(Math.round(Math.min(1, Math.max(0, fraction)) * 100));

      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const firstLevel = document.getElementById("level-1");
      const margin = firstLevel ? parseFloat(getComputedStyle(firstLevel).scrollMarginTop) || 0 : 0;
      // Include the existing anchor offset when deciding which heading is current.
      const reference = Math.min(
        window.innerHeight - 1,
        Math.max(headerBottom + 24, padding + margin + 1),
      );
      const bounds = sections.map((level) =>
        document.getElementById(`level-${level}`)?.getBoundingClientRect(),
      );
      let active = 0;
      for (const [index, boundsForLevel] of bounds.entries()) {
        if (boundsForLevel && boundsForLevel.top <= reference) active = index;
      }
      // The page bottom must select the last level even on a very tall viewport.
      if (distance > 0 && window.scrollY >= distance - 1) active = sections.length - 1;
      const current = bounds[active];
      const next = bounds[active + 1];
      const withinLevel =
        current && next
          ? Math.min(1, Math.max(0, (reference - current.top) / (next.top - current.top)))
          : 0;
      setActiveLevel(active);
      setPosition((active + withinLevel) / (sections.length - 1));
    };
    const scheduleUpdate = () => {
      // Limit scroll measurements to one per frame, including layout changes.
      frame ??= window.requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.body);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav
      aria-label={tr({ fr: "Niveaux du programme", en: "Curriculum levels" })}
      className="fixed top-[calc(50%+2.75rem)] left-1 z-30 max-h-[calc(100dvh-7rem)] w-10 -translate-y-1/2 overflow-y-auto py-3 sm:left-3 sm:w-28 xl:left-[max(1rem,calc((100vw-80rem)/2))]"
    >
      <div className="relative">
        <div
          role="progressbar"
          aria-label={tr({ fr: "Progression du défilement", en: "Page scroll progress" })}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${tr(ui.level)} ${activeLevel} · ${percent}%`}
          aria-orientation="vertical"
          className="pointer-events-none absolute top-[22px] bottom-[22px] left-[18px] w-px overflow-hidden bg-border sm:left-[15px]"
        >
          <div
            className="h-full origin-top bg-primary"
            style={{ transform: `scaleY(${position})` }}
          />
        </div>
        <ol className="relative space-y-0">
          {sections.map((level) => {
            const active = activeLevel === level;
            return (
              <li key={level}>
                <a
                  href={`#level-${level}`}
                  aria-label={`${tr(ui.level)} ${level}`}
                  aria-current={active ? "location" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mx-1 sm:px-1.5 ${active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] sm:size-2.5 ${active ? "border-primary bg-primary text-primary-foreground" : level < activeLevel ? "border-primary/70 bg-surface-2 text-primary" : "border-border bg-background"}`}
                  >
                    <span className="sm:hidden">{level}</span>
                  </span>
                  <span className="hidden sm:inline">
                    {tr(ui.level)} {level}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
