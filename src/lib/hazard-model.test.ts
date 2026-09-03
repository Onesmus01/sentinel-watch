import { describe, expect, it } from "vitest";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  HAZARD_MODELS,
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  applicableParameters,
  hazardModel,
  riskClassFor,
  runModel,
  scoreWard,
  wardPolygon,
  wardsOf,
  type HazardId,
  type ParameterId,
} from "./hazard-model";

/** Every criterion. Most tests want "consider everything", the old behaviour. */
const ALL: ParameterId[] = PARAMETERS.map((d) => d.id);

/** Only the criteria that actually affect the hazard. */
const applies = (h: HazardId): ParameterId[] => applicableParameters(h);

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
          const s = scoreWard(w, h.id, p, applies(h.id));
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
      const s = scoreWard(wards[0]!, h.id, wild, applies(h.id));
      expect(s).toBeGreaterThanOrEqual(2);
      expect(s).toBeLessThanOrEqual(99);
    }
  });

  it("is deterministic for the same ward, hazard and parameters", () => {
    const a = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ALL);
    const b = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ALL);
    expect(a).toBe(b);
  });

  it("responds to the parameter each hazard is meant to be driven by", () => {
    // Rainfall drives flood up and drought down. If a weight sign is ever
    // flipped in scoreWard, this is the test that catches it.
    const dry = { ...DEFAULT_PARAMETERS, rainfall: 0 };
    const wet = { ...DEFAULT_PARAMETERS, rainfall: 400 };
    const floodDry = wards.map((w) => scoreWard(w, "flood", dry, ALL));
    const floodWet = wards.map((w) => scoreWard(w, "flood", wet, ALL));
    const droughtDry = wards.map((w) => scoreWard(w, "drought", dry, ALL));
    const droughtWet = wards.map((w) => scoreWard(w, "drought", wet, ALL));

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(floodWet)).toBeGreaterThan(mean(floodDry));
    expect(mean(droughtDry)).toBeGreaterThan(mean(droughtWet));
  });

  it("drives landslide with gradient", () => {
    const flat = { ...DEFAULT_PARAMETERS, gradient: 0 };
    const steep = { ...DEFAULT_PARAMETERS, gradient: 60 };
    const mean = (p: typeof flat) =>
      wards.map((w) => scoreWard(w, "landslide", p, ALL)).reduce((a, b) => a + b, 0) / wards.length;
    expect(mean(steep)).toBeGreaterThan(mean(flat));
  });
});

describe("runModel", () => {
  it("scores every ward of the county when unscoped", () => {
    expect(runModel("Nairobi", "flood", DEFAULT_PARAMETERS, ALL)).toHaveLength(
      wardsOf("Nairobi").length,
    );
  });

  it("narrows to a sub-county", () => {
    const out = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ALL, { subCounty: "Nyando" });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((r) => r.subCounty === "Nyando")).toBe(true);
  });

  it("narrows to a single ward", () => {
    const out = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ALL, {
      subCounty: "Nyando",
      ward: "Ahero",
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Ahero");
  });

  it("treats undefined scope fields as 'no filter', not as a literal match", () => {
    const scoped = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ALL, {
      subCounty: undefined,
      ward: undefined,
    });
    expect(scoped).toHaveLength(wardsOf("Kisumu").length);
  });

  it("returns an empty list for a ward that is not in the county", () => {
    expect(runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ALL, { ward: "Kitisuru" })).toEqual([]);
  });

  it("attaches the risk class that matches each score", () => {
    for (const r of runModel("Baringo", "landslide", DEFAULT_PARAMETERS, ALL)) {
      expect(r.risk).toBe(riskClassFor(r.score));
    }
  });

  it("is stable across runs for every county and hazard", () => {
    for (const c of COUNTIES) {
      for (const h of HAZARDS) {
        expect(runModel(c.name, h.id, DEFAULT_PARAMETERS, ALL)).toEqual(
          runModel(c.name, h.id, DEFAULT_PARAMETERS, ALL),
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

  // The bug this pins: rad reached 0.50 and was multiplied by 1.5, putting
  // vertices 0.75 of a cell from centre when the half-width is 0.5. Polygons
  // overlapped and occluded each other, and the occluded fill is the risk
  // class, so the map showed the wrong class for the hidden ward.
  it("keeps every vertex inside its own grid cell", () => {
    for (const total of [1, 2, 4, 9, 11, 12, 16, 25]) {
      const cols = Math.ceil(Math.sqrt(total));
      const rows = Math.ceil(total / cols);
      const cw = 100 / cols;
      const ch = 100 / rows;
      for (let i = 0; i < total; i++) {
        const cx = (i % cols) * cw;
        const cy = Math.floor(i / cols) * ch;
        for (const pt of wardPolygon(i, total, `w${i}`).split(" ")) {
          const [x, y] = pt.split(",").map(Number) as [number, number];
          expect(x).toBeGreaterThanOrEqual(cx - 1e-9);
          expect(x).toBeLessThanOrEqual(cx + cw + 1e-9);
          expect(y).toBeGreaterThanOrEqual(cy - 1e-9);
          expect(y).toBeLessThanOrEqual(cy + ch + 1e-9);
        }
      }
    }
  });

  it("leaves a surface gap between the bounding boxes of any two wards", () => {
    const total = 12;
    const boxes = Array.from({ length: total }, (_, i) => {
      const pts = wardPolygon(i, total, `w${i}`)
        .split(" ")
        .map((p) => p.split(",").map(Number) as [number, number]);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    });
    for (let a = 0; a < total; a++) {
      for (let b = a + 1; b < total; b++) {
        const overlaps =
          boxes[a]!.minX < boxes[b]!.maxX &&
          boxes[b]!.minX < boxes[a]!.maxX &&
          boxes[a]!.minY < boxes[b]!.maxY &&
          boxes[b]!.minY < boxes[a]!.maxY;
        expect(overlaps, `ward ${a} overlaps ward ${b}`).toBe(false);
      }
    }
  });

  it("still varies corner distance, so wards do not become regular hexagons", () => {
    const pts = wardPolygon(0, 9, "vary")
      .split(" ")
      .map((p) => p.split(",").map(Number) as [number, number]);
    const cw = 100 / 3;
    const ch = 100 / 3;
    const radii = pts.map(([x, y]) => Math.hypot((x - cw / 2) / cw, (y - ch / 2) / ch));
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(0.02);
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

describe("HAZARD_MODELS weight table", () => {
  it("gives every hazard exactly one definition", () => {
    expect(HAZARD_MODELS.map((m) => m.id).sort()).toEqual(HAZARDS.map((h) => h.id).sort());
  });

  it("sums each definition's weights to 1, so a full selection needs no renormalising", () => {
    for (const m of HAZARD_MODELS) {
      const total = m.trait.weight + m.terms.reduce((n, t) => n + t.weight, 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });

  it("gives every term a positive weight and a known parameter", () => {
    const ids = new Set(PARAMETERS.map((d) => d.id));
    for (const m of HAZARD_MODELS) {
      expect(m.trait.weight).toBeGreaterThan(0);
      for (const t of m.terms) {
        expect(t.weight).toBeGreaterThan(0);
        expect(ids.has(t.parameter)).toBe(true);
      }
    }
  });

  it("names each parameter at most once per hazard", () => {
    for (const m of HAZARD_MODELS) {
      const names = m.terms.map((t) => t.parameter);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("throws on an unknown hazard rather than scoring silently", () => {
    expect(() => hazardModel("cyclone" as HazardId)).toThrow(/unknown hazard/);
  });
});

describe("applicableParameters", () => {
  // Documented deliberately: the UI relies on these gaps to tell the user that a
  // selected criterion is inert for the hazard they picked.
  it.each([
    ["flood", ["rainfall", "humidity", "gradient"]],
    ["drought", ["rainfall", "temperature", "humidity"]],
    ["landslide", ["gradient", "rainfall", "humidity"]],
  ])("%s uses %j", (hazard, expected) => {
    expect(applicableParameters(hazard as HazardId).sort()).toEqual([...expected].sort());
  });

  it("leaves temperature out of flood and landslide, and gradient out of drought", () => {
    expect(applicableParameters("flood")).not.toContain("temperature");
    expect(applicableParameters("landslide")).not.toContain("temperature");
    expect(applicableParameters("drought")).not.toContain("gradient");
  });
});

describe("scoreWard criterion selection", () => {
  const wards = wardsOf("Kisumu");

  it("stays on 0..100 for every subset of criteria", () => {
    // 2^4 subsets x every hazard x every ward: renormalisation must never let a
    // score escape the clamp or divide by zero.
    const subsets: ParameterId[][] = [];
    for (let mask = 0; mask < 1 << ALL.length; mask++) {
      subsets.push(ALL.filter((_, i) => mask & (1 << i)));
    }
    expect(subsets).toHaveLength(16);

    for (const w of wards) {
      for (const h of HAZARDS) {
        for (const sel of subsets) {
          const s = scoreWard(w, h.id, DEFAULT_PARAMETERS, sel);
          expect(Number.isFinite(s)).toBe(true);
          expect(s).toBeGreaterThanOrEqual(2);
          expect(s).toBeLessThanOrEqual(99);
        }
      }
    }
  });

  it("falls back to a terrain-only score for an empty selection, not NaN", () => {
    for (const h of HAZARDS) {
      const s = scoreWard(wards[0]!, h.id, DEFAULT_PARAMETERS, []);
      expect(Number.isFinite(s)).toBe(true);
    }
  });

  it("treats an inapplicable criterion as a no-op", () => {
    // Temperature does not enter flood, so selecting it must change nothing.
    const withTemp = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["rainfall", "temperature"]);
    const without = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["rainfall"]);
    expect(withTemp).toBe(without);
  });

  it("scores a wholly inapplicable selection the same as no selection at all", () => {
    const inert = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["temperature"]);
    const none = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, []);
    expect(inert).toBe(none);
  });

  it("ignores the order criteria are given in", () => {
    const a = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["rainfall", "humidity"]);
    const b = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["humidity", "rainfall"]);
    expect(a).toBe(b);
  });

  it("ignores duplicates in the selection", () => {
    const once = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["rainfall"]);
    const twice = scoreWard(wards[0]!, "flood", DEFAULT_PARAMETERS, ["rainfall", "rainfall"]);
    expect(once).toBe(twice);
  });

  it("makes a dropped criterion stop mattering", () => {
    // With rainfall selected, changing rainfall moves flood scores. With it
    // deselected, the same change must move nothing.
    const dry = { ...DEFAULT_PARAMETERS, rainfall: 0 };
    const wet = { ...DEFAULT_PARAMETERS, rainfall: 400 };

    const withRain = wards.map((w) => [
      scoreWard(w, "flood", dry, ["rainfall", "humidity"]),
      scoreWard(w, "flood", wet, ["rainfall", "humidity"]),
    ]);
    expect(withRain.some(([a, b]) => a !== b)).toBe(true);

    for (const w of wards) {
      expect(scoreWard(w, "flood", dry, ["humidity"])).toBe(
        scoreWard(w, "flood", wet, ["humidity"]),
      );
    }
  });

  it("keeps a single-criterion score responsive to that criterion", () => {
    const dry = { ...DEFAULT_PARAMETERS, rainfall: 0 };
    const wet = { ...DEFAULT_PARAMETERS, rainfall: 400 };
    const mean = (p: typeof dry) =>
      wards.map((w) => scoreWard(w, "flood", p, ["rainfall"])).reduce((a, b) => a + b, 0) /
      wards.length;
    expect(mean(wet)).toBeGreaterThan(mean(dry));
  });

  it("renormalises rather than shrinking: dropping a criterion does not push every score down", () => {
    // The bug this guards: filtering terms without renormalising would make the
    // weights sum to less than 1 and drag every score toward zero, so a smaller
    // selection would look like lower risk.
    const p = { gradient: 30, rainfall: 300, temperature: 30, humidity: 80 };
    const full = wards.map((w) => scoreWard(w, "flood", p, applies("flood")));
    const partial = wards.map((w) => scoreWard(w, "flood", p, ["rainfall"]));
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    // Not asserting a direction, only that it did not collapse.
    expect(mean(partial)).toBeGreaterThan(mean(full) * 0.6);
  });
});

describe("runModel criterion selection", () => {
  it("passes the selection through to every ward", () => {
    const a = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ["rainfall"]);
    const b = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ALL);
    expect(a).not.toEqual(b);
    for (const r of a) {
      expect(r.score).toBe(
        scoreWard(
          wardsOf("Kisumu").find((w) => w.id === r.id)!,
          "flood",
          DEFAULT_PARAMETERS,
          ["rainfall"],
        ),
      );
    }
  });

  it("accepts a Set as well as an array", () => {
    expect(
      runModel("Kisumu", "flood", DEFAULT_PARAMETERS, new Set<ParameterId>(["rainfall"])),
    ).toEqual(runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ["rainfall"]));
  });
});
