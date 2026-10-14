
export type HazardId = "flood" | "drought" | "landslide";

export type ParameterId =
  | "gradient"
  | "rainfall"
  | "temperature"
  | "humidity";

export interface ParameterDef {
  id: ParameterId;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

/**
 * Legacy frontend parameter definitions.
 *
 * Flood analysis is now supplied by the real Django/GIS backend.
 * These definitions remain temporarily for the other hazard screens
 * until their GIS calculation APIs are connected.
 */
export const PARAMETERS: ParameterDef[] = [
  {
    id: "gradient",
    label: "Gradient",
    unit: "%",
    min: 0,
    max: 60,
    step: 1,
    default: 12,
  },
  {
    id: "rainfall",
    label: "Rainfall",
    unit: "mm",
    min: 0,
    max: 400,
    step: 5,
    default: 120,
  },
  {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    min: 5,
    max: 45,
    step: 1,
    default: 24,
  },
  {
    id: "humidity",
    label: "Humidity",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    default: 62,
  },
];

export const HAZARDS: {
  id: HazardId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "flood",
    label: "Flood",
    blurb: "Surface water accumulation",
  },
  {
    id: "drought",
    label: "Drought",
    blurb: "Prolonged moisture deficit",
  },
  {
    id: "landslide",
    label: "Landslide",
    blurb: "Slope mass movement",
  },
];

/**
 * GIS hazard classification.
 *
 * These labels match the flood hotspot classification produced
 * by the backend/GIS calculation:
 *
 * 1 = Very Low
 * 2 = Low
 * 3 = Moderate
 * 4 = High
 * 5 = Very High
 */
export const RISK_CLASSES = [
  {
    id: "very-low",
    label: "Very Low",
    range: "",
    varName: "--risk-1",
  },
  {
    id: "low",
    label: "Low",
    range: "",
    varName: "--risk-2",
  },
  {
    id: "moderate",
    label: "Moderate",
    range: "",
    varName: "--risk-3",
  },
  {
    id: "high",
    label: "High",
    range: "",
    varName: "--risk-4",
  },
  {
    id: "very-high",
    label: "Very High",
    range: "",
    varName: "--risk-5",
  },
] as const;

export type RiskClassId = (typeof RISK_CLASSES)[number]["id"];

/**
 * Convert the backend/GIS class number into the frontend legend class.
 */
export function riskClassForClass(
  classNumber: number,
): (typeof RISK_CLASSES)[number] {
  if (classNumber <= 1) return RISK_CLASSES[0];
  if (classNumber === 2) return RISK_CLASSES[1];
  if (classNumber === 3) return RISK_CLASSES[2];
  if (classNumber === 4) return RISK_CLASSES[3];

  return RISK_CLASSES[4];
}

/**
 * Kept temporarily for non-flood frontend code.
 *
 * Flood results should use the backend's actual class values rather
 * than calculating a score in the browser.
 */
export function riskClassFor(
  score: number,
): (typeof RISK_CLASSES)[number] {
  if (score <= 20) return RISK_CLASSES[0];
  if (score <= 40) return RISK_CLASSES[1];
  if (score <= 60) return RISK_CLASSES[2];
  if (score <= 80) return RISK_CLASSES[3];

  return RISK_CLASSES[4];
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

/**
 * Parameters currently exposed by the frontend.
 *
 * These are retained for drought/landslide placeholder screens.
 * Flood does not use them because its weights and inputs are supplied
 * by the real GIS backend.
 */
export function applicableParameters(
  hazard: HazardId,
): ParameterId[] {
  switch (hazard) {
    case "flood":
      return [];

    case "drought":
      return [
        "rainfall",
        "temperature",
        "humidity",
      ];

    case "landslide":
      return [
        "gradient",
        "rainfall",
        "humidity",
      ];

    default:
      return [];
  }
}

/**
 * Legacy result shape retained temporarily so the existing non-flood
 * UI can compile while those GIS APIs are being connected.
 */
export interface Ward {
  id: string;
  name: string;
  subCounty: string;
  county: string;
}

export interface WardResult extends Ward {
  score: number;
  risk: (typeof RISK_CLASSES)[number];
}

/**
 * Temporary placeholder for non-flood screens.
 *
 * This is deliberately not used by the real flood analysis.
 * Once drought and landslide APIs are connected, this function
 * will be removed together with the remaining demo model code.
 */
export function runModel(
  county: string,
  _hazard: HazardId,
  _parameters: ParameterValues,
  _selected: Iterable<ParameterId>,
  _scope?: {
    subCounty?: string;
    ward?: string;
  },
): WardResult[] {
  return [
    {
      id: `${county}-pending-gis`,
      name: "GIS results pending",
      subCounty: "",
      county,
      score: 0,
      risk: RISK_CLASSES[0],
    },
  ];
}
