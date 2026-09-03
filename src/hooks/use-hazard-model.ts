import { useCallback, useMemo, useState } from "react";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  applicableParameters,
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

  // No criterion is selected up front. The analyst decides what the run should
  // account for; an unselected criterion contributes nothing rather than sitting
  // in the model at its default value without anyone having asked for it.
  const [selected, setSelected] = useState<ParameterId[]>([]);

  // Values are always live and editable. Selecting a criterion adopts its
  // default as a starting point, which the analyst then types over.
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

  /** Criteria that affect the chosen hazard. Not every hazard uses every one. */
  const applicable = useMemo(() => applicableParameters(hazard), [hazard]);

  /**
   * Selected AND applicable. A criterion the user picked that this hazard does
   * not use is inert, and the UI has to be able to say so rather than implying
   * the run accounted for it.
   */
  const activeCriteria = useMemo(
    () => selected.filter((id) => applicable.includes(id)),
    [selected, applicable],
  );

  /** Selected but inert for this hazard. */
  const ignoredCriteria = useMemo(
    () => selected.filter((id) => !applicable.includes(id)),
    [selected, applicable],
  );

  /** A terrain-only score is not an analysis, so a run needs one live criterion. */
  const canRun = activeCriteria.length > 0;

  const usesDefaults = useMemo(
    () => selected.every((id) => parameters[id] === DEFAULT_PARAMETERS[id]),
    [selected, parameters],
  );

  const selectCounty = useCallback((name: string) => {
    setCounty(name);
    setSubCounty("all");
    setWard("all");
  }, []);

  const selectSubCounty = useCallback((name: string) => {
    setSubCounty(name);
    setWard("all");
  }, []);

  const toggleParameter = useCallback((id: ParameterId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    // Both directions reset the value to its default. Two separate setState
    // calls rather than one nested inside the other's updater: an updater must
    // stay pure, or StrictMode's double invocation applies the side effect twice.
    // The effect of resetting on the way out is invisible (an unselected value is
    // never read), and it guarantees a re-selected criterion never returns
    // carrying a stale figure someone typed and forgot.
    setParameters((vals) => ({ ...vals, [id]: DEFAULT_PARAMETERS[id] }));
  }, []);

  const setParameter = useCallback((id: ParameterId, value: number) => {
    setParameters((prev) => ({ ...prev, [id]: value }));
  }, []);

  const resetParameters = useCallback(() => setParameters(DEFAULT_PARAMETERS), []);

  const clearParameters = useCallback(() => {
    setSelected([]);
    setParameters(DEFAULT_PARAMETERS);
  }, []);

  const run = useCallback(() => {
    if (activeCriteria.length === 0) return;
    setStatus("running");
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
  }, [activeCriteria, county, hazard, parameters, subCounty, ward]);

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
    run,
  };
}

export type HazardModel = ReturnType<typeof useHazardModel>;
