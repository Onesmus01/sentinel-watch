import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Search, X, Download, MapPinned,
  TrendingUp, Gauge, Waves, Inbox,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { WardResult } from "@/lib/hazard-model";

type SortKey = "name" | "subCounty" | "score" | "area";

const FLOOD_CLASSES = [
  { key: "veryLow", label: "Very Low", color: "#16a34a" },
  { key: "low", label: "Low", color: "#84cc16" },
  { key: "moderate", label: "Moderate", color: "#eab308" },
  { key: "high", label: "High", color: "#f97316" },
  { key: "veryHigh", label: "Very High", color: "#dc2626" },
] as const;

type FloodStats = Partial<Record<(typeof FLOOD_CLASSES)[number]["key"], number>> & {
  affectedAreaKm2?: number;
};
type Row = WardResult & { flood?: FloodStats };

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const AVATARS = ["bg-teal-600", "bg-emerald-600", "bg-cyan-600", "bg-sky-600", "bg-indigo-500", "bg-violet-500"];
const avatarColor = (s: string) => AVATARS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];

export function WardTable({ results }: { results: WardResult[] }) {
  const [sort, setSort] = useState<SortKey>("score");
  const [desc, setDesc] = useState(true);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  const all = results as Row[];

  const riskLevels = useMemo(() => {
    const map = new Map<string, { label: string; varName: string; count: number }>();
    all.forEach((w) => {
      const e = map.get(w.risk.label);
      if (e) e.count += 1;
      else map.set(w.risk.label, { label: w.risk.label, varName: w.risk.varName, count: 1 });
    });
    return [...map.values()];
  }, [all]);

  const maxScore = useMemo(() => Math.max(1, ...all.map((w) => w.score)), [all]);
  const avgScore = all.length ? all.reduce((s, w) => s + w.score, 0) / all.length : 0;
  const topWard = useMemo(() => [...all].sort((a, b) => b.score - a.score)[0], [all]);
  const totalArea = all.reduce((s, w) => s + (w.flood?.affectedAreaKm2 ?? 0), 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dir = desc ? -1 : 1;
    return all
      .filter((w) => (!riskFilter || w.risk.label === riskFilter) &&
        (!q || w.name.toLowerCase().includes(q) || w.subCounty.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === "score") return (a.score - b.score) * dir;
        if (sort === "area") return ((a.flood?.affectedAreaKm2 ?? 0) - (b.flood?.affectedAreaKm2 ?? 0)) * dir;
        return a[sort].localeCompare(b[sort]) * dir;
      });
  }, [all, sort, desc, query, riskFilter]);

  function toggle(key: SortKey) {
    if (key === sort) return setDesc((d) => !d);
    setSort(key);
    setDesc(key === "score" || key === "area");
  }

  function exportCsv() {
    const head = ["ward", "sub_county", "score", "risk", ...FLOOD_CLASSES.map((c) => `${c.key}_pct`), "affected_km2"];
    const lines = rows.map((w) => [
      `"${w.name}"`, `"${w.subCounty}"`, w.score, `"${w.risk.label}"`,
      ...FLOOD_CLASSES.map((c) => w.flood?.[c.key] ?? ""), w.flood?.affectedAreaKm2 ?? "",
    ].join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "ward-results.csv" }).click();
    URL.revokeObjectURL(url);
  }

  /* ---------- Default (empty) state ---------- */
  if (results.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-lg shadow-teal-900/20">
            <Inbox className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold tracking-tight">Ward results</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              No results yet. Run the hazard calculation and every ward will appear here, ranked by susceptibility with its risk-class breakdown.
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {FLOOD_CLASSES.map((c) => (
              <span key={c.key} className="h-8 w-3 rounded-full opacity-70" style={{ background: c.color }} />
            ))}
          </div>
        </div>
        <div className="border-t border-border px-5 py-3 sm:px-6" aria-hidden="true">
          {[72, 54, 38].map((w, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="size-8 animate-pulse rounded-full bg-muted" />
              <span className="h-3 animate-pulse rounded-full bg-muted" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { icon: <MapPinned className="size-4" />, label: "Wards", value: String(all.length) },
    { icon: <TrendingUp className="size-4" />, label: "Highest score", value: topWard ? `${topWard.score}` : "—", sub: topWard?.name },
    { icon: <Gauge className="size-4" />, label: "Average score", value: avgScore.toFixed(1) },
    { icon: <Waves className="size-4" />, label: "Affected area", value: totalArea ? `${totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} km²` : "—" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-card to-teal-500/5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-900/20">
            <MapPinned className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight">Ward results</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Susceptibility statistics from the latest calculation</p>
          </div>
        </div>
        <button type="button" onClick={exportCsv}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold shadow-sm transition hover:border-teal-300 hover:bg-teal-500/10 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
          <Download className="size-4" />Export CSV
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="text-teal-600">{s.icon}</span>{s.label}
            </p>
            <p className="mt-1 truncate text-xl font-bold tabular-nums tracking-tight">{s.value}</p>
            {s.sub && <p className="truncate text-[11px] text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 sm:px-5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ward or sub-county…"
            aria-label="Search wards"
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-8 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by risk class">
          <button type="button" onClick={() => setRiskFilter(null)} aria-pressed={!riskFilter}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!riskFilter ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            All <span className="tabular-nums opacity-70">{all.length}</span>
          </button>
          {riskLevels.map((r) => {
            const on = riskFilter === r.label;
            return (
              <button key={r.label} type="button" onClick={() => setRiskFilter(on ? null : r.label)} aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-transparent bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-muted"}`}>
                <span className="size-2 rounded-full" style={{ backgroundColor: `var(${r.varName})` }} />
                {r.label} <span className="tabular-nums opacity-60">{r.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[32rem] overflow-auto border-t border-border">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-card/95 shadow-[0_1px_0_var(--border)] backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center text-xs">#</TableHead>
              <SortHeader label="Ward" col="name" {...{ sort, desc }} onSort={toggle} />
              <SortHeader label="Sub-county" col="subCounty" {...{ sort, desc }} onSort={toggle} />
              <SortHeader label="Score" col="score" {...{ sort, desc }} onSort={toggle} className="min-w-[150px]" />
              <TableHead>Risk class</TableHead>
              <TableHead className="min-w-[160px]">Distribution</TableHead>
              {FLOOD_CLASSES.map((c) => (
                <TableHead key={c.key} className="text-right">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold"
                    style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 12%, transparent)` }}>
                    <span className="size-1.5 rounded-full" style={{ background: c.color }} />{c.label}
                  </span>
                </TableHead>
              ))}
              <SortHeader label="Affected km²" col="area" {...{ sort, desc }} onSort={toggle} className="text-right" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="py-12 text-center text-sm text-muted-foreground">
                  No wards match your filters.{" "}
                  <button type="button" className="font-semibold text-teal-700 hover:underline"
                    onClick={() => { setQuery(""); setRiskFilter(null); }}>Clear filters</button>
                </TableCell>
              </TableRow>
            )}

            {rows.map((w, i) => {
              const f = w.flood;
              const risk = `var(${w.risk.varName})`;
              return (
                <TableRow key={w.id} className="group transition-colors hover:bg-teal-500/5">
                  <TableCell className="text-center text-xs tabular-nums text-muted-foreground">{i + 1}</TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2.5 whitespace-nowrap font-medium">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${avatarColor(w.name)}`}>
                        {w.name.charAt(0).toUpperCase()}
                      </span>
                      {w.name}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-muted-foreground">{w.subCounty}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(w.score / maxScore) * 100}%`, background: risk }} />
                      </div>
                      <span className="w-10 text-right text-sm font-bold tabular-nums">{w.score}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ color: risk, background: `color-mix(in srgb, ${risk} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${risk} 30%, transparent)` }}>
                      <span className="size-1.5 rounded-full" style={{ background: risk }} />
                      {w.risk.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    {f ? (
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-black/5"
                        role="img" aria-label={FLOOD_CLASSES.map((c) => `${c.label} ${f[c.key] ?? 0}%`).join(", ")}>
                        {FLOOD_CLASSES.map((c) => (
                          <span key={c.key} title={`${c.label}: ${(f[c.key] ?? 0).toFixed(2)}%`}
                            style={{ width: `${f[c.key] ?? 0}%`, background: c.color }} />
                        ))}
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  {FLOOD_CLASSES.map((c) => {
                    const v = f?.[c.key];
                    return (
                      <TableCell key={c.key} className="p-1 text-right">
                        <span className="block rounded-md px-2 py-1.5 text-xs tabular-nums"
                          style={num(v) && v > 0 ? {
                            background: `color-mix(in srgb, ${c.color} ${Math.min(55, v * 0.6)}%, transparent)`,
                            fontWeight: v >= 30 ? 700 : 500,
                          } : undefined}>
                          {num(v) ? `${v.toFixed(2)}%` : "—"}
                        </span>
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {num(f?.affectedAreaKm2) ? f!.affectedAreaKm2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
        <span>Showing <b className="text-foreground">{rows.length}</b> of {all.length} wards</span>
        <span className="hidden sm:inline">Cell shading shows each class's share of the ward</span>
      </div>
    </div>
  );
}

function SortHeader({ label, col, sort, desc, onSort, className = "" }: {
  label: string; col: SortKey; sort: SortKey; desc: boolean; onSort: (k: SortKey) => void; className?: string;
}) {
  const active = sort === col;
  return (
    <TableHead className={className} aria-sort={active ? (desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs font-semibold transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${active ? "text-teal-700" : ""}`}>
        {label}
        {active ? (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </TableHead>
  );
}