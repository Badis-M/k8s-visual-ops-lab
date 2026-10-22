import { useEffect, useState } from "react";
import { RotateCcw, Rocket } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function VmVsContainerDiagram() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const Layer = ({ label, cls }: { label: string; cls: string }) => (
    <div className={`rounded-md border px-2 py-1.5 text-center font-mono text-[11px] ${cls}`}>{label}</div>
  );
  const apps = ["App A", "App B", "App C"];
  return (
    <figure className="my-8 grid gap-4 rounded-2xl border border-border bg-surface/70 p-5 shadow-card md:grid-cols-2">
      <div>
        <div className="eyebrow mb-3 !text-muted-foreground">{fr ? "Machines virtuelles" : "Virtual machines"}</div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {apps.map((a) => (
              <div key={a} className="space-y-1 rounded-lg border border-dashed border-border p-1.5">
                <Layer label={a} cls="border-worker/40 bg-worker-soft text-worker" />
                <Layer label="libs" cls="border-border bg-surface-2 text-muted-foreground" />
                <Layer label={fr ? "OS invité" : "Guest OS"} cls="border-warning/40 bg-warning/10 text-warning" />
              </div>
            ))}
          </div>
          <Layer label={fr ? "Hyperviseur" : "Hypervisor"} cls="border-control/40 bg-control-soft text-control" />
          <Layer label={fr ? "Matériel" : "Hardware"} cls="border-border bg-surface-2 text-muted-foreground" />
        </div>
      </div>
      <div>
        <div className="eyebrow mb-3 !text-muted-foreground">{fr ? "Conteneurs" : "Containers"}</div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {apps.map((a) => (
              <div key={a} className="space-y-1 rounded-lg border border-dashed border-border p-1.5">
                <Layer label={a} cls="border-worker/40 bg-worker-soft text-worker" />
                <Layer label="libs" cls="border-border bg-surface-2 text-muted-foreground" />
              </div>
            ))}
          </div>
          <Layer label={fr ? "Runtime (containerd)" : "Container runtime (containerd)"} cls="border-control/40 bg-control-soft text-control" />
          <Layer label={fr ? "Noyau Linux partagé · namespaces + cgroups" : "Shared Linux kernel · namespaces + cgroups"} cls="border-warning/40 bg-warning/10 text-warning" />
          <Layer label={fr ? "Matériel" : "Hardware"} cls="border-border bg-surface-2 text-muted-foreground" />
        </div>
      </div>
      <figcaption className="text-xs text-muted-foreground md:col-span-2">
        {fr ? "Chaque VM embarque un OS complet ; les conteneurs partagent le noyau de l'hôte." : "Each VM carries a full OS; containers share the host kernel."}
      </figcaption>
    </figure>
  );
}

export function PodLifecycleDiagram() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const phases = [
    { name: "Pending", text: fr ? "Accepté, pas encore planifié ou images en cours" : "Accepted; not scheduled yet or pulling images", cls: "border-warning/40 text-warning" },
    { name: "Running", text: fr ? "Lié à un nœud, au moins un conteneur actif" : "Bound to a node, at least one container running", cls: "border-worker/40 text-worker" },
    { name: "Succeeded", text: fr ? "Tous les conteneurs terminés avec succès" : "All containers exited 0, won't restart", cls: "border-success/40 text-success" },
    { name: "Failed", text: fr ? "Tous terminés, au moins un en échec" : "All terminated, at least one failed", cls: "border-destructive/40 text-destructive" },
  ];
  return (
    <figure className="my-8 rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
      <div className="eyebrow mb-3">status.phase</div>
      <div className="grid gap-2 sm:grid-cols-4">
        {phases.map((p, i) => (
          <div key={p.name} className={`relative rounded-xl border bg-background/40 p-3 ${p.cls}`}>
            <div className="font-mono text-sm font-semibold">{p.name}</div>
            <div className="mt-1 text-xs text-foreground/70">{p.text}</div>
            {i < 2 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground sm:block">›</span>}
          </div>
        ))}
      </div>
      <div className="eyebrow mt-5 mb-3 !text-muted-foreground">containerStatuses[].state</div>
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        <span className="rounded-md border border-border bg-surface-2 px-2 py-1">Waiting <span className="text-muted-foreground">(ContainerCreating, ImagePullBackOff, CrashLoopBackOff)</span></span>
        <span className="rounded-md border border-border bg-surface-2 px-2 py-1">Running</span>
        <span className="rounded-md border border-border bg-surface-2 px-2 py-1">Terminated <span className="text-muted-foreground">(Completed, Error, OOMKilled)</span></span>
      </div>
    </figure>
  );
}

export function DeploymentTreeDiagram() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const total = 3;
  const [rev, setRev] = useState(1);
  const [oldCount, setOldCount] = useState(3);
  const [newCount, setNewCount] = useState(0);
  const rolling = rev > 1 && (newCount < total || oldCount > 0);

  useEffect(() => {
    if (!rolling) return;
    const t = setTimeout(() => {
      // maxSurge 1, maxUnavailable 0: add one new, then remove one old
      if (newCount + oldCount <= total && newCount < total) setNewCount((n) => n + 1);
      else if (oldCount > 0) setOldCount((o) => o - 1);
    }, 900);
    return () => clearTimeout(t);
  }, [rolling, newCount, oldCount]);

  const RS = ({ name, image, count, tone }: { name: string; image: string; count: number; tone: string }) => (
    <div className={`rounded-xl border bg-background/40 p-3 ${tone}`}>
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="font-semibold">ReplicaSet {name}</span>
        <span className="text-muted-foreground">{count}/{count}</span>
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{image}</div>
      <div className="mt-3 flex min-h-8 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="animate-rise flex h-8 w-11 items-center justify-center rounded-md border border-current/30 bg-current/10 font-mono text-[10px]">Pod</span>
        ))}
      </div>
    </div>
  );

  return (
    <figure className="my-8 rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
          Deployment web · replicas: {total} · revision {rev}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={rolling || rev > 1} onClick={() => setRev(2)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40">
            <Rocket className="size-3.5" />{fr ? "Déployer nginx:1.27" : "Roll out nginx:1.27"}
          </button>
          <button type="button" onClick={() => { setRev(1); setOldCount(3); setNewCount(0); }}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" aria-label="reset"><RotateCcw className="size-3.5" /></button>
        </div>
      </div>
      <div className="ml-4 mt-3 grid gap-3 border-l border-dashed border-border pl-4 sm:grid-cols-2">
        <RS name="web-7d9f" image="nginx:1.26" count={oldCount} tone="text-worker border-worker/30" />
        <RS name="web-5c4b" image="nginx:1.27" count={newCount} tone="text-control border-control/30" />
      </div>
      <figcaption className="mt-4 text-xs text-muted-foreground">
        {fr ? "maxSurge: 1, maxUnavailable: 0 — un nouveau Pod d'abord, puis un ancien est retiré. L'ancien ReplicaSet reste à 0 pour permettre un rollback." :
          "maxSurge: 1, maxUnavailable: 0 — one new Pod first, then one old Pod is removed. The old ReplicaSet stays at 0 to allow rollback."}
      </figcaption>
    </figure>
  );
}
