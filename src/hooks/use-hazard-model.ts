
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_PARAMETERS,
  applicableParameters,
  runModel,
  type HazardId,
  type ParameterId,
  type ParameterValues,
  type WardResult,
} from "@/lib/hazard-model";

import {
  getFloodAnalysis,
  type FloodApiResponse,
  type FloodWeights,
} from "@/lib/flood_api";

export type RunStatus = "idle" | "running" | "done" | "error";

const DJANGO_API_URL = "http://127.0.0.1:8000";

/**
 * The calculator stores and displays percentages.
 * These defaults total exactly 100%.
 */
const DEFAULT_FLOOD_WEIGHTS: FloodWeights = {
  dist_to_river: 58.33,
  rainfall: 33.33,
  landcover: 8.34,
};

const FLOOD_WEIGHT_TOLERANCE = 0.01;

export interface GeoServerCounty {
  name: string;
  properties: Record<string, unknown>;
}

interface CountyApiItem {
  id: number | string;
  name: string;
  code: number | string | null;
}

interface SubCountyApiItem {
  id: number | string;
  name: string;
  county: string;
  code: number | string | null;
}

interface WardApiItem {
  id: number | string;
  name: string;
  county: string;
  constituency: string | null;
  code: number | string | null;
}

interface ApiResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
  error?: string;
  details?: string;
}

async function fetchLocationItems<T>(
  url: string,
  signal: AbortSignal,
): Promise<T[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const responseText = await response.text();

  let data: ApiResponse<T>;

  try {
    data = JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    throw new Error(
      `Location API returned a non-JSON response (HTTP ${response.status}). ` +
        responseText.slice(0, 300),
    );
  }

  if (!response.ok) {
    throw new Error(
      data.details ||
        data.error ||
        `Location request failed with status ${response.status}.`,
    );
  }

  if (!Array.isArray(data.results)) {
    throw new Error("The location API returned an invalid response.");
  }

  return data.results;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useHazardModel() {
  const [query, setQuery] = useState("");

  // Administrative locations.
  const [counties, setCounties] = useState<GeoServerCounty[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(true);
  const [countiesError, setCountiesError] = useState<string | null>(null);

  const [county, setCounty] = useState("");
  const [subCounty, setSubCounty] = useState("all");
  const [ward, setWard] = useState("all");

  const [subCountyItems, setSubCountyItems] = useState<SubCountyApiItem[]>([]);
  const [wardItems, setWardItems] = useState<WardApiItem[]>([]);

  const [subCountiesLoading, setSubCountiesLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);

  const [subCountiesError, setSubCountiesError] = useState<string | null>(null);
  const [wardsError, setWardsError] = useState<string | null>(null);

  // Hazard selection.
  const [hazard, setHazardState] = useState<HazardId>("flood");

  // Legacy parameters for drought and landslide.
  const [selected, setSelected] = useState<ParameterId[]>([]);
  const [parameters, setParameters] =
    useState<ParameterValues>(DEFAULT_PARAMETERS);

  // Flood weights are stored as percentages, not fractions.
  const [floodWeights, setFloodWeights] =
    useState<FloodWeights>({ ...DEFAULT_FLOOD_WEIGHTS });

  // Analysis state.
  const [status, setStatus] = useState<RunStatus>("idle");
  const [results, setResults] = useState<WardResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const [floodCalculation, setFloodCalculation] =
    useState<FloodApiResponse["calculation"] | null>(null);

  const [error, setError] = useState<string | null>(null);

  /*
   * Load counties.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadCounties() {
      setCountiesLoading(true);
      setCountiesError(null);

      try {
        const items = await fetchLocationItems<CountyApiItem>(
          `${DJANGO_API_URL}/api/locations/counties/`,
          controller.signal,
        );

        const unique = new Map<string, GeoServerCounty>();

        for (const item of items) {
          const name =
            typeof item.name === "string" ? item.name.trim() : "";

          if (!name || unique.has(name)) continue;

          unique.set(name, {
            name,
            properties: {
              id: item.id,
              code: item.code,
              COUNTY: name,
            },
          });
        }

        const loadedCounties = [...unique.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        if (controller.signal.aborted) return;

        setCounties(loadedCounties);

        setCounty((current) => {
          if (
            current &&
            loadedCounties.some((item) => item.name === current)
          ) {
            return current;
          }

          return loadedCounties[0]?.name ?? "";
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        setCounties([]);
        setCounty("");

        setCountiesError(
          getErrorMessage(err, "Unable to load counties from the backend."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setCountiesLoading(false);
        }
      }
    }

    void loadCounties();

    return () => controller.abort();
  }, []);

  /*
   * Load sub-counties and wards for the selected county.
   */
  useEffect(() => {
    if (!county) {
      setSubCountyItems([]);
      setWardItems([]);

      setSubCountiesError(null);
      setWardsError(null);

      setSubCountiesLoading(false);
      setWardsLoading(false);

      return;
    }

    const controller = new AbortController();
    const countyQuery = encodeURIComponent(county);

    async function loadSubCounties() {
      setSubCountiesLoading(true);
      setSubCountiesError(null);
      setSubCountyItems([]);

      try {
        const items = await fetchLocationItems<SubCountyApiItem>(
          `${DJANGO_API_URL}/api/locations/subcounties/?county=${countyQuery}`,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        const unique = new Map<string, SubCountyApiItem>();

        for (const item of items) {
          const name = item.name?.trim();

          if (!name || unique.has(name)) continue;

          unique.set(name, { ...item, name });
        }

        setSubCountyItems(
          [...unique.values()].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setSubCountyItems([]);
        setSubCounty("all");

        setSubCountiesError(
          getErrorMessage(err, "Unable to load sub-counties."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setSubCountiesLoading(false);
        }
      }
    }

    async function loadWards() {
      setWardsLoading(true);
      setWardsError(null);
      setWardItems([]);

      try {
        const items = await fetchLocationItems<WardApiItem>(
          `${DJANGO_API_URL}/api/locations/wards/?county=${countyQuery}`,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        const unique = new Map<string, WardApiItem>();

        for (const item of items) {
          const name = item.name?.trim();

          if (!name || unique.has(name)) continue;

          unique.set(name, { ...item, name });
        }

        setWardItems(
          [...unique.values()].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setWardItems([]);
        setWard("all");

        setWardsError(getErrorMessage(err, "Unable to load wards."));
      } finally {
        if (!controller.signal.aborted) {
          setWardsLoading(false);
        }
      }
    }

    void loadSubCounties();
    void loadWards();

    return () => controller.abort();
  }, [county]);

  /*
   * County search.
   */
  const filteredCounties = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return counties;

    return counties.filter((item) =>
      item.name.toLowerCase().includes(value),
    );
  }, [counties, query]);

  const subCounties = useMemo(
    () => subCountyItems.map((item) => item.name),
    [subCountyItems],
  );

  const wards = useMemo(
    () => wardItems.map((item) => item.name),
    [wardItems],
  );

  /*
   * Applicable legacy parameters.
   */
  const applicable = useMemo(
    () => applicableParameters(hazard),
    [hazard],
  );

  const activeCriteria = useMemo(
    () => selected.filter((id) => applicable.includes(id)),
    [selected, applicable],
  );

  const ignoredCriteria = useMemo(
    () => selected.filter((id) => !applicable.includes(id)),
    [selected, applicable],
  );

  /*
   * Validate the flood weights as percentages.
   */
  const floodWeightsTotal =
    floodWeights.dist_to_river +
    floodWeights.rainfall +
    floodWeights.landcover;

  const floodWeightsValid =
    Object.values(floodWeights).every(
      (value) =>
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100,
    ) &&
    Math.abs(floodWeightsTotal - 100) <= FLOOD_WEIGHT_TOLERANCE;

  /*
   * Flood calculation uses the backend's configured GIS area.
   * County loading is not a prerequisite for enabling this button.
   */
  const canRun =
    status !== "running" &&
    (hazard === "flood"
      ? floodWeightsValid
      : Boolean(county) && activeCriteria.length > 0);

  const usesDefaults = useMemo(
    () =>
      selected.every(
        (id) => parameters[id] === DEFAULT_PARAMETERS[id],
      ),
    [selected, parameters],
  );

  /*
   * Location controls.
   */
  const selectCounty = useCallback((name: string) => {
    setCounty(name);
    setSubCounty("all");
    setWard("all");

    setSubCountyItems([]);
    setWardItems([]);

    setFloodCalculation(null);
    setResults([]);
    setLastRun(null);
    setStatus("idle");
    setError(null);
  }, []);

  const selectSubCounty = useCallback((name: string) => {
    setSubCounty(name);
    setWard("all");
  }, []);

  /*
   * Hazard selection.
   */
  const setHazard = useCallback((nextHazard: HazardId) => {
    setHazardState(nextHazard);
    setFloodCalculation(null);
    setResults([]);
    setLastRun(null);
    setStatus("idle");
    setError(null);
  }, []);

  /*
   * Legacy parameter controls.
   */
  const toggleParameter = useCallback((id: ParameterId) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );

    setParameters((values) => ({
      ...values,
      [id]: DEFAULT_PARAMETERS[id],
    }));
  }, []);

  const setParameter = useCallback(
    (id: ParameterId, value: number) => {
      setParameters((previous) => ({
        ...previous,
        [id]: value,
      }));
    },
    [],
  );

  const resetParameters = useCallback(() => {
    setParameters(DEFAULT_PARAMETERS);
  }, []);

  const clearParameters = useCallback(() => {
    setSelected([]);
    setParameters(DEFAULT_PARAMETERS);
  }, []);

  /*
   * Flood calculator controls.
   * Sidebar values are percentages in the range 0–100.
   */
  const setFloodWeight = useCallback(
    (key: keyof FloodWeights, value: number) => {
      if (!Number.isFinite(value)) return;

      const safeValue = Math.min(100, Math.max(0, value));

      setFloodWeights((previous) => ({
        ...previous,
        [key]: safeValue,
      }));

      // Existing results are stale after a weight change.
      setFloodCalculation(null);
      setResults([]);
      setLastRun(null);
      setStatus("idle");
      setError(null);
    },
    [],
  );

  const resetFloodWeights = useCallback(() => {
    setFloodWeights({ ...DEFAULT_FLOOD_WEIGHTS });
    setFloodCalculation(null);
    setResults([]);
    setLastRun(null);
    setStatus("idle");
    setError(null);
  }, []);

  /*
   * Run the real Django flood calculation.
   */
  const run = useCallback(async () => {
    if (status === "running") return;

    if (hazard === "flood" && !floodWeightsValid) {
      setError(
        `Flood weights must total 100%. ` +
          `Current total: ${floodWeightsTotal.toFixed(2)}%.`,
      );
      setStatus("error");
      return;
    }

    if (hazard !== "flood" && (!county || activeCriteria.length === 0)) {
      setError(
        "Select a county and at least one applicable criterion before running.",
      );
      setStatus("error");
      return;
    }

    setStatus("running");
    setError(null);
    setFloodCalculation(null);
    setResults([]);

    if (hazard === "flood") {
      try {
        /*
         * Convert percentages to fractions for Django.
         * The API receives weights totalling 1.0, not 100.
         */
        const apiWeights: FloodWeights = {
          dist_to_river: floodWeights.dist_to_river / 100,
          rainfall: floodWeights.rainfall / 100,
          landcover: floodWeights.landcover / 100,
        };

        const response = await getFloodAnalysis(apiWeights);

        if (!response.success || !response.calculation) {
          throw new Error(
            [response.error, response.details]
              .filter(Boolean)
              .join(": ") ||
              "The flood GIS backend did not return a successful calculation.",
          );
        }

        setFloodCalculation(response.calculation);
        setLastRun(new Date());
        setStatus("done");
      } catch (err) {
        setFloodCalculation(null);
        setLastRun(null);
        setStatus("error");

        setError(
          getErrorMessage(
            err,
            "Unable to connect to the flood GIS API.",
          ),
        );
      }

      return;
    }

    /*
     * Existing temporary frontend model for non-flood hazards.
     */
    try {
      const criteria = [...activeCriteria];

      const modelResults = runModel(
        county,
        hazard,
        parameters,
        criteria,
        {
          subCounty: subCounty === "all" ? undefined : subCounty,
          ward: ward === "all" ? undefined : ward,
        },
      );

      setResults(modelResults);
      setLastRun(new Date());
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(
        getErrorMessage(err, "The hazard analysis could not be completed."),
      );
    }
  }, [
    status,
    hazard,
    floodWeights,
    floodWeightsValid,
    floodWeightsTotal,
    county,
    activeCriteria,
    parameters,
    subCounty,
    ward,
  ]);

  return {
    query,
    setQuery,

    counties,
    filteredCounties,
    countiesLoading,
    countiesError,

    county,
    selectCounty,

    subCounty,
    selectSubCounty,
    subCounties,
    subCountiesLoading,
    subCountiesError,

    ward,
    setWard,
    wards,
    wardsLoading,
    wardsError,

    hazard,
    setHazard,

    selected,
    toggleParameter,

    applicable,
    activeCriteria,
    ignoredCriteria,

    canRun,

    usesDefaults,
    parameters,
    setParameter,
    resetParameters,
    clearParameters,

    // Flood calculator state and controls.
    floodWeights,
    setFloodWeight,
    resetFloodWeights,
    floodWeightsTotal,
    floodWeightsValid,

    status,
    results,
    lastRun,

    floodCalculation,
    error,

    run,
  };
}

export type HazardModel = ReturnType<typeof useHazardModel>;
