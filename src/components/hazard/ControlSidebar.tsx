import { Play, RotateCcw, Search, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTIES, HAZARDS, PARAMETERS } from "@/lib/hazard-model";
import type { HazardModel } from "@/hooks/use-hazard-model";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

  return (
    <div className="flex h-full flex-col bg-chrome text-chrome-foreground">
      <div className="flex-1 overflow-y-auto">
        {/* Hazard first: it decides which criteria below are even applicable, so
            choosing it last would mean revisiting the criteria afterwards. */}
        <Section title="Hazard">
          <div className="space-y-2">
            {HAZARDS.map((h) => {
              const active = model.hazard === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => model.setHazard(h.id)}
                  aria-pressed={active}
                  className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent/15 text-chrome-foreground"
                      : "border-chrome-muted bg-chrome-muted/30 text-chrome-foreground/70 hover:bg-chrome-muted/60"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={`size-2 rounded-full ${active ? "bg-accent" : "bg-chrome-foreground/25"}`}
                    />
                    {h.label}
                  </span>
                  <span className="mt-0.5 block pl-4 text-xs text-chrome-foreground/45">
                    {h.blurb}
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
              onChange={(e) => model.setQuery(e.target.value)}
              placeholder="Search location…"
              aria-label="Search location"
              className="border-chrome-muted bg-chrome-muted/60 pl-9 text-chrome-foreground placeholder:text-chrome-foreground/40"
            />
          </div>

          <div className="mt-3 space-y-3">
            <Field label="County">
              <Select value={model.county} onValueChange={model.selectCounty}>
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
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
            </Field>

            <Field label="Sub-county">
              <Select value={model.subCounty} onValueChange={model.selectSubCounty}>
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
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
            </Field>

            <Field label="Ward">
              <Select value={model.ward} onValueChange={model.setWard}>
                <SelectTrigger className="w-full border-chrome-muted bg-chrome-muted/60 text-chrome-foreground">
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
            </Field>
          </div>
        </Section>

        <Section title="Criteria">
          <p className="mb-3 text-xs text-chrome-foreground/45">
            Select the criteria this run should account for. Nothing is included until you choose
            it.
          </p>

          <div className="space-y-2">
            {PARAMETERS.map((p) => {
              const on = model.selected.includes(p.id);
              const applies = model.applicable.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-md border px-3 py-2.5 transition-colors ${
                    on
                      ? "border-chrome-muted bg-chrome-muted/50"
                      : "border-chrome-muted/60 bg-chrome-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id={`criterion-${p.id}`}
                      checked={on}
                      onCheckedChange={() => model.toggleParameter(p.id)}
                      className="border-chrome-foreground/30 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
                    />
                    <Label
                      htmlFor={`criterion-${p.id}`}
                      className="flex-1 cursor-pointer text-sm text-chrome-foreground/85"
                    >
                      {p.label}
                    </Label>

                    {on && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={model.parameters[p.id]}
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          aria-label={`${p.label} value in ${p.unit}`}
                          onChange={(e) => {
                            // Clamp on the way in: the model clamps too, but an
                            // out-of-range figure left visible in the field would
                            // not match the number the run actually used.
                            const n = Number(e.target.value);
                            if (Number.isNaN(n)) return;
                            model.setParameter(p.id, Math.max(p.min, Math.min(p.max, n)));
                          }}
                          className="h-8 w-20 border-chrome-muted bg-chrome/80 text-right text-chrome-foreground tabular-nums"
                        />
                        <span className="w-6 text-xs text-chrome-foreground/50">{p.unit}</span>
                      </div>
                    )}
                  </div>

                  {on && (
                    <p className="mt-1.5 pl-[26px] text-[11px] text-chrome-foreground/40">
                      {applies ? (
                        <>
                          Range {p.min}–{p.max}
                          {p.unit} · default {p.default}
                          {p.unit}
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-chrome-foreground/70">
                          <Info className="size-3 shrink-0" />
                          Not used for{" "}
                          {HAZARDS.find((h) => h.id === model.hazard)?.label.toLowerCase()}; it will
                          not affect this run.
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {model.selected.length > 0 && (
            <div className="mt-3 flex items-center gap-4">
              {!model.usesDefaults && (
                <button
                  type="button"
                  onClick={model.resetParameters}
                  className="inline-flex items-center gap-1.5 text-xs text-accent transition-opacity hover:opacity-80"
                >
                  <RotateCcw className="size-3.5" />
                  Use system defaults
                </button>
              )}
              <button
                type="button"
                onClick={model.clearParameters}
                className="text-xs text-chrome-foreground/45 transition-colors hover:text-chrome-foreground/80"
              >
                Clear selection
              </button>
            </div>
          )}
        </Section>
      </div>

      <div className="border-t border-chrome-muted p-4">
        <Button
          onClick={model.run}
          disabled={running || !model.canRun}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Running…
            </>
          ) : (
            <>
              <Play className="size-4" /> Run analysis
            </>
          )}
        </Button>
        <p aria-live="polite" className="mt-2 text-center text-[11px] text-chrome-foreground/45">
          {model.canRun
            ? `${model.activeCriteria.length} of ${model.applicable.length} applicable criteria selected`
            : "Select at least one criterion that applies to this hazard"}
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-chrome-foreground/55">{label}</Label>
      {children}
    </div>
  );
}
