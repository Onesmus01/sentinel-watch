import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS, RISK_CLASSES, runModel } from "@/lib/hazard-model";
import { MapFrame } from "./MapFrame";
import { MapLegend } from "./MapLegend";
import { ResultSummary } from "./ResultSummary";
import { WardTable } from "./WardTable";

const results = runModel("Kisumu", "flood", DEFAULT_PARAMETERS);

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

describe("ResultSummary", () => {
  it("shows placeholders with no results", () => {
    render(<ResultSummary results={[]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("counts high-risk wards against the total", () => {
    render(<ResultSummary results={results} />);
    const high = results.filter((r) => r.score > 60).length;
    expect(screen.getByText(`${high}/${results.length}`)).toBeTruthy();
  });

  it("names the highest-scoring ward", () => {
    render(<ResultSummary results={results} />);
    const top = [...results].sort((a, b) => b.score - a.score)[0]!;
    expect(screen.getByText(top.name)).toBeTruthy();
  });

  it("shows the mean score", () => {
    render(<ResultSummary results={results} />);
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    expect(screen.getByText(String(avg))).toBeTruthy();
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
