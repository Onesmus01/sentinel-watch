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

interface CountyApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CountyApiItem[];
  error?: string;
  details?: string;
}

export function useHazardModel() {
  const [query, setQuery] = useState("");

  /*
   * Counties come from the Django API.
   *
   * Browser:
   * React -> Django /api/locations/counties/
   *
   * Django:
   * Django -> GeoServer Kenya_Counties WFS
   *
   * The browser therefore never contacts GeoServer directly.
   */
  const [counties, setCounties] =
    useState<GeoServerCounty[]>([]);

  const [countiesLoading, setCountiesLoading] =
    useState(true);

  const [countiesError, setCountiesError] =
    useState<string | null>(null);

  const [county, setCounty] = useState("");

  const [subCounty, setSubCounty] =
    useState("all");

  const [ward, setWard] =
    useState("all");

  /*
   * React state setter is called setHazardState so that
   * the public hook can expose its own setHazard callback.
   */
  const [hazard, setHazardState] =
    useState<HazardId>("flood");

  /*
   * Temporary parameters for hazards whose real GIS APIs
   * have not yet been connected.
   *
   * Flood does not use these values.
   */
  const [selected, setSelected] =
    useState<ParameterId[]>([]);

  const [parameters, setParameters] =
    useState<ParameterValues>(
      DEFAULT_PARAMETERS,
    );

  const [status, setStatus] =
    useState<RunStatus>("idle");

  const [results, setResults] =
    useState<WardResult[]>([]);

  const [lastRun, setLastRun] =
    useState<Date | null>(null);

  const [floodCalculation, setFloodCalculation] =
    useState<FloodApiResponse["calculation"] | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Load counties through Django.
   *
   * IMPORTANT:
   * Do NOT fetch GeoServer directly from React.
   *
   * Django's /api/locations/counties/ endpoint already
   * proxies the real GeoServer Kenya_Counties layer.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCounties() {
      setCountiesLoading(true);
      setCountiesError(null);

      try {
        const response = await fetch(
          `${DJANGO_API_URL}/api/locations/counties/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const data =
          (await response.json()) as CountyApiResponse;

        if (!response.ok) {
          throw new Error(
            data.details ||
              data.error ||
              `County API request failed with status ${response.status}`,
          );
        }

        const unique =
          new Map<string, GeoServerCounty>();

        for (const item of data.results ?? []) {
          const name =
            typeof item.name === "string"
              ? item.name.trim()
              : "";

          if (!name || unique.has(name)) {
            continue;
          }

          unique.set(name, {
            name,
            properties: {
              id: item.id,
              code: item.code,
              COUNTY: name,
            },
          });
        }

        const loadedCounties =
          [...unique.values()].sort((a, b) =>
            a.name.localeCompare(b.name),
          );

        if (cancelled) {
          return;
        }

        setCounties(loadedCounties);

        /*
         * Select the first county returned by the real
         * backend layer.
         *
         * Nothing is hard-coded.
         */
        if (loadedCounties.length > 0) {
          setCounty((current) => {
            if (
              current &&
              loadedCounties.some(
                (item) => item.name === current,
              )
            ) {
              return current;
            }

            return loadedCounties[0]!.name;
          });
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setCounties([]);
        setCounty("");

        setCountiesError(
          err instanceof Error
            ? err.message
            : "Unable to load counties from the backend.",
        );
      } finally {
        if (!cancelled) {
          setCountiesLoading(false);
        }
      }
    }

    void loadCounties();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Search/filter counties returned by Django.
   */
  const filteredCounties = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    if (!value) {
      return counties;
    }

    return counties.filter((item) =>
      item.name
        .toLowerCase()
        .includes(value),
    );
  }, [counties, query]);

  /*
   * Do not invent sub-county or ward data.
   *
   * These will be connected once the actual GIS layers
   * are verified.
   */
  const subCounties = useMemo<string[]>(
    () => [],
    [],
  );

  const wards = useMemo<string[]>(
    () => [],
    [],
  );

  const applicable = useMemo(
    () => applicableParameters(hazard),
    [hazard],
  );

  const activeCriteria = useMemo(
    () =>
      selected.filter((id) =>
        applicable.includes(id),
      ),
    [selected, applicable],
  );

  const ignoredCriteria = useMemo(
    () =>
      selected.filter(
        (id) =>
          !applicable.includes(id),
      ),
    [selected, applicable],
  );

  /*
   * Flood uses the real Django/GIS API.
   *
   * It does not require frontend criteria.
   */
  const canRun =
    hazard === "flood"
      ? !countiesLoading &&
        counties.length > 0 &&
        status !== "running"
      : activeCriteria.length > 0;

  const usesDefaults = useMemo(
    () =>
      selected.every(
        (id) =>
          parameters[id] ===
          DEFAULT_PARAMETERS[id],
      ),
    [selected, parameters],
  );

  const selectCounty = useCallback(
    (name: string) => {
      setCounty(name);
      setSubCounty("all");
      setWard("all");

      setFloodCalculation(null);
      setResults([]);
      setStatus("idle");
      setError(null);
    },
    [],
  );

  const selectSubCounty = useCallback(
    (name: string) => {
      setSubCounty(name);
      setWard("all");
    },
    [],
  );

  /*
   * Public hazard setter.
   */
  const setHazard = useCallback(
    (nextHazard: HazardId) => {
      setHazardState(nextHazard);

      setFloodCalculation(null);
      setResults([]);
      setStatus("idle");
      setError(null);
    },
    [],
  );

  const toggleParameter = useCallback(
    (id: ParameterId) => {
      setSelected((previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) => item !== id,
            )
          : [...previous, id],
      );

      setParameters((values) => ({
        ...values,
        [id]: DEFAULT_PARAMETERS[id],
      }));
    },
    [],
  );

  const setParameter = useCallback(
    (
      id: ParameterId,
      value: number,
    ) => {
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
   * Run the selected hazard.
   *
   * FLOOD:
   * React -> Django -> real GIS flood calculation.
   *
   * OTHER HAZARDS:
   * Temporary frontend model until their real GIS
   * APIs are connected.
   */
  const run = useCallback(async () => {
    if (!canRun) {
      return;
    }

    setStatus("running");
    setError(null);

    if (hazard === "flood") {
      try {
        const response =
          await getFloodAnalysis();

        if (
          !response.success ||
          !response.calculation
        ) {
          throw new Error(
            response.details ||
              response.error ||
              "Flood API returned no calculation.",
          );
        }

        setFloodCalculation(
          response.calculation,
        );

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

    const criteria = [
      ...activeCriteria,
    ];

    window.setTimeout(() => {
      setResults(
        runModel(
          county,
          hazard,
          parameters,
          criteria,
          {
            subCounty:
              subCounty === "all"
                ? undefined
                : subCounty,

            ward:
              ward === "all"
                ? undefined
                : ward,
          },
        ),
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

    ward,
    setWard,
    wards,

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

export type HazardModel =
  ReturnType<typeof useHazardModel>;