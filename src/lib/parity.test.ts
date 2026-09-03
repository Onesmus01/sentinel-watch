import { describe, expect, it } from "vitest";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  HAZARDS,
  PARAMETERS,
  applicableParameters,
  scoreWard,
  wardsOf,
  type HazardId,
  type ParameterValues,
  type Ward,
} from "@/lib/hazard-model";

// The ORIGINAL formula, transcribed from git history, kept only in this file.
// If the data-driven rewrite drifts from it for a full selection, this fails.
const norm = (v: number, min: number, max: number) =>
  Math.max(0, Math.min(1, (v - min) / (max - min)));

function seeded(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function legacyScore(ward: Ward, hazard: HazardId, p: ParameterValues): number {
  const g = norm(p.gradient, 0, 60);
  const r = norm(p.rainfall, 0, 400);
  const t = norm(p.temperature, 5, 45);
  const h = norm(p.humidity, 0, 100);
  let s: number;
  if (hazard === "flood") {
    s = 0.42 * r + 0.22 * (1 - ward.drainage) + 0.18 * h + 0.18 * (1 - g);
  } else if (hazard === "drought") {
    s = 0.38 * (1 - r) + 0.24 * t + 0.2 * ward.aridity + 0.18 * (1 - h);
  } else {
    s = 0.4 * g + 0.26 * ward.slope + 0.2 * r + 0.14 * h;
  }
  const jitter = (seeded(ward.id + hazard, 7) - 0.5) * 0.12;
  return Math.round(Math.max(2, Math.min(99, (s + jitter) * 100)));
}

const SAMPLES: ParameterValues[] = [
  DEFAULT_PARAMETERS,
  { gradient: 0, rainfall: 0, temperature: 5, humidity: 0 },
  { gradient: 60, rainfall: 400, temperature: 45, humidity: 100 },
  { gradient: 33, rainfall: 210, temperature: 31, humidity: 44 },
  { gradient: 7, rainfall: 355, temperature: 12, humidity: 91 },
];

describe("parity with the pre-rewrite formula", () => {
  it("matches exactly for every ward, hazard and sample when all applicable criteria are selected", () => {
    let compared = 0;
    for (const c of COUNTIES) {
      for (const w of wardsOf(c.name)) {
        for (const h of HAZARDS) {
          for (const p of SAMPLES) {
            expect(scoreWard(w, h.id, p, applicableParameters(h.id))).toBe(legacyScore(w, h.id, p));
            compared++;
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(500);
  });

  it("also matches when the full four-parameter set is passed, not just the applicable ones", () => {
    // Selecting an inapplicable criterion must be a no-op, not a weight change.
    const all = PARAMETERS.map((d) => d.id);
    for (const w of wardsOf("Baringo")) {
      for (const h of HAZARDS) {
        for (const p of SAMPLES) {
          expect(scoreWard(w, h.id, p, all)).toBe(legacyScore(w, h.id, p));
        }
      }
    }
  });
});
