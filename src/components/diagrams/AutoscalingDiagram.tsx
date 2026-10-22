import { useId, useState } from "react";
import { useLang } from "@/lib/i18n";

/** Isolate the denominator effect; this is deliberately not a controller emulator. */
export function AutoscalingDiagram() {
  const { tr } = useLang();
  const [request, setRequest] = useState(100);
  const inputId = useId();
  const utilization = (50 / request) * 100;
  const replicas = Math.ceil((2 * utilization) / 50);

  return (
    <figure className="my-8 rounded-2xl border border-primary/25 bg-surface p-4 sm:p-6">
      <figcaption className="text-base font-semibold text-foreground">
        {tr({
          en: "The same usage, a different utilization signal",
          fr: "Même usage, autre signal d’utilisation",
        })}
      </figcaption>
      <p className="mt-2 text-sm text-muted-foreground">
        {tr({
          en: "Two replicas each consume 50m CPU. The utilization target is 50%. Change only their CPU request.",
          fr: "Deux réplicas consomment chacun 50m CPU. La cible d’utilisation vaut 50 %. Modifiez uniquement leur request CPU.",
        })}
      </p>
      <label htmlFor={inputId} className="mt-5 block text-sm font-medium">
        {tr({ en: "CPU request per replica", fr: "Request CPU par réplica" })}: {request}m
      </label>
      <input
        id={inputId}
        type="range"
        min={25}
        max={200}
        step={25}
        value={request}
        onChange={(event) => setRequest(Number(event.target.value))}
        className="mt-3 w-full accent-primary"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs text-muted-foreground">
            {tr({ en: "Usage / request", fr: "Usage / request" })}
          </div>
          <div className="mt-1 font-mono text-lg">50m / {request}m</div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-xs text-muted-foreground">
            {tr({ en: "Average utilization", fr: "Utilisation moyenne" })}
          </div>
          <div className="mt-1 font-mono text-lg">{Math.round(utilization * 10) / 10}%</div>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="text-xs text-muted-foreground">
            {tr({ en: "Nominal replica count", fr: "Nombre nominal de réplicas" })}
          </div>
          <output className="mt-1 block font-mono text-lg">{replicas}</output>
        </div>
      </div>
      <p className="mt-4 break-words font-mono text-xs text-muted-foreground">
        ceil(2 × {Math.round(utilization * 10) / 10} / 50) = {replicas}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {tr({
          en: "This simplified calculation excludes tolerance, missing metrics, readiness adjustments, stabilization and min/max replicas. It predicts neither real cluster behavior nor future workload demand.",
          fr: "Ce calcul simplifié exclut tolérance, métriques manquantes, ajustements de readiness, stabilisation et bornes min/max. Il ne prédit ni le comportement réel d’un cluster ni la demande future.",
        })}
      </p>
    </figure>
  );
}
