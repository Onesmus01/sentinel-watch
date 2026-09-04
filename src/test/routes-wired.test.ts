import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CSV_COLUMNS } from "@/lib/report";

/**
 * Static guard for the bug that actually shipped: every route file existed,
 * every unit test passed, tsc was clean and the build was green — and `/` still
 * rendered the Lovable placeholder, because nothing imported the app.
 *
 * These are string assertions on the route sources rather than a render. A
 * RouterProvider mount was tried first and hangs in jsdom, which would have cost
 * the gate lane its whole point; the real render path is covered instead by
 * driving the running app in a browser (see the drive script referenced in the
 * PR), and by the component tests next to each component.
 */

const ROUTES = join(process.cwd(), "src", "routes");
const read = (f: string) => readFileSync(join(ROUTES, f), "utf8");
const routeFiles = readdirSync(ROUTES).filter((f) => /\.tsx$/.test(f));

describe("no route ships the scaffold placeholder", () => {
  it.each(routeFiles)("%s has no Lovable blank-page marker", (f) => {
    const src = read(f);
    expect(src).not.toContain("data-lovable-blank-page-placeholder");
    expect(src).not.toContain("blank-app-v1.svg");
    expect(src).not.toContain("Your app will live here");
  });

  it.each(routeFiles)("%s has no 'replace this placeholder' instruction left in it", (f) => {
    expect(read(f)).not.toMatch(/Replace this placeholder/i);
  });
});

describe("/ is wired to the hazard console", () => {
  const src = read("index.tsx");

  it.each(["AppHeader", "ControlSidebar", "MapFrame", "MapLegend", "SiteFooter", "WardTable"])(
    "mounts %s",
    (component) => {
      expect(src).toContain(`components/hazard/${component}`);
      expect(src).toMatch(new RegExp(`<${component}[\\s/>]`));
    },
  );

  it("drives them from the shared hook rather than local state", () => {
    expect(src).toContain("useHazardModel");
    expect(src).toMatch(/useHazardModel\(\)/);
  });

  it("renders the component the route declares", () => {
    expect(src).toMatch(/createFileRoute\("\/"\)\(\{/);
    expect(src).toMatch(/component:\s*Index/);
  });

  it("no longer mounts the mean/peak/high-risk summary cards", () => {
    // Out of agreed scope for this phase. Pinned so reinstating them is a
    // deliberate act rather than a merge bringing them back unnoticed.
    expect(src).not.toContain("ResultSummary");
  });

  it("bounds the shell to the viewport from xl, so the footer is on screen", () => {
    // Without this the page is header + a 100vh rail + a footer, which is
    // taller than the viewport by exactly the footer's height — so the footer
    // the map is supposed to meet sits below the fold.
    expect(src).toMatch(/xl:h-screen/);
  });

  it("stops the control rail sizing itself against the whole viewport at xl", () => {
    // h-[calc(100vh-61px)] assumed nothing followed the rail. It is still
    // correct at lg, where the page scrolls, so the fix is an xl override
    // rather than a removal.
    expect(src).toContain("h-[calc(100vh-61px)]");
    expect(src).toMatch(/xl:h-full/);
  });

  it("drops the main pad at the bottom from xl, so the map can reach the footer", () => {
    expect(src).toMatch(/xl:pb-0/);
  });

  it("lets the right rail scroll inside itself rather than growing the page", () => {
    expect(src).toMatch(/xl:overflow-y-auto/);
  });

  it("offers the controls on small screens too, not only in the lg rail", () => {
    // The rail is `hidden lg:block`, so without a drawer the whole control set
    // would be unreachable on a phone.
    expect(src).toContain("lg:hidden");
    expect(src).toContain("SheetContent");
    expect(src).toContain("onOpenControls");
  });
});

describe("/reports is a real page", () => {
  const src = read("reports.tsx");

  it("declares the route the header links to", () => {
    expect(src).toMatch(/createFileRoute\("\/reports"\)\(\{/);
  });

  it("does not return null or an empty fragment", () => {
    expect(src).not.toMatch(/function Reports\(\)\s*\{\s*return null;?\s*\}/);
    expect(src.length).toBeGreaterThan(2000);
  });

  it("keeps the shared chrome", () => {
    for (const c of ["AppHeader", "SiteFooter"]) {
      expect(src).toContain(`components/hazard/${c}`);
    }
  });

  it("goes through the report contract instead of rolling its own", () => {
    expect(src).toContain('from "@/lib/report"');
    for (const fn of ["renderReport", "downloadReport"]) {
      expect(src).toContain(fn);
    }
    // Automatic-FAIL conditions from the build rubric.
    expect(src).not.toMatch(/text\/csv/);
    expect(src).not.toMatch(/createObjectURL/);
    expect(src).not.toMatch(/join\(","\)/);
  });

  it("runs the model itself, so the page does not depend on a prior dashboard run", () => {
    expect(src).toMatch(/runModel|useHazardModel/);
  });

  it("documents the CSV columns from the contract rather than restating them", () => {
    // Any literal column list in the page would drift the day CSV_COLUMNS
    // changes; reading the constant cannot. Only the snake_case/suffixed names
    // are checked: "county" and "ward" are also ordinary scope-state keys, so
    // their presence proves nothing either way.
    expect(src).toContain("CSV_COLUMNS");
    const schemaOnly = CSV_COLUMNS.filter((c) => /_/.test(c));
    expect(schemaOnly.length).toBeGreaterThan(5);
    expect(schemaOnly.filter((c) => src.includes(`"${c}"`))).toEqual([]);
  });

  it("shows the request time in UTC, matching the filename stamp", () => {
    expect(src).toContain("Requested (UTC)");
    expect(src).not.toMatch(/generatedAt\.toLocaleTimeString\(\)\}/);
  });

  it("drops the mean and peak stat tiles", () => {
    expect(src).not.toMatch(/label="Average score"/);
    expect(src).not.toMatch(/label="Peak score"/);
    expect(src).not.toContain("summary.averageScore");
    expect(src).not.toContain("summary.highestScore");
  });

  it("picks criteria with checkboxes and numeric fields, with no slider or defaults switch", () => {
    expect(src).toContain("toggleParameter");
    expect(src).toContain('type="number"');
    expect(src).not.toContain("Slider");
    expect(src).not.toContain("Switch");
    expect(src).not.toContain("useDefaults");
  });
});

describe("no route file leaks a forbidden escape hatch", () => {
  it.each(routeFiles)("%s", (f) => {
    const src = read(f);
    expect(src).not.toMatch(/:\s*any\b/);
    expect(src).not.toMatch(/as any\b/);
    expect(src).not.toMatch(/@ts-(expect-error|ignore)/);
    expect(src).not.toMatch(/eslint-disable/);
  });
});
