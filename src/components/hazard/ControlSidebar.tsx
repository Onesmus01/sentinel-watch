import {
  Play, Search, Loader2, RotateCcw, X, Calculator, AlertCircle, CheckCircle2,
  MapPin, ShieldAlert, Waves, SlidersHorizontal, Activity, ChevronRight,
  Layers3, Sparkles, FileOutput, TrendingUp, Ruler,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { HAZARDS, PARAMETERS } from "@/lib/hazard-model";
import type { HazardModel } from "@/hooks/use-hazard-model";
import type { FloodWeights } from "@/lib/flood_api";

/* ------------------------------ Risk palette ------------------------------ */

const RISK_COLORS = {
  veryLow: "#16a34a", low: "#84cc16", moderate: "#eab308", high: "#f97316", veryHigh: "#dc2626",
} as const;

const RISK_CLASS_STYLES = [
  { label: "Very Low", color: RISK_COLORS.veryLow, background: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  { label: "Low", color: RISK_COLORS.low, background: "#f7fee7", border: "#d9f99d", text: "#3f6212" },
  { label: "Moderate", color: RISK_COLORS.moderate, background: "#fefce8", border: "#fde68a", text: "#854d0e" },
  { label: "High", color: RISK_COLORS.high, background: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  { label: "Very High", color: RISK_COLORS.veryHigh, background: "#fef2f2", border: "#fecaca", text: "#991b1b" },
] as const;

function getRiskStyle(label: string) {
  return (
    RISK_CLASS_STYLES.find((i) => i.label.toLowerCase() === label.trim().toLowerCase()) ?? {
      label, color: "#64748b", background: "#f8fafc", border: "#e2e8f0", text: "#334155",
    }
  );
}

const NAVY = "#0a1f44";

const FLOOD_WEIGHT_FIELDS: { key: keyof FloodWeights; label: string; description: string; color: string }[] = [
  { key: "dist_to_river", label: "Distance to river", description: "Influence of proximity to rivers.", color: RISK_COLORS.veryLow },
  { key: "rainfall", label: "Rainfall", description: "Influence of rainfall conditions.", color: RISK_COLORS.moderate },
  { key: "landcover", label: "Land cover", description: "Influence of land-cover characteristics.", color: RISK_COLORS.high },
];

/* ------------------------------ Shared pieces ----------------------------- */

const card = "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]";

function Section({ title, subtitle, children, icon, step }: {
  title: string; subtitle?: string; children: React.ReactNode; icon?: React.ReactNode; step?: number;
}) {
  return (
    <section className="px-3 pt-3 sm:px-4">
      <div className={card}>
        <div className="relative flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5">
          <span className="absolute inset-y-0 left-0 w-1" style={{ background: `linear-gradient(${NAVY}, ${RISK_COLORS.veryLow})` }} />
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-slate-900/20"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #1e3a6e)` }}>
            {icon}
            {typeof step === "number" && (
              <span className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-green-600 text-[9px] font-bold text-white">
                {step}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </section>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0 space-y-1.5">
    <Label className="block text-[13px] font-semibold text-slate-700">{label}</Label>
    {children}
  </div>
);

const HelperMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1.5 text-xs leading-5 text-slate-500">{children}</p>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <p role="alert" className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs leading-5 text-red-700">
    <AlertCircle className="size-3.5 shrink-0" />{message}
  </p>
);

const LoadingMessage = ({ message }: { message: string }) => (
  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
    <Loader2 className="size-3.5 animate-spin" />{message}
  </p>
);

function InfoBanner({ icon, tone, children }: { icon: React.ReactNode; tone: "amber" | "slate"; children: React.ReactNode }) {
  const tones = {
    amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-900 [&_svg]:text-amber-600",
    slate: "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-600 [&_svg]:text-slate-500",
  } as const;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${tones[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="text-xs leading-5">{children}</p>
    </div>
  );
}

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-800 shadow-inner shadow-slate-900/[0.02] transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus-visible:border-[#0a1f44] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#0a1f44]/10 disabled:bg-slate-100 disabled:text-slate-400";

const selectTriggerClass =
  "h-11 w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-800 shadow-inner shadow-slate-900/[0.02] transition-all hover:border-slate-300 hover:bg-white focus:ring-4 focus:ring-[#0a1f44]/10";

const selectContentClass = "rounded-xl border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-900/10";

/* ------------------------------ ControlSidebar ---------------------------- */

export function ControlSidebar({ model }: { model: HazardModel }) {
  const running = model.status === "running";
  const isFlood = model.hazard === "flood";

  const selectedSet = new Set(model.selected);
  const activeSet = new Set(model.activeCriteria);
  const ignoredSet = new Set(model.ignoredCriteria);
  const floodSummary = model.floodCalculation?.summary ?? [];
  const w = model.floodWeights;

  const totalWeight = w.dist_to_river + w.rainfall + w.landcover;
  const weightsAreValid =
    Number.isFinite(totalWeight) && Math.abs(totalWeight - 100) < 0.01 &&
    FLOOD_WEIGHT_FIELDS.every(({ key }) => Number.isFinite(w[key]) && w[key] >= 0 && w[key] <= 100);

  const canRun = !running && model.canRun && (isFlood ? weightsAreValid : model.activeCriteria.length > 0);

  const topClass = floodSummary.length ? [...floodSummary].sort((a, b) => b.percentage - a.percentage)[0] : null;
  const totalArea = floodSummary.reduce((s, i) => s + i.area_km2, 0);

  function normalizeFloodWeights() {
    const total = w.dist_to_river + w.rainfall + w.landcover;
    if (!Number.isFinite(total) || total <= 0) return;
    const distance = Number(((w.dist_to_river / total) * 100).toFixed(2));
    const rainfall = Number(((w.rainfall / total) * 100).toFixed(2));
    const landcover = Number((100 - distance - rainfall).toFixed(2));
    model.setFloodWeight("dist_to_river", distance);
    model.setFloodWeight("rainfall", rainfall);
    model.setFloodWeight("landcover", landcover);
  }

  return (
    <div className="control-sidebar flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900">
      <style>{`
        .control-sidebar .scroll-area{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;
          background-image:radial-gradient(#cbd5e1 1px,transparent 1px);background-size:18px 18px}
        .control-sidebar .scroll-area::-webkit-scrollbar{width:6px}
        .control-sidebar .scroll-area::-webkit-scrollbar-track{background:transparent}
        .control-sidebar .scroll-area::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
        .control-sidebar .scroll-area::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        @keyframes control-sidebar-shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}}
        .control-sidebar .run-shimmer::after{content:"";position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.24) 50%,transparent 60%);
          animation:control-sidebar-shimmer 2.6s ease-in-out infinite}
        @keyframes control-sidebar-pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .control-sidebar .pulse-dot{animation:control-sidebar-pulse 1.6s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.control-sidebar .run-shimmer::after,.control-sidebar .pulse-dot{animation:none}}
      `}</style>

      {/* Header — unchanged */}
      <header className="relative shrink-0 overflow-hidden border-b border-blue-950 bg-[#0a1f44] px-4 py-5 text-white sm:px-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Activity className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold tracking-tight text-white">Analysis workspace</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-200">
              <Sparkles className="size-3" />Configure your hazard assessment
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <span className="pulse-dot size-1.5 rounded-full bg-white" />GIS
          </span>
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
        {/* Hazard selection */}
        <Section title="Hazard selection" subtitle="Choose what to assess" icon={<ShieldAlert className="size-[18px]" />} step={1}>
          <div className="space-y-2.5">
            {HAZARDS.map((hazard) => {
              const active = model.hazard === hazard.id;
              return (
                <button
                  key={hazard.id} type="button" onClick={() => model.setHazard(hazard.id)} aria-pressed={active}
                  className={`group relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1f44] focus-visible:ring-offset-2 ${
                    active
                      ? "border-[#0a1f44]/40 bg-gradient-to-r from-[#0a1f44]/[0.06] via-white to-white shadow-md shadow-[#0a1f44]/10"
                      : "border-slate-200 bg-white hover:-translate-y-px hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5"
                  }`}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-1" style={{ background: NAVY }} />}
                  <span className="relative flex items-start gap-3 pl-1">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                        active ? "text-white shadow-md shadow-[#0a1f44]/30" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                      }`}
                      style={active ? { background: `linear-gradient(135deg, ${NAVY}, #1e3a6e)` } : undefined}
                    >
                      {hazard.id === "flood" ? <Waves className="size-[18px]" /> : <ShieldAlert className="size-[18px]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">{hazard.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{hazard.blurb}</span>
                    </span>
                    <span className="flex h-10 shrink-0 items-center">
                      {active ? <CheckCircle2 className="size-5 text-green-600" /> : <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Geographic area */}
        <Section title="Geographic area" subtitle="County, sub-county and ward" icon={<MapPin className="size-[18px]" />} step={2}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={model.query} onChange={(e) => model.setQuery(e.target.value)}
              placeholder="Search counties..." aria-label="Search county"
              className={`${inputClass} pl-10 pr-10`}
            />
            {model.query && (
              <button type="button" aria-label="Clear search" onClick={() => model.setQuery("")}
                className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="relative mt-5 space-y-4 pl-4">
            <span className="absolute bottom-3 left-[3px] top-3 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-transparent" />

            <Field label="County">
              <Select value={model.county} onValueChange={model.selectCounty}
                disabled={model.countiesLoading || model.filteredCounties.length === 0}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={model.countiesLoading ? "Loading counties..." : model.countiesError ? "Counties unavailable" : model.filteredCounties.length === 0 ? "No counties found" : "Select county"} />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {model.filteredCounties.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {model.countiesError && <ErrorMessage message={model.countiesError} />}
              {!model.countiesLoading && !model.countiesError && model.filteredCounties.length === 0 && <HelperMessage>No counties match your search.</HelperMessage>}
            </Field>

            <Field label="Sub-county">
              <Select value={model.subCounty} onValueChange={model.selectSubCounty}
                disabled={!model.county || model.subCountiesLoading || model.subCounties.length === 0}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={model.subCountiesLoading ? "Loading sub-counties..." : model.subCountiesError ? "Sub-counties unavailable" : "All sub-counties"} />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="all">All sub-counties</SelectItem>
                  {model.subCounties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {model.subCountiesLoading && <LoadingMessage message="Loading sub-counties..." />}
              {model.subCountiesError && <ErrorMessage message={model.subCountiesError} />}
              {!model.subCountiesLoading && !model.subCountiesError && model.subCounties.length === 0 && <HelperMessage>No sub-counties were returned for this county.</HelperMessage>}
            </Field>

            <Field label="Ward">
              <Select value={model.ward} onValueChange={model.setWard}
                disabled={!model.county || model.wardsLoading || model.wards.length === 0}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={model.wardsLoading ? "Loading wards..." : model.wardsError ? "Wards unavailable" : "All wards"} />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="all">All wards</SelectItem>
                  {model.wards.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
              {model.wardsLoading && <LoadingMessage message="Loading wards..." />}
              {model.wardsError && <ErrorMessage message={model.wardsError} />}
              {!model.wardsLoading && !model.wardsError && model.wards.length === 0 && <HelperMessage>No wards were returned for this county.</HelperMessage>}
            </Field>
          </div>

          <div className="mt-5">
            <InfoBanner icon={<MapPin className="size-4" />} tone="amber">
              The flood endpoint currently uses its configured GIS area. Location selections do not yet change the backend calculation area.
            </InfoBanner>
          </div>
        </Section>

        {isFlood ? (
          <>
            {/* Flood calculator */}
            <Section title="Flood calculator" subtitle="GIS-based weighted risk assessment" icon={<Calculator className="size-[18px]" />} step={3}>
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a1f44] shadow-sm ring-1 ring-slate-200">
                  <Waves className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900">Flood susceptibility</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Adjust each factor. The combined weight must equal <strong className="text-slate-800">100%</strong>.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0a1f44] px-2.5 py-1 text-[10px] font-bold text-white">
                  <Layers3 className="size-3" />3
                </span>
              </div>

              {/* Live composition bar */}
              <div className="mb-5">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200"
                  role="img" aria-label={FLOOD_WEIGHT_FIELDS.map((f) => `${f.label} ${w[f.key]}%`).join(", ")}>
                  {FLOOD_WEIGHT_FIELDS.map((f) => (
                    <div key={f.key} className="h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, w[f.key]))}%`, background: f.color }} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {FLOOD_WEIGHT_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:border-slate-300 hover:bg-white">
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="size-3 rounded-md shadow-sm ring-1 ring-black/10" style={{ background: f.color }} />
                      <Label className="flex-1 text-[13px] font-bold text-slate-800">{f.label}</Label>
                      <span className="text-xs font-bold tabular-nums text-slate-500">{Number(w[f.key]).toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number" inputMode="decimal" min={0} max={100} step="0.01"
                        value={w[f.key]} disabled={running}
                        aria-label={`${f.label} weight percentage`}
                        onChange={(e) => {
                          const raw = e.currentTarget.value;
                          if (raw.trim() === "") return;
                          const v = Number(raw);
                          if (!Number.isFinite(v)) return;
                          model.setFloodWeight(f.key, Math.min(100, Math.max(0, v)));
                        }}
                        className={`${inputClass} bg-white pr-10 font-bold tabular-nums`}
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
                    </div>
                    <HelperMessage>{f.description}</HelperMessage>
                  </div>
                ))}
              </div>

              {/* Combined weight */}
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5"
                  style={{ backgroundColor: weightsAreValid ? "#f0fdf4" : "#fffbeb" }}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Combined weight</p>
                    <p className="mt-0.5 text-xs text-slate-500">Weight allocation check</p>
                  </div>
                  <span className="rounded-xl border bg-white px-3 py-1.5 text-lg font-extrabold tabular-nums shadow-sm"
                    style={{ color: weightsAreValid ? "#166534" : "#92400e", borderColor: weightsAreValid ? "#bbf7d0" : "#fde68a" }}>
                    {totalWeight.toFixed(2)}%
                  </span>
                </div>
                <div className="px-4 pb-4 pt-3.5">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Total weight percentage"
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, totalWeight))}>
                    <div className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, totalWeight))}%`, backgroundColor: weightsAreValid ? RISK_COLORS.veryLow : RISK_COLORS.moderate }} />
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    {weightsAreValid
                      ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: RISK_COLORS.veryLow }} />
                      : <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: RISK_COLORS.moderate }} />}
                    <p className="text-xs leading-5" style={{ color: weightsAreValid ? "#166534" : "#854d0e" }}>
                      {weightsAreValid
                        ? "Your weights are balanced and ready for calculation."
                        : "The three weights must total exactly 100% before you can run the calculation."}
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={normalizeFloodWeights}
                    disabled={running || !Number.isFinite(totalWeight) || totalWeight <= 0}
                    className="mt-4 h-10 w-full rounded-xl border-slate-300 bg-white font-bold text-slate-700 shadow-none hover:border-[#0a1f44]/40 hover:bg-slate-50 hover:text-[#0a1f44]">
                    <Calculator className="mr-2 size-4" />Normalize weights to 100%
                  </Button>
                </div>
              </div>

              <Button type="button" variant="ghost" onClick={model.resetFloodWeights} disabled={running}
                className="mt-3 h-10 w-full rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <RotateCcw className="mr-2 size-4" />Restore default weights
              </Button>
            </Section>

            {/* Results */}
            {model.status === "done" && model.floodCalculation && (
              <Section title="Calculation results" subtitle={model.lastRun ? model.lastRun.toLocaleString() : "Latest run"} icon={<CheckCircle2 className="size-[18px]" />}>
                <div className="mb-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><TrendingUp className="size-3.5" />Largest class</p>
                    <p className="mt-1.5 truncate text-sm font-extrabold" style={{ color: topClass ? getRiskStyle(topClass.label).text : "#334155" }}>
                      {topClass?.label ?? "—"}
                    </p>
                    <p className="text-xs tabular-nums text-slate-500">{topClass ? `${topClass.percentage.toFixed(1)}% of area` : "No summary"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Ruler className="size-3.5" />Total area</p>
                    <p className="mt-1.5 text-sm font-extrabold tabular-nums text-slate-900">
                      {totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} km²
                    </p>
                    <p className="text-xs text-slate-500">{floodSummary.length} risk classes</p>
                  </div>
                </div>

                {floodSummary.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-bold text-slate-800">Flood risk distribution</p>
                      <p className="mt-0.5 text-xs text-slate-500">Area and percentage by risk class</p>
                    </div>
                    <div className="flex h-3.5 overflow-hidden">
                      {floodSummary.map((i) => (
                        <div key={i.class} title={`${i.label}: ${i.percentage.toFixed(2)}%`}
                          style={{ width: `${Math.min(100, Math.max(0, i.percentage))}%`, background: getRiskStyle(i.label).color }} />
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[300px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider">Risk class</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Area km²</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {floodSummary.map((item) => {
                            const risk = getRiskStyle(item.label);
                            return (
                              <tr key={item.class} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-semibold"
                                    style={{ color: risk.text, backgroundColor: risk.background, borderColor: risk.border }}>
                                    <span className="size-2 rounded-full" style={{ backgroundColor: risk.color }} />{item.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                  {item.area_km2.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="font-bold tabular-nums" style={{ color: risk.text }}>{item.percentage.toFixed(2)}%</span>
                                  <span className="mt-1 ml-auto block h-1 w-14 overflow-hidden rounded-full bg-slate-100">
                                    <span className="block h-full rounded-full" style={{ width: `${Math.min(100, item.percentage)}%`, background: risk.color }} />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <HelperMessage>The backend completed the calculation but returned no risk-class summary rows.</HelperMessage>
                )}

                <div className="mt-5 space-y-2.5">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileOutput className="size-4 text-slate-600" />Generated GIS outputs</p>
                    <p className="mt-1 text-xs text-slate-500">Output references returned by the calculation service.</p>
                  </div>
                  {Object.entries(model.floodCalculation.outputs).map(([name, path]) => (
                    <div key={name} className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Layers3 className="size-4" /></span>
                        <p className="text-xs font-bold capitalize text-slate-700">{name.replaceAll("_", " ")}</p>
                      </div>
                      <p className="mt-2.5 break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-[11px] leading-5 text-slate-300">{path}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : (
          <Section title="Model parameters" subtitle="Drought and landslide criteria" icon={<SlidersHorizontal className="size-[18px]" />} step={3}>
            <div className="mb-4">
              <InfoBanner icon={<Sparkles className="size-4" />} tone="slate">
                Select criteria and enter values for drought or landslide analysis. These hazards still use the temporary frontend model rather than the real Django GIS calculation.
              </InfoBanner>
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="rounded-full bg-[#0a1f44] px-3 py-1.5 text-xs font-bold text-white">{model.selected.length} selected</span>
              <button type="button" onClick={model.clearParameters} disabled={model.selected.length === 0 || running}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                <X className="size-3.5" />Clear all
              </button>
            </div>

            <div className="space-y-3">
              {PARAMETERS.map((p) => {
                const checked = selectedSet.has(p.id);
                const applicable = activeSet.has(p.id);
                const ignored = ignoredSet.has(p.id);
                return (
                  <div key={p.id} className={`rounded-xl border p-3.5 transition-all ${checked ? "border-[#0a1f44]/40 bg-gradient-to-br from-[#0a1f44]/[0.04] to-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <label className="flex min-h-7 cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={checked} disabled={running} onChange={() => model.toggleParameter(p.id)}
                        className="size-4 shrink-0 cursor-pointer accent-green-700" />
                      <span className="flex-1 text-sm font-bold text-slate-800">{p.label}</span>
                      {applicable && <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-bold text-green-800">Applicable</span>}
                    </label>
                    {ignored && (
                      <p className="mt-2 flex items-center gap-1.5 pl-7 text-xs leading-5 text-amber-700">
                        <AlertCircle className="size-3.5 shrink-0" />This criterion is not used for {model.hazard}.
                      </p>
                    )}
                    {checked && (
                      <div className="mt-4 border-t border-slate-200 pt-3.5">
                        <Label htmlFor={`parameter-${p.id}`} className="mb-2 block text-xs font-semibold text-slate-600">{p.label} ({p.unit})</Label>
                        <div className="flex items-center gap-3">
                          <Input id={`parameter-${p.id}`} type="number" min={p.min} max={p.max} step={p.step}
                            value={model.parameters[p.id]} disabled={running}
                            onChange={(e) => {
                              const v = e.currentTarget.valueAsNumber;
                              if (!Number.isFinite(v)) return;
                              model.setParameter(p.id, Math.min(p.max, Math.max(p.min, v)));
                            }}
                            className={`${inputClass} min-w-0 flex-1 bg-white font-bold`} />
                          <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold tabular-nums text-slate-500">{p.min}–{p.max}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
              <span>
                Applicable criteria: <strong className="text-slate-800">{model.activeCriteria.length}</strong>.{" "}
                {model.activeCriteria.length === 0 ? "Select at least one." : "Ready for review."}
              </span>
              {model.usesDefaults ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-slate-500"><Sparkles className="size-3.5" />Defaults</span>
              ) : (
                <button type="button" onClick={model.resetParameters} disabled={running}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-bold text-[#0a1f44] hover:bg-slate-200 disabled:opacity-40">
                  <RotateCcw className="size-3.5" />Restore defaults
                </button>
              )}
            </div>
          </Section>
        )}

        {model.error && (
          <section className="px-3 pt-3 sm:px-4">
            <div role="alert" className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm">
              <div className="flex items-start gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-900/20">
                  <AlertCircle className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-red-900">Calculation failed</p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words rounded-lg border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-red-800">{model.error}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sticky action */}
      <footer className="z-10 shrink-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5">
        <Button
          onClick={() => void model.run()} disabled={!canRun} size="lg"
          className={`run-shimmer relative h-12 w-full overflow-hidden rounded-xl font-extrabold text-white transition-all focus-visible:ring-2 focus-visible:ring-[#0a1f44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${
            canRun && !running
              ? "bg-gradient-to-r from-[#0a1f44] via-[#12306a] to-[#1e4a9a] shadow-lg shadow-[#0a1f44]/35 ring-1 ring-inset ring-white/10 hover:brightness-125 hover:shadow-xl active:scale-[0.99]"
              : "bg-slate-300"
          }`}
        >
          {running ? (<><Loader2 className="mr-2 size-4 animate-spin" />Running GIS calculation...</>) : (<><Play className="mr-2 size-4 fill-current" />Run calculation</>)}
        </Button>

        <p aria-live="polite" className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-slate-500">
          {running ? (
            <><Loader2 className="size-3.5 animate-spin" />Waiting for the calculation service...</>
          ) : isFlood ? (
            !weightsAreValid ? (
              <><AlertCircle className="size-3.5 shrink-0" style={{ color: RISK_COLORS.moderate }} />Weights must total 100%</>
            ) : (
              <><CheckCircle2 className="size-3.5 shrink-0" style={{ color: RISK_COLORS.veryLow }} />Ready to run flood GIS analysis</>
            )
          ) : model.activeCriteria.length === 0 ? "Select an applicable criterion to continue" : "Runs the temporary frontend model"}
        </p>
      </footer>
    </div>
  );
}