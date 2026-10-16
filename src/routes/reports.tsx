import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileJson,
  FileSpreadsheet,
  Flame,
  FolderOpen,
  Gauge,
  History,
  Info,
  MapPinned,
  RefreshCw,
  Ruler,
  SlidersHorizontal,
  Waves,
} from "lucide-react";

import { AppHeader } from "@/components/hazard/AppHeader";
import { SiteFooter } from "@/components/hazard/SiteFooter";
import { WardTable } from "@/components/hazard/WardTable";

import {
  DEFAULT_PARAMETERS,
  RISK_CLASSES,
  riskClassForClass,
  type HazardId,
  type WardResult,
} from "@/lib/hazard-model";

import {
  getFloodAnalysis,
  type FloodApiResponse,
  type FloodWardResult,
} from "@/lib/flood_api";

import {
  downloadReport,
  renderReport,
  summarise,
  type ReportFormat,
  type ReportScope,
} from "@/lib/report";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

type FloodTableResult = WardResult & {
  flood: {
    veryLow: number;
    low: number;
    moderate: number;
    high: number;
    veryHigh: number;
    affectedAreaKm2: number;
  };
};

const RISK_COLORS: Record<string, string> = {
  "Very Low": "#16a34a",
  Low: "#84cc16",
  Moderate: "#eab308",
  High: "#f97316",
  "Very High": "#dc2626",
};

const numberFormat = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 2,
});

const formatNumber = (value: number) => numberFormat.format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

function mapFloodWard(ward: FloodWardResult): FloodTableResult {
  return {
    id: ward.id,
    name: ward.name,
    county: ward.county,
    subCounty: ward.subCounty,
    score: ward.score,
    risk: riskClassForClass(ward.riskClass),
    flood: {
      veryLow: ward.flood.veryLow,
      low: ward.flood.low,
      moderate: ward.flood.moderate,
      high: ward.flood.high,
      veryHigh: ward.flood.veryHigh,
      affectedAreaKm2: ward.flood.affectedAreaKm2,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Design tokens (shared class strings)                                */
/* ------------------------------------------------------------------ */

const PAGE_CSS = `
@keyframes rp-shimmer{100%{transform:translateX(100%)}}
.rp-skeleton{position:relative;overflow:hidden;border-radius:0;background:rgb(148 163 184/.22)}
.rp-skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgb(255 255 255/.55),transparent);animation:rp-shimmer 1.4s infinite}
.rp-grid{background-image:linear-gradient(rgb(255 255 255/.06) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255/.06) 1px,transparent 1px);background-size:36px 36px;mask-image:linear-gradient(180deg,#000 30%,transparent)}
.rp-bar{transition:width .8s cubic-bezier(.2,.8,.2,1)}
@media (prefers-reduced-motion:reduce){.rp-skeleton::after{animation:none}.rp-bar{transition:none}}
`;

const card =
  "overflow-hidden border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a1a1f] dark:shadow-none";

const cardHead =
  "flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-teal-50/60 px-4 py-4 dark:border-white/10 dark:from-[#0a1a1f] dark:to-teal-950/30 sm:flex-row sm:items-center sm:justify-between sm:px-6";

const h2 = "text-sm font-bold tracking-tight text-[#0a1f44] dark:text-white";
const sub = "mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a1a1f]";

const TONES = {
  teal: "from-teal-500 to-emerald-600 shadow-teal-900/25",
  blue: "from-sky-500 to-indigo-600 shadow-indigo-900/25",
  red: "from-orange-500 to-red-600 shadow-red-900/25",
  navy: "from-[#16397a] to-[#0a1f44] shadow-slate-900/30",
} as const;

function ReportsPage() {
  const [response, setResponse] = useState<FloodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);

  const [hazard, setHazard] = useState<HazardId>("flood");
  const [county, setCounty] = useState("all");
  const [subCounty, setSubCounty] = useState("all");
  const [ward, setWard] = useState("all");
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [history, setHistory] = useState<
    { filename: string; generatedAt: string; rows: number }[]
  >([]);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadFloodResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getFloodAnalysis();

      setResponse(result);
      setLastLoaded(new Date());
    } catch (err) {
      setResponse(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load flood analysis from Django.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFloodResults();
  }, [loadFloodResults]);

  const calculation = response?.calculation;
  const apiWards = calculation?.wards ?? [];

  const wardResults = useMemo(() => apiWards.map(mapFloodWard), [apiWards]);

  // These options come from actual API analysis records, not demo constants.
  const countyOptions = useMemo(
    () => [...new Set(apiWards.map((item) => item.county))].sort(),
    [apiWards],
  );

  const subCountyOptions = useMemo(() => {
    const filtered =
      county === "all"
        ? apiWards
        : apiWards.filter((item) => item.county === county);

    return [...new Set(filtered.map((item) => item.subCounty))].sort();
  }, [apiWards, county]);

  const wardOptions = useMemo(() => {
    const filtered = apiWards.filter(
      (item) =>
        (county === "all" || item.county === county) &&
        (subCounty === "all" || item.subCounty === subCounty),
    );

    return [...new Set(filtered.map((item) => item.name))].sort();
  }, [apiWards, county, subCounty]);

  const filteredResults = useMemo(
    () =>
      wardResults.filter(
        (item) =>
          (county === "all" || item.county === county) &&
          (subCounty === "all" || item.subCounty === subCounty) &&
          (ward === "all" || item.name === ward),
      ),
    [wardResults, county, subCounty, ward],
  );

  const wardSummary = useMemo(
    () => summarise(filteredResults),
    [filteredResults],
  );

  const rasterSummary = calculation?.summary ?? [];

  const rasterArea = rasterSummary.reduce(
    (total, item) => total + item.area_km2,
    0,
  );

  const veryHighClass = rasterSummary.find(
    (item) => item.label === "Very High",
  );

  const highestWard = useMemo(
    () => [...filteredResults].sort((a, b) => b.score - a.score)[0] ?? null,
    [filteredResults],
  );

  const hasFilters = county !== "all" || subCounty !== "all" || ward !== "all";
  const canExport =
    !loading && !!calculation && filteredResults.length > 0 && hazard === "flood";

  function changeCounty(value: string) {
    setCounty(value);
    setSubCounty("all");
    setWard("all");
  }

  function changeSubCounty(value: string) {
    setSubCounty(value);
    setWard("all");
  }

  function resetFilters() {
    setCounty("all");
    setSubCounty("all");
    setWard("all");
  }

  function exportReport() {
    setExportError(null);

    if (hazard !== "flood") {
      setExportError(
        "Django GIS reports are currently connected for flood analysis only. Drought and landslide exports are unavailable here.",
      );
      return;
    }

    if (!calculation || filteredResults.length === 0) {
      setExportError("There are no real flood ward results matching this scope.");
      return;
    }

    const generatedAt = new Date();

    const scope: ReportScope = {
      county: county === "all" ? "Tana River" : county,
      subCounty,
      ward,
      hazard: "flood",
      parameters: DEFAULT_PARAMETERS,
      // The flood model uses backend GIS factor weights, not these legacy
      // frontend parameters.
      selected: [],
      usedDefaults: true,
      generatedAt,
    };

    const report = renderReport(filteredResults, scope, format);
    downloadReport(report);

    setHistory((previous) => [
      {
        filename: report.filename,
        generatedAt: generatedAt.toLocaleString(),
        rows: filteredResults.length,
      },
      ...previous,
    ]);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#050f12] dark:text-slate-100">
      <style>{PAGE_CSS}</style>
      <AppHeader />

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1f44] via-[#0b3a5c] to-teal-700 p-4 text-white shadow-md sm:p-5">
          <div className="rp-grid pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -right-16 -top-20 size-72 bg-teal-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 bg-sky-400/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-teal-200/90">
                Sentinel Watch / Analytics
              </p>
              <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                Hazard reports
              </h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-teal-50/85">
                Review actual Django flood GIS results, filter returned ward
                records, inspect raster-wide susceptibility and export reports.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              {lastLoaded && (
                <span className="inline-flex items-center justify-center gap-1.5 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-50 ring-1 ring-white/20 backdrop-blur">
                  <Clock3 className="size-3.5" />
                  Updated {lastLoaded.toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                onClick={() => void loadFloodResults()}
                disabled={loading}
                className={`inline-flex h-9 items-center justify-center gap-2 bg-white px-5 text-sm font-bold text-[#0a1f44] shadow-sm transition hover:bg-teal-50 active:scale-[.98] disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading GIS results…" : "Refresh results"}
              </button>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <Metric
            icon={<MapPinned className="size-5" />}
            tone="teal"
            loading={loading}
            label="Returned ward records"
            value={formatNumber(apiWards.length)}
            note="Records returned by the flood API"
          />
          <Metric
            icon={<Ruler className="size-5" />}
            tone="blue"
            loading={loading && !calculation}
            label="Raster analysis area"
            value={calculation ? `${formatNumber(rasterArea)} km²` : "Unavailable"}
            note="Configured GIS raster; independent of filters"
          />
          <Metric
            icon={<Flame className="size-5" />}
            tone="red"
            loading={loading && !veryHighClass}
            label="Very high raster risk"
            value={veryHighClass ? formatPercent(veryHighClass.percentage) : "Unavailable"}
            note={
              veryHighClass
                ? `${formatNumber(veryHighClass.area_km2)} km²`
                : "Waiting for raster summary"
            }
          />
          <Metric
            icon={<Gauge className="size-5" />}
            tone="navy"
            loading={loading && !highestWard}
            label="Highest filtered ward score"
            value={highestWard ? highestWard.score.toFixed(2) : "—"}
            note={highestWard?.name ?? "No matching ward result"}
          />
        </section>

        {/* Status banners */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3.5 border border-red-200 bg-gradient-to-r from-red-50 to-white p-4 text-sm text-red-900 shadow-sm dark:border-red-900/50 dark:from-red-950/60 dark:to-[#0a1a1f] dark:text-red-200"
          >
            <span className="grid size-8 shrink-0 place-items-center bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Unable to load flood GIS results</p>
              <p className="mt-1 break-words">{error}</p>
              <p className="mt-2 text-xs opacity-80">
                Confirm that Django is running and that
                /api/calculations/flood/ responds successfully.
              </p>
            </div>
          </div>
        )}

        {response && calculation && (
          <div className="flex items-start gap-3.5 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/50 dark:to-[#0a1a1f] dark:text-emerald-200">
            <span className="grid size-8 shrink-0 place-items-center bg-emerald-500 text-white shadow-sm">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Real flood calculation loaded successfully</p>
              <p className="mt-1 leading-5 opacity-90">
                Source: Django API · {response.hazard.name} · {apiWards.length}{" "}
                returned ward records
                {lastLoaded ? ` · Refreshed ${lastLoaded.toLocaleTimeString()}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Scope */}
        <section className={card}>
          <div className={cardHead}>
            <div className="flex items-start gap-3">
              <IconBadge><SlidersHorizontal className="size-5" /></IconBadge>
              <div>
                <h2 className={h2}>Report scope</h2>
                <p className={sub}>
                  Filters below select which returned ward records appear in the
                  table and export. They do not rerun the backend raster.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
            <Field label="Hazard">
              <Select
                value={hazard}
                onChange={(value) => {
                  setHazard(value as HazardId);
                  setExportError(null);
                }}
              >
                <option value="flood">Flood — GIS connected</option>
                <option value="drought">Drought — not connected</option>
                <option value="landslide">Landslide — not connected</option>
              </Select>
            </Field>

            <Field label="County">
              <Select
                value={county}
                onChange={changeCounty}
                disabled={countyOptions.length === 0}
              >
                <option value="all">All returned counties</option>
                {countyOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Sub-county">
              <Select
                value={subCounty}
                onChange={changeSubCounty}
                disabled={subCountyOptions.length === 0}
              >
                <option value="all">All returned sub-counties</option>
                {subCountyOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Ward">
              <Select
                value={ward}
                onChange={setWard}
                disabled={wardOptions.length === 0}
              >
                <option value="all">All returned wards</option>
                {wardOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[.03] sm:px-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="bg-teal-600/10 px-3 py-1 font-bold text-teal-800 dark:text-teal-200">
                {filteredResults.length} of {apiWards.length} wards
              </span>
              {[county, subCounty, ward]
                .filter((value) => value !== "all")
                .map((value) => (
                  <span
                    key={value}
                    className="bg-white px-2.5 py-1 font-semibold ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
                  >
                    {value}
                  </span>
                ))}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className={`px-2.5 py-1.5 text-xs font-bold text-teal-800 transition hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-400/10 ${focusRing}`}
            >
              Reset location filters
            </button>
          </div>
        </section>

        {/* Raster distribution */}
        {calculation && (
          <section className={card}>
            <div className={cardHead}>
              <div className="flex items-start gap-3">
                <IconBadge><Waves className="size-5" /></IconBadge>
                <div>
                  <h2 className={h2}>Raster-wide susceptibility distribution</h2>
                  <p className={sub}>
                    These percentages describe the full configured raster, not
                    the selected ward subset.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-3 sm:p-4">
              {/* Stacked overview */}
              <div
                className="flex h-3.5 overflow-hidden bg-slate-100 ring-1 ring-black/5 dark:bg-white/10"
                role="img"
                aria-label="Stacked susceptibility distribution across risk classes"
              >
                {rasterSummary.map((item) => (
                  <div
                    key={item.class}
                    className="rp-bar h-full "
                    style={{
                      width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                      backgroundColor: RISK_COLORS[item.label] ?? "#64748b",
                    }}
                    title={`${item.label}: ${formatPercent(item.percentage)}`}
                  />
                ))}
              </div>

              <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
                {rasterSummary.map((item) => {
                  const color = RISK_COLORS[item.label] ?? "#64748b";

                  return (
                    <div key={item.class} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                          <span
                            className="size-3 ring-1 ring-black/10"
                            style={{ backgroundColor: color }}
                          />
                          {item.label}
                        </span>
                        <span className="tabular-nums text-slate-600 dark:text-slate-400">
                          <b className="text-slate-900 dark:text-white">
                            {formatPercent(item.percentage)}
                          </b>{" "}
                          · {formatNumber(item.area_km2)} km²
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden bg-slate-100 dark:bg-white/10">
                        <div
                          className="rp-bar h-full "
                          style={{
                            width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                            background: `linear-gradient(90deg, ${color}aa, ${color})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-5 dark:border-white/10">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Backend factor weights
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    Object.entries(calculation.weights) as [
                      keyof typeof calculation.weights,
                      number,
                    ][]
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-white/10 dark:from-white/5 dark:to-transparent"
                    >
                      <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                        {key.replaceAll("_", " ")}
                      </p>
                      <p className="mt-0.5 text-lg font-bold tracking-tight text-[#0a1f44] dark:text-white">
                        {formatPercent(value * 100)}
                      </p>
                      <div className="mt-2.5 h-1.5 overflow-hidden bg-slate-200/70 dark:bg-white/10">
                        <div
                          className="rp-bar h-full bg-gradient-to-r from-teal-500 to-emerald-500"
                          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Export */}
        <section className={card}>
          <div className={cardHead}>
            <div className="flex items-start gap-3">
              <IconBadge><Download className="size-5" /></IconBadge>
              <div>
                <h2 className={h2}>Export report</h2>
                <p className={sub}>
                  Download the filtered real ward records as CSV or JSON.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="group"
                aria-label="Export format"
                className="inline-flex bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
              >
                {(
                  [
                    ["csv", "CSV", <FileSpreadsheet key="c" className="size-4" />],
                    ["json", "JSON", <FileJson key="j" className="size-4" />],
                  ] as const
                ).map(([id, text, icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormat(id)}
                    aria-pressed={format === id}
                    className={`inline-flex h-9 items-center gap-2 px-3.5 text-xs font-bold transition ${focusRing} ${
                      format === id
                        ? "bg-[#0a1f44] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {icon}
                    {text}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={exportReport}
                disabled={!canExport}
                className={`inline-flex h-9 items-center gap-2 bg-gradient-to-br from-teal-600 to-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${focusRing}`}
              >
                <Download className="size-4" />
                Download {format.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {exportError && (
              <p
                role="alert"
                className="mb-4 flex items-start gap-2 bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/50"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {exportError}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Export hazard" value={hazard} capitalize />
              <Stat label="Exported ward rows" value={String(filteredResults.length)} />
              <Stat label="Raster scope" value="Tana River configured GIS area" />
            </div>
          </div>
        </section>

        {/* Ward table */}
        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-base font-bold tracking-tight text-[#0a1f44] dark:text-white">
              Ward results
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ward scores, risk classes and flood distribution come from the
              Django calculation response.
            </p>
          </div>

          {loading && !response ? (
            <div className={`${card} space-y-2 p-4`}>
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="rp-skeleton h-8 w-full" />
              ))}
              <p className="pt-1 text-center text-sm text-slate-500">
                Loading flood GIS results…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto ">
              <WardTable results={filteredResults} />
            </div>
          )}
        </section>

        {/* Summary */}
        <section className={card}>
          <div className={cardHead}>
            <div>
              <h2 className={h2}>Current report summary</h2>
              <p className={sub}>
                Risk-class counts below describe filtered ward records, not
                raster pixels.
              </p>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
            {RISK_CLASSES.map((risk) => {
              const count =
                wardSummary.byClass.find((item) => item.id === risk.id)?.count ?? 0;
              const color = RISK_COLORS[risk.label] ?? "#64748b";

              return (
                <div
                  key={risk.id}
                  className="relative overflow-hidden border border-slate-200 bg-white p-3 pt-4 dark:border-white/10 dark:bg-white/5"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1.5"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {risk.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-[#0a1f44] dark:text-white">
                    {count}
                  </p>
                  <p className="text-[11px] text-slate-400">ward records</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className={card}>
          <div className={cardHead}>
            <div className="flex items-start gap-3">
              <IconBadge><History className="size-5" /></IconBadge>
              <div>
                <h2 className={h2}>Export history</h2>
                <p className={sub}>Downloads created during this page session.</p>
              </div>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="grid place-items-center gap-2 px-4 py-6 text-center">
              <span className="grid size-9 place-items-center bg-slate-100 text-slate-400 dark:bg-white/5">
                <Download className="size-5" />
              </span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No reports downloaded in this session yet.
              </p>
              <p className="text-xs text-slate-400">
                Choose a format above and select Download to add one here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/10">
              {history.map((item, index) => (
                <li
                  key={`${item.filename}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center bg-teal-600/10 text-teal-700 dark:text-teal-300">
                      {item.filename.endsWith("json") ? (
                        <FileJson className="size-5" />
                      ) : (
                        <FileSpreadsheet className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.filename}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.generatedAt} · {item.rows} ward rows
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                    Downloaded
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Artifacts */}
        {calculation?.outputs && (
          <section className={card}>
            <div className={cardHead}>
              <div className="flex items-start gap-3">
                <IconBadge><FolderOpen className="size-5" /></IconBadge>
                <div>
                  <h2 className={h2}>Backend GIS artifacts</h2>
                  <p className={sub}>
                    Filesystem paths returned by Django. These are not browser
                    download links.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-2">
              {Object.entries(calculation.outputs).map(([name, path]) => (
                <div
                  key={name}
                  className="min-w-0 bg-slate-50 p-3.5 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
                >
                  <p className="text-xs font-bold capitalize text-slate-700 dark:text-slate-200">
                    {name.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1.5 break-all bg-white px-2.5 py-2 font-mono text-[11px] leading-5 text-slate-500 ring-1 ring-slate-200 dark:bg-black/30 dark:text-slate-400 dark:ring-white/10">
                    {String(path)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scope note */}
        <aside className="flex items-start gap-3.5 border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 text-xs leading-5 text-amber-900 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-[#0a1a1f] dark:text-amber-200 sm:p-5">
          <span className="grid size-9 shrink-0 place-items-center bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Info className="size-4.5" />
          </span>
          <p>
            <strong>Scope and interpretation:</strong> the raster summary and
            factor weights represent the backend's configured flood calculation.
            Location filters only select the ward records currently returned by
            that endpoint; they do not recalculate the raster. Drought and
            landslide calculations are not connected to this report page.
          </p>
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm">
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  loading?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-teal-400 dark:border-white/10 dark:bg-[#0a1a1f]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`grid size-8 shrink-0 place-items-center bg-gradient-to-br text-white shadow-lg ${TONES[tone]}`}
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="rp-skeleton mt-3 h-6 w-2/3" />
      ) : (
        <p className="mt-2 break-words text-lg font-bold tracking-tight text-[#0a1f44] dark:text-white">
          {value}
        </p>
      )}

      <p className="mt-1.5 truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">
        {note}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="bg-slate-50 p-3 ring-1 ring-slate-200/80 dark:bg-white/5 dark:ring-white/10">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-sm font-bold text-slate-800 dark:text-slate-100 ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-9 w-full appearance-none truncate border border-slate-300 bg-white pl-3 pr-9 text-[13px] font-medium text-slate-800 shadow-sm outline-none transition hover:border-teal-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:disabled:bg-white/[.03]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}