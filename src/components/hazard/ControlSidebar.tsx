
import {
  Play,
  Search,
  Loader2,
  RotateCcw,
  X,
  Calculator,
  AlertCircle,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { HAZARDS, PARAMETERS } from "@/lib/hazard-model";
import type { HazardModel } from "@/hooks/use-hazard-model";
import type { FloodWeights } from "@/lib/flood_api";

const FLOOD_WEIGHT_FIELDS: {
  key: keyof FloodWeights;
  label: string;
  description: string;
}[] = [
  {
    key: "dist_to_river",
    label: "Distance to river",
    description: "Influence of proximity to rivers.",
  },
  {
    key: "rainfall",
    label: "Rainfall",
    description: "Influence of rainfall conditions.",
  },
  {
    key: "landcover",
    label: "Land cover",
    description: "Influence of land-cover characteristics.",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-chrome-muted px-4 py-5">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-chrome-foreground/50">
        {title}
      </h2>
      {children}
    </section>
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
    <div>
      <Label className="mb-1.5 block text-xs text-chrome-foreground/55">
        {label}
      </Label>
      {children}
    </div>
  );
}

function HelperMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[11px] leading-4 text-chrome-foreground/40">
      {children}
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-1.5 text-[11px] leading-4 text-red-400">
      {message}
    </p>
  );
}

function LoadingMessage({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-chrome-foreground/45">
      <Loader2 className="size-3 animate-spin" />
      {message}
    </p>
  );
}

export function ControlSidebar({ model }: { model: HazardModel }) {
  const running = model.status === "running";
  const isFlood = model.hazard === "flood";

  const selectedSet = new Set(model.selected);
  const activeSet = new Set(model.activeCriteria);
  const ignoredSet = new Set(model.ignoredCriteria);

  const floodSummary = model.floodCalculation?.summary ?? [];

  const totalWeight =
    model.floodWeights.dist_to_river +
    model.floodWeights.rainfall +
    model.floodWeights.landcover;

  const weightsAreValid =
    Number.isFinite(totalWeight) &&
    Math.abs(totalWeight - 100) < 0.01 &&
    FLOOD_WEIGHT_FIELDS.every(
      ({ key }) =>
        Number.isFinite(model.floodWeights[key]) &&
        model.floodWeights[key] >= 0 &&
        model.floodWeights[key] <= 100,
    );

  const canRun =
    !running &&
    model.canRun &&
    (isFlood
      ? weightsAreValid
      : model.activeCriteria.length > 0);

  function normalizeFloodWeights() {
    const weights = model.floodWeights;
    const total =
      weights.dist_to_river +
      weights.rainfall +
      weights.landcover;

    if (!Number.isFinite(total) || total <= 0) return;

    const distance = Number(
      ((weights.dist_to_river / total) * 100).toFixed(2),
    );

    const rainfall = Number(
      ((weights.rainfall / total) * 100).toFixed(2),
    );

    // Calculate the final value from the remainder so that
    // the three displayed percentages total exactly 100.00.
    const landcover = Number((100 - distance - rainfall).toFixed(2));

    model.setFloodWeight("dist_to_river", distance);
    model.setFloodWeight("rainfall", rainfall);
    model.setFloodWeight("landcover", landcover);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-chrome text-chrome-foreground">
      <div className="flex-1 overflow-y-auto">
        <Section title="Hazard">
          <div className="space-y-2">
            {HAZARDS.map((hazard) => {
              const active = model.hazard === hazard.id;

              return (
                <button
                  key={hazard.id}
                  type="button"
                  onClick={() => model.setHazard(hazard.id)}
                  aria-pressed={active}
                  className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-chrome-foreground"
                      : "border-chrome-muted bg-chrome-muted/30 text-chrome-foreground/70 hover:bg-chrome-muted/60"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={`size-2 rounded-full ${
                        active ? "bg-accent" : "bg-chrome-foreground/25"
                      }`}
                    />
                    {hazard.label}
                  </span>

                  <span className="mt-0.5 block pl-4 text-xs text-chrome-foreground/45">
                    {hazard.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Location">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chrome-foreground/40" />

            <Input
              value={model.query}
              onChange={(event) => model.setQuery(event.target.value)}
              placeholder="Search county..."
              aria-label="Search county"
              className="border-chrome-muted bg-chrome-muted/60 pl-9 text-chrome-foreground placeholder:text-chrome-foreground/40"
            />
          </div>

          <div className="mt-3 space-y-3">
            <Field label="County">
              <Select
                value={model.county}
                onValueChange={model.selectCounty}
                disabled={
                  model.countiesLoading ||
                  model.filteredCounties.length === 0
                }
              >
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
                  <SelectValue
                    placeholder={
                      model.countiesLoading
                        ? "Loading counties..."
                        : model.countiesError
                          ? "Counties unavailable"
                          : model.filteredCounties.length === 0
                            ? "No counties found"
                            : "Select county"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {model.filteredCounties.map((county) => (
                    <SelectItem key={county.name} value={county.name}>
                      {county.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {model.countiesError && (
                <ErrorMessage message={model.countiesError} />
              )}

              {!model.countiesLoading &&
                !model.countiesError &&
                model.filteredCounties.length === 0 && (
                  <HelperMessage>
                    No counties match your search.
                  </HelperMessage>
                )}
            </Field>

            <Field label="Sub-county">
              <Select
                value={model.subCounty}
                onValueChange={model.selectSubCounty}
                disabled={
                  !model.county ||
                  model.subCountiesLoading ||
                  model.subCounties.length === 0
                }
              >
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
                  <SelectValue
                    placeholder={
                      model.subCountiesLoading
                        ? "Loading sub-counties..."
                        : model.subCountiesError
                          ? "Sub-counties unavailable"
                          : "All sub-counties"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All sub-counties</SelectItem>
                  {model.subCounties.map((subCounty) => (
                    <SelectItem key={subCounty} value={subCounty}>
                      {subCounty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {model.subCountiesLoading && (
                <LoadingMessage message="Loading sub-counties..." />
              )}

              {model.subCountiesError && (
                <ErrorMessage message={model.subCountiesError} />
              )}

              {!model.subCountiesLoading &&
                !model.subCountiesError &&
                model.subCounties.length === 0 && (
                  <HelperMessage>
                    No sub-counties were returned for this county.
                  </HelperMessage>
                )}
            </Field>

            <Field label="Ward">
              <Select
                value={model.ward}
                onValueChange={model.setWard}
                disabled={
                  !model.county ||
                  model.wardsLoading ||
                  model.wards.length === 0
                }
              >
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
                  <SelectValue
                    placeholder={
                      model.wardsLoading
                        ? "Loading wards..."
                        : model.wardsError
                          ? "Wards unavailable"
                          : "All wards"
                    }
                  />
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

              {model.wardsLoading && (
                <LoadingMessage message="Loading wards..." />
              )}

              {model.wardsError && (
                <ErrorMessage message={model.wardsError} />
              )}

              {!model.wardsLoading &&
                !model.wardsError &&
                model.wards.length === 0 && (
                  <HelperMessage>
                    No wards were returned for this county.
                  </HelperMessage>
                )}
            </Field>

            <p className="flex items-start gap-2 text-[11px] leading-5 text-chrome-foreground/45">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              The flood endpoint uses its configured GIS area. Location
              selections do not yet change the backend calculation area.
            </p>
          </div>
        </Section>

        {isFlood ? (
          <>
            <Section title="Calculator">
              <div className="mb-4 rounded-md border border-accent/30 bg-accent/10 p-3">
                <div className="flex items-center gap-2">
                  <Calculator className="size-5 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">
                      Flood susceptibility
                    </p>
                    <p className="text-[11px] text-chrome-foreground/50">
                      Django GIS calculation
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {FLOOD_WEIGHT_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label}>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.01"
                        value={model.floodWeights[field.key]}
                        disabled={running}
                        aria-label={`${field.label} weight percentage`}
                        onChange={(event) => {
                          const rawValue = event.currentTarget.value;

                          // Allow the input to be temporarily empty while
                          // the user edits it without storing NaN.
                          if (rawValue.trim() === "") return;

                          const value = Number(rawValue);

                          if (!Number.isFinite(value)) return;

                          model.setFloodWeight(
                            field.key,
                            Math.min(100, Math.max(0, value)),
                          );
                        }}
                        className="border-chrome-muted bg-chrome-muted/60 pr-9 text-chrome-foreground"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-chrome-foreground/45">
                        %
                      </span>
                    </div>

                    <HelperMessage>{field.description}</HelperMessage>
                  </Field>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-chrome-muted bg-chrome-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-chrome-foreground/70">
                    Total weight
                  </span>

                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      weightsAreValid
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {totalWeight.toFixed(2)}%
                  </span>
                </div>

                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-chrome-muted"
                  role="progressbar"
                  aria-label="Total weight percentage"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.max(0, totalWeight))}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      weightsAreValid ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, totalWeight))}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[11px] leading-4 text-chrome-foreground/45">
                  All three weights must add up to exactly 100%.
                </p>

                {!weightsAreValid && (
                  <p className="mt-2 text-[11px] text-amber-400">
                    Normalize the weights before running the calculation.
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={normalizeFloodWeights}
                  disabled={
                    running ||
                    !Number.isFinite(totalWeight) ||
                    totalWeight <= 0
                  }
                  className="mt-3 w-full border-chrome-muted bg-chrome-muted/40 text-chrome-foreground hover:bg-chrome-muted"
                >
                  <Calculator className="mr-2 size-3.5" />
                  Normalize to 100%
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={model.resetFloodWeights}
                disabled={running}
                className="mt-3 w-full text-chrome-foreground/65 hover:bg-chrome-muted/50"
              >
                <RotateCcw className="mr-2 size-3.5" />
                Reset default weights
              </Button>
            </Section>

            {model.status === "done" && model.floodCalculation && (
              <Section title="Calculation results">
                <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">
                      GIS calculation completed
                    </p>

                    {model.lastRun && (
                      <p className="mt-0.5 text-[10px] text-chrome-foreground/50">
                        {model.lastRun.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {floodSummary.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-chrome-muted">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-chrome-muted/50 text-chrome-foreground/60">
                        <tr>
                          <th className="px-2 py-2 font-medium">Risk class</th>
                          <th className="px-2 py-2 text-right font-medium">
                            Area km²
                          </th>
                          <th className="px-2 py-2 text-right font-medium">
                            Share
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {floodSummary.map((item) => (
                          <tr
                            key={item.class}
                            className="border-t border-chrome-muted"
                          >
                            <td className="px-2 py-2 text-chrome-foreground/80">
                              {item.label}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {item.area_km2.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {item.percentage.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <HelperMessage>
                    The backend completed the calculation but returned no
                    risk-class summary rows.
                  </HelperMessage>
                )}

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-chrome-foreground/75">
                    Generated GIS outputs
                  </p>

                  {Object.entries(model.floodCalculation.outputs).map(
                    ([name, path]) => (
                      <div
                        key={name}
                        className="rounded-md border border-chrome-muted bg-chrome-muted/20 p-2.5"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-chrome-foreground/45">
                          {name.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 break-all text-[11px] text-chrome-foreground/75">
                          {path}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </Section>
            )}
          </>
        ) : (
          <Section title="Model criteria">
            <p className="mb-3 text-xs leading-5 text-chrome-foreground/55">
              Select criteria for drought or landslide analysis. These hazards
              still use the temporary frontend model rather than the real
              Django GIS calculation.
            </p>

            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-chrome-foreground/60">
                Selected criteria: {model.selected.length}
              </span>

              <button
                type="button"
                onClick={model.clearParameters}
                disabled={model.selected.length === 0 || running}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-chrome-foreground/65 hover:bg-chrome-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="size-3.5" />
                Clear selection
              </button>
            </div>

            <div className="space-y-2">
              {PARAMETERS.map((parameter) => {
                const checked = selectedSet.has(parameter.id);
                const applicable = activeSet.has(parameter.id);
                const ignored = ignoredSet.has(parameter.id);

                return (
                  <div
                    key={parameter.id}
                    className="rounded-md border border-chrome-muted bg-chrome-muted/20 p-3"
                  >
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={running}
                        onChange={() => model.toggleParameter(parameter.id)}
                        className="size-4 shrink-0 accent-[var(--accent)]"
                      />

                      <span className="flex-1 text-sm font-medium text-chrome-foreground/85">
                        {parameter.label}
                      </span>

                      {applicable && (
                        <span className="text-[10px] text-emerald-400">
                          Applicable
                        </span>
                      )}
                    </label>

                    {ignored && (
                      <p className="mt-2 pl-6 text-[11px] leading-4 text-amber-400">
                        Not used for {model.hazard}.
                      </p>
                    )}

                    {checked && (
                      <div className="mt-3 pl-6">
                        <Label
                          htmlFor={`parameter-${parameter.id}`}
                          className="mb-1.5 block text-xs text-chrome-foreground/55"
                        >
                          {parameter.label} ({parameter.unit})
                        </Label>

                        <div className="flex items-center gap-2">
                          <Input
                            id={`parameter-${parameter.id}`}
                            type="number"
                            min={parameter.min}
                            max={parameter.max}
                            step={parameter.step}
                            value={model.parameters[parameter.id]}
                            disabled={running}
                            onChange={(event) => {
                              const value = event.currentTarget.valueAsNumber;

                              if (!Number.isFinite(value)) return;

                              model.setParameter(
                                parameter.id,
                                Math.min(
                                  parameter.max,
                                  Math.max(parameter.min, value),
                                ),
                              );
                            }}
                            className="border-chrome-muted bg-chrome-muted/60 text-chrome-foreground"
                          />

                          <span className="min-w-12 text-right text-xs text-chrome-foreground/45">
                            {parameter.min}–{parameter.max}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-md border border-chrome-muted bg-chrome-muted/20 px-3 py-2.5">
              <p className="text-[11px] leading-5 text-chrome-foreground/50">
                Applicable criteria: {model.activeCriteria.length}.{" "}
                {model.activeCriteria.length === 0
                  ? "Select at least one applicable criterion."
                  : "Criteria selected."}
              </p>
            </div>

            {model.usesDefaults ? (
              <p className="mt-2 text-[11px] text-chrome-foreground/45">
                Parameter values are using system defaults.
              </p>
            ) : (
              <button
                type="button"
                onClick={model.resetParameters}
                disabled={running}
                className="mt-3 inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-accent hover:bg-chrome-muted/50"
              >
                <RotateCcw className="size-3.5" />
                Use system defaults
              </button>
            )}
          </Section>
        )}

        {model.error && (
          <section className="px-4 py-4">
            <div
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-red-300">
                    Calculation failed
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-red-300/80">
                    {model.error}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-chrome-muted p-4">
        <Button
          onClick={() => void model.run()}
          disabled={!canRun}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Running GIS calculation...
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" />
              Run Calculation
            </>
          )}
        </Button>

        <p
          aria-live="polite"
          className="mt-2 text-center text-[11px] text-chrome-foreground/45"
        >
          {running
            ? "Waiting for the calculation service..."
            : isFlood
              ? !weightsAreValid
                ? "Flood weights must total 100%"
                : "Runs the flood GIS backend using these weights"
              : model.activeCriteria.length === 0
                ? "Select at least one applicable criterion"
                : "Runs the temporary frontend model"}
        </p>
      </div>
    </div>
  );
}
