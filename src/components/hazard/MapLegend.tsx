import { HAZARDS, RISK_CLASSES, type HazardId } from "@/lib/hazard-model";

interface Props {
  hazard: HazardId;
  active: boolean;
}

export function MapLegend({ hazard, active }: Props) {
  const label = HAZARDS.find((item) => item.id === hazard)?.label ?? "";

  const descending = [...RISK_CLASSES].reverse();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          Risk key
        </h3>

        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        <div
          aria-hidden="true"
          className="w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/10"
          style={{ opacity: active ? 1 : 0.35 }}
        >
          {descending.map((item) => (
            <div
              key={item.id}
              className="h-9"
              style={{
                backgroundColor: `var(${item.varName})`,
              }}
            />
          ))}
        </div>

        <ul className="flex-1">
          {descending.map((item) => (
            <li
              key={item.id}
              className="flex h-9 items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground">
                {item.label}
              </span>

              {hazard !== "flood" && (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {item.range}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {active
          ? hazard === "flood"
            ? "Classes represent the flood susceptibility categories produced by the GIS calculation."
            : "Classes are shown using the configured hazard model."
          : "Hazard classes appear after an analysis is completed."}
      </p>
    </div>
  );
}
