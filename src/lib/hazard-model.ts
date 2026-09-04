export type HazardId = "flood" | "drought" | "landslide";
export type ParameterId = "gradient" | "rainfall" | "temperature" | "humidity";

export interface ParameterDef {
  id: ParameterId;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export const PARAMETERS: ParameterDef[] = [
  { id: "gradient", label: "Gradient", unit: "%", min: 0, max: 60, step: 1, default: 12 },
  { id: "rainfall", label: "Rainfall", unit: "mm", min: 0, max: 400, step: 5, default: 120 },
  { id: "temperature", label: "Temperature", unit: "°C", min: 5, max: 45, step: 1, default: 24 },
  { id: "humidity", label: "Humidity", unit: "%", min: 0, max: 100, step: 1, default: 62 },
];

export const HAZARDS: { id: HazardId; label: string; blurb: string }[] = [
  { id: "flood", label: "Flood", blurb: "Surface water accumulation" },
  { id: "drought", label: "Drought", blurb: "Prolonged moisture deficit" },
  { id: "landslide", label: "Landslide", blurb: "Slope mass movement" },
];

export const RISK_CLASSES = [
  { id: "very-low", label: "Very Low", range: "0 – 20", varName: "--risk-1" },
  { id: "low", label: "Low", range: "21 – 40", varName: "--risk-2" },
  { id: "moderate", label: "Moderate", range: "41 – 60", varName: "--risk-3" },
  { id: "high", label: "High", range: "61 – 80", varName: "--risk-4" },
  { id: "severe", label: "Severe", range: "81 – 100", varName: "--risk-5" },
] as const;

export type RiskClassId = (typeof RISK_CLASSES)[number]["id"];

export function riskClassFor(score: number): (typeof RISK_CLASSES)[number] {
  if (score <= 20) return RISK_CLASSES[0];
  if (score <= 40) return RISK_CLASSES[1];
  if (score <= 60) return RISK_CLASSES[2];
  if (score <= 80) return RISK_CLASSES[3];
  return RISK_CLASSES[4];
}

export interface Ward {
  id: string;
  name: string;
  subCounty: string;
  county: string;
  /** terrain traits, 0..1 — demo values driving the illustrative score */
  slope: number;
  drainage: number;
  aridity: number;
}

export interface SubCounty {
  name: string;
  wards: string[];
}

export interface County {
  name: string;
  subCounties: SubCounty[];
}

export const COUNTIES: County[] = [
  {
    name: "Nairobi",
    subCounties: [
      { name: "Westlands", wards: ["Kitisuru", "Parklands", "Karura", "Kangemi"] },
      { name: "Embakasi East", wards: ["Upper Savannah", "Utawala", "Mihango"] },
      { name: "Kasarani", wards: ["Mwiki", "Kahawa", "Roysambu", "Njiru"] },
    ],
  },
  {
    name: "Kisumu",
    subCounties: [
      { name: "Kisumu Central", wards: ["Railways", "Migosi", "Shaurimoyo", "Market Milimani"] },
      { name: "Nyando", wards: ["Ahero", "Kabonyo", "Awasi", "East Kano"] },
      { name: "Muhoroni", wards: ["Chemelil", "Miwani", "Ombeyi"] },
    ],
  },
  {
    name: "Baringo",
    subCounties: [
      { name: "Baringo North", wards: ["Barwessa", "Kabartonjo", "Saimo Soi"] },
      { name: "Marigat", wards: ["Ilchamus", "Mochongoi", "Marigat"] },
      { name: "Tiaty", wards: ["Ribkwo", "Silale", "Loiyamorok", "Tirioko"] },
    ],
  },
  {
    name: "Murang'a",
    subCounties: [
      { name: "Kangema", wards: ["Kanyenya-ini", "Muguru", "Rwathia"] },
      { name: "Mathioya", wards: ["Gitugi", "Kiru", "Kamacharia"] },
      { name: "Kandara", wards: ["Ng'araria", "Muruka", "Gaichanjiru", "Ithiru"] },
    ],
  },
];

/** deterministic 0..1 pseudo-random from a string seed */
function seeded(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function wardsOf(county: string): Ward[] {
  const c = COUNTIES.find((x) => x.name === county);
  if (!c) return [];
  return c.subCounties.flatMap((sc) =>
    sc.wards.map((w) => ({
      id: `${c.name}-${sc.name}-${w}`.replace(/\s+/g, "-").toLowerCase(),
      name: w,
      subCounty: sc.name,
      county: c.name,
      slope: seeded(w + c.name, 1),
      drainage: seeded(w + sc.name, 2),
      aridity: seeded(c.name + w, 3),
    })),
  );
}

export interface ParameterValues {
  gradient: number;
  rainfall: number;
  temperature: number;
  humidity: number;
}

export const DEFAULT_PARAMETERS: ParameterValues = {
  gradient: 12,
  rainfall: 120,
  temperature: 24,
  humidity: 62,
};

const norm = (v: number, min: number, max: number) =>
  Math.max(0, Math.min(1, (v - min) / (max - min)));

/** A criterion's contribution to one hazard. `invert` means low input = high risk. */
export interface HazardTerm {
  parameter: ParameterId;
  weight: number;
  invert: boolean;
}

/** The ward's intrinsic terrain contribution. Always counted: it is not a user criterion. */
export interface TraitTerm {
  of: "slope" | "drainage" | "aridity";
  weight: number;
  invert: boolean;
}

export interface HazardModelDef {
  id: HazardId;
  trait: TraitTerm;
  terms: HazardTerm[];
}

/**
 * The scoring weights, as data rather than branches, so that dropping a
 * criterion is a filter plus a renormalisation instead of a new code path.
 *
 * Note that no hazard uses all four parameters: temperature is a drought term
 * only, and gradient does not enter drought. `applicableParameters` exposes
 * that so the UI can say so rather than silently ignoring a selection.
 *
 * Each definition's weights sum to 1, which the unit tests assert.
 */
export const HAZARD_MODELS: HazardModelDef[] = [
  {
    id: "flood",
    trait: { of: "drainage", weight: 0.22, invert: true },
    terms: [
      { parameter: "rainfall", weight: 0.42, invert: false },
      { parameter: "humidity", weight: 0.18, invert: false },
      { parameter: "gradient", weight: 0.18, invert: true },
    ],
  },
  {
    id: "drought",
    trait: { of: "aridity", weight: 0.2, invert: false },
    terms: [
      { parameter: "rainfall", weight: 0.38, invert: true },
      { parameter: "temperature", weight: 0.24, invert: false },
      { parameter: "humidity", weight: 0.18, invert: true },
    ],
  },
  {
    id: "landslide",
    trait: { of: "slope", weight: 0.26, invert: false },
    terms: [
      { parameter: "gradient", weight: 0.4, invert: false },
      { parameter: "rainfall", weight: 0.2, invert: false },
      { parameter: "humidity", weight: 0.14, invert: false },
    ],
  },
];

export function hazardModel(hazard: HazardId): HazardModelDef {
  const m = HAZARD_MODELS.find((x) => x.id === hazard);
  if (!m) throw new Error(`unknown hazard: ${hazard}`);
  return m;
}

/** Which criteria actually affect this hazard. The UI uses this to flag no-ops. */
export function applicableParameters(hazard: HazardId): ParameterId[] {
  return hazardModel(hazard).terms.map((t) => t.parameter);
}

/** Normalise a raw parameter value to 0..1 against its declared min/max. */
function normalised(id: ParameterId, p: ParameterValues): number {
  const def = PARAMETERS.find((d) => d.id === id)!;
  return norm(p[id], def.min, def.max);
}

/**
 * Illustrative demo scoring. Weighted blend of the SELECTED criteria against the
 * ward's terrain trait.
 *
 * `selected` is the set of criteria the user chose to include. Criteria outside
 * it are dropped and the surviving weights are renormalised, so the score stays
 * on 0..100 and stays comparable across different selections instead of
 * collapsing toward zero as criteria are removed.
 *
 * With every applicable criterion selected the renormalisation is a no-op, so
 * this reproduces the original weights exactly.
 */
export function scoreWard(
  ward: Ward,
  hazard: HazardId,
  p: ParameterValues,
  selected: Iterable<ParameterId>,
): number {
  const model = hazardModel(hazard);
  const chosen = new Set(selected);
  const terms = model.terms.filter((t) => chosen.has(t.parameter));

  const traitValue = ward[model.trait.of];
  let weighted = model.trait.weight * (model.trait.invert ? 1 - traitValue : traitValue);
  let total = model.trait.weight;

  for (const t of terms) {
    const v = normalised(t.parameter, p);
    weighted += t.weight * (t.invert ? 1 - v : v);
    total += t.weight;
  }

  // total is never 0: the trait term is unconditional, so an empty or wholly
  // inapplicable selection degrades to a terrain-only score rather than NaN.
  const s = weighted / total;
  const jitter = (seeded(ward.id + hazard, 7) - 0.5) * 0.12;
  return Math.round(Math.max(2, Math.min(99, (s + jitter) * 100)));
}

export interface WardResult extends Ward {
  score: number;
  risk: (typeof RISK_CLASSES)[number];
}

export function runModel(
  county: string,
  hazard: HazardId,
  p: ParameterValues,
  selected: Iterable<ParameterId>,
  scope?: { subCounty?: string | undefined; ward?: string | undefined },
): WardResult[] {
  const chosen = [...selected];
  return wardsOf(county)
    .filter((w) => (scope?.subCounty ? w.subCounty === scope.subCounty : true))
    .filter((w) => (scope?.ward ? w.name === scope.ward : true))
    .map((w) => {
      const score = scoreWard(w, hazard, p, chosen);
      return { ...w, score, risk: riskClassFor(score) };
    });
}
