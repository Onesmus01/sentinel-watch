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

/**
 * Illustrative demo scoring. Weighted blend of the four parameters against each
 * ward's terrain traits. Swap this out for real hazard modelling later.
 */
export function scoreWard(ward: Ward, hazard: HazardId, p: ParameterValues): number {
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

export interface WardResult extends Ward {
  score: number;
  risk: (typeof RISK_CLASSES)[number];
}

export function runModel(
  county: string,
  hazard: HazardId,
  p: ParameterValues,
  scope?: { subCounty?: string; ward?: string },
): WardResult[] {
  return wardsOf(county)
    .filter((w) => (scope?.subCounty ? w.subCounty === scope.subCounty : true))
    .filter((w) => (scope?.ward ? w.name === scope.ward : true))
    .map((w) => {
      const score = scoreWard(w, hazard, p);
      return { ...w, score, risk: riskClassFor(score) };
    });
}

/** Simple irregular polygon layout so the map frame reads as terrain, not a grid. */
export function wardPolygon(index: number, total: number, seed: string): string {
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);
  const cw = 100 / cols;
  const ch = 100 / rows;
  const cx = (index % cols) * cw;
  const cy = Math.floor(index / cols) * ch;
  const pts: string[] = [];
  const corners = 6;
  for (let i = 0; i < corners; i++) {
    const a = (i / corners) * Math.PI * 2;
    const rad = 0.34 + seeded(seed, i + 11) * 0.16;
    const x = cx + cw / 2 + Math.cos(a) * cw * rad * 1.5;
    const y = cy + ch / 2 + Math.sin(a) * ch * rad * 1.5;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}
