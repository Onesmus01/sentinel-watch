import { useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileJson, FileSpreadsheet, History, RotateCcw } from "lucide-react";

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
      { title: "Download reports · Sentinel Hazard Monitor" },
      {
        name: "description",
        content:
          "Request a ward-level hazard extract as CSV or JSON: pick county, sub-county, ward and hazard, check the preview, then download.",
      },
    ],
  }),
  component: Reports,
});

/** The rendered file, kept whole so a re-download never re-runs the model. */
type ReportFile = ReturnType<typeof renderReport>;

interface RequestRecord {
  /** Monotonic React key: two requests can share a scope and a timestamp. */
  key: number;
  scope: ReportScope;
  format: ReportFormat;
  rows: number;
  file: ReportFile;
}

function hazardLabelOf(id: HazardId): string {
  return HAZARDS.find((h) => h.id === id)?.label ?? id;
}

/** "all" is report.ts's no-filter sentinel; spell it out for human readers. */
function scopeText(scope: Pick<ReportScope, "county" | "subCounty" | "ward">): string {
  return [
    `${scope.county} County`,
    scope.subCounty === "all" ? "all sub-counties" : scope.subCounty,
    scope.ward === "all" ? "all wards" : scope.ward,
  ].join(" · ");
}

function countLabel(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

const FORMATS: { id: ReportFormat; label: string; hint: string }[] = [
  { id: "csv", label: "CSV", hint: "One row per ward. Opens in Excel, QGIS, R, pandas." },
  { id: "json", label: "JSON", hint: "Scope, parameters, summary and wards in one payload." },
];

function Reports() {
  // The dashboard's own scope state machine, so both pages agree on what a
  // scope is and on the cascade rules (changing county clears the sub-county
  // and ward, so a stale ward can never survive into a request). Only its
  // run() is left aside — see `results`.
  const model = useHazardModel();
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const nextKey = useRef(0);

  // runModel is pure and synchronous, so the preview is derived state, not
  // something the user has to trigger. That is what makes this page
  // self-sufficient: there is no Run button to forget and no empty state that
  // needs a trip to the dashboard to escape.
  const results = useMemo(
    () =>
      model.canRun
        ? runModel(model.county, model.hazard, model.parameters, model.activeCriteria, {
            subCounty: model.subCounty === "all" ? undefined : model.subCounty,
            ward: model.ward === "all" ? undefined : model.ward,
          })
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
  const subCountiesCovered = new Set(results.map((r) => r.subCounty)).size;
  const latest = requests[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rows === 0) return;

    // generatedAt is minted in the handler, never during render: a Date created
    // while rendering differs between the SSR pass and hydration, and it would
    // also make the previewed filename lie by a few seconds.
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

    const key = nextKey.current++;
    setRequests((prev) => [{ key, scope, format, rows, file }, ...prev]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader county={model.county} lastRun={latest ? latest.scope.generatedAt : null} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Download reports
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Request a ward-level extract for any county and hazard. The model runs here, so the
              figures below follow the scope as you set it — no dashboard run needed first.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-border text-muted-foreground">
            Demo dataset v1
          </Badge>
        </div>

        {/* One form across both columns: the scope fields sit on the left, the
            submit button sits under the preview it describes, and Enter from
            any field triggers the same primary action. */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid items-start gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]"
        >
          <section
            aria-labelledby="scope-heading"
            className="min-w-0 overflow-hidden rounded-xl border border-border bg-card xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto"
          >
            <header className="bg-chrome px-4 py-3 text-chrome-foreground">
              <h2 id="scope-heading" className="font-display text-sm font-semibold tracking-tight">
                1 · Report scope
              </h2>
              <p className="mt-0.5 text-xs text-chrome-foreground/60">
                Applied to the model before the file is written.
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
                <Select value={model.county} onValueChange={model.selectCounty}>
                  <SelectTrigger id="scope-county">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
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
                <Select value={model.subCounty} onValueChange={model.selectSubCounty}>
                  <SelectTrigger id="scope-sub-county">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sub-counties</SelectItem>
                    {model.subCounties.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scope-ward" className="mb-1.5 block text-xs text-muted-foreground">
                  Ward
                </Label>
                <Select value={model.ward} onValueChange={model.setWard}>
                  <SelectTrigger id="scope-ward">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wards</SelectItem>
                    {model.wards.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <fieldset className="border-t border-border pt-4">
                <legend className="text-xs text-muted-foreground">Hazard</legend>
                <RadioGroup
                  className="mt-2 gap-2"
                  value={model.hazard}
                  onValueChange={(value) => {
                    // Narrow through HAZARDS rather than casting: the radio
                    // group hands back a plain string.
                    const picked = HAZARDS.find((h) => h.id === value);
                    if (picked) model.setHazard(picked.id);
                  }}
                >
                  {HAZARDS.map((h) => {
                    const active = model.hazard === h.id;
                    return (
                      <div
                        key={h.id}
                        className={`flex items-start gap-3 rounded-md border p-2.5 transition-colors ${
                          active ? "border-accent bg-accent/5" : "border-border"
                        }`}
                      >
                        <RadioGroupItem id={`hazard-${h.id}`} value={h.id} className="mt-0.5" />
                        <Label htmlFor={`hazard-${h.id}`} className="cursor-pointer">
                          <span className="block text-sm font-medium">{h.label}</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {h.blurb}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </fieldset>

              <fieldset className="border-t border-border pt-4">
                <legend className="text-xs text-muted-foreground">Criteria</legend>
                <p className="mt-2 text-xs text-muted-foreground">
                  Choose what the run accounts for. Nothing is included until you select it.
                </p>

                <div className="mt-3 space-y-2">
                  {PARAMETERS.map((p) => {
                    const on = model.selected.includes(p.id);
                    const applies = model.applicable.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-md border px-3 py-2.5 ${
                          on ? "border-border bg-muted/40" : "border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`criterion-${p.id}`}
                            checked={on}
                            onCheckedChange={() => model.toggleParameter(p.id)}
                          />
                          <Label
                            htmlFor={`criterion-${p.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {p.label}
                          </Label>
                          {on && (
                            <div className="flex items-center gap-1">
                              <Input
                                id={`param-${p.id}`}
                                type="number"
                                value={model.parameters[p.id]}
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                aria-label={`${p.label} value in ${p.unit}`}
                                onChange={(e) => {
                                  const n = Number(e.target.value);
                                  if (Number.isNaN(n)) return;
                                  model.setParameter(p.id, Math.max(p.min, Math.min(p.max, n)));
                                }}
                                className="h-8 w-20 text-right tabular-nums"
                              />
                              <span className="w-5 text-xs text-muted-foreground">{p.unit}</span>
                            </div>
                          )}
                        </div>
                        {on && (
                          <p className="mt-1.5 pl-[26px] text-[11px] text-muted-foreground">
                            {applies ? (
                              <>
                                {p.min}–{p.max}
                                {p.unit} · default {p.default}
                                {p.unit}
                              </>
                            ) : (
                              <>
                                Not used for {hazardLabel.toLowerCase()}; excluded from this file.
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
                    variant="ghost"
                    size="sm"
                    onClick={model.resetParameters}
                    className="mt-3 text-accent hover:bg-accent/10 hover:text-accent"
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
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <h2
                    id="preview-heading"
                    className="font-display text-sm font-semibold tracking-tight"
                  >
                    2 · Preview this extract
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {hazardLabel} · {scopeLine}
                  </p>
                </div>
                {/* Announced on scope changes: the row count is the one number
                    that decides whether the download is worth making. */}
                <p aria-live="polite" className="text-xs text-muted-foreground">
                  <span className="font-medium tabular-nums text-foreground">{rows}</span>{" "}
                  {rows === 1 ? "row" : "rows"} ready
                </p>
              </header>

              {/* Mean / peak / high-risk-area metrics are deliberately absent:
                  out of agreed scope for this phase. The class distribution below
                  is the legend breakdown, not a derived index. */}
              <dl className="grid grid-cols-2 gap-px bg-border">
                <Stat label="Rows in file" value={String(rows)} />
                <Stat label="Sub-counties" value={String(subCountiesCovered)} />
              </dl>

              <div className="border-t border-border p-4">
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Risk class mix
                </h3>
                {/* Every row names its class in text and gives the count; the
                    swatch and the bar are decoration on top of that, never the
                    only way to read the distribution. */}
                <ul className="mt-3 space-y-2">
                  {RISK_CLASSES.map((rc) => {
                    const count = summary.byClass.find((c) => c.id === rc.id)?.count ?? 0;
                    const pct = rows === 0 ? 0 : Math.round((count / rows) * 100);
                    return (
                      <li key={rc.id} className="flex items-center gap-2 text-sm sm:gap-3">
                        <span
                          aria-hidden="true"
                          className="size-3 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: `var(${rc.varName})` }}
                        />
                        <span className="w-[4.5rem] shrink-0 text-foreground">{rc.label}</span>
                        <span
                          aria-hidden="true"
                          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                        >
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: `var(${rc.varName})` }}
                          />
                        </span>
                        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {count} · {pct}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section
              aria-labelledby="deliver-heading"
              className="rounded-xl border border-border bg-card p-4"
            >
              <h2
                id="deliver-heading"
                className="font-display text-sm font-semibold tracking-tight"
              >
                3 · Choose a format and download
              </h2>

              <RadioGroup
                className="mt-3 gap-3 sm:grid-cols-2"
                value={format}
                onValueChange={(value) => setFormat(value === "json" ? "json" : "csv")}
              >
                {FORMATS.map((f) => {
                  const active = format === f.id;
                  return (
                    <div
                      key={f.id}
                      className={`flex min-w-0 items-start gap-3 rounded-lg border p-3 transition-colors ${
                        active ? "border-accent bg-accent/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem id={`format-${f.id}`} value={f.id} className="mt-1" />
                      <div className="min-w-0">
                        <Label
                          htmlFor={`format-${f.id}`}
                          className="flex cursor-pointer items-center gap-1.5 text-sm"
                        >
                          {f.id === "csv" ? (
                            <FileSpreadsheet className="size-4 text-muted-foreground" />
                          ) : (
                            <FileJson className="size-4 text-muted-foreground" />
                          )}
                          {f.label}
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
                        {f.id === "csv" && (
                          // Read off the contract's own column list, so the
                          // manifest cannot drift from the file.
                          <p className="mt-1 break-words text-[11px] leading-relaxed text-muted-foreground/80">
                            {CSV_COLUMNS.length} columns: {CSV_COLUMNS.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={rows === 0}
                  aria-describedby="download-note"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Download className="size-4" />
                  Download {format.toUpperCase()}
                </Button>
                <p id="download-note" className="min-w-0 text-xs text-muted-foreground">
                  {rows === 0
                    ? "Nothing to download yet — widen the scope above."
                    : `${countLabel(rows, "ward")} · ${hazardLabel} · ${
                        model.usesDefaults ? "system default values" : "custom values"
                      }`}
                </p>
              </div>

              {latest && (
                <p role="status" className="mt-3 text-xs text-muted-foreground">
                  Saved{" "}
                  <span className="break-all font-mono text-foreground">
                    {latest.file.filename}
                  </span>{" "}
                  to your downloads.
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                The file repeats the disclaimer this page carries: illustrative demo values from a
                placeholder scoring model, not for operational decisions.
              </p>
            </section>

            {rows === 0 ? (
              // Unreachable through the selects as they stand, but if a scope
              // ever yields nothing the way out is on this page, not on /.
              <div role="status" className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-display text-sm font-semibold tracking-tight">
                  No wards in this scope
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Widen the scope to bring rows back into the extract.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => model.selectSubCounty("all")}
                >
                  Reset to the whole county
                </Button>
              </div>
            ) : (
              <WardTable results={results} />
            )}
          </div>
        </form>

        <section
          aria-labelledby="history-heading"
          className="mt-5 overflow-hidden rounded-xl border border-border bg-card"
        >
          <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
            <h2
              id="history-heading"
              className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight"
            >
              <History className="size-4 text-muted-foreground" />
              Session requests
            </h2>
            <p className="text-xs text-muted-foreground">
              {requests.length === 0
                ? "Nothing requested yet"
                : `${countLabel(requests.length, "report")} · newest first`}
            </p>
          </header>

          {requests.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Reports you download land here, so you can fetch the same file again without
              re-running the model. The list lives in this browser tab only and clears on reload.
            </p>
          ) : (
            <>
              {/* Seven columns will not fit a 390px screen, so the table keeps
                  its width and scrolls inside Table's own overflow wrapper
                  rather than widening the page. */}
              <Table className="min-w-[46rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested (UTC)</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Hazard</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Download again</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((entry) => (
                    <TableRow key={entry.key}>
                      {/* UTC, not local: reportFilename stamps the filename in
                          UTC, so a local time here would disagree with the file
                          it describes by the viewer's offset. Local time stays
                          available on hover. */}
                      <TableCell
                        className="whitespace-nowrap tabular-nums text-muted-foreground"
                        title={`${entry.scope.generatedAt.toLocaleString()} local time`}
                      >
                        {entry.scope.generatedAt.toISOString().slice(11, 19)}
                      </TableCell>
                      <TableCell>
                        <span className="block font-medium">{scopeText(entry.scope)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {entry.scope.usedDefaults ? "System defaults" : "Custom parameters"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {hazardLabelOf(entry.scope.hazard)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase">
                          {entry.format}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{entry.rows}</TableCell>
                      <TableCell
                        className="max-w-[16rem] truncate font-mono text-xs text-muted-foreground"
                        title={entry.file.filename}
                      >
                        {entry.file.filename}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Serves the stored bytes: the archived numbers stay
                            the ones the user saw, and reportFilename is
                            deterministic so the re-download overwrites rather
                            than piling up "(1)" copies. */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
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
              <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                Re-downloads are served from this tab's memory, not re-modelled, so an archived
                report keeps the figures it was written with.
              </p>
            </>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 bg-card px-4 py-3">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </dd>
      {sub && <dd className="truncate text-xs text-muted-foreground">{sub}</dd>}
    </div>
  );
}
