
import { Play, Search, Loader2 } from "lucide-react";

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

import { HAZARDS } from "@/lib/hazard-model";
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

  return (
    <div className="flex h-full flex-col bg-chrome text-chrome-foreground">
      <div className="flex-1 overflow-y-auto">
        {/* HAZARD */}
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

        {/* LOCATION */}
        <Section title="Location">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chrome-foreground/40" />

            <Input
              value={model.query}
              onChange={(event) => model.setQuery(event.target.value)}
              placeholder="Search county…"
              aria-label="Search county"
              className="border-chrome-muted bg-chrome-muted/60 pl-9 text-chrome-foreground placeholder:text-chrome-foreground/40"
            />
          </div>

          <div className="mt-3 space-y-3">
            {/* COUNTY */}
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
                        ? "Loading counties…"
                        : model.filteredCounties.length === 0
                          ? "No counties available"
                          : "Select county"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {model.filteredCounties.map((county) => (
                    <SelectItem
                      key={county.name}
                      value={county.name}
                    >
                      {county.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {model.countiesError && (
                <p className="mt-1.5 text-[11px] text-red-400">
                  {model.countiesError}
                </p>
              )}

              {!model.countiesLoading &&
                !model.countiesError &&
                model.filteredCounties.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-chrome-foreground/40">
                    No counties were returned by the GIS layer.
                  </p>
                )}
            </Field>

            {/* SUB-COUNTY */}
            <Field label="Sub-county">
              <Select
                value={model.subCounty}
                onValueChange={model.selectSubCounty}
                disabled={model.subCounties.length === 0}
              >
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
                  <SelectValue placeholder="All sub-counties" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All sub-counties
                  </SelectItem>

                  {model.subCounties.map((subCounty) => (
                    <SelectItem
                      key={subCounty}
                      value={subCounty}
                    >
                      {subCounty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {model.subCounties.length === 0 && (
                <p className="mt-1.5 text-[11px] text-chrome-foreground/40">
                  Sub-county GIS layer not connected yet.
                </p>
              )}
            </Field>

            {/* WARD */}
            <Field label="Ward">
              <Select
                value={model.ward}
                onValueChange={model.setWard}
                disabled={model.wards.length === 0}
              >
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
                  <SelectValue placeholder="All wards" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All wards
                  </SelectItem>

                  {model.wards.map((ward) => (
                    <SelectItem key={ward} value={ward}>
                      {ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {model.wards.length === 0 && (
                <p className="mt-1.5 text-[11px] text-chrome-foreground/40">
                  Ward GIS layer not connected yet.
                </p>
              )}
            </Field>
          </div>
        </Section>

        {/* FLOOD MODEL */}
        {isFlood && (
          <Section title="Flood model">
            <p className="mb-3 text-xs leading-5 text-chrome-foreground/50">
              The flood susceptibility calculation uses the
              backend AHP weights. These values are fixed for the
              current GIS model.
            </p>

            <div className="space-y-2">
              <Factor
                label="Distance to river"
                value="58.33%"
              />

              <Factor
                label="Rainfall"
                value="33.33%"
              />

              <Factor
                label="Land cover"
                value="8.33%"
              />
            </div>

            <div className="mt-3 rounded-md border border-chrome-muted bg-chrome-muted/20 px-3 py-2.5">
              <p className="text-[11px] leading-5 text-chrome-foreground/45">
                These weights are supplied by the flood calculation
                API. The frontend does not modify them.
              </p>
            </div>
          </Section>
        )}

        {/* NON-FLOOD STATUS */}
        {!isFlood && (
          <Section title="Model status">
            <div className="rounded-md border border-chrome-muted bg-chrome-muted/20 px-3 py-3">
              <p className="text-xs leading-5 text-chrome-foreground/55">
                {
                  HAZARDS.find(
                    (item) => item.id === model.hazard,
                  )?.label
                }{" "}
                integration is not connected to the GIS calculation
                API yet.
              </p>
            </div>
          </Section>
        )}

        {/* ERROR */}
        {model.error && (
          <section className="px-4 py-4">
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-3">
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

      {/* RUN */}
      <div className="border-t border-chrome-muted p-4">
        <Button
          onClick={model.run}
          disabled={running || !model.canRun}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running…
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
            ? "Running flood calculation…"
            : isFlood
              ? "Runs the real flood calculation"
              : "Select an applicable criterion to run"}
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

function Factor({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-chrome-muted bg-chrome-muted/20 px-3 py-2.5">
      <span className="text-sm text-chrome-foreground/80">
        {label}
      </span>

      <span className="text-sm font-semibold tabular-nums text-accent">
        {value}
      </span>
    </div>
  );
}
