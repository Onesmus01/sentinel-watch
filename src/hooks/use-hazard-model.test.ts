import { act } from "react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COUNTIES,
  DEFAULT_PARAMETERS,
  PARAMETERS,
  applicableParameters,
  runModel,
  type ParameterId,
} from "@/lib/hazard-model";
import { useHazardModel } from "./use-hazard-model";

// run() defers by 900ms to show the "Calculating…" state; fake timers make that
// deterministic instead of a sleep.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const settle = () => act(() => void vi.advanceTimersByTime(1000));
const ALL: ParameterId[] = PARAMETERS.map((d) => d.id);

describe("initial state", () => {
  it("selects no criteria, so nothing is in the model until the analyst asks", () => {
    const { result } = renderHook(() => useHazardModel());
    expect(result.current.selected).toEqual([]);
    expect(result.current.activeCriteria).toEqual([]);
    expect(result.current.canRun).toBe(false);
  });

  it("starts on the first county, flood, idle and empty", () => {
    const { result } = renderHook(() => useHazardModel());
    expect(result.current.county).toBe(COUNTIES[0]!.name);
    expect(result.current.subCounty).toBe("all");
    expect(result.current.ward).toBe("all");
    expect(result.current.hazard).toBe("flood");
    expect(result.current.status).toBe("idle");
    expect(result.current.results).toEqual([]);
    expect(result.current.lastRun).toBeNull();
  });

  it("holds the default values ready, even though none are selected yet", () => {
    // Values exist from the start so selecting a criterion adopts a sensible
    // figure rather than an empty field.
    const { result } = renderHook(() => useHazardModel());
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
  });

  it("lists every sub-county and every ward of the starting county", () => {
    const { result } = renderHook(() => useHazardModel());
    const c = COUNTIES[0]!;
    expect(result.current.subCounties).toEqual(c.subCounties.map((s) => s.name));
    expect(result.current.wards).toEqual(c.subCounties.flatMap((s) => s.wards));
  });
});

describe("criterion selection", () => {
  it("adds and removes a criterion", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    expect(result.current.selected).toEqual(["rainfall"]);
    expect(result.current.canRun).toBe(true);

    act(() => result.current.toggleParameter("rainfall"));
    expect(result.current.selected).toEqual([]);
    expect(result.current.canRun).toBe(false);
  });

  it("keeps several criteria in selection order", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("humidity"));
    act(() => result.current.toggleParameter("rainfall"));
    expect(result.current.selected).toEqual(["humidity", "rainfall"]);
  });

  it("resets a criterion's value to its default when it is re-selected", () => {
    // Guards against a criterion returning with a stale figure someone typed,
    // deselected and forgot about.
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    act(() => result.current.setParameter("rainfall", 390));
    expect(result.current.parameters.rainfall).toBe(390);

    act(() => result.current.toggleParameter("rainfall"));
    act(() => result.current.toggleParameter("rainfall"));
    expect(result.current.parameters.rainfall).toBe(DEFAULT_PARAMETERS.rainfall);
  });

  it("clears the whole selection and restores every default", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    act(() => result.current.toggleParameter("humidity"));
    act(() => result.current.setParameter("humidity", 15));

    act(() => result.current.clearParameters());
    expect(result.current.selected).toEqual([]);
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
    expect(result.current.canRun).toBe(false);
  });
});

describe("applicability", () => {
  it("reports which criteria the chosen hazard uses", () => {
    const { result } = renderHook(() => useHazardModel());
    expect(result.current.applicable.sort()).toEqual(applicableParameters("flood").sort());

    act(() => result.current.setHazard("drought"));
    expect(result.current.applicable.sort()).toEqual(applicableParameters("drought").sort());
  });

  it("splits a selection into what counts and what is inert", () => {
    // Temperature does not enter flood, so selecting it must not imply the run
    // accounted for it.
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("temperature"));
    act(() => result.current.toggleParameter("rainfall"));

    expect(result.current.selected).toEqual(["temperature", "rainfall"]);
    expect(result.current.activeCriteria).toEqual(["rainfall"]);
    expect(result.current.ignoredCriteria).toEqual(["temperature"]);
  });

  it("refuses to run on a wholly inert selection", () => {
    // Terrain-only output is not an analysis, so this must not be runnable.
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("temperature"));
    expect(result.current.canRun).toBe(false);

    act(() => result.current.run());
    expect(result.current.status).toBe("idle");
    settle();
    expect(result.current.results).toEqual([]);
  });

  it("re-evaluates applicability when the hazard changes under a fixed selection", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("temperature"));
    expect(result.current.canRun).toBe(false);

    // Temperature is a drought term, so the same selection becomes live.
    act(() => result.current.setHazard("drought"));
    expect(result.current.activeCriteria).toEqual(["temperature"]);
    expect(result.current.canRun).toBe(true);
  });

  it("turns gradient inert for drought and live again for landslide", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("gradient"));
    act(() => result.current.setHazard("drought"));
    expect(result.current.canRun).toBe(false);

    act(() => result.current.setHazard("landslide"));
    expect(result.current.canRun).toBe(true);
  });
});

describe("values", () => {
  it("changes only the named criterion", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("gradient"));
    act(() => result.current.setParameter("gradient", 45));
    expect(result.current.parameters).toEqual({ ...DEFAULT_PARAMETERS, gradient: 45 });
  });

  it("reports whether the selected values are still the system defaults", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    expect(result.current.usesDefaults).toBe(true);

    act(() => result.current.setParameter("rainfall", 300));
    expect(result.current.usesDefaults).toBe(false);
  });

  it("ignores an edit to an unselected criterion when judging defaults", () => {
    // Only what the run will use should decide whether it is a defaults run.
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    act(() => result.current.setParameter("humidity", 5));
    expect(result.current.selected).toEqual(["rainfall"]);
    expect(result.current.usesDefaults).toBe(true);
  });

  it("restores every default with resetParameters but keeps the selection", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleParameter("rainfall"));
    act(() => result.current.toggleParameter("humidity"));
    act(() => result.current.setParameter("rainfall", 10));
    act(() => result.current.resetParameters());
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
    expect(result.current.selected).toEqual(["rainfall", "humidity"]);
    expect(result.current.usesDefaults).toBe(true);
  });
});

describe("scope selection", () => {
  it("resets sub-county and ward when the county changes", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectSubCounty("Westlands"));
    act(() => result.current.setWard("Kitisuru"));
    expect(result.current.ward).toBe("Kitisuru");

    act(() => result.current.selectCounty("Kisumu"));
    expect(result.current.county).toBe("Kisumu");
    expect(result.current.subCounty).toBe("all");
    expect(result.current.ward).toBe("all");
  });

  it("resets the ward when the sub-county changes", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectSubCounty("Westlands"));
    act(() => result.current.setWard("Kitisuru"));
    act(() => result.current.selectSubCounty("Kasarani"));
    expect(result.current.ward).toBe("all");
  });

  it("narrows the ward list to the chosen sub-county", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.selectSubCounty("Nyando"));
    expect(result.current.wards).toEqual(["Ahero", "Kabonyo", "Awasi", "East Kano"]);
  });
});

describe("search query", () => {
  it("filters sub-counties by their own name", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.setQuery("muhoroni"));
    expect(result.current.subCounties).toEqual(["Muhoroni"]);
  });

  it("keeps a sub-county whose ward matches, not just its own name", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.setQuery("ahero"));
    expect(result.current.subCounties).toEqual(["Nyando"]);
  });

  it("falls back to the full ward list when a query matches no ward", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.setQuery("zzzz"));
    expect(result.current.wards.length).toBeGreaterThan(0);
  });

  it("ignores a whitespace-only query", () => {
    const { result } = renderHook(() => useHazardModel());
    const before = result.current.subCounties;
    act(() => result.current.setQuery("   "));
    expect(result.current.subCounties).toEqual(before);
  });

  it("matches case-insensitively", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.setQuery("NYANDO"));
    expect(result.current.subCounties).toEqual(["Nyando"]);
  });
});

describe("run", () => {
  function withRainfall() {
    const hook = renderHook(() => useHazardModel());
    act(() => hook.result.current.toggleParameter("rainfall"));
    return hook;
  }

  it("goes running, then done with results and a timestamp", () => {
    const { result } = withRainfall();
    act(() => result.current.run());
    expect(result.current.status).toBe("running");
    expect(result.current.results).toEqual([]);

    settle();
    expect(result.current.status).toBe("done");
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.lastRun).toBeInstanceOf(Date);
  });

  it("does nothing at all with no criteria selected", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.run());
    expect(result.current.status).toBe("idle");
    settle();
    expect(result.current.results).toEqual([]);
    expect(result.current.lastRun).toBeNull();
  });

  it("scores with only the selected criteria", () => {
    const { result } = withRainfall();
    act(() => result.current.run());
    settle();
    expect(result.current.results).toEqual(
      runModel(result.current.county, "flood", DEFAULT_PARAMETERS, ["rainfall"]),
    );
  });

  it("differs from a full-criteria run, proving the selection reaches the model", () => {
    const { result } = withRainfall();
    act(() => result.current.run());
    settle();
    expect(result.current.results).not.toEqual(
      runModel(result.current.county, "flood", DEFAULT_PARAMETERS, ALL),
    );
  });

  it("drops the inert half of a mixed selection before scoring", () => {
    const { result } = withRainfall();
    act(() => result.current.toggleParameter("temperature"));
    act(() => result.current.run());
    settle();
    // Temperature is not a flood term, so the run must equal rainfall alone.
    expect(result.current.results).toEqual(
      runModel(result.current.county, "flood", DEFAULT_PARAMETERS, ["rainfall"]),
    );
  });

  it("matches runModel for the selected scope", () => {
    const { result } = withRainfall();
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.selectSubCounty("Nyando"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toEqual(
      runModel("Kisumu", "flood", DEFAULT_PARAMETERS, ["rainfall"], { subCounty: "Nyando" }),
    );
  });

  it("uses the typed value, not the default", () => {
    const { result } = withRainfall();
    act(() => result.current.setParameter("rainfall", 400));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toEqual(
      runModel(result.current.county, "flood", { ...DEFAULT_PARAMETERS, rainfall: 400 }, [
        "rainfall",
      ]),
    );
  });

  it("re-runs against a changed hazard", () => {
    const { result } = withRainfall();
    act(() => result.current.run());
    settle();
    const flood = result.current.results;

    act(() => result.current.setHazard("drought"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).not.toEqual(flood);
    expect(result.current.results).toEqual(
      runModel(result.current.county, "drought", DEFAULT_PARAMETERS, ["rainfall"]),
    );
  });

  it("keeps the previous results on screen until the new ones land", () => {
    const { result } = withRainfall();
    act(() => result.current.run());
    settle();
    const first = result.current.results;

    act(() => result.current.setHazard("landslide"));
    act(() => result.current.run());
    expect(result.current.status).toBe("running");
    expect(result.current.results).toEqual(first);
    settle();
    expect(result.current.results).not.toEqual(first);
  });

  it("scopes down to a single ward", () => {
    const { result } = withRainfall();
    act(() => result.current.selectSubCounty("Westlands"));
    act(() => result.current.setWard("Kitisuru"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe("Kitisuru");
  });
});
