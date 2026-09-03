import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMETERS, runModel, type WardResult } from "./hazard-model";
import {
  CSV_COLUMNS,
  renderReport,
  reportFilename,
  slug,
  summarise,
  toCsv,
  toJson,
  type ReportScope,
} from "./report";

const AT = new Date("2026-09-03T10:26:48.000Z");

const scope = (over: Partial<ReportScope> = {}): ReportScope => ({
  county: "Kisumu",
  subCounty: "all",
  ward: "all",
  hazard: "flood",
  parameters: DEFAULT_PARAMETERS,
  usedDefaults: true,
  generatedAt: AT,
  ...over,
});

const results = () => runModel("Kisumu", "flood", DEFAULT_PARAMETERS);

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
  it("reports zeroes and a full zeroed class breakdown for no results", () => {
    const s = summarise([]);
    expect(s.wards).toBe(0);
    expect(s.averageScore).toBe(0);
    expect(s.highestWard).toBe("");
    expect(s.byClass).toHaveLength(5);
    expect(s.byClass.every((c) => c.count === 0)).toBe(true);
  });

  it("counts every ward exactly once across the class breakdown", () => {
    const r = results();
    const s = summarise(r);
    expect(s.byClass.reduce((n, c) => n + c.count, 0)).toBe(r.length);
    expect(s.wards).toBe(r.length);
  });

  it("finds the true maximum and names the ward that holds it", () => {
    const r = results();
    const s = summarise(r);
    const max = Math.max(...r.map((x) => x.score));
    expect(s.highestScore).toBe(max);
    expect(r.find((x) => x.name === s.highestWard)!.score).toBe(max);
  });

  it("averages to an integer inside the observed range", () => {
    const r = results();
    const s = summarise(r);
    expect(Number.isInteger(s.averageScore)).toBe(true);
    expect(s.averageScore).toBeGreaterThanOrEqual(Math.min(...r.map((x) => x.score)));
    expect(s.averageScore).toBeLessThanOrEqual(Math.max(...r.map((x) => x.score)));
  });

  it("handles a single ward", () => {
    const one = runModel("Kisumu", "flood", DEFAULT_PARAMETERS, {
      subCounty: "Nyando",
      ward: "Ahero",
    });
    const s = summarise(one);
    expect(s.wards).toBe(1);
    expect(s.averageScore).toBe(one[0]!.score);
    expect(s.highestWard).toBe("Ahero");
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

  it("writes the parameters actually used, not the defaults, when overridden", () => {
    const custom = { gradient: 33, rainfall: 210, temperature: 31, humidity: 44 };
    const rows = toCsv(results(), scope({ parameters: custom, usedDefaults: false }))
      .trimEnd()
      .split("\n")
      .slice(1)
      .map(splitCsvLine);
    for (const row of rows) {
      expect(row.slice(6, 10)).toEqual(["33", "210", "31", "44"]);
    }
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
