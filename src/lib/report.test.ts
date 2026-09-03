import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARAMETERS,
  applicableParameters,
  runModel,
  type ParameterId,
  type WardResult,
} from "./hazard-model";
import {
  CSV_COLUMNS,
  effectiveCriteria,
  renderReport,
  reportFilename,
  slug,
  summarise,
  toCsv,
  toJson,
  type ReportScope,
} from "./report";

const FLOOD: ParameterId[] = applicableParameters("flood");

const AT = new Date("2026-09-03T10:26:48.000Z");

const scope = (over: Partial<ReportScope> = {}): ReportScope => ({
  county: "Kisumu",
  subCounty: "all",
  ward: "all",
  hazard: "flood",
  parameters: DEFAULT_PARAMETERS,
  selected: FLOOD,
  usedDefaults: true,
  generatedAt: AT,
  ...over,
});

const results = () => runModel("Kisumu", "flood", DEFAULT_PARAMETERS, FLOOD);

/** Split a CSV line on unquoted commas only. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

describe("summarise", () => {
  it("reports zero wards and a full zeroed class breakdown for no results", () => {
    const s = summarise([]);
    expect(s.wards).toBe(0);
    expect(s.byClass).toHaveLength(5);
    expect(s.byClass.every((c) => c.count === 0)).toBe(true);
  });

  it("counts every ward exactly once across the class breakdown", () => {
    const r = results();
    const s = summarise(r);
    expect(s.byClass.reduce((n, c) => n + c.count, 0)).toBe(r.length);
    expect(s.wards).toBe(r.length);
  });

  it("keeps the class breakdown in ramp order", () => {
    expect(summarise(results()).byClass.map((c) => c.id)).toEqual([
      "very-low",
      "low",
      "moderate",
      "high",
      "severe",
    ]);
  });

  it("derives no mean, peak or high-risk-area metric", () => {
    // Dropped as out of agreed scope for this phase. Asserted rather than just
    // deleted, so reinstating one is a deliberate act with a failing test first.
    const s = summarise(results()) as unknown as Record<string, unknown>;
    for (const gone of ["averageScore", "highestScore", "highestWard", "highRisk"]) {
      expect(s[gone]).toBeUndefined();
    }
    expect(Object.keys(s).sort()).toEqual(["byClass", "wards"]);
  });

  it("handles a single ward", () => {
    const one = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, FLOOD, {
      subCounty: "Nyando",
      ward: "Ahero",
    });
    expect(summarise(one).wards).toBe(1);
  });
});

describe("effectiveCriteria", () => {
  it("keeps only the criteria the hazard actually uses", () => {
    expect(effectiveCriteria(scope({ selected: ["rainfall", "temperature"] }))).toEqual([
      "rainfall",
    ]);
  });

  it("returns an empty list for a wholly inapplicable selection", () => {
    expect(effectiveCriteria(scope({ selected: ["temperature"] }))).toEqual([]);
  });

  it("preserves the caller's order", () => {
    expect(effectiveCriteria(scope({ selected: ["humidity", "rainfall"] }))).toEqual([
      "humidity",
      "rainfall",
    ]);
  });
});

describe("toCsv", () => {
  it("emits a header plus one row per ward and a trailing newline", () => {
    const r = results();
    const csv = toCsv(r, scope());
    expect(csv.endsWith("\n")).toBe(true);
    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toBe(CSV_COLUMNS.join(","));
    expect(lines).toHaveLength(r.length + 1);
  });

  it("gives every row the same field count as the header", () => {
    const csv = toCsv(results(), scope());
    const lines = csv.trimEnd().split("\n");
    for (const line of lines) {
      expect(splitCsvLine(line)).toHaveLength(CSV_COLUMNS.length);
    }
  });

  it("round-trips the score and class of each ward", () => {
    const r = results();
    const rows = toCsv(r, scope()).trimEnd().split("\n").slice(1).map(splitCsvLine);
    for (const w of r) {
      const row = rows.find((x) => x[2] === w.name)!;
      expect(row[4]).toBe(String(w.score));
      expect(row[5]).toBe(w.risk.label);
    }
  });

  it("quotes and escapes a field containing a comma, quote or newline", () => {
    const nasty: WardResult = {
      ...results()[0]!,
      name: 'Ward "A", North',
      subCounty: "Line1\nLine2",
    };
    const rows = toCsv([nasty], scope()).trimEnd().split("\n");
    const fields = splitCsvLine(rows[1]!.replace(/\n/g, "\\n"));
    // The parser must recover the originals, which is the real assertion:
    // a naive join would break the column count here.
    const recovered = splitCsvLine(rows.slice(1).join("\n"));
    expect(recovered).toHaveLength(CSV_COLUMNS.length);
    expect(recovered[2]).toBe('Ward "A", North');
    expect(recovered[1]).toBe("Line1\nLine2");
    expect(fields.length).toBeGreaterThan(0);
  });

  it("leaves plain fields unquoted", () => {
    const csv = toCsv(results(), scope());
    expect(csv.split("\n")[1]).not.toContain('"');
  });

  it("declares criteria_used before the value columns it explains", () => {
    expect(CSV_COLUMNS.indexOf("criteria_used")).toBeLessThan(CSV_COLUMNS.indexOf("gradient_pct"));
  });

  it("writes the parameters actually used, not the defaults, when overridden", () => {
    const custom = { gradient: 33, rainfall: 210, temperature: 31, humidity: 44 };
    const rows = toCsv(results(), scope({ parameters: custom, usedDefaults: false }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    const col = (name: string) => CSV_COLUMNS.indexOf(name as (typeof CSV_COLUMNS)[number]);
    for (const row of rows) {
      // Flood uses gradient, rainfall and humidity; temperature is not a flood
      // term, so its column must be blank rather than carrying 31.
      expect(row[col("gradient_pct")]).toBe("33");
      expect(row[col("rainfall_mm")]).toBe("210");
      expect(row[col("humidity_pct")]).toBe("44");
      expect(row[col("temperature_c")]).toBe("");
    }
  });

  it("blanks the value column of every criterion the run did not use", () => {
    const rows = toCsv(results(), scope({ selected: ["rainfall"] }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    const col = (name: string) => CSV_COLUMNS.indexOf(name as (typeof CSV_COLUMNS)[number]);
    for (const row of rows) {
      expect(row[col("rainfall_mm")]).toBe(String(DEFAULT_PARAMETERS.rainfall));
      for (const blank of ["gradient_pct", "temperature_c", "humidity_pct"]) {
        expect(row[col(blank)]).toBe("");
      }
    }
  });

  it("names the criteria used, so a blank is never mistaken for a missing reading", () => {
    const rows = toCsv(results(), scope({ selected: ["rainfall", "humidity"] }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    const col = CSV_COLUMNS.indexOf("criteria_used");
    for (const row of rows) {
      expect(row[col]).toBe("rainfall;humidity");
    }
  });

  it("omits an inapplicable criterion from criteria_used", () => {
    const rows = toCsv(results(), scope({ selected: ["rainfall", "temperature"] }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    expect(rows[0]![CSV_COLUMNS.indexOf("criteria_used")]).toBe("rainfall");
  });

  it("uses semicolons in criteria_used so the field never needs quoting", () => {
    const csv = toCsv(results(), scope({ selected: ["rainfall", "humidity", "gradient"] }));
    expect(csv).toContain("rainfall;humidity;gradient");
    expect(csv.split("\n")[1]).not.toContain('"');
  });

  it("leaves criteria_used empty when nothing applicable was selected", () => {
    const rows = toCsv(results(), scope({ selected: ["temperature"] }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    expect(rows[0]![CSV_COLUMNS.indexOf("criteria_used")]).toBe("");
  });

  it("emits header only for an empty result set", () => {
    expect(toCsv([], scope())).toBe(CSV_COLUMNS.join(",") + "\n");
  });
});

describe("toJson", () => {
  it("parses and carries scope, parameters, summary and wards", () => {
    const r = results();
    const j = JSON.parse(toJson(r, scope()));
    expect(j.version).toBe(1);
    expect(j.scope.county).toBe("Kisumu");
    expect(j.scope.hazardLabel).toBe("Flood");
    expect(j.wards).toHaveLength(r.length);
    expect(j.summary.wards).toBe(r.length);
    expect(j.parameters.usedSystemDefaults).toBe(true);
    expect(j.parameters.selected.sort()).toEqual([...FLOOD].sort());
    expect(j.disclaimer).toMatch(/not for operational decisions/i);
  });

  it("normalises the 'all' sentinel to null rather than leaking it", () => {
    const j = JSON.parse(toJson(results(), scope()));
    expect(j.scope.subCounty).toBeNull();
    expect(j.scope.ward).toBeNull();
  });

  it("keeps a real sub-county and ward when scoped", () => {
    const j = JSON.parse(toJson(results(), scope({ subCounty: "Nyando", ward: "Ahero" })));
    expect(j.scope.subCounty).toBe("Nyando");
    expect(j.scope.ward).toBe("Ahero");
  });

  it("stays valid JSON for an empty result set", () => {
    const j = JSON.parse(toJson([], scope()));
    expect(j.wards).toEqual([]);
    expect(j.summary.wards).toBe(0);
  });
});

describe("slug", () => {
  it.each([
    ["Murang'a", "murang-a"],
    ["Kisumu Central", "kisumu-central"],
    ["Saimo Soi", "saimo-soi"],
    ["  padded  ", "padded"],
    ["Embakasi East", "embakasi-east"],
  ])("slugs %s to %s", (input, expected) => {
    expect(slug(input)).toBe(expected);
  });

  it("never leaves a leading or trailing dash", () => {
    for (const s of ["'quoted'", "--x--", "!!!", " a "]) {
      expect(slug(s)).not.toMatch(/^-|-$/);
    }
  });
});

describe("reportFilename", () => {
  it("omits the 'all' scope segments", () => {
    expect(reportFilename(scope(), "csv")).toBe("sentinel_kisumu_flood_2026-09-03-10-26-48.csv");
  });

  it("includes sub-county and ward when scoped, in order", () => {
    expect(reportFilename(scope({ subCounty: "Nyando", ward: "Ahero" }), "json")).toBe(
      "sentinel_kisumu_nyando_ahero_flood_2026-09-03-10-26-48.json",
    );
  });

  it("contains no character that is illegal in a Windows filename", () => {
    const name = reportFilename(scope({ county: "Murang'a", subCounty: "Kangema" }), "csv");
    expect(name).not.toMatch(/[<>:"/\\|?*]/);
  });

  it("distinguishes two different scopes at the same instant", () => {
    const a = reportFilename(scope({ hazard: "flood" }), "csv");
    const b = reportFilename(scope({ hazard: "drought" }), "csv");
    expect(a).not.toBe(b);
  });

  it("is stable for the same scope and instant", () => {
    expect(reportFilename(scope(), "csv")).toBe(reportFilename(scope(), "csv"));
  });

  // The filename is stamped in UTC on purpose: it sorts correctly and means the
  // same thing in every timezone. Anything displaying that instant next to the
  // filename must therefore show UTC too, or the row disagrees with the file it
  // describes by the viewer's offset. Pinned here so the choice stays explicit.
  it("stamps the time in UTC, not the local zone", () => {
    const at = new Date("2026-09-03T08:07:21.000Z");
    const name = reportFilename(scope({ generatedAt: at }), "csv");
    expect(name).toContain("2026-09-03-08-07-21");
    expect(name).toContain(at.toISOString().slice(0, 19).replace(/[:T]/g, "-"));
  });

  it("orders lexicographically by time for a fixed scope", () => {
    const earlier = reportFilename(scope({ generatedAt: new Date("2026-09-03T08:00:00Z") }), "csv");
    const later = reportFilename(scope({ generatedAt: new Date("2026-09-03T09:00:00Z") }), "csv");
    expect([later, earlier].sort()).toEqual([earlier, later]);
  });
});

describe("renderReport", () => {
  it("pairs the csv body with a csv filename and mime type", () => {
    const f = renderReport(results(), scope(), "csv");
    expect(f.filename.endsWith(".csv")).toBe(true);
    expect(f.mime).toMatch(/^text\/csv/);
    expect(f.body).toBe(toCsv(results(), scope()));
  });

  it("pairs the json body with a json filename and mime type", () => {
    const f = renderReport(results(), scope(), "json");
    expect(f.filename.endsWith(".json")).toBe(true);
    expect(f.mime).toBe("application/json");
    expect(() => JSON.parse(f.body)).not.toThrow();
  });
});

describe("toJson criterion reporting", () => {
  it("carries values only for the criteria that took part", () => {
    const j = JSON.parse(toJson(results(), scope({ selected: ["rainfall"] })));
    expect(j.parameters.selected).toEqual(["rainfall"]);
    expect(Object.keys(j.parameters.values)).toEqual(["rainfall"]);
    expect(j.parameters.values.rainfall).toBe(DEFAULT_PARAMETERS.rainfall);
  });

  it("records a selected-but-inapplicable criterion as ignored, not as an input", () => {
    const j = JSON.parse(toJson(results(), scope({ selected: ["rainfall", "temperature"] })));
    expect(j.parameters.selected).toEqual(["rainfall"]);
    expect(j.parameters.ignored).toEqual(["temperature"]);
    expect(j.parameters.values.temperature).toBeUndefined();
  });

  it("describes only the criteria it carries, with their CSV column names", () => {
    const j = JSON.parse(toJson(results(), scope({ selected: ["rainfall"] })));
    expect(j.parameters.definitions).toHaveLength(1);
    expect(j.parameters.definitions[0]).toMatchObject({
      id: "rainfall",
      unit: "mm",
      column: "rainfall_mm",
    });
  });

  it("carries no mean or peak metric in the summary", () => {
    const j = JSON.parse(toJson(results(), scope()));
    expect(Object.keys(j.summary).sort()).toEqual(["byClass", "wards"]);
  });

  it("stays valid JSON with nothing applicable selected", () => {
    const j = JSON.parse(toJson(results(), scope({ selected: [] })));
    expect(j.parameters.selected).toEqual([]);
    expect(j.parameters.values).toEqual({});
    expect(j.parameters.definitions).toEqual([]);
  });
});
