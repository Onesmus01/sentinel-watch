import { act } from "react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COUNTIES, DEFAULT_PARAMETERS, runModel } from "@/lib/hazard-model";
import { useHazardModel } from "./use-hazard-model";

// run() defers by 900ms to show the "Calculating…" state; fake timers make that
// deterministic instead of a sleep.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const settle = () => act(() => void vi.advanceTimersByTime(1000));

describe("useHazardModel initial state", () => {
  it("starts on the first county, flood, defaults, idle and empty", () => {
    const { result } = renderHook(() => useHazardModel());
    expect(result.current.county).toBe(COUNTIES[0]!.name);
    expect(result.current.subCounty).toBe("all");
    expect(result.current.ward).toBe("all");
    expect(result.current.hazard).toBe("flood");
    expect(result.current.useDefaults).toBe(true);
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
    expect(result.current.status).toBe("idle");
    expect(result.current.results).toEqual([]);
    expect(result.current.lastRun).toBeNull();
  });

  it("lists every sub-county and every ward of the starting county", () => {
    const { result } = renderHook(() => useHazardModel());
    const c = COUNTIES[0]!;
    expect(result.current.subCounties).toEqual(c.subCounties.map((s) => s.name));
    expect(result.current.wards).toEqual(c.subCounties.flatMap((s) => s.wards));
  });
});

describe("scope selection", () => {
  it("resets sub-county and ward when the county changes", () => {
    // The bug this guards: keeping a Nairobi ward selected after switching to
    // Kisumu, which silently yields zero results on the next run.
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
    // Deliberate: an unmatched query must not leave the ward select empty and
    // unusable, so the hook degrades to the unfiltered list.
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

describe("parameters", () => {
  it("restores defaults when defaults are switched back on", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleDefaults(false));
    act(() => result.current.setParameter("rainfall", 350));
    expect(result.current.parameters.rainfall).toBe(350);

    act(() => result.current.toggleDefaults(true));
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
  });

  it("changes only the named parameter", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleDefaults(false));
    act(() => result.current.setParameter("gradient", 45));
    expect(result.current.parameters).toEqual({ ...DEFAULT_PARAMETERS, gradient: 45 });
  });

  it("resets every parameter with resetParameters", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleDefaults(false));
    act(() => result.current.setParameter("humidity", 5));
    act(() => result.current.setParameter("temperature", 40));
    act(() => result.current.resetParameters());
    expect(result.current.parameters).toEqual(DEFAULT_PARAMETERS);
  });
});

describe("run", () => {
  it("goes running, then done with results and a timestamp", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.run());
    expect(result.current.status).toBe("running");
    expect(result.current.results).toEqual([]);

    settle();
    expect(result.current.status).toBe("done");
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.lastRun).toBeInstanceOf(Date);
  });

  it("matches runModel for the selected scope", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectCounty("Kisumu"));
    act(() => result.current.selectSubCounty("Nyando"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toEqual(
      runModel("Kisumu", "flood", DEFAULT_PARAMETERS, { subCounty: "Nyando" }),
    );
  });

  it("scores with system defaults while the defaults switch is on, even after edits", () => {
    // toggleDefaults(false) -> edit -> toggleDefaults(true) resets the values,
    // but the run must use defaults regardless of what is held in state.
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleDefaults(false));
    act(() => result.current.setParameter("rainfall", 400));
    act(() => result.current.toggleDefaults(true));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toEqual(
      runModel(result.current.county, "flood", DEFAULT_PARAMETERS),
    );
  });

  it("uses the overridden parameters when defaults are off", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.toggleDefaults(false));
    act(() => result.current.setParameter("rainfall", 400));
    act(() => result.current.run());
    settle();
    const expected = runModel(result.current.county, "flood", {
      ...DEFAULT_PARAMETERS,
      rainfall: 400,
    });
    expect(result.current.results).toEqual(expected);
    expect(result.current.results).not.toEqual(
      runModel(result.current.county, "flood", DEFAULT_PARAMETERS),
    );
  });

  it("re-runs against a changed hazard", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.run());
    settle();
    const flood = result.current.results;

    act(() => result.current.setHazard("drought"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).not.toEqual(flood);
    expect(result.current.results).toEqual(
      runModel(result.current.county, "drought", DEFAULT_PARAMETERS),
    );
  });

  it("keeps the previous results on screen until the new ones land", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.run());
    settle();
    const first = result.current.results;

    act(() => result.current.setHazard("landslide"));
    act(() => result.current.run());
    // mid-flight: status is running, but the map still has something to show
    expect(result.current.status).toBe("running");
    expect(result.current.results).toEqual(first);
    settle();
    expect(result.current.results).not.toEqual(first);
  });

  it("returns no results when the scope selects a ward outside the county", () => {
    const { result } = renderHook(() => useHazardModel());
    act(() => result.current.selectSubCounty("Westlands"));
    act(() => result.current.setWard("Kitisuru"));
    act(() => result.current.run());
    settle();
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe("Kitisuru");
  });
});
