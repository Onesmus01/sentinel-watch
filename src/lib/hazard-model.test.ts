import { describe, expect, it } from "vitest";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  riskClassFor,
  runModel,
  scoreWard,
  wardPolygon,
  wardsOf,
  type HazardId,
} from "./hazard-model";

describe("riskClassFor", () => {
  // Boundary table straight off the RISK_CLASSES ranges. The off-by-one at each
  // seam is the failure mode worth pinning: an inclusive/exclusive slip here
  // silently mislabels a ward one class too low.
  it.each([
    [0, "very-low"],
    [20, "very-low"],
    [21, "low"],
    [40, "low"],
    [41, "moderate"],
    [60, "moderate"],
    [61, "high"],
    [80, "high"],
    [81, "severe"],
    [100, "severe"],
  ])("scores %i as %s", (score, expected) => {
    expect(riskClassFor(score).id).toBe(expected);
  });

  it("covers the full 0..100 range with no gap between class ranges", () => {
    for (let s = 0; s <= 100; s++) {
      expect(RISK_CLASSES).toContain(riskClassFor(s));
    }
  });

  it("is monotone: risk class index never decreases as score rises", () => {
    let last = 0;
    for (let s = 0; s <= 100; s++) {
      const i = RISK_CLASSES.indexOf(riskClassFor(s));
      expect(i).toBeGreaterThanOrEqual(last);
      last = i;
    }
  });
});

describe("wardsOf", () => {
  it("returns every ward of every sub-county for a known county", () => {
    const nairobi = COUNTIES.find((c) => c.name === "Nairobi")!;
    const expected = nairobi.subCounties.reduce((n, s) => n + s.wards.length, 0);
    expect(wardsOf("Nairobi")).toHaveLength(expected);
  });

  it("returns an empty list for an unknown county rather than throwing", () => {
    expect(wardsOf("Atlantis")).toEqual([]);
  });

  it("mints unique ids across the whole dataset", () => {
    const ids = COUNTIES.flatMap((c) => wardsOf(c.name)).map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("emits slug-safe ids", () => {
    // Murang'a and "Saimo Soi" are the awkward ones: an apostrophe and a space.
    for (const w of wardsOf("Murang'a")) {
      expect(w.id).toMatch(/^[a-z0-9'-]+$/);
      expect(w.id).not.toContain(" ");
    }
  });

  it("gives terrain traits inside 0..1", () => {
    for (const w of COUNTIES.flatMap((c) => wardsOf(c.name))) {
      for (const t of [w.slope, w.drainage, w.aridity]) {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(1);
      }
    }
  });

  it("is deterministic across calls", () => {
    expect(wardsOf("Kisumu")).toEqual(wardsOf("Kisumu"));
  });
});

describe("scoreWard", () => {
  const wards = wardsOf("Baringo");

  it("keeps every score inside the clamp for every hazard and parameter extreme", () => {
    const extremes = [
      { gradient: 0, rainfall: 0, temperature: 5, humidity: 0 },
      { gradient: 60, rainfall: 400, temperature: 45, humidity: 100 },
      DEFAULT_PARAMETERS,
    ];
    for (const w of wards) {
      for (const h of HAZARDS) {
        for (const p of extremes) {
          const s = scoreWard(w, h.id, p);
          expect(s).toBeGreaterThanOrEqual(2);
          expect(s).toBeLessThanOrEqual(99);
          expect(Number.isInteger(s)).toBe(true);
        }
      }
    }
  });

  it("clamps out-of-range parameter input instead of escaping the score range", () => {
    // The sidebar clamps at the input, but the model must not blow up if a
    // caller skips it — this is the guard that keeps a bad URL param harmless.
    const wild = { gradient: 1e6, rainfall: -1e6, temperature: 1e6, humidity: -1e6 };
    for (const h of HAZARDS) {
      const s = scoreWard(wards[0]!, h.id, wild);
      expect(s).toBeGreaterThanOrEqual(2);
      expect(s).toBeLessThanOrEqual(99);
    }
  });

  it("is deterministic for the same ward, hazard and parameters", () => {
    const a = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS);
    const b = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS);
    expect(a).toBe(b);
  });

  it("responds to the parameter each hazard is meant to be driven by", () => {
    // Rainfall drives flood up and drought down. If a weight sign is ever
    // flipped in scoreWard, this is the test that catches it.
    const dry = { ...DEFAULT_PARAMETERS, rainfall: 0 };
    const wet = { ...DEFAULT_PARAMETERS, rainfall: 400 };
    const floodDry = wards.map((w) => scoreWard(w, "flood", dry));
    const floodWet = wards.map((w) => scoreWard(w, "flood", wet));
    const droughtDry = wards.map((w) => scoreWard(w, "drought", dry));
    const droughtWet = wards.map((w) => scoreWard(w, "drought", wet));

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(floodWet)).toBeGreaterThan(mean(floodDry));
    expect(mean(droughtDry)).toBeGreaterThan(mean(droughtWet));
  });

  it("drives landslide with gradient", () => {
    const flat = { ...DEFAULT_PARAMETERS, gradient: 0 };
    const steep = { ...DEFAULT_PARAMETERS, gradient: 60 };
    const mean = (p: typeof flat) =>
      wards.map((w) => scoreWard(w, "landslide", p)).reduce((a, b) => a + b, 0) / wards.length;
    expect(mean(steep)).toBeGreaterThan(mean(flat));
  });
});

describe("runModel", () => {
  it("scores every ward of the county when unscoped", () => {
    expect(runModel("Nairobi", "flood", DEFAULT_PARAMETERS)).toHaveLength(
      wardsOf("Nairobi").length,
    );
  });

  it("narrows to a sub-county", () => {
    const out = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, { subCounty: "Nyando" });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((r) => r.subCounty === "Nyando")).toBe(true);
  });

  it("narrows to a single ward", () => {
    const out = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, {
      subCounty: "Nyando",
      ward: "Ahero",
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Ahero");
  });

  it("treats undefined scope fields as 'no filter', not as a literal match", () => {
    const scoped = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, {
      subCounty: undefined,
      ward: undefined,
    });
    expect(scoped).toHaveLength(wardsOf("Kisumu").length);
  });

  it("returns an empty list for a ward that is not in the county", () => {
    expect(runModel("Kisumu", "flood", DEFAULT_PARAMETERS, { ward: "Kitisuru" })).toEqual([]);
  });

  it("attaches the risk class that matches each score", () => {
    for (const r of runModel("Baringo", "landslide", DEFAULT_PARAMETERS)) {
      expect(r.risk).toBe(riskClassFor(r.score));
    }
  });

  it("is stable across runs for every county and hazard", () => {
    for (const c of COUNTIES) {
      for (const h of HAZARDS) {
        expect(runModel(c.name, h.id, DEFAULT_PARAMETERS)).toEqual(
          runModel(c.name, h.id, DEFAULT_PARAMETERS),
        );
      }
    }
  });
});

describe("wardPolygon", () => {
  it("emits six 'x,y' pairs of finite numbers", () => {
    const pts = wardPolygon(0, 12, "seed").split(" ");
    expect(pts).toHaveLength(6);
    for (const p of pts) {
      const [x, y] = p.split(",").map(Number);
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("does not divide by zero for a single-ward result", () => {
    // total = 1 is the real case: scoping to one ward. cols/rows must not be 0.
    const pts = wardPolygon(0, 1, "solo").split(" ");
    expect(pts).toHaveLength(6);
    for (const n of pts.flatMap((p) => p.split(",").map(Number))) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it("places different indices at different centroids", () => {
    const centroid = (s: string) => {
      const pts = s.split(" ").map((p) => p.split(",").map(Number) as [number, number]);
      return pts.reduce((a, [x, y]) => [a[0] + x / 6, a[1] + y / 6], [0, 0]);
    };
    const a = centroid(wardPolygon(0, 9, "a"));
    const b = centroid(wardPolygon(8, 9, "b"));
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(10);
  });

  it("is deterministic for the same inputs", () => {
    expect(wardPolygon(3, 9, "x")).toBe(wardPolygon(3, 9, "x"));
  });
});

describe("dataset and definition invariants", () => {
  it("declares a default inside [min, max] for every parameter", () => {
    for (const p of PARAMETERS) {
      expect(p.default).toBeGreaterThanOrEqual(p.min);
      expect(p.default).toBeLessThanOrEqual(p.max);
      expect(p.step).toBeGreaterThan(0);
    }
  });

  it("keeps DEFAULT_PARAMETERS in step with the PARAMETERS definitions", () => {
    // Two sources of truth for the same numbers; this is the drift alarm.
    for (const p of PARAMETERS) {
      expect(DEFAULT_PARAMETERS[p.id]).toBe(p.default);
    }
    expect(Object.keys(DEFAULT_PARAMETERS).sort()).toEqual(PARAMETERS.map((p) => p.id).sort());
  });

  it("gives every county at least one sub-county with at least one ward", () => {
    for (const c of COUNTIES) {
      expect(c.subCounties.length).toBeGreaterThan(0);
      for (const s of c.subCounties) expect(s.wards.length).toBeGreaterThan(0);
    }
  });

  it("names sub-counties uniquely within a county", () => {
    for (const c of COUNTIES) {
      const names = c.subCounties.map((s) => s.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("declares exactly the three hazards the UI offers", () => {
    expect(HAZARDS.map((h) => h.id)).toEqual<HazardId[]>(["flood", "drought", "landslide"]);
  });

  it("gives every risk class a --risk-* custom property that styles.css defines", () => {
    for (const rc of RISK_CLASSES) {
      expect(rc.varName).toMatch(/^--risk-[1-5]$/);
    }
    expect(new Set(RISK_CLASSES.map((r) => r.varName)).size).toBe(RISK_CLASSES.length);
  });
});
