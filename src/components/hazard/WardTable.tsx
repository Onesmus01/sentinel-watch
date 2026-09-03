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

/**
 * The map's colour-free counterpart. The risk ramp is a single-hue scale, so the
 * two lightest steps sit close together by design; this table is the relief
 * channel that keeps risk readable without relying on the fill colour, and it
 * doubles as the on-screen preview of what a downloaded report contains.
 */
export function WardTable({ results }: { results: WardResult[] }) {
  const [sort, setSort] = useState<SortKey>("score");
  const [desc, setDesc] = useState(true);

  const rows = useMemo(() => {
    const dir = desc ? -1 : 1;
    return [...results].sort((a, b) => {
      if (sort === "score") return (a.score - b.score) * dir;
      return a[sort].localeCompare(b[sort]) * dir;
    });
  }, [results, sort, desc]);

  function toggle(key: SortKey) {
    if (key === sort) {
      setDesc((d) => !d);
      return;
    }
    setSort(key);
    setDesc(key === "score");
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-display text-sm font-semibold tracking-tight">Ward results</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The per-ward table appears here after a run, alongside the map.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-baseline justify-between px-4 py-3">
        <h3 className="font-display text-sm font-semibold tracking-tight">Ward results</h3>
        <span className="text-xs text-muted-foreground">{results.length} wards</span>
      </div>
      <div className="max-h-80 overflow-y-auto border-t border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <SortHeader label="Ward" col="name" sort={sort} desc={desc} onSort={toggle} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.subCounty}</TableCell>
                <TableCell className="text-right tabular-nums">{r.score}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: `var(${r.risk.varName})` }}
                    />
                    {r.risk.label}
                  </span>
                </TableCell>
              </TableRow>
            ))}
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
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort === col;
  // aria-sort belongs on the columnheader, not on the control inside it.
  return (
    <TableHead
      className={className}
      aria-sort={active ? (desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        {active && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
      </button>
    </TableHead>
  );
}
