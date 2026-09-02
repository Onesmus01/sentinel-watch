import { HAZARDS, RISK_CLASSES, type HazardId } from "@/lib/hazard-model";

export function MapLegend({ hazard, active }: { hazard: HazardId; active: boolean }) {
  const label = HAZARDS.find((h) => h.id === hazard)?.label ?? "";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight">Risk key</h3>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {RISK_CLASSES.map((rc) => (
          <li key={rc.id} className="flex items-center gap-3 text-sm">
            <span
              className="size-4 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: `var(${rc.varName})`, opacity: active ? 1 : 0.35 }}
            />
            <span className="flex-1 text-foreground">{rc.label}</span>
            <span className="tabular-nums text-xs text-muted-foreground">{rc.range}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        Shading appears once a model run completes.
      </p>
    </div>
  );
}
