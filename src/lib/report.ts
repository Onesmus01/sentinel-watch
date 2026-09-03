import {
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  applicableParameters,
  type HazardId,
  type ParameterId,
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
  /**
   * The criteria the run actually accounted for. Load-bearing for the export:
   * `parameters` always carries all four fields, so without this the file would
   * report a temperature that took no part in a flood score. Values for criteria
   * outside this list are written blank.
   */
  selected: ParameterId[];
  /** True when every selected criterion still sits at its declared default. */
  usedDefaults: boolean;
  generatedAt: Date;
}

/** Selected AND applicable to the hazard — the criteria that moved the score. */
export function effectiveCriteria(scope: ReportScope): ParameterId[] {
  const applies = applicableParameters(scope.hazard);
  return scope.selected.filter((id) => applies.includes(id));
}

export interface ReportSummary {
  wards: number;
  /** count per risk class, keyed by RISK_CLASSES id, in ramp order */
  byClass: { id: string; label: string; count: number }[];
}

/*
 * Mean index, peak index and high-risk-area count are intentionally NOT derived
 * here. They were dropped as out of agreed scope for this phase; the per-ward
 * scores are still exported, so any of them can be recomputed downstream, and
 * reinstating them is a small addition rather than a data migration.
 */

/**
 * Whole-of-report statistics. Pure so the same numbers appear in the on-screen
 * summary, the CSV footer and the JSON payload — one implementation, no drift.
 */
export function summarise(results: WardResult[]): ReportSummary {
  return {
    wards: results.length,
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
  // Explicit rather than inferred from which value columns are populated: a
  // blank could otherwise be read as a missing reading rather than an excluded
  // criterion, and the two mean very different things to whoever loads this.
  "criteria_used",
  "gradient_pct",
  "rainfall_mm",
  "temperature_c",
  "humidity_pct",
  "generated_at",
] as const;

/** Parameter id -> its CSV column, so the two can never fall out of step. */
const PARAMETER_COLUMN: Record<ParameterId, string> = {
  gradient: "gradient_pct",
  rainfall: "rainfall_mm",
  temperature: "temperature_c",
  humidity: "humidity_pct",
};

export function toCsv(results: WardResult[], scope: ReportScope): string {
  const p = scope.parameters;
  const stamp = scope.generatedAt.toISOString();
  const used = effectiveCriteria(scope);
  // Semicolons, not commas: a comma here would need the field quoting, and this
  // column is read by eye as often as by a parser.
  const usedList = used.join(";");
  const valueOf = (id: ParameterId) => (used.includes(id) ? p[id] : "");

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
        usedList,
        valueOf("gradient"),
        valueOf("rainfall"),
        valueOf("temperature"),
        valueOf("humidity"),
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
  const used = effectiveCriteria(scope);
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
        // Only the criteria that took part, so a consumer cannot mistake an
        // excluded criterion's carried-over value for an input to the score.
        selected: used,
        ignored: scope.selected.filter((id) => !used.includes(id)),
        values: Object.fromEntries(used.map((id) => [id, scope.parameters[id]])),
        usedSystemDefaults: scope.usedDefaults,
        definitions: PARAMETERS.filter((d) => used.includes(d.id)).map((d) => ({
          id: d.id,
          label: d.label,
          unit: d.unit,
          column: PARAMETER_COLUMN[d.id],
        })),
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
