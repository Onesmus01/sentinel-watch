import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WardResult } from "@/lib/hazard-model";

type SortKey = "name" | "subCounty" | "score";

const FLOOD_CLASSES = [
  { key: "veryLow", label: "Very Low" },
  { key: "low", label: "Low" },
  { key: "moderate", label: "Moderate" },
  { key: "high", label: "High" },
  { key: "veryHigh", label: "Very High" },
] as const;

export function WardTable({ results }: { results: WardResult[] }) {
  const [sort, setSort] = useState<SortKey>("score");
  const [desc, setDesc] = useState(true);

  const rows = useMemo(() => {
    const direction = desc ? -1 : 1;

    return [...results].sort((a, b) => {
      if (sort === "score") {
        return (a.score - b.score) * direction;
      }

      return a[sort].localeCompare(b[sort]) * direction;
    });
  }, [results, sort, desc]);

  function toggle(key: SortKey) {
    if (key === sort) {
      setDesc((current) => !current);
      return;
    }

    setSort(key);
    setDesc(key === "score");
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          Ward results
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Run the hazard calculation to display ward-level results here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-tight">
            Ward results
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Susceptibility statistics from the latest calculation
          </p>
        </div>

        <span className="text-xs text-muted-foreground">
          {results.length} wards
        </span>
      </div>

      <div className="max-h-[28rem] overflow-auto border-t border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <SortHeader
                label="Ward"
                col="name"
                sort={sort}
                desc={desc}
                onSort={toggle}
              />
              <SortHeader
                label="Sub-county"
                col="subCounty"
                sort={sort}
                desc={desc}
                onSort={toggle}
              />
              <SortHeader
                label="Score"
                col="score"
                sort={sort}
                desc={desc}
                onSort={toggle}
                className="text-right"
              />
              <TableHead>Risk class</TableHead>

              {FLOOD_CLASSES.map((item) => (
                <TableHead key={item.key} className="text-right whitespace-nowrap">
                  {item.label} %
                </TableHead>
              ))}

              <TableHead className="text-right whitespace-nowrap">
                Affected area (km²)
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((ward) => {
              const flood = (
                ward as WardResult & {
                  flood?: {
                    veryLow?: number;
                    low?: number;
                    moderate?: number;
                    high?: number;
                    veryHigh?: number;
                    affectedAreaKm2?: number;
                  };
                }
              ).flood;

              return (
                <TableRow key={ward.id}>
                  <TableCell className="font-medium">
                    {ward.name}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {ward.subCounty}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {ward.score}
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                        style={{
                          backgroundColor: `var(${ward.risk.varName})`,
                        }}
                      />
                      {ward.risk.label}
                    </span>
                  </TableCell>

                  {FLOOD_CLASSES.map((item) => {
                    const value = flood?.[item.key];

                    return (
                      <TableCell
                        key={item.key}
                        className="text-right tabular-nums"
                      >
                        {typeof value === "number"
                          ? `${value.toFixed(2)}%`
                          : "—"}
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-right tabular-nums">
                    {typeof flood?.affectedAreaKm2 === "number"
                      ? flood.affectedAreaKm2.toFixed(2)
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  col,
  sort,
  desc,
  onSort,
  className,
}: {
  label: string;
  col: SortKey;
  sort: SortKey;
  desc: boolean;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort === col;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground"
      >
        {label}
        {active &&
          (desc ? (
            <ArrowDown className="size-3" />
          ) : (
            <ArrowUp className="size-3" />
          ))}
      </button>
    </TableHead>
  );
}