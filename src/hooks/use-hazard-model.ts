import { useCallback, useMemo, useState } from "react";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  runModel,
  type HazardId,
  type ParameterId,
  type ParameterValues,
  type WardResult,
} from "@/lib/hazard-model";

export type RunStatus = "idle" | "running" | "done";

export function useHazardModel() {
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState(COUNTIES[0]!.name);
  const [subCounty, setSubCounty] = useState<string>("all");
  const [ward, setWard] = useState<string>("all");
  const [hazard, setHazard] = useState<HazardId>("flood");
  const [useDefaults, setUseDefaults] = useState(true);
  const [parameters, setParameters] = useState<ParameterValues>(DEFAULT_PARAMETERS);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [results, setResults] = useState<WardResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const countyData = useMemo(
    () => COUNTIES.find((c) => c.name === county) ?? COUNTIES[0]!,
    [county],
  );

  const subCounties = useMemo(() => {
    const names = countyData.subCounties.map((s) => s.name);
    if (!query.trim()) return names;
    const q = query.toLowerCase();
    return names.filter(
      (n) =>
        n.toLowerCase().includes(q) ||
        countyData.subCounties
          .find((s) => s.name === n)!
          .wards.some((w) => w.toLowerCase().includes(q)),
    );
  }, [countyData, query]);

  const wards = useMemo(() => {
    const list =
      subCounty === "all"
        ? countyData.subCounties.flatMap((s) => s.wards)
        : (countyData.subCounties.find((s) => s.name === subCounty)?.wards ?? []);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    const filtered = list.filter((w) => w.toLowerCase().includes(q));
    return filtered.length ? filtered : list;
  }, [countyData, subCounty, query]);

  const selectCounty = useCallback((name: string) => {
    setCounty(name);
    setSubCounty("all");
    setWard("all");
  }, []);

  const selectSubCounty = useCallback((name: string) => {
    setSubCounty(name);
    setWard("all");
  }, []);

  const setParameter = useCallback((id: ParameterId, value: number) => {
    setParameters((prev) => ({ ...prev, [id]: value }));
  }, []);

  const resetParameters = useCallback(() => setParameters(DEFAULT_PARAMETERS), []);

  const toggleDefaults = useCallback((on: boolean) => {
    setUseDefaults(on);
    if (on) setParameters(DEFAULT_PARAMETERS);
  }, []);

  const run = useCallback(() => {
    setStatus("running");
    const p = useDefaults ? DEFAULT_PARAMETERS : parameters;
    window.setTimeout(() => {
      setResults(
        runModel(county, hazard, p, {
          subCounty: subCounty === "all" ? undefined : subCounty,
          ward: ward === "all" ? undefined : ward,
        }),
      );
      setLastRun(new Date());
      setStatus("done");
    }, 900);
  }, [county, hazard, parameters, subCounty, useDefaults, ward]);

  return {
    query,
    setQuery,
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
    useDefaults,
    toggleDefaults,
    parameters,
    setParameter,
    resetParameters,
    status,
    results,
    lastRun,
    run,
  };
}

export type HazardModel = ReturnType<typeof useHazardModel>;
