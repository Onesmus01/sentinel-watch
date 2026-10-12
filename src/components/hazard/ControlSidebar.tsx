
import { Play, Search, Loader2, RotateCcw, X } from "lucide-react";

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

export function ControlSidebar({ model }: { model: HazardModel }) {
  const running = model.status === "running";
  const isFlood = model.hazard === "flood";

  const selectedSet = new Set(model.selected);
  const activeSet = new Set(model.activeCriteria);
  const ignoredSet = new Set(model.ignoredCriteria);

  // Flood uses the real GIS API. Drought and landslide require
  // at least one selected criterion applicable to that hazard.
  const canRun =
    !running &&
    (isFlood
      ? model.canRun
      : model.canRun && model.activeCriteria.length > 0);

  return (
    <div className="flex h-full flex-col bg-chrome text-chrome-foreground">
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
                        active
                          ? "bg-accent"
                          : "bg-chrome-foreground/25"
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
                  model.countiesLoading ||
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
                <LoadingMessage message="Loading sub-counties from GIS..." />
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
                  model.countiesLoading ||
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
                <LoadingMessage message="Loading wards from GIS..." />
              )}
              {model.wardsError && (
                <ErrorMessage message={model.wardsError} />
              )}
              {!model.wardsLoading &&
                !model.wardsError &&
                model.wards.length === 0 && (
                  <HelperMessage>
                    {model.subCounty !== "all"
                      ? "No wards match the selected sub-county."
                      : "No wards were returned for this county."}
                  </HelperMessage>
                )}
            </Field>
          </div>
        </Section>

        <Section title="Model criteria">
          <p className="mb-3 text-xs leading-5 text-chrome-foreground/55">
            Select criteria for drought or landslide analysis. Flood
            calculations use the configured GIS backend instead.
          </p>

          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-chrome-foreground/60">
              Selected criteria: {model.selected.length}
            </span>

            <button
              type="button"
              onClick={model.clearParameters}
              disabled={model.selected.length === 0}
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
                          aria-label={`${parameter.label} value`}
                          type="number"
                          min={parameter.min}
                          max={parameter.max}
                          step={parameter.step}
                          value={model.parameters[parameter.id]}
                          onChange={(event) => {
                            const rawValue = event.target.valueAsNumber;
                            if (!Number.isFinite(rawValue)) return;

                            const clampedValue = Math.min(
                              parameter.max,
                              Math.max(parameter.min, rawValue),
                            );

                            model.setParameter(parameter.id, clampedValue);
                          }}
                          className="border-chrome-muted bg-chrome-muted/60 text-chrome-foreground"
                        />

                        <span className="min-w-12 text-right text-xs text-chrome-foreground/45">
                          {parameter.min}–{parameter.max}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[10px] text-chrome-foreground/40">
                        Allowed range: {parameter.min}–{parameter.max}{" "}
                        {parameter.unit}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-md border border-chrome-muted bg-chrome-muted/20 px-3 py-2.5">
            <p className="text-[11px] leading-5 text-chrome-foreground/50">
              Applicable criteria: {model.activeCriteria.length}.{" "}
              {isFlood
                ? "Legacy criteria are not inputs to the flood GIS calculation."
                : model.activeCriteria.length === 0
                  ? "Select at least one applicable criterion."
                  : "Your selected criteria are ready for analysis."}
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
              className="mt-3 inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-accent hover:bg-chrome-muted/50"
            >
              <RotateCcw className="size-3.5" />
              Use system defaults
            </button>
          )}
        </Section>

        {model.error && (
          <section className="px-4 py-4">
            <div
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-3"
            >
              <p className="text-xs font-medium text-red-300">
                Analysis failed
              </p>
              <p className="mt-1 text-[11px] leading-5 text-red-300/70">
                {model.error}
              </p>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-chrome-muted p-4">
        <Button
          onClick={model.run}
          disabled={!canRun}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run analysis
            </>
          )}
        </Button>

        <p
          aria-live="polite"
          className="mt-2 text-center text-[11px] text-chrome-foreground/45"
        >
          {running
            ? "Running analysis..."
            : isFlood
              ? "Runs the real flood GIS calculation"
              : model.activeCriteria.length === 0
                ? "Select at least one criterion"
                : "Ready to run analysis"}
        </p>
      </div>
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
