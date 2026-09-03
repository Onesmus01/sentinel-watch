import { HAZARDS, RISK_CLASSES, type HazardId } from "@/lib/hazard-model";

/**
 * Graduated vertical legend: one contiguous colour bar with the class breaks
 * labelled alongside, rather than five separated swatches. Contiguous is the
 * point — the ramp is a single ordered scale, and gaps between swatches read as
 * five unrelated categories.
 *
 * Class names come from RISK_CLASSES and are deliberately not written here, so
 * the GIS team's final terminology is a one-file change in the model.
 */
export function MapLegend({ hazard, active }: { hazard: HazardId; active: boolean }) {
  const label = HAZARDS.find((h) => h.id === hazard)?.label ?? "";

  // Highest class at the top, the way a graduated legend is conventionally read.
  const descending = [...RISK_CLASSES].reverse();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight">Risk key</h3>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      <div className="mt-3 flex gap-3">
        {/* The ramp. aria-hidden because the list beside it carries every class
            name and range as text; a screen reader gains nothing from the bar. */}
        <div
          aria-hidden="true"
          className="w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/10"
          style={{ opacity: active ? 1 : 0.35 }}
        >
          {descending.map((rc) => (
            <div key={rc.id} className="h-9" style={{ backgroundColor: `var(${rc.varName})` }} />
          ))}
        </div>

        <ul className="flex-1">
          {descending.map((rc) => (
            <li
              key={rc.id}
              // h-9 matches one ramp band, so each label sits against its colour.
              className="flex h-9 items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground">{rc.label}</span>
              <span className="tabular-nums text-xs text-muted-foreground">{rc.range}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {active
          ? "Scores are illustrative demo values. The ward table lists them without relying on colour."
          : "Shading appears once a model run completes."}
      </p>
    </div>
  );
}
