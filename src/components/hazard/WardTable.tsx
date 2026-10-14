
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  X,
  Download,
  MapPinned,
  TrendingUp,
  Gauge,
  Waves,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WardResult } from "@/lib/hazard-model";

type SortKey = "name" | "subCounty" | "score" | "area";

const NAVY = "#0a1f44";

const FLOOD_CLASSES = [
  { key: "veryLow", label: "Very Low", color: "#16a34a" },
  { key: "low", label: "Low", color: "#84cc16" },
  { key: "moderate", label: "Moderate", color: "#eab308" },
  { key: "high", label: "High", color: "#f97316" },
  { key: "veryHigh", label: "Very High", color: "#dc2626" },
] as const;

type FloodStats = Partial<
  Record<(typeof FLOOD_CLASSES)[number]["key"], number>
> & {
  affectedAreaKm2?: number;
};

type Row = WardResult & { flood?: FloodStats };

const num = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const AVATARS = [
  "#0f766e",
  "#047857",
  "#0e7490",
  "#0369a1",
  "#4338ca",
  "#6d28d9",
];

const avatarColor = (name: string) =>
  AVATARS[
    [...name].reduce((total, char) => total + char.charCodeAt(0), 0) %
      AVATARS.length
  ];

function riskColor(label: string, fallback?: string) {
  const normalized = label.toLowerCase().trim();

  const match = FLOOD_CLASSES.find(
    (item) => item.label.toLowerCase() === normalized,
  );

  if (match) return match.color;
  if (normalized.includes("very high")) return "#dc2626";
  if (normalized.includes("high")) return "#f97316";
  if (normalized.includes("moderate") || normalized.includes("medium"))
    return "#eab308";
  if (normalized.includes("very low")) return "#16a34a";
  if (normalized.includes("low")) return "#84cc16";

  if (fallback && /^--[\w-]+$/.test(fallback)) {
    return `var(${fallback})`;
  }

  return "#64748b";
}

function riskOrder(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("very low")) return 0;
  if (normalized === "low" || normalized.endsWith(" low")) return 1;
  if (normalized.includes("moderate") || normalized.includes("medium"))
    return 2;
  if (normalized === "high" || normalized.endsWith(" high")) return 3;
  if (normalized.includes("very high")) return 4;

  return 5;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function WardTable({ results }: { results: WardResult[] }) {
  const [sort, setSort] = useState<SortKey>("score");
  const [desc, setDesc] = useState(true);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  const all = results as Row[];

  const riskLevels = useMemo(() => {
    const map = new Map<
      string,
      { label: string; varName: string; count: number }
    >();

    all.forEach((ward) => {
      const existing = map.get(ward.risk.label);

      if (existing) {
        existing.count += 1;
      } else {
        map.set(ward.risk.label, {
          label: ward.risk.label,
          varName: ward.risk.varName,
          count: 1,
        });
      }
    });

    return [...map.values()].sort(
      (a, b) =>
        riskOrder(a.label) - riskOrder(b.label) ||
        a.label.localeCompare(b.label),
    );
  }, [all]);

  const maxScore = useMemo(
    () => Math.max(1, ...all.map((ward) => ward.score)),
    [all],
  );

  const avgScore = all.length
    ? all.reduce((sum, ward) => sum + ward.score, 0) / all.length
    : 0;

  const topWard = useMemo(
    () => [...all].sort((a, b) => b.score - a.score)[0],
    [all],
  );

  const totalArea = all.reduce(
    (sum, ward) => sum + (ward.flood?.affectedAreaKm2 ?? 0),
    0,
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const direction = desc ? -1 : 1;

    return all
      .filter(
        (ward) =>
          (!riskFilter || ward.risk.label === riskFilter) &&
          (!q ||
            ward.name.toLowerCase().includes(q) ||
            ward.subCounty.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        if (sort === "score") {
          return (a.score - b.score) * direction;
        }

        if (sort === "area") {
          return (
            ((a.flood?.affectedAreaKm2 ?? 0) -
              (b.flood?.affectedAreaKm2 ?? 0)) *
            direction
          );
        }

        return a[sort].localeCompare(b[sort]) * direction;
      });
  }, [all, sort, desc, query, riskFilter]);

  function toggle(key: SortKey) {
    if (key === sort) {
      setDesc((current) => !current);
      return;
    }

    setSort(key);
    setDesc(key === "score" || key === "area");
  }

  function exportCsv() {
    const header = [
      "ward",
      "sub_county",
      "score",
      "risk",
      ...FLOOD_CLASSES.map((item) => `${item.key}_pct`),
      "affected_km2",
    ];

    const lines = rows.map((ward) =>
      [
        csvEscape(ward.name),
        csvEscape(ward.subCounty),
        ward.score,
        csvEscape(ward.risk.label),
        ...FLOOD_CLASSES.map((item) => ward.flood?.[item.key] ?? ""),
        ward.flood?.affectedAreaKm2 ?? "",
      ].join(","),
    );

    const blob = new Blob(
      ["\uFEFF", [header.join(","), ...lines].join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sentinel-ward-results.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const clearFilters = () => {
    setQuery("");
    setRiskFilter(null);
  };

  if (results.length === 0) {
    return (
      <section className="min-w-0 overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div
          className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5"
          style={{ backgroundColor: NAVY }}
        >
          <MapPinned className="size-5 shrink-0 text-emerald-300" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Ward results
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Susceptibility analysis by administrative area
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center px-5 py-9 text-center sm:py-12">
          <span className="grid size-12 place-items-center bg-slate-100 text-slate-500">
            <Inbox className="size-6" />
          </span>

          <h4 className="mt-4 text-sm font-semibold text-slate-900">
            No ward results available
          </h4>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Run a hazard calculation to populate this table with ward
            susceptibility scores, risk classifications, and affected-area
            statistics.
          </p>

          <div
            className="mt-5 flex w-full max-w-xs flex-col gap-1.5 text-left"
            aria-label="Flood risk legend"
          >
            {FLOOD_CLASSES.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 border border-slate-100 px-2 py-1.5"
              >
                <span
                  className="h-4 w-1 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-slate-600">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const stats = [
    {
      icon: <MapPinned className="size-4" />,
      label: "Total wards",
      value: String(all.length),
      note: "In current results",
    },
    {
      icon: <TrendingUp className="size-4" />,
      label: "Highest score",
      value: topWard ? String(topWard.score) : "—",
      note: topWard?.name ?? "No ward",
    },
    {
      icon: <Gauge className="size-4" />,
      label: "Average score",
      value: avgScore.toFixed(1),
      note: "Across all wards",
    },
    {
      icon: <Waves className="size-4" />,
      label: "Affected area",
      value: totalArea
        ? `${totalArea.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })} km²`
        : "—",
      note: "Combined reported area",
    },
  ];

  return (
    <section className="min-w-0 overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white sm:px-5"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center border border-white/15 bg-white/10">
            <MapPinned className="size-4 text-emerald-300" />
          </span>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight">
              Ward susceptibility results
            </h3>
            <p className="mt-0.5 text-[11px] text-white/65">
              Risk classification and affected-area distribution
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-8 items-center gap-2 border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-white lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`min-w-0 bg-white px-3 py-3 sm:px-4 ${
              index < 2 ? "border-b border-slate-200 lg:border-b-0" : ""
            } ${
              index % 2 === 0 ? "border-r border-slate-200" : ""
            } ${
              index === 2 ? "lg:border-l lg:border-r lg:border-slate-200" : ""
            }`}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <span className="text-teal-700">{stat.icon}</span>
              {stat.label}
            </p>

            <p className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {stat.value}
            </p>

            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              {stat.note}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="space-y-3 border-b border-slate-200 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ward or sub-county..."
              aria-label="Search wards"
              className="h-9 w-full border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
            />

            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-500">
            {rows.length} matching {rows.length === 1 ? "ward" : "wards"}
          </span>

          {(query || riskFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-8 items-center gap-1 px-2 text-xs font-medium text-teal-800 hover:bg-teal-50"
            >
              <X className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* Compact vertical risk key */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
          <p className="col-span-full mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Filter by risk class
          </p>

          <button
            type="button"
            onClick={() => setRiskFilter(null)}
            aria-pressed={!riskFilter}
            className={`flex min-h-8 items-center justify-between gap-2 border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
              !riskFilter
                ? "border-[#0a1f44] bg-[#0a1f44] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>All wards</span>
            <span className="tabular-nums opacity-70">{all.length}</span>
          </button>

          {riskLevels.map((level) => {
            const selected = riskFilter === level.label;
            const color = riskColor(level.label, level.varName);

            return (
              <button
                key={level.label}
                type="button"
                onClick={() =>
                  setRiskFilter(selected ? null : level.label)
                }
                aria-pressed={selected}
                className={`flex min-h-8 items-center justify-between gap-2 border px-2.5 py-1.5 text-left text-[11px] transition ${
                  selected
                    ? "bg-slate-50 font-bold"
                    : "border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50"
                }`}
                style={
                  selected
                    ? { color, borderColor: color }
                    : undefined
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-4 w-1 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{level.label}</span>
                </span>

                <span className="shrink-0 tabular-nums text-slate-400">
                  {level.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results table */}
      <div className="max-h-[min(65vh,36rem)] overflow-auto">
        <Table>
          <TableHeader
            className="sticky top-0 z-20 text-white"
            style={{ backgroundColor: NAVY }}
          >
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10 text-center text-[10px] font-semibold text-white/65">
                #
              </TableHead>

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
                className="min-w-[125px]"
              />

              <TableHead className="whitespace-nowrap text-[11px] font-semibold text-white">
                Risk class
              </TableHead>

              <TableHead className="min-w-[130px] text-[11px] font-semibold text-white">
                Distribution
              </TableHead>

              {FLOOD_CLASSES.map((item) => (
                <TableHead
                  key={item.key}
                  className="whitespace-nowrap text-right text-[10px] font-semibold text-white"
                >
                  <span className="inline-flex items-center gap-1 px-1.5 py-1">
                    <span
                      className="size-1.5 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                </TableHead>
              ))}

              <SortHeader
                label="Affected km²"
                col="area"
                sort={sort}
                desc={desc}
                onSort={toggle}
                className="text-right"
              />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={12}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  <Search className="mx-auto mb-2 size-5 text-slate-300" />
                  No wards match your current filters.
                  <button
                    type="button"
                    className="ml-1 font-semibold text-teal-800 hover:underline"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </TableCell>
              </TableRow>
            )}

            {rows.map((ward, index) => {
              const flood = ward.flood;
              const color = riskColor(ward.risk.label, ward.risk.varName);

              return (
                <TableRow
                  key={ward.id}
                  className="group border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <TableCell className="text-center text-[11px] tabular-nums text-slate-400">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className="grid size-7 shrink-0 place-items-center text-[11px] font-bold text-white"
                        style={{ backgroundColor: avatarColor(ward.name) }}
                      >
                        {ward.name.charAt(0).toUpperCase()}
                      </span>

                      <span className="text-xs font-semibold text-slate-800">
                        {ward.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {ward.subCounty}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 shrink-0 overflow-hidden bg-slate-100">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, (ward.score / maxScore) * 100),
                            )}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>

                      <span className="text-xs font-bold tabular-nums text-slate-800">
                        {ward.score}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className="inline-flex items-center gap-1.5 whitespace-nowrap border-l-2 px-2 py-1 text-[10px] font-semibold"
                      style={{
                        color,
                        borderLeftColor: color,
                        backgroundColor: `color-mix(in srgb, ${color} 9%, white)`,
                      }}
                    >
                      <span
                        className="size-1.5 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {ward.risk.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    {flood ? (
                      <div
                        className="flex h-2 overflow-hidden bg-slate-100"
                        role="img"
                        aria-label={FLOOD_CLASSES.map(
                          (item) =>
                            `${item.label} ${flood[item.key] ?? 0}%`,
                        ).join(", ")}
                      >
                        {FLOOD_CLASSES.map((item) => (
                          <span
                            key={item.key}
                            title={`${item.label}: ${(flood[item.key] ?? 0).toFixed(2)}%`}
                            style={{
                              width: `${Math.max(0, flood[item.key] ?? 0)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>

                  {FLOOD_CLASSES.map((item) => {
                    const value = flood?.[item.key];

                    return (
                      <TableCell
                        key={item.key}
                        className="p-1 text-right"
                      >
                        <span
                          className="block px-1.5 py-1.5 text-[11px] tabular-nums"
                          style={
                            num(value) && value > 0
                              ? {
                                  backgroundColor: `color-mix(in srgb, ${item.color} ${Math.min(45, value * 0.5)}%, white)`,
                                  color:
                                    item.key === "low" && value > 15
                                      ? "#365314"
                                      : "#334155",
                                  fontWeight: value >= 30 ? 700 : 500,
                                }
                              : { color: "#94a3b8" }
                          }
                        >
                          {num(value) ? `${value.toFixed(1)}%` : "—"}
                        </span>
                      </TableCell>
                    );
                  })}

                  <TableCell className="whitespace-nowrap text-right text-xs font-semibold tabular-nums text-slate-700">
                    {num(flood?.affectedAreaKm2)
                      ? flood.affectedAreaKm2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="size-3.5 text-teal-700" />
          Showing{" "}
          <strong className="text-slate-800">{rows.length}</strong> of{" "}
          <strong className="text-slate-800">{all.length}</strong> wards
        </div>

        <p className="text-[10px] text-slate-400">
          Cell shading represents each risk class&apos;s share of the ward.
        </p>
      </div>
    </section>
  );
}

function SortHeader({
  label,
  col,
  sort,
  desc,
  onSort,
  className = "",
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
        className={`inline-flex items-center gap-1 whitespace-nowrap px-1 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
          active
            ? "text-emerald-300"
            : "text-white hover:bg-white/10 hover:text-white"
        }`}
      >
        {label}

        {active ? (
          desc ? (
            <ArrowDown className="size-3" />
          ) : (
            <ArrowUp className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-45" />
        )}
      </button>
    </TableHead>
  );
}
