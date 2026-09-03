import {
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  type HazardId,
  type ParameterValues,
  type WardResult,
} from "./hazard-model";

export type ReportFormat = "csv" | "json";

export interface ReportScope {
  county: string;
  subCounty: string;
  ward: string;
  hazard: HazardId;
  parameters: ParameterValues;
  usedDefaults: boolean;
  generatedAt: Date;
}

export interface ReportSummary {
  wards: number;
  averageScore: number;
  highestScore: number;
  highestWard: string;
  /** count per risk class, keyed by RISK_CLASSES id, in ramp order */
  byClass: { id: string; label: string; count: number }[];
}

/**
 * Whole-of-report statistics. Pure so the same numbers appear in the on-screen
 * summary, the CSV footer and the JSON payload — one implementation, no drift.
 */
export function summarise(results: WardResult[]): ReportSummary {
  if (results.length === 0) {
    return {
      wards: 0,
      averageScore: 0,
      highestScore: 0,
      highestWard: "",
      byClass: RISK_CLASSES.map((rc) => ({ id: rc.id, label: rc.label, count: 0 })),
    };
  }
  const top = results.reduce((a, b) => (b.score > a.score ? b : a));
  return {
    wards: results.length,
    averageScore: Math.round(results.reduce((s, r) => s + r.score, 0) / results.length),
    highestScore: top.score,
    highestWard: top.name,
    byClass: RISK_CLASSES.map((rc) => ({
      id: rc.id,
      label: rc.label,
      count: results.filter((r) => r.risk.id === rc.id).length,
    })),
  };
}

/** RFC 4180: quote a field only when it needs it, and double any inner quote. */
function csvField(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_COLUMNS = [
  "county",
  "sub_county",
  "ward",
  "hazard",
  "risk_score",
  "risk_class",
  "gradient_pct",
  "rainfall_mm",
  "temperature_c",
  "humidity_pct",
  "generated_at",
] as const;

export function toCsv(results: WardResult[], scope: ReportScope): string {
  const p = scope.parameters;
  const stamp = scope.generatedAt.toISOString();
  const lines = [CSV_COLUMNS.join(",")];
  for (const r of results) {
    lines.push(
      [
        r.county,
        r.subCounty,
        r.name,
        scope.hazard,
        r.score,
        r.risk.label,
        p.gradient,
        p.rainfall,
        p.temperature,
        p.humidity,
        stamp,
      ]
        .map(csvField)
        .join(","),
    );
  }
  // Trailing newline: POSIX text file, and it stops spreadsheets from folding
  // the last data row into the one before it on re-import.
  return lines.join("\n") + "\n";
}

export function toJson(results: WardResult[], scope: ReportScope): string {
  const hazardLabel = HAZARDS.find((h) => h.id === scope.hazard)?.label ?? scope.hazard;
  return JSON.stringify(
    {
      report: "sentinel-watch-hazard-assessment",
      version: 1,
      generatedAt: scope.generatedAt.toISOString(),
      scope: {
        county: scope.county,
        subCounty: scope.subCounty === "all" ? null : scope.subCounty,
        ward: scope.ward === "all" ? null : scope.ward,
        hazard: scope.hazard,
        hazardLabel,
      },
      parameters: {
        values: scope.parameters,
        usedSystemDefaults: scope.usedDefaults,
        definitions: PARAMETERS.map((d) => ({ id: d.id, label: d.label, unit: d.unit })),
      },
      summary: summarise(results),
      wards: results.map((r) => ({
        id: r.id,
        name: r.name,
        subCounty: r.subCounty,
        county: r.county,
        score: r.score,
        riskClass: r.risk.id,
        riskLabel: r.risk.label,
      })),
      disclaimer:
        "Illustrative demo values from a placeholder scoring model. Not for operational decisions.",
    },
    null,
    2,
  );
}

/** Filesystem-safe slug: lowercase, single dashes, no leading/trailing dash. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Deterministic filename. Same scope and instant always yields the same name,
 * so a re-download overwrites rather than piling up "(1)" copies, and two
 * different scopes never collide.
 */
export function reportFilename(scope: ReportScope, format: ReportFormat): string {
  const parts = ["sentinel", slug(scope.county)];
  if (scope.subCounty !== "all") parts.push(slug(scope.subCounty));
  if (scope.ward !== "all") parts.push(slug(scope.ward));
  parts.push(scope.hazard);
  // Second precision, colon-free: ":" is illegal in Windows filenames.
  parts.push(scope.generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-"));
  return `${parts.join("_")}.${format}`;
}

export function renderReport(
  results: WardResult[],
  scope: ReportScope,
  format: ReportFormat,
): { filename: string; mime: string; body: string } {
  return {
    filename: reportFilename(scope, format),
    mime: format === "csv" ? "text/csv;charset=utf-8" : "application/json",
    body: format === "csv" ? toCsv(results, scope) : toJson(results, scope),
  };
}

/**
 * Browser-only. Kept apart from the pure builders above so the report content is
 * unit-testable without a DOM.
 */
export function downloadReport(file: { filename: string; mime: string; body: string }): void {
  const url = URL.createObjectURL(new Blob([file.body], { type: file.mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next tick: revoking synchronously can beat the download in
  // some browsers and yield an empty file.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
