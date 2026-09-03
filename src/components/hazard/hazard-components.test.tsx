import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARAMETERS,
  HAZARDS,
  PARAMETERS,
  RISK_CLASSES,
  applicableParameters,
  runModel,
} from "@/lib/hazard-model";
import { useHazardModel } from "@/hooks/use-hazard-model";
import { ControlSidebar } from "./ControlSidebar";
import { MapFrame } from "./MapFrame";
import { MapLegend } from "./MapLegend";
import { WardTable } from "./WardTable";

const results = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, applicableParameters("flood"));

/** Drives the real hook, so these exercise the wired component, not a stub. */
function Sidebar() {
  const model = useHazardModel();
  return <ControlSidebar model={model} />;
}

describe("MapLegend", () => {
  it("lists every risk class with its label and numeric range", () => {
    render(<MapLegend hazard="flood" active />);
    for (const rc of RISK_CLASSES) {
      expect(screen.getByText(rc.label)).toBeTruthy();
      expect(screen.getByText(rc.range)).toBeTruthy();
    }
  });

  it("names the selected hazard", () => {
    render(<MapLegend hazard="landslide" active />);
    expect(screen.getByText("Landslide")).toBeTruthy();
  });

  it("still shows the labels when inactive, so the key is never colour-only", () => {
    render(<MapLegend hazard="drought" active={false} />);
    expect(screen.getByText("Severe")).toBeTruthy();
    expect(screen.getByText("81 – 100")).toBeTruthy();
  });

  it("renders one contiguous vertical ramp band per class", () => {
    const { container } = render(<MapLegend hazard="flood" active />);
    const bands = container.querySelectorAll('[aria-hidden="true"] > div');
    expect(bands).toHaveLength(RISK_CLASSES.length);
    for (const b of bands) {
      expect((b as HTMLElement).style.backgroundColor).toMatch(/^var\(--risk-[1-5]\)$/);
    }
  });

  it("orders the ramp highest class first, as a graduated legend reads", () => {
    const { container } = render(<MapLegend hazard="flood" active />);
    const vars = [...container.querySelectorAll('[aria-hidden="true"] > div')].map(
      (b) => (b as HTMLElement).style.backgroundColor,
    );
    expect(vars[0]).toBe("var(--risk-5)");
    expect(vars.at(-1)).toBe("var(--risk-1)");
  });

  it("orders the labels to match the ramp, so each name sits against its colour", () => {
    render(<MapLegend hazard="flood" active />);
    const names = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(names[0]).toContain("Severe");
    expect(names.at(-1)).toContain("Very Low");
  });

  it("hides the ramp from assistive tech, since the list carries every name", () => {
    const { container } = render(<MapLegend hazard="flood" active />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(RISK_CLASSES.length);
  });

  it("promises shading before a run and stops promising it afterwards", () => {
    const { unmount } = render(<MapLegend hazard="flood" active={false} />);
    expect(screen.getByText(/Shading appears once a model run completes/)).toBeTruthy();
    unmount();

    render(<MapLegend hazard="flood" active />);
    expect(screen.queryByText(/Shading appears once a model run completes/)).toBeNull();
    expect(screen.getByText(/without relying on colour/)).toBeTruthy();
  });
});

describe("MapFrame", () => {
  it("prompts for a run when idle with no results", () => {
    render(<MapFrame county="Kisumu" results={[]} status="idle" />);
    expect(screen.getByText("No results yet")).toBeTruthy();
    expect(screen.getByText(/Awaiting model run/)).toBeTruthy();
  });

  it("names selecting criteria as a required step, not an optional tweak", () => {
    render(<MapFrame county="Kisumu" results={[]} status="idle" />);
    expect(screen.getByText(/select the criteria the run should account for/i)).toBeTruthy();
    expect(screen.queryByText(/adjust parameters if needed/i)).toBeNull();
  });

  it("shows the calculating state and hides the empty prompt while running", () => {
    render(<MapFrame county="Kisumu" results={[]} status="running" />);
    expect(screen.getByText(/Calculating risk surface/)).toBeTruthy();
    expect(screen.queryByText("No results yet")).toBeNull();
  });

  it("draws one polygon per ward and reports the count once done", () => {
    const { container } = render(<MapFrame county="Kisumu" results={results} status="done" />);
    expect(container.querySelectorAll("polygon")).toHaveLength(results.length);
    expect(screen.getByText(`${results.length} wards modelled`)).toBeTruthy();
  });

  it("labels the map for screen readers with the county", () => {
    render(<MapFrame county="Baringo" results={results} status="done" />);
    expect(screen.getByRole("img", { name: /Baringo County/ })).toBeTruthy();
  });

  it("reveals the ward name and risk label on hover, not colour alone", async () => {
    const user = userEvent.setup();
    const { container } = render(<MapFrame county="Kisumu" results={results} status="done" />);
    await user.hover(container.querySelector("polygon")!);
    const first = results[0]!;
    expect(screen.getByText(first.name)).toBeTruthy();
    expect(screen.getByText(new RegExp(`score ${first.score}`))).toBeTruthy();
  });
});

describe("WardTable", () => {
  it("explains itself instead of rendering an empty table", () => {
    render(<WardTable results={[]} />);
    expect(screen.getByText(/appears here after a run/)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders one row per ward with score and risk label", () => {
    render(<WardTable results={results} />);
    expect(screen.getAllByRole("row")).toHaveLength(results.length + 1);
    for (const r of results) {
      const row = screen.getByRole("row", { name: new RegExp(`^${r.name}\\b`) });
      expect(within(row).getByText(String(r.score))).toBeTruthy();
      expect(within(row).getByText(r.risk.label)).toBeTruthy();
    }
  });

  it("sorts by score descending by default", () => {
    render(<WardTable results={results} />);
    const scores = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => Number(row.children[2]!.textContent));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("reverses the score order on a second click of the same header", async () => {
    const user = userEvent.setup();
    render(<WardTable results={results} />);
    await user.click(screen.getByRole("button", { name: /Score/ }));
    const scores = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => Number(row.children[2]!.textContent));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });

  it("sorts by ward name ascending when the Ward header is clicked", async () => {
    const user = userEvent.setup();
    render(<WardTable results={results} />);
    await user.click(screen.getByRole("button", { name: /Ward/ }));
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.children[0]!.textContent!);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("publishes the sort direction on the column header, where ARIA expects it", async () => {
    const user = userEvent.setup();
    render(<WardTable results={results} />);
    const scoreHeader = screen.getByRole("columnheader", { name: /Score/ });
    expect(scoreHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(screen.getByRole("button", { name: /Score/ }));
    expect(screen.getByRole("columnheader", { name: /Score/ }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
  });

  it("marks the inactive columns as unsorted rather than leaving aria-sort off", async () => {
    const user = userEvent.setup();
    render(<WardTable results={results} />);
    expect(screen.getByRole("columnheader", { name: /Ward/ }).getAttribute("aria-sort")).toBe(
      "none",
    );
    await user.click(screen.getByRole("button", { name: /Ward/ }));
    expect(screen.getByRole("columnheader", { name: /Ward/ }).getAttribute("aria-sort")).toBe(
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Score/ }).getAttribute("aria-sort")).toBe(
      "none",
    );
  });

  it("hides the colour chip from assistive tech, since the label carries the class", () => {
    const { container } = render(<WardTable results={results} />);
    // Scoped to tbody: the sort-direction arrow in thead is aria-hidden too.
    const chips = container.querySelectorAll('tbody [aria-hidden="true"]');
    expect(chips.length).toBe(results.length);
  });
});

describe("ControlSidebar criteria picker", () => {
  it("puts Hazard above Location", () => {
    render(<Sidebar />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf("Hazard")).toBeLessThan(headings.indexOf("Location"));
  });

  it("starts with every criterion unchecked", () => {
    render(<Sidebar />);
    for (const p of PARAMETERS) {
      // Radix renders a button with role=checkbox, so aria-checked is the state,
      // not the DOM .checked property an <input> would carry.
      expect(screen.getByRole("checkbox", { name: p.label }).getAttribute("aria-checked")).toBe(
        "false",
      );
    }
  });

  it("disables Run until a criterion is chosen", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const run = screen.getByRole("button", { name: /Run analysis/i });
    expect(run).toHaveProperty("disabled", true);
    expect(screen.getByText(/Select at least one criterion/i)).toBeTruthy();

    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    expect(screen.getByRole("button", { name: /Run analysis/i })).toHaveProperty("disabled", false);
  });

  it("shows a numeric field only for a chosen criterion, and no slider anywhere", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar />);
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);

    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    const fields = container.querySelectorAll('input[type="number"]');
    expect(fields).toHaveLength(1);
    expect((fields[0] as HTMLInputElement).value).toBe(String(DEFAULT_PARAMETERS.rainfall));

    // The point of the change: precise entry, not a drag target.
    expect(container.querySelectorAll('[role="slider"]')).toHaveLength(0);
  });

  it("accepts a typed value", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    const field = screen.getByLabelText(/Rainfall value in mm/i);
    await user.clear(field);
    await user.type(field, "275");
    expect((field as HTMLInputElement).value).toBe("275");
  });

  it("clamps a typed value to the criterion's declared range", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    const field = screen.getByLabelText(/Rainfall value in mm/i);
    await user.clear(field);
    await user.type(field, "9999");
    // Otherwise the field would display a figure the run did not use.
    expect(Number((field as HTMLInputElement).value)).toBeLessThanOrEqual(400);
  });

  it("says so when a chosen criterion does not apply to the hazard", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Temperature" }));
    expect(screen.getByText(/Not used for flood/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Run analysis/i })).toHaveProperty("disabled", true);
  });

  it("clears the warning once the hazard does use that criterion", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Temperature" }));
    await user.click(screen.getByRole("button", { name: /Drought/ }));
    expect(screen.queryByText(/Not used for/i)).toBeNull();
    expect(screen.getByRole("button", { name: /Run analysis/i })).toHaveProperty("disabled", false);
  });

  it("reports how many applicable criteria are selected", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    const applicable = applicableParameters("flood").length;
    expect(screen.getByText(new RegExp(`1 of ${applicable} applicable criteria`))).toBeTruthy();
  });

  it("clears the selection on demand", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    await user.click(screen.getByRole("button", { name: /Clear selection/i }));
    for (const p of PARAMETERS) {
      // Radix renders a button with role=checkbox, so aria-checked is the state,
      // not the DOM .checked property an <input> would carry.
      expect(screen.getByRole("checkbox", { name: p.label }).getAttribute("aria-checked")).toBe(
        "false",
      );
    }
  });

  it("offers the defaults shortcut only once a value has been edited", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole("checkbox", { name: "Rainfall" }));
    expect(screen.queryByRole("button", { name: /Use system defaults/i })).toBeNull();

    const field = screen.getByLabelText(/Rainfall value in mm/i);
    await user.clear(field);
    await user.type(field, "300");
    const reset = screen.getByRole("button", { name: /Use system defaults/i });

    await user.click(reset);
    expect((screen.getByLabelText(/Rainfall value in mm/i) as HTMLInputElement).value).toBe(
      String(DEFAULT_PARAMETERS.rainfall),
    );
  });

  it("lists all three hazards as pressable", () => {
    render(<Sidebar />);
    for (const h of HAZARDS) {
      const btn = screen.getByRole("button", { name: new RegExp(h.label) });
      expect(btn.getAttribute("aria-pressed")).toBe(h.id === "flood" ? "true" : "false");
    }
  });
});
