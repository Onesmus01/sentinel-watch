
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
} from "@/lib/flood_api";

export type RunStatus = "idle" | "running" | "done" | "error";

const DJANGO_API_URL = "http://127.0.0.1:8000";

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

  const data = (await response.json()) as ApiResponse<T>;

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

export function useHazardModel() {
  const [query, setQuery] = useState("");

  // Administrative locations loaded from Django and GeoServer.
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

  // Existing parameter controls.
  const [selected, setSelected] = useState<ParameterId[]>([]);
  const [parameters, setParameters] =
    useState<ParameterValues>(DEFAULT_PARAMETERS);

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
          err instanceof Error
            ? err.message
            : "Unable to load counties from the backend.",
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
   *
   * Important: the ward layer exposes a constituency field, not a
   * verified sub-county relationship. Do not treat constituency names
   * as sub-county names. Load the county's wards without that assumption.
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
          err instanceof Error
            ? err.message
            : "Unable to load sub-counties.",
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

        setWardsError(
          err instanceof Error
            ? err.message
            : "Unable to load wards.",
        );
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

  /*
   * Ward names are kept as the actual names returned by Django.
   * The list is county-scoped because the current ward data does not
   * establish a reliable sub-county-to-ward mapping.
   */
  const wards = useMemo(
    () => wardItems.map((item) => item.name),
    [wardItems],
  );

  /*
   * Applicable analysis parameters.
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

  const canRun =
    hazard === "flood"
      ? !countiesLoading &&
        counties.length > 0 &&
        status !== "running"
      : activeCriteria.length > 0 && status !== "running";

  const usesDefaults = useMemo(
    () =>
      selected.every(
        (id) => parameters[id] === DEFAULT_PARAMETERS[id],
      ),
    [selected, parameters],
  );

  /*
   * Location selection.
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
   * Parameter controls.
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
   * Run the real Django flood analysis.
   * Preserve the existing temporary frontend model for other hazards.
   */
  const run = useCallback(async () => {
    if (!canRun) return;

    setStatus("running");
    setError(null);

    if (hazard === "flood") {
      try {
        const response = await getFloodAnalysis();

        if (!response.success || !response.calculation) {
          throw new Error(
            response.details ||
              response.error ||
              "Flood API returned no calculation.",
          );
        }

        setFloodCalculation(response.calculation);
        setResults([]);
        setLastRun(new Date());
        setStatus("done");

        return;
      } catch (err) {
        setFloodCalculation(null);
        setStatus("error");

        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to the flood API.",
        );

        return;
      }
    }

    const criteria = [...activeCriteria];

    window.setTimeout(() => {
      setResults(
        runModel(county, hazard, parameters, criteria, {
          subCounty: subCounty === "all" ? undefined : subCounty,
          ward: ward === "all" ? undefined : ward,
        }),
      );

      setLastRun(new Date());
      setStatus("done");
    }, 900);
  }, [
    canRun,
    hazard,
    activeCriteria,
    county,
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

    status,
    results,
    lastRun,

    floodCalculation,
    error,

    run,
  };
}

export type HazardModel = ReturnType<typeof useHazardModel>;
