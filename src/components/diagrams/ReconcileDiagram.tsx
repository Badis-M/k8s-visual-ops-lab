import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

type Pod = { id: string; state: "creating" | "running" | "terminating" };
const rnd = () => Math.random().toString(36).slice(2, 7);

export function ReconcileDiagram() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const [desired, setDesired] = useState(3);
  const [pods, setPods] = useState<Pod[]>(() => ["8x2kq", "p4m7d", "z9w3r"].map((id) => ({ id, state: "running" as const })));
  const [log, setLog] = useState<string[]>([]);
  const desiredRef = useRef(desired);
  desiredRef.current = desired;

  useEffect(() => {
    const t = setInterval(() => {
      setPods((prev) => {
        // advance lifecycles
        let next = prev
          .filter((p) => p.state !== "terminating")
          .map((p) => (p.state === "creating" ? { ...p, state: "running" as const } : p));
        const terminating = prev.filter((p) => p.state === "terminating");
        const live = next.length;
        const want = desiredRef.current;
        if (live < want) {
          const add = Array.from({ length: want - live }, () => ({ id: rnd(), state: "creating" as const }));
          setLog((l) => [`observe ${live} / desire ${want} → create ${want - live}`, ...l].slice(0, 4));
          next = [...next, ...add];
        } else if (live > want) {
          const remove = live - want;
          setLog((l) => [`observe ${live} / desire ${want} → delete ${remove}`, ...l].slice(0, 4));
          next = next.map((p, i) => (i >= want ? { ...p, state: "terminating" as const } : p));
        } else if (terminating.length === 0 && prev.every((p) => p.state === "running")) {
          return prev;
        }
        return next;
      });
    }, 1300);
    return () => clearInterval(t);
  }, []);

  const actual = pods.filter((p) => p.state === "running").length;
  const converged = actual === desired && pods.every((p) => p.state === "running");

  const kill = (id: string) => setPods((ps) => ps.filter((p) => p.id !== id));

  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-surface/70 shadow-card">
      <div className="grid gap-px bg-border md:grid-cols-[14rem_1fr]">
        <div className="space-y-4 bg-surface p-5">
          <div>
            <div className="eyebrow">spec.replicas</div>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" aria-label="decrease" onClick={() => setDesired((d) => Math.max(0, d - 1))} className="rounded-md border border-border p-1.5 hover:bg-surface-2"><Minus className="size-3.5" /></button>
              <span className="w-10 text-center font-mono text-3xl font-semibold text-primary">{desired}</span>
              <button type="button" aria-label="increase" onClick={() => setDesired((d) => Math.min(6, d + 1))} className="rounded-md border border-border p-1.5 hover:bg-surface-2"><Plus className="size-3.5" /></button>
            </div>
          </div>
          <div>
            <div className="eyebrow !text-muted-foreground">status.readyReplicas</div>
            <div className="mt-2 font-mono text-3xl font-semibold text-foreground">{actual}</div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[11px] ${converged ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
            <span className={`size-1.5 rounded-full ${converged ? "bg-success" : "animate-pulse bg-warning"}`} />
            {converged ? (fr ? "convergé" : "converged") : fr ? "réconciliation…" : "reconciling…"}
          </div>
        </div>
        <div className="bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">ReplicaSet · app=web</span>
            <span className="font-mono text-[11px] text-muted-foreground">{fr ? "cliquez un Pod pour le supprimer" : "click a Pod to delete it"}</span>
          </div>
          <div className="mt-4 grid min-h-[7.5rem] grid-cols-3 gap-2.5 sm:grid-cols-6">
            {pods.map((p) => (
              <button key={p.id} type="button" onClick={() => kill(p.id)} disabled={p.state === "terminating"}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border font-mono text-[10px] transition-all duration-500 ${
                  p.state === "running" ? "border-success/40 bg-success/10 text-success" :
                  p.state === "creating" ? "animate-rise border-primary/50 bg-primary/10 text-primary" :
                  "scale-90 border-destructive/40 bg-destructive/10 text-destructive opacity-50"}`}>
                <span className="text-[11px] font-semibold">Pod</span>
                <span className="opacity-80">web-{p.id}</span>
                <span className="mt-1 opacity-70">{p.state === "running" ? "Running" : p.state === "creating" ? "Creating" : "Terminating"}</span>
                {p.state === "running" && <Trash2 className="absolute right-1.5 top-1.5 size-3 opacity-0 transition group-hover:opacity-100" />}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-code px-3 py-2 font-mono text-[11px] leading-5 text-muted-foreground">
            {log.length === 0 ? <span>controller: {fr ? "en attente d'un écart…" : "waiting for drift…"}</span> :
              log.map((l, i) => <div key={i} className={i === 0 ? "text-foreground/90" : ""}>replicaset-controller: {l}</div>)}
          </div>
        </div>
      </div>
      <figcaption className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        {fr ? "Observer → comparer → agir. Le contrôleur ne mémorise pas d'événements : il compare l'état courant à l'état désiré à chaque passage." :
          "Observe → diff → act. The controller doesn't remember events: it compares current state with desired state on every pass."}
      </figcaption>
    </figure>
  );
}
