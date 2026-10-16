
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Gauge,
  MapPinned,
  Search,
  ShieldCheck,
  TrendingUp,
  Waves,
  X,
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

export interface DefaultWard {
  id: string;
  name: string;
  county: string;
  subCounty: string;
}

type TableWard = DefaultWard & {
  score?: number;
  risk?: WardResult["risk"];
  flood?: FloodStats;
  analysed: boolean;
};

interface Props {
  results: WardResult[];

  /**
   * Supply the actual ward directory from your application/API.
   * These wards appear before any hazard calculation is run.
   */
  defaultWards?: DefaultWard[];
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const AVATARS = [
  "#0f766e",
  "#047857",
  "#0e7490",
  "#0369a1",
  "#4338ca",
  "#6d28d9",
];

function avatarColor(name: string) {
  return AVATARS[
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      AVATARS.length
  ];
}

function riskColor(label?: string) {
  const normalized = label?.toLowerCase().trim() ?? "";

  if (normalized.includes("very high")) return "#dc2626";
  if (normalized.includes("high")) return "#f97316";
  if (normalized.includes("moderate") || normalized.includes("medium")) {
    return "#eab308";
  }
  if (normalized.includes("very low")) return "#16a34a";
  if (normalized.includes("low")) return "#84cc16";

  return "#64748b";
}

function riskOrder(label?: string) {
  const normalized = label?.toLowerCase() ?? "";

  if (normalized.includes("very low")) return 0;
  if (normalized.includes("very high")) return 4;
  if (normalized.includes("moderate") || normalized.includes("medium")) {
    return 2;
  }
  if (normalized.includes("high")) return 3;
  if (normalized.includes("low")) return 1;

  return 5;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function WardTable({ results, defaultWards = [] }: Props) {
  const [sort, setSort] = useState<SortKey>("name");
  const [desc, setDesc] = useState(false);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  /*
   * Use actual calculated results when available.
   * Otherwise show the supplied ward directory without fabricated scores.
   */
  const all = useMemo<TableWard[]>(() => {
    if (results.length > 0) {
      return results.map((ward) => ({
        id: ward.id,
        name: ward.name,
        county: ward.county,
        subCounty: ward.subCounty,
        score: ward.score,
        risk: ward.risk,
        flood: (ward as WardResult & { flood?: FloodStats }).flood,
        analysed: true,
      }));
    }

    return defaultWards.map((ward) => ({
      ...ward,
      analysed: false,
    }));
  }, [results, defaultWards]);

  const hasResults = results.length > 0;

  const riskLevels = useMemo(() => {
    const counts = new Map<string, number>();

    all.forEach((ward) => {
      if (!ward.analysed || !ward.risk) return;

      counts.set(
        ward.risk.label,
        (counts.get(ward.risk.label) ?? 0) + 1,
      );
    });

    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort(
        (a, b) =>
          riskOrder(a.label) - riskOrder(b.label) ||
          a.label.localeCompare(b.label),
      );
  }, [all]);

  const analysedWards = all.filter(
    (ward) => ward.analysed && isNumber(ward.score),
  );

  const averageScore = analysedWards.length
    ? analysedWards.reduce((sum, ward) => sum + ward.score!, 0) /
      analysedWards.length
    : null;

  const topWard = [...analysedWards].sort(
    (a, b) => b.score! - a.score!,
  )[0];

  const totalArea = all.reduce(
    (sum, ward) => sum + (ward.flood?.affectedAreaKm2 ?? 0),
    0,
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return all
      .filter((ward) => {
        const matchesSearch =
          !q ||
          ward.name.toLowerCase().includes(q) ||
          ward.subCounty.toLowerCase().includes(q) ||
          ward.county.toLowerCase().includes(q);

        const matchesRisk =
          !riskFilter ||
          (ward.analysed && ward.risk?.label === riskFilter);

        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sort === "score") {
          comparison =
            (a.score ?? -1) - (b.score ?? -1);
        } else if (sort === "area") {
          comparison =
            (a.flood?.affectedAreaKm2 ?? -1) -
            (b.flood?.affectedAreaKm2 ?? -1);
        } else {
          comparison = a[sort].localeCompare(b[sort]);
        }

        return desc ? -comparison : comparison;
      });
  }, [all, sort, desc, query, riskFilter]);

  function toggleSort(key: SortKey) {
    if (key === sort) {
      setDesc((current) => !current);
    } else {
      setSort(key);
      setDesc(key === "score" || key === "area");
    }
  }

  function exportCsv() {
    const header = [
      "ward",
      "county",
      "sub_county",
      "analysis_status",
      "score",
      "risk",
      ...FLOOD_CLASSES.map((item) => `${item.key}_pct`),
      "affected_km2",
    ];

    const lines = rows.map((ward) =>
      [
        csvEscape(ward.name),
        csvEscape(ward.county),
        csvEscape(ward.subCounty),
        csvEscape(ward.analysed ? "Analysed" : "Not analysed"),
        ward.score ?? "",
        csvEscape(ward.risk?.label ?? ""),
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

  function clearFilters() {
    setQuery("");
    setRiskFilter(null);
  }

  const stats = [
    {
      icon: <MapPinned className="size-4" />,
      label: "Total wards",
      value: String(all.length),
      note: "Available in directory",
    },
    {
      icon: <TrendingUp className="size-4" />,
      label: "Highest score",
      value: topWard ? String(topWard.score) : "—",
      note: topWard?.name ?? "Awaiting analysis",
    },
    {
      icon: <Gauge className="size-4" />,
      label: "Average score",
      value: averageScore === null ? "—" : averageScore.toFixed(1),
      note: hasResults ? "Across available results" : "Awaiting analysis",
    },
    {
      icon: <Waves className="size-4" />,
      label: "Affected area",
      value: totalArea
        ? `${totalArea.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })} km²`
        : "—",
      note: "Reported GIS area",
    },
  ];

  return (
    <section className="min-w-0 overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white sm:px-5"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center border border-white/15 bg-white/10">
            <MapPinned className="size-4 text-emerald-300" />
          </span>

          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Ward susceptibility results
            </h3>
            <p className="mt-0.5 text-[11px] text-white/65">
              Ward directory and GIS risk analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="border border-white/20 px-2 py-1 text-[10px]">
            {hasResults ? "Analysis available" : "Default ward view"}
          </span>

          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="inline-flex h-8 items-center gap-2 border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-slate-200 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`min-w-0 px-3 py-3 sm:px-4 ${
              index < 2 ? "border-b border-slate-200 lg:border-b-0" : ""
            } ${
              index % 2 === 0 ? "border-r border-slate-200" : ""
            }`}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <span className="text-teal-700">{stat.icon}</span>
              {stat.label}
            </p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {stat.value}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              {stat.note}
            </p>
          </div>
        ))}
      </div>

      {!hasResults && (
        <div className="flex items-start gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" />
          <p className="text-xs leading-5 text-slate-600">
            Default ward records are available below. Risk scores,
            susceptibility classes, and affected areas will appear after
            real GIS analysis results are provided.
          </p>
        </div>
      )}

      <div className="space-y-3 border-b border-slate-200 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ward, county or sub-county..."
              aria-label="Search wards"
              className="h-9 w-full border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
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

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRiskFilter(null)}
            aria-pressed={!riskFilter}
            className={`min-h-8 border px-3 py-1.5 text-[11px] font-semibold ${
              !riskFilter
                ? "border-[#0a1f44] bg-[#0a1f44] text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All wards ({all.length})
          </button>

          {riskLevels.map((level) => {
            const selected = riskFilter === level.label;
            const color = riskColor(level.label);

            return (
              <button
                key={level.label}
                type="button"
                onClick={() =>
                  setRiskFilter(selected ? null : level.label)
                }
                aria-pressed={selected}
                className="flex min-h-8 items-center gap-2 border px-2.5 py-1.5 text-[11px]"
                style={{
                  color: selected ? color : "#475569",
                  borderColor: selected ? color : "#e2e8f0",
                  fontWeight: selected ? 700 : 500,
                }}
              >
                <span
                  className="h-4 w-1"
                  style={{ backgroundColor: color }}
                />
                {level.label} ({level.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[min(65vh,36rem)] overflow-auto">
        <Table>
          <TableHeader
            className="sticky top-0 z-20 text-white"
            style={{ backgroundColor: NAVY }}
          >
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-10 text-center text-[10px] text-white/65">
                #
              </TableHead>
              <SortHeader label="Ward" col="name" sort={sort} desc={desc} onSort={toggleSort} />
              <SortHeader label="Sub-county" col="subCounty" sort={sort} desc={desc} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-[11px] text-white">
                County
              </TableHead>
              <SortHeader label="Score" col="score" sort={sort} desc={desc} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-[11px] text-white">
                Risk class
              </TableHead>
              <TableHead className="min-w-[120px] text-[11px] text-white">
                Distribution
              </TableHead>
              {FLOOD_CLASSES.map((item) => (
                <TableHead
                  key={item.key}
                  className="whitespace-nowrap text-right text-[10px] text-white"
                >
                  {item.label}
                </TableHead>
              ))}
              <SortHeader label="Affected km²" col="area" sort={sort} desc={desc} onSort={toggleSort} />
              <TableHead className="whitespace-nowrap text-[11px] text-white">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="py-12 text-center text-sm text-slate-500"
                >
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
              const color = riskColor(ward.risk?.label);
              const flood = ward.flood;

              return (
                <TableRow
                  key={ward.id}
                  className="border-slate-100 transition-colors hover:bg-slate-50"
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
                    {ward.subCounty || "—"}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {ward.county || "—"}
                  </TableCell>

                  <TableCell>
                    {ward.analysed && isNumber(ward.score) ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden bg-slate-100">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, ward.score))}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-slate-800">
                          {ward.score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {ward.analysed && ward.risk ? (
                      <span
                        className="inline-flex items-center gap-1.5 whitespace-nowrap border-l-2 px-2 py-1 text-[10px] font-semibold"
                        style={{
                          color,
                          borderLeftColor: color,
                          backgroundColor: `color-mix(in srgb, ${color} 9%, white)`,
                        }}
                      >
                        {ward.risk.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Not analysed
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {flood ? (
                      <div
                        className="flex h-2 min-w-[100px] overflow-hidden bg-slate-100"
                        role="img"
                        aria-label={FLOOD_CLASSES.map(
                          (item) =>
                            `${item.label} ${flood[item.key] ?? 0}%`,
                        ).join(", ")}
                      >
                        {FLOOD_CLASSES.map((item) => (
                          <span
                            key={item.key}
                            title={`${item.label}: ${(flood[item.key] ?? 0).toFixed(1)}%`}
                            style={{
                              width: `${Math.max(0, Math.min(100, flood[item.key] ?? 0))}%`,
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
                      <TableCell key={item.key} className="p-1 text-right">
                        <span className="block px-1.5 py-1.5 text-[11px] tabular-nums text-slate-500">
                          {isNumber(value) ? `${value.toFixed(1)}%` : "—"}
                        </span>
                      </TableCell>
                    );
                  })}

                  <TableCell className="whitespace-nowrap text-right text-xs font-semibold tabular-nums text-slate-700">
                    {isNumber(flood?.affectedAreaKm2)
                      ? flood.affectedAreaKm2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`whitespace-nowrap text-[10px] font-semibold ${
                        ward.analysed ? "text-teal-700" : "text-slate-500"
                      }`}
                    >
                      {ward.analysed ? "Analysed" : "Not run"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="size-3.5 text-teal-700" />
          Showing <strong className="text-slate-800">{rows.length}</strong> of{" "}
          <strong className="text-slate-800">{all.length}</strong> wards
        </div>
        <p className="text-[10px] text-slate-400">
          Risk statistics appear only when calculated GIS results are available.
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
}: {
  label: string;
  col: SortKey;
  sort: SortKey;
  desc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const active = sort === col;

  return (
    <TableHead
      aria-sort={active ? (desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 whitespace-nowrap px-1 py-1 text-[11px] font-semibold ${
          active
            ? "text-emerald-300"
            : "text-white hover:bg-white/10"
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
