
import { useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  RotateCcw,
} from "lucide-react";

import { AppHeader } from "@/components/hazard/AppHeader";
import { SiteFooter } from "@/components/hazard/SiteFooter";
import { WardTable } from "@/components/hazard/WardTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHazardModel } from "@/hooks/use-hazard-model";
import {
  COUNTIES,
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  runModel,
  type HazardId,
} from "@/lib/hazard-model";
import {
  CSV_COLUMNS,
  downloadReport,
  renderReport,
  summarise,
  type ReportFormat,
  type ReportScope,
} from "@/lib/report";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Sentinel Hazard Monitor" },
      {
        name: "description",
        content:
          "Preview and download ward-level hazard reports in CSV or JSON format.",
      },
    ],
  }),
  component: Reports,
});

type ReportFile = ReturnType<typeof renderReport>;

interface RequestRecord {
  key: number;
  scope: ReportScope;
  format: ReportFormat;
  rows: number;
  file: ReportFile;
}

const NAVY = "#0a1f44";

const FORMATS: {
  id: ReportFormat;
  label: string;
  hint: string;
}[] = [
  {
    id: "csv",
    label: "CSV",
    hint: "Ward-level rows for Excel, QGIS, R and pandas.",
  },
  {
    id: "json",
    label: "JSON",
    hint: "Structured scope, parameters, summary and ward results.",
  },
];

function hazardLabelOf(id: HazardId): string {
  return HAZARDS.find((hazard) => hazard.id === id)?.label ?? id;
}

function scopeText(
  scope: Pick<ReportScope, "county" | "subCounty" | "ward">,
): string {
  return [
    `${scope.county} County`,
    scope.subCounty === "all" ? "All sub-counties" : scope.subCounty,
    scope.ward === "all" ? "All wards" : scope.ward,
  ].join(" · ");
}

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function Reports() {
  const model = useHazardModel();
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const nextKey = useRef(0);

  const results = useMemo(
    () =>
      model.canRun
        ? runModel(
            model.county,
            model.hazard,
            model.parameters,
            model.activeCriteria,
            {
              subCounty:
                model.subCounty === "all" ? undefined : model.subCounty,
              ward: model.ward === "all" ? undefined : model.ward,
            },
          )
        : [],
    [
      model.canRun,
      model.county,
      model.hazard,
      model.subCounty,
      model.ward,
      model.parameters,
      model.activeCriteria,
    ],
  );

  const summary = useMemo(() => summarise(results), [results]);
  const rows = results.length;
  const hazardLabel = hazardLabelOf(model.hazard);

  const scopeLine = scopeText({
    county: model.county,
    subCounty: model.subCounty,
    ward: model.ward,
  });

  const subCountiesCovered = new Set(
    results.map((result) => result.subCounty),
  ).size;

  const latest = requests[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rows === 0) return;

    const scope: ReportScope = {
      county: model.county,
      subCounty: model.subCounty,
      ward: model.ward,
      hazard: model.hazard,
      parameters: model.parameters,
      selected: model.activeCriteria,
      usedDefaults: model.usesDefaults,
      generatedAt: new Date(),
    };

    const file = renderReport(results, scope, format);

    downloadReport(file);

    const request: RequestRecord = {
      key: nextKey.current++,
      scope,
      format,
      rows,
      file,
    };

    setRequests((previous) => [request, ...previous]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        county={model.county}
        lastRun={latest ? latest.scope.generatedAt : null}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="grid size-11 shrink-0 place-items-center text-white"
              style={{ backgroundColor: NAVY }}
            >
              <FileSpreadsheet className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Hazard reports
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Configure an assessment, inspect the results, and export a
                ward-level report for documentation and review.
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="w-fit shrink-0 rounded-none border-border text-muted-foreground"
          >
            Demo dataset v1
          </Badge>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"
        >
          <section
            aria-labelledby="scope-heading"
            className="min-w-0 border border-border bg-card xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto"
          >
            <header
              className="px-4 py-3 text-white"
              style={{ backgroundColor: NAVY }}
            >
              <h2
                id="scope-heading"
                className="font-display text-sm font-semibold"
              >
                1. Report scope
              </h2>
              <p className="mt-1 text-xs text-white/70">
                Define the area and calculation inputs.
              </p>
            </header>

            <div className="space-y-4 p-4">
              <div>
                <Label
                  htmlFor="scope-county"
                  className="mb-1.5 block text-xs text-muted-foreground"
                >
                  County
                </Label>

                <Select
                  value={model.county}
                  onValueChange={model.selectCounty}
                >
                  <SelectTrigger
                    id="scope-county"
                    className="rounded-none"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {COUNTIES.map((county) => (
                      <SelectItem
                        key={county.name}
                        value={county.name}
                      >
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="scope-sub-county"
                  className="mb-1.5 block text-xs text-muted-foreground"
                >
                  Sub-county
                </Label>

                <Select
                  value={model.subCounty}
                  onValueChange={model.selectSubCounty}
                >
                  <SelectTrigger
                    id="scope-sub-county"
                    className="rounded-none"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All sub-counties
                    </SelectItem>
                    {model.subCounties.map((subCounty) => (
                      <SelectItem key={subCounty} value={subCounty}>
                        {subCounty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="scope-ward"
                  className="mb-1.5 block text-xs text-muted-foreground"
                >
                  Ward
                </Label>

                <Select
                  value={model.ward}
                  onValueChange={model.setWard}
                >
                  <SelectTrigger id="scope-ward" className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All wards</SelectItem>
                    {model.wards.map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <fieldset className="border-t border-border pt-4">
                <legend className="text-xs font-semibold text-muted-foreground">
                  Hazard type
                </legend>

                <RadioGroup
                  className="mt-2 gap-2"
                  value={model.hazard}
                  onValueChange={(value) => {
                    const selectedHazard = HAZARDS.find(
                      (hazard) => hazard.id === value,
                    );

                    if (selectedHazard) {
                      model.setHazard(selectedHazard.id);
                    }
                  }}
                >
                  {HAZARDS.map((hazard) => {
                    const active = model.hazard === hazard.id;

                    return (
                      <div
                        key={hazard.id}
                        className={`flex items-start gap-3 border p-3 transition-colors ${
                          active
                            ? "border-teal-700 bg-teal-700/5"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem
                          id={`hazard-${hazard.id}`}
                          value={hazard.id}
                          className="mt-0.5 rounded-none"
                        />

                        <Label
                          htmlFor={`hazard-${hazard.id}`}
                          className="cursor-pointer"
                        >
                          <span className="block text-sm font-medium">
                            {hazard.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {hazard.blurb}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </fieldset>

              <fieldset className="border-t border-border pt-4">
                <legend className="text-xs font-semibold text-muted-foreground">
                  Calculation criteria
                </legend>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Select the parameters used by the model. Review their
                  applicability before generating the report.
                </p>

                <div className="mt-3 space-y-2">
                  {PARAMETERS.map((parameter) => {
                    const selected = model.selected.includes(parameter.id);
                    const applicable = model.applicable.includes(parameter.id);

                    return (
                      <div
                        key={parameter.id}
                        className={`border p-3 ${
                          selected
                            ? "border-border bg-muted/30"
                            : "border-border/70"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            id={`criterion-${parameter.id}`}
                            checked={selected}
                            onCheckedChange={() =>
                              model.toggleParameter(parameter.id)
                            }
                            className="mt-0.5 rounded-none"
                          />

                          <Label
                            htmlFor={`criterion-${parameter.id}`}
                            className="min-w-0 flex-1 cursor-pointer text-sm leading-5"
                          >
                            {parameter.label}
                          </Label>

                          {selected && (
                            <div className="flex shrink-0 items-center gap-1">
                              <Input
                                id={`param-${parameter.id}`}
                                type="number"
                                value={model.parameters[parameter.id]}
                                min={parameter.min}
                                max={parameter.max}
                                step={parameter.step}
                                aria-label={`${parameter.label} value in ${parameter.unit}`}
                                onChange={(event) => {
                                  const value = Number(event.target.value);

                                  if (!Number.isFinite(value)) return;

                                  model.setParameter(
                                    parameter.id,
                                    Math.max(
                                      parameter.min,
                                      Math.min(parameter.max, value),
                                    ),
                                  );
                                }}
                                className="h-8 w-20 rounded-none text-right tabular-nums"
                              />
                              <span className="w-5 text-xs text-muted-foreground">
                                {parameter.unit}
                              </span>
                            </div>
                          )}
                        </div>

                        {selected && (
                          <p className="mt-2 pl-6 text-[11px] leading-5 text-muted-foreground">
                            {applicable ? (
                              <>
                                Range: {parameter.min}–{parameter.max}{" "}
                                {parameter.unit}. Default: {parameter.default}{" "}
                                {parameter.unit}.
                              </>
                            ) : (
                              <>
                                Not used for {hazardLabel.toLowerCase()}; this
                                parameter is excluded from the current model
                                run.
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {model.selected.length > 0 && !model.usesDefaults && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={model.resetParameters}
                    className="mt-3 w-full rounded-none"
                  >
                    <RotateCcw className="size-3.5" />
                    Use system defaults
                  </Button>
                )}
              </fieldset>
            </div>
          </section>

          <div className="min-w-0 space-y-5">
            <section
              aria-labelledby="preview-heading"
              className="overflow-hidden border border-border bg-card"
            >
              <header className="flex flex-col justify-between gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <h2
                    id="preview-heading"
                    className="font-display text-sm font-semibold"
                  >
                    2. Report preview
                  </h2>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {hazardLabel} · {scopeLine}
                  </p>
                </div>

                <p
                  aria-live="polite"
                  className="shrink-0 text-sm text-muted-foreground"
                >
                  <span className="font-semibold tabular-nums text-foreground">
                    {rows}
                  </span>{" "}
                  {rows === 1 ? "row" : "rows"} ready
                </p>
              </header>

              <dl className="grid grid-cols-2 gap-px border-b border-border bg-border">
                <Stat label="Rows in report" value={String(rows)} />
                <Stat
                  label="Sub-counties covered"
                  value={String(subCountiesCovered)}
                />
              </dl>

              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Risk-class distribution
                </h3>

                <ul className="mt-4 space-y-3">
                  {RISK_CLASSES.map((riskClass) => {
                    const count =
                      summary.byClass.find(
                        (item) => item.id === riskClass.id,
                      )?.count ?? 0;

                    const percentage =
                      rows === 0 ? 0 : (count / rows) * 100;

                    return (
                      <li
                        key={riskClass.id}
                        className="grid grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] items-center gap-3"
                      >
                        <span className="text-xs text-foreground">
                          {riskClass.label}
                        </span>

                        <div
                          className="h-2 overflow-hidden bg-muted"
                          role="img"
                          aria-label={`${riskClass.label}: ${count} wards, ${percentage.toFixed(1)} percent`}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: `var(${riskClass.varName})`,
                            }}
                          />
                        </div>

                        <span className="text-right text-xs tabular-nums text-muted-foreground">
                          {count} · {Math.round(percentage)}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section
              aria-labelledby="download-heading"
              className="border border-border bg-card p-4"
            >
              <h2
                id="download-heading"
                className="font-display text-sm font-semibold"
              >
                3. Export report
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose a file format. The exported file reflects the scope and
                parameters shown in the preview.
              </p>

              <RadioGroup
                className="mt-4 gap-3 sm:grid-cols-2"
                value={format}
                onValueChange={(value) =>
                  setFormat(value === "json" ? "json" : "csv")
                }
              >
                {FORMATS.map((item) => {
                  const active = format === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex min-w-0 items-start gap-3 border p-3 ${
                        active
                          ? "border-teal-700 bg-teal-700/5"
                          : "border-border"
                      }`}
                    >
                      <RadioGroupItem
                        id={`format-${item.id}`}
                        value={item.id}
                        className="mt-1 rounded-none"
                      />

                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor={`format-${item.id}`}
                          className="flex cursor-pointer items-center gap-2 text-sm font-semibold"
                        >
                          {item.id === "csv" ? (
                            <FileSpreadsheet className="size-4" />
                          ) : (
                            <FileJson className="size-4" />
                          )}
                          {item.label}
                        </Label>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.hint}
                        </p>

                        {item.id === "csv" && (
                          <p className="mt-2 break-words text-[11px] leading-5 text-muted-foreground">
                            {CSV_COLUMNS.length} columns:{" "}
                            {CSV_COLUMNS.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={rows === 0}
                  className="w-full rounded-none bg-[#0a1f44] text-white hover:bg-[#123366] sm:w-auto"
                >
                  <Download className="size-4" />
                  Download {format.toUpperCase()}
                </Button>

                <p
                  className="text-xs leading-5 text-muted-foreground"
                  id="download-note"
                >
                  {rows === 0
                    ? "No rows available. Widen the report scope."
                    : `${countLabel(rows, "ward")} · ${hazardLabel} · ${
                        model.usesDefaults
                          ? "System defaults"
                          : "Custom parameters"
                      }`}
                </p>
              </div>

              {latest && (
                <p role="status" className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                  Latest file:{" "}
                  <span className="break-all font-mono text-foreground">
                    {latest.file.filename}
                  </span>
                </p>
              )}
            </section>

            {rows === 0 ? (
              <section className="border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">
                  No wards in this scope
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Widen the selected area to include more wards in the report.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-none"
                  onClick={() => model.selectSubCounty("all")}
                >
                  Reset to the whole county
                </Button>
              </section>
            ) : (
              <section className="min-w-0 border border-border bg-card">
                <header className="border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">
                    Ward-level results
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review the current results before exporting.
                  </p>
                </header>
                <WardTable results={results} />
              </section>
            )}
          </div>
        </form>

        <section
          aria-labelledby="history-heading"
          className="mt-5 overflow-hidden border border-border bg-card"
        >
          <header className="flex flex-col justify-between gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
            <h2
              id="history-heading"
              className="flex items-center gap-2 font-display text-sm font-semibold"
            >
              <History className="size-4 text-muted-foreground" />
              Session report history
            </h2>

            <p className="text-xs text-muted-foreground">
              {requests.length === 0
                ? "No reports downloaded in this session"
                : `${countLabel(requests.length, "report")} · newest first`}
            </p>
          </header>

          {requests.length === 0 ? (
            <p className="px-4 py-6 text-sm leading-6 text-muted-foreground">
              Downloaded reports appear here. This history is held in memory
              for the current page session and clears when the page reloads.
            </p>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested (UTC)</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Hazard</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {requests.map((entry) => (
                      <TableRow key={entry.key}>
                        <TableCell
                          className="whitespace-nowrap tabular-nums text-muted-foreground"
                          title={`${entry.scope.generatedAt.toLocaleString()} local time`}
                        >
                          {entry.scope.generatedAt.toISOString().slice(11, 19)}
                        </TableCell>

                        <TableCell className="min-w-48">
                          <span className="block text-xs font-medium">
                            {scopeText(entry.scope)}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {entry.scope.usedDefaults
                              ? "System defaults"
                              : "Custom parameters"}
                          </span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {hazardLabelOf(entry.scope.hazard)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="rounded-none uppercase"
                          >
                            {entry.format}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {entry.rows}
                        </TableCell>

                        <TableCell
                          className="max-w-56 truncate font-mono text-xs text-muted-foreground"
                          title={entry.file.filename}
                        >
                          {entry.file.filename}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-none"
                            onClick={() => downloadReport(entry.file)}
                            aria-label={`Download ${entry.file.filename} again`}
                          >
                            <Download className="size-3.5" />
                            Again
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                Re-downloads use the stored report file rather than running the
                model again. This history is temporary and is not saved to
                Django or a database.
              </p>
            </>
          )}
        </section>

        <footer className="mt-5 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          <strong>Assessment notice:</strong> The current frontend report
          uses the project's illustrative demo scoring model. Verify source
          datasets, model methodology and validation before using its results
          for operational decisions.
        </footer>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 bg-card px-4 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </dd>
    </div>
  );
}
