
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
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

const NAVY = "#0a1f44";

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

function formatNumber(value: number): string {
  return numberFormat.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

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

  const wardResults = useMemo(
    () => apiWards.map(mapFloodWard),
    [apiWards],
  );

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
    () =>
      [...filteredResults].sort((a, b) => b.score - a.score)[0] ?? null,
    [filteredResults],
  );

  function changeCounty(value: string) {
    setCounty(value);
    setSubCounty("all");
    setWard("all");
  }

  function changeSubCounty(value: string) {
    setSubCounty(value);
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-3 py-5 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Sentinel Watch / Analytics
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0a1f44] sm:text-3xl">
              Hazard reports
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review actual Django flood GIS results, filter returned ward
              records, inspect raster-wide susceptibility and export reports.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFloodResults()}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading GIS results..." : "Refresh results"}
          </button>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Returned ward records"
            value={loading ? "…" : formatNumber(apiWards.length)}
            note="Records returned by the flood API"
          />
          <Metric
            label="Raster analysis area"
            value={
              calculation
                ? `${formatNumber(rasterArea)} km²`
                : loading
                  ? "…"
                  : "Unavailable"
            }
            note="Configured GIS raster; independent of filters"
          />
          <Metric
            label="Very high raster risk"
            value={
              veryHighClass
                ? formatPercent(veryHighClass.percentage)
                : loading
                  ? "…"
                  : "Unavailable"
            }
            note={
              veryHighClass
                ? `${formatNumber(veryHighClass.area_km2)} km²`
                : "Waiting for raster summary"
            }
          />
          <Metric
            label="Highest filtered ward score"
            value={highestWard ? highestWard.score.toFixed(2) : "—"}
            note={highestWard?.name ?? "No matching ward result"}
          />
        </section>

        {error && (
          <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Unable to load flood GIS results</p>
              <p className="mt-1 break-words">{error}</p>
              <p className="mt-2 text-xs">
                Confirm that Django is running and that
                /api/calculations/flood/ responds successfully.
              </p>
            </div>
          </div>
        )}

        {response && calculation && (
          <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Real flood calculation loaded successfully
              </p>
              <p className="mt-1 leading-5">
                Source: Django API · {response.hazard.name} ·{" "}
                {apiWards.length} returned ward records
                {lastLoaded ? ` · Refreshed ${lastLoaded.toLocaleTimeString()}` : ""}
              </p>
            </div>
          </div>
        )}

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-[#0a1f44]">Report scope</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Filters below select which returned ward records appear in the
              table and export. They do not rerun the backend raster.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
            <Field label="Hazard">
              <select
                value={hazard}
                onChange={(event) => {
                  setHazard(event.target.value as HazardId);
                  setExportError(null);
                }}
                className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
              >
                <option value="flood">Flood — GIS connected</option>
                <option value="drought">Drought — not connected</option>
                <option value="landslide">Landslide — not connected</option>
              </select>
            </Field>

            <Field label="County">
              <select
                value={county}
                onChange={(event) => changeCounty(event.target.value)}
                disabled={countyOptions.length === 0}
                className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 disabled:bg-slate-100"
              >
                <option value="all">All returned counties</option>
                {countyOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>

            <Field label="Sub-county">
              <select
                value={subCounty}
                onChange={(event) => changeSubCounty(event.target.value)}
                disabled={subCountyOptions.length === 0}
                className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 disabled:bg-slate-100"
              >
                <option value="all">All returned sub-counties</option>
                {subCountyOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>

            <Field label="Ward">
              <select
                value={ward}
                onChange={(event) => setWard(event.target.value)}
                disabled={wardOptions.length === 0}
                className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 disabled:bg-slate-100"
              >
                <option value="all">All returned wards</option>
                {wardOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-600">
              Showing <strong>{filteredResults.length}</strong> of{" "}
              <strong>{apiWards.length}</strong> returned wards
            </p>
            <button
              type="button"
              onClick={() => {
                setCounty("all");
                setSubCounty("all");
                setWard("all");
              }}
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              Reset location filters
            </button>
          </div>
        </section>

        {calculation && (
          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <Waves className="size-5 text-teal-700" />
                <h2 className="font-semibold text-[#0a1f44]">
                  Raster-wide susceptibility distribution
                </h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                These percentages describe the full configured raster, not the
                selected ward subset.
              </p>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {rasterSummary.map((item) => {
                const color = RISK_COLORS[item.label] ?? "#64748b";

                return (
                  <div key={item.class} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        <span
                          className="size-2.5"
                          style={{ backgroundColor: color }}
                        />
                        {item.label}
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {formatPercent(item.percentage)} ·{" "}
                        {formatNumber(item.area_km2)} km²
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden bg-slate-100">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, item.percentage))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Backend factor weights
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(
                    Object.entries(calculation.weights) as [
                      keyof typeof calculation.weights,
                      number,
                    ][]
                  ).map(([key, value]) => (
                    <div key={key} className="border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">
                        {key.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-lg font-bold text-[#0a1f44]">
                        {formatPercent(value * 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h2 className="font-semibold text-[#0a1f44]">
                Export report
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Download the filtered real ward records as CSV or JSON.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                aria-pressed={format === "csv"}
                className={`inline-flex h-9 items-center gap-2 border px-3 text-xs font-semibold ${
                  format === "csv"
                    ? "border-[#0a1f44] bg-[#0a1f44] text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <FileSpreadsheet className="size-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                aria-pressed={format === "json"}
                className={`inline-flex h-9 items-center gap-2 border px-3 text-xs font-semibold ${
                  format === "json"
                    ? "border-[#0a1f44] bg-[#0a1f44] text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <FileJson className="size-4" />
                JSON
              </button>
              <button
                type="button"
                onClick={exportReport}
                disabled={
                  loading ||
                  !calculation ||
                  filteredResults.length === 0 ||
                  hazard !== "flood"
                }
                className="inline-flex h-9 items-center gap-2 bg-teal-700 px-4 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="size-4" />
                Download {format.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {exportError && (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {exportError}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Export hazard</p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                  {hazard}
                </p>
              </div>
              <div className="bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Exported ward rows</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {filteredResults.length}
                </p>
              </div>
              <div className="bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Raster scope</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Tana River configured GIS area
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0a1f44]">
              Ward results
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Ward scores, risk classes and flood distribution come from the
              Django calculation response.
            </p>
          </div>

          {loading && !response ? (
            <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Loading flood GIS results…
            </div>
          ) : (
            <WardTable results={filteredResults} />
          )}
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-[#0a1f44]">
              Current report summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Risk-class counts below describe filtered ward records, not raster pixels.
            </p>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5 sm:p-5">
            {RISK_CLASSES.map((risk) => {
              const count =
                wardSummary.byClass.find((item) => item.id === risk.id)?.count ?? 0;

              return (
                <div key={risk.id} className="border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{risk.label}</p>
                  <p className="mt-1 text-xl font-bold text-[#0a1f44]">{count}</p>
                  <p className="text-[11px] text-slate-400">ward records</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-[#0a1f44]">Export history</h2>
            <p className="mt-1 text-xs text-slate-500">
              Downloads created during this page session.
            </p>
          </div>

          {history.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No reports downloaded in this session yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((item, index) => (
                <div
                  key={`${item.filename}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium text-slate-800">
                      {item.filename}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.generatedAt} · {item.rows} ward rows
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700">
                    Downloaded
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {calculation?.outputs && (
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="font-semibold text-[#0a1f44]">
                Backend GIS artifacts
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Filesystem paths returned by Django. These are not browser download links.
              </p>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {Object.entries(calculation.outputs).map(([name, path]) => (
                <div key={name} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="text-xs font-semibold text-slate-700">
                    {name.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {path}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="border-l-4 border-amber-400 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <strong>Scope and interpretation:</strong> the raster summary and
          factor weights represent the backend's configured flood calculation.
          Location filters only select the ward records currently returned by
          that endpoint; they do not recalculate the raster. Drought and
          landslide calculations are not connected to this report page.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-bold tracking-tight text-[#0a1f44] sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{note}</p>
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
      <span className="block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
