import { useState } from "react";
import { Loader2 } from "lucide-react";
import { wardPolygon, type WardResult } from "@/lib/hazard-model";

interface Props {
  county: string;
  results: WardResult[];
  status: "idle" | "running" | "done";
}

export function MapFrame({ county, results, status }: Props) {
  const [hovered, setHovered] = useState<WardResult | null>(null);
  const showing = results.length > 0 && status !== "running";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-map shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 bg-card/60 px-4 py-2.5 backdrop-blur">
        <div>
          <p className="font-display text-sm font-semibold tracking-tight">{county} County</p>
          <p className="text-xs text-muted-foreground">
            {showing ? `${results.length} wards modelled` : "Awaiting model run"}
          </p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          Ward boundaries · demo
        </span>
      </div>

      <div className="relative aspect-4/3 w-full sm:aspect-16/10">
        <svg
          viewBox="-6 -6 112 112"
          className="size-full"
          role="img"
          aria-label={`Hazard risk map of ${county} County`}
        >
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M8 0H0V8"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect x="-6" y="-6" width="112" height="112" fill="url(#grid)" />

          {results.map((r, i) => (
            <polygon
              key={r.id}
              points={wardPolygon(i, results.length, r.id)}
              fill={showing ? `var(${r.risk.varName})` : "var(--muted)"}
              stroke="var(--card)"
              strokeWidth="0.6"
              className="cursor-pointer transition-[fill,opacity] duration-500"
              opacity={hovered && hovered.id !== r.id ? 0.55 : 1}
              onMouseEnter={() => setHovered(r)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {results.length === 0 && status !== "running" && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="max-w-xs">
              <p className="font-display text-sm font-semibold">No results yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a hazard and a location, select the criteria the run should account for, then
                press Run to render risk classes on the map.
              </p>
            </div>
          </div>
        )}

        {status === "running" && (
          <div className="absolute inset-0 grid place-items-center bg-card/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Calculating risk surface…
            </div>
          </div>
        )}

        {hovered && showing && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-card/95 px-3 py-2 text-xs shadow-md">
            <p className="font-medium text-foreground">{hovered.name}</p>
            <p className="text-muted-foreground">{hovered.subCounty}</p>
            <p className="mt-1 flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: `var(${hovered.risk.varName})` }}
              />
              <span className="text-foreground">{hovered.risk.label}</span>
              <span className="tabular-nums text-muted-foreground">score {hovered.score}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
