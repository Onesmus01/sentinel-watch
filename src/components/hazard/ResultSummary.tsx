import type { WardResult } from "@/lib/hazard-model";

export function ResultSummary({ results }: { results: WardResult[] }) {
  const has = results.length > 0;
  const high = results.filter((r) => r.score > 60).length;
  const top = has ? [...results].sort((a, b) => b.score - a.score)[0] : null;
  const avg = has ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  const cards = [
    { label: "Wards at high risk", value: has ? `${high}/${results.length}` : "—" },
    { label: "Highest ranked ward", value: top ? top.name : "—", sub: top ? top.risk.label : "" },
    { label: "Average risk score", value: has ? String(avg) : "—" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight">
            {c.value}
          </p>
          {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
