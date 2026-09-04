import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RISK_CLASSES } from "@/lib/hazard-model";

/**
 * Regression guard for the bug that shipped in this repo: the hazard components
 * referenced `bg-chrome`, `bg-map` and `var(--risk-N)`, but styles.css defined
 * none of them. Tailwind v4 emits no CSS for an unregistered token and throws no
 * error, so the app rendered unstyled and the build stayed green. A type checker
 * cannot see this — only a test that reads the stylesheet can.
 */

const SRC = join(process.cwd(), "src");
const css = readFileSync(join(SRC, "styles.css"), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [p] : [];
  });
}

const sources = walk(SRC).map((p) => ({ path: p, text: readFileSync(p, "utf8") }));
const allCode = sources.map((s) => s.text).join("\n");

/**
 * src/components/ui is vendored shadcn/Radix. Those files reference custom
 * properties that are injected at runtime by Radix (--radix-*) or set inline by
 * a provider (--sidebar-width), so they are correctly absent from styles.css.
 * This suite guards *our* design tokens, so it reads only our own code.
 */
const ownCode = sources
  .filter((s) => !s.path.includes(join("components", "ui")))
  .map((s) => s.text)
  .join("\n");

/** Block bodies of `:root { ... }`, `.dark { ... }`, `@theme inline { ... }`. */
function block(selector: string): string {
  const i = css.indexOf(selector);
  if (i === -1) return "";
  const open = css.indexOf("{", i);
  const close = css.indexOf("\n}", open);
  return css.slice(open, close);
}

const root = block(":root {");
const dark = block(".dark {");
const theme = block("@theme inline {");

describe("custom properties referenced via var()", () => {
  const used = [...new Set([...ownCode.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!))];

  it("defines every statically referenced token in both modes", () => {
    // The list is legitimately empty now that the map is an OpenStreetMap
    // basemap: nothing in our own code spells a token name out literally any
    // more. Kept because the next one added must still resolve, and asserting a
    // non-empty list here would fail for the wrong reason.
    for (const name of used) {
      expect(root, `${name} missing from :root`).toContain(`${name}:`);
      expect(dark, `${name} missing from .dark`).toContain(`${name}:`);
    }
  });

  it("still reaches the risk ramp dynamically, off RISK_CLASSES", () => {
    // This is what replaced the static references, and it is what keeps the
    // ramp assertions below from scanning something nothing uses.
    expect(ownCode).toMatch(/var\(\$\{[^}]*varName\}\)/);
  });
});

describe("risk ramp", () => {
  it("defines every RISK_CLASSES varName in both modes", () => {
    for (const rc of RISK_CLASSES) {
      expect(root).toContain(`${rc.varName}:`);
      expect(dark).toContain(`${rc.varName}:`);
    }
  });

  it("uses oklch for every risk step, as styles.css requires", () => {
    for (const rc of RISK_CLASSES) {
      for (const scope of [root, dark]) {
        const line = scope.split("\n").find((l) => l.trim().startsWith(`${rc.varName}:`))!;
        expect(line).toMatch(/oklch\(/);
      }
    }
  });

  it("keeps the light ramp monotone light -> dark", () => {
    const ls = RISK_CLASSES.map((rc) => {
      const line = root.split("\n").find((l) => l.trim().startsWith(`${rc.varName}:`))!;
      return Number(/oklch\(([0-9.]+)/.exec(line)![1]);
    });
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i]!).toBeLessThan(ls[i - 1]!);
      // The dataviz ordinal gate: adjacent steps must be tellable apart.
      expect(ls[i - 1]! - ls[i]!).toBeGreaterThanOrEqual(0.06);
    }
  });

  it("keeps the dark ramp monotone dark -> light, so Severe stays the brightest", () => {
    const ls = RISK_CLASSES.map((rc) => {
      const line = dark.split("\n").find((l) => l.trim().startsWith(`${rc.varName}:`))!;
      return Number(/oklch\(([0-9.]+)/.exec(line)![1]);
    });
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i]!).toBeGreaterThan(ls[i - 1]!);
      expect(ls[i]! - ls[i - 1]!).toBeGreaterThanOrEqual(0.06);
    }
  });

  it("holds the ramp to a single hue", () => {
    const hues = RISK_CLASSES.flatMap((rc) =>
      [root, dark].map((scope) => {
        const line = scope.split("\n").find((l) => l.trim().startsWith(`${rc.varName}:`))!;
        return Number(/oklch\([0-9.]+ [0-9.]+ ([0-9.]+)/.exec(line)![1]);
      }),
    );
    expect(Math.max(...hues) - Math.min(...hues)).toBeLessThan(3);
  });
});

describe("Tailwind theme registration", () => {
  // A token can exist in :root and still produce no utility class: Tailwind v4
  // only generates `bg-x` if `--color-x` is registered in @theme.
  const CLASS_TOKENS = ["chrome", "chrome-foreground", "chrome-muted", "map"];

  it.each(CLASS_TOKENS)("registers --color-%s so its utility classes exist", (name) => {
    expect(theme).toContain(`--color-${name}: var(--${name});`);
  });

  it.each(CLASS_TOKENS)("defines --%s in both modes", (name) => {
    expect(root).toContain(`--${name}:`);
    expect(dark).toContain(`--${name}:`);
  });

  it("registers --font-display for the font-display utility", () => {
    expect(allCode).toContain("font-display");
    expect(theme).toMatch(/--font-display:\s*\S/);
  });

  it("has no chrome/map/risk utility class in the code without a matching token", () => {
    const classes = [
      ...new Set(
        [
          ...allCode.matchAll(
            /\b(?:bg|text|border|ring|fill|stroke)-((?:chrome|map|risk)[a-z0-9-]*)/g,
          ),
        ].map((m) => m[1]!),
      ),
    ];
    expect(classes.length).toBeGreaterThan(0);
    for (const c of classes) {
      expect(theme, `utility "${c}" has no --color-${c} in @theme inline`).toContain(
        `--color-${c}:`,
      );
    }
  });
});
