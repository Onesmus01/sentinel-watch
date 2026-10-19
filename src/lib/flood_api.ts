
export interface FloodSummaryItem {
  class: number;
  label: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  pixel_count: number;
  area_km2: number;
  percentage: number;
}

export interface FloodWeights {
  dist_to_river: number;
  rainfall: number;
  landcover: number;
}

export interface FloodWardResult {
  id: string;
  name: string;
  subCounty: string;
  county: string;
  score: number;
  riskClass: number;
  riskLabel: string;
  flood: {
    veryLow: number;
    low: number;
    moderate: number;
    high: number;
    veryHigh: number;
    affectedAreaKm2: number;
  };
}

export interface FloodApiResponse {
  success: boolean;
  hazard: {
    id: number;
    name: string;
    hazard_type: string;
  };
  calculation?: {
    summary: FloodSummaryItem[];
    wards: FloodWardResult[];
    weights: FloodWeights;
    outputs: {
      fhi_raster: string;
      classes_raster: string;
      diagnostic_map: string;
      hotspot_map: string;
    };
    created_at: string;
  };
  error?: string;
  details?: string;
}

const DJANGO_API_URL = (
  import.meta.env.VITE_DJANGO_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const FLOOD_API_URL = `${DJANGO_API_URL}/api/calculations/flood/`;

const CACHE_KEY = `sentinel-watch:flood-analysis:${FLOOD_API_URL}`;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedFloodResponse {
  cachedAt: number;
  data: FloodApiResponse;
}

let memoryCache: CachedFloodResponse | null = null;
let inFlightGet: Promise<FloodApiResponse> | null = null;
let requestRevision = 0;

function isValidResponse(value: unknown): value is FloodApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<FloodApiResponse>;
  const calculation = data.calculation;

  return (
    data.success === true &&
    typeof data.hazard === "object" &&
    data.hazard !== null &&
    typeof calculation === "object" &&
    calculation !== null &&
    Array.isArray(calculation.wards) &&
    Array.isArray(calculation.summary)
  );
}

function isCacheFresh(
  entry: CachedFloodResponse | null,
): boolean {
  return Boolean(
    entry &&
      Date.now() - entry.cachedAt >= 0 &&
      Date.now() - entry.cachedAt < CACHE_TTL_MS &&
      isValidResponse(entry.data),
  );
}

function readCache(): FloodApiResponse | null {
  if (isCacheFresh(memoryCache)) {
    return memoryCache!.data;
  }

  memoryCache = null;

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(CACHE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as CachedFloodResponse;

    if (
      typeof parsed.cachedAt !== "number" ||
      !isValidResponse(parsed.data) ||
      !isCacheFresh(parsed)
    ) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    memoryCache = parsed;
    return parsed.data;
  } catch {
    // Continue without persistent caching if storage is unavailable.
    return null;
  }
}

function writeCache(data: FloodApiResponse): void {
  if (!isValidResponse(data)) {
    return;
  }

  const entry: CachedFloodResponse = {
    cachedAt: Date.now(),
    data,
  };

  memoryCache = entry;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(entry),
    );
  } catch {
    // The in-memory cache remains available.
  }
}

export function clearFloodAnalysisCache(): void {
  requestRevision += 1;
  memoryCache = null;
  inFlightGet = null;

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // In-memory cache has already been cleared.
    }
  }
}

async function requestFloodAnalysis(
  weights?: FloodWeights,
): Promise<FloodApiResponse> {
  const response = await fetch(FLOOD_API_URL, {
    method: weights ? "POST" : "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(weights ? { "Content-Type": "application/json" } : {}),
    },
    ...(weights ? { body: JSON.stringify({ weights }) } : {}),
  });

  const responseText = await response.text();

  let data: FloodApiResponse;

  try {
    data = JSON.parse(responseText) as FloodApiResponse;
  } catch {
    throw new Error(
      `Flood API returned a non-JSON response (HTTP ${response.status}). ` +
        responseText.slice(0, 500),
    );
  }

  if (!response.ok) {
    throw new Error(
      data.details ||
        data.error ||
        `Flood API request failed with status ${response.status}.`,
    );
  }

  if (!isValidResponse(data)) {
    throw new Error(
      data.details ||
        data.error ||
        "The flood API did not return a successful calculation.",
    );
  }

  return data;
}

export async function getFloodAnalysis(
  weights?: FloodWeights,
  options: { forceRefresh?: boolean } = {},
): Promise<FloodApiResponse> {
  // A POST intentionally requests a new calculation.
  if (weights) {
    requestRevision += 1;
    inFlightGet = null;

    const result = await requestFloodAnalysis(weights);

    writeCache(result);
    return result;
  }

  // Reuse cached results unless the caller explicitly requests a refresh.
  if (!options.forceRefresh) {
    const cached = readCache();

    if (cached) {
      return cached;
    }
  }

  // Reuse an existing GET rather than making duplicate requests.
  if (inFlightGet) {
    return inFlightGet;
  }

  const revisionAtStart = requestRevision;

  const request = requestFloodAnalysis()
    .then((result) => {
      // An older GET must not overwrite results from a newer calculation.
      if (revisionAtStart === requestRevision) {
        writeCache(result);
      }

      return result;
    })
    .finally(() => {
      if (inFlightGet === request) {
        inFlightGet = null;
      }
    });

  inFlightGet = request;

  return request;
}
