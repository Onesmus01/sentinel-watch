import { Play, RotateCcw, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
        <Section title="Location">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chrome-foreground/40" />
            <Input
              value={model.query}
              onChange={(e) => model.setQuery(e.target.value)}
              placeholder="Search location…"
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

        <Section title="Hazards">
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

        <Section title="Parameters">
          <div className="flex items-center justify-between rounded-md border border-chrome-muted bg-chrome-muted/30 px-3 py-2.5">
            <Label htmlFor="defaults" className="text-sm text-chrome-foreground/80">
              Use system defaults
            </Label>
            <Switch
              id="defaults"
              checked={model.useDefaults}
              onCheckedChange={model.toggleDefaults}
            />
          </div>

          <div
            className={`mt-4 space-y-5 transition-opacity ${model.useDefaults ? "opacity-45" : ""}`}
          >
            {PARAMETERS.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm text-chrome-foreground/80">{p.label}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={model.parameters[p.id]}
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      disabled={model.useDefaults}
                      onChange={(e) =>
                        model.setParameter(
                          p.id,
                          Math.max(p.min, Math.min(p.max, Number(e.target.value))),
                        )
                      }
                      className="h-8 w-20 border-chrome-muted bg-chrome-muted/60 text-right text-chrome-foreground tabular-nums"
                    />
                    <span className="w-6 text-xs text-chrome-foreground/50">{p.unit}</span>
                  </div>
                </div>
                <Slider
                  className="mt-2.5"
                  value={[model.parameters[p.id]]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  disabled={model.useDefaults}
                  onValueChange={([v]) => model.setParameter(p.id, v ?? p.default)}
                />
                <p className="mt-1 text-[11px] text-chrome-foreground/40">
                  Default {p.default}
                  {p.unit}
                </p>
              </div>
            ))}
          </div>

          {!model.useDefaults && (
            <button
              type="button"
              onClick={model.resetParameters}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent transition-opacity hover:opacity-80"
            >
              <RotateCcw className="size-3.5" />
              Reset to defaults
            </button>
          )}
        </Section>
      </div>

      <div className="border-t border-chrome-muted p-4">
        <Button
          onClick={model.run}
          disabled={running}
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
