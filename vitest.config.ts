import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Deliberately NOT built on vite.config.ts. That file wraps
 * @lovable.dev/vite-tanstack-config, which injects the TanStack Start plugin,
 * nitro and a devtools plugin; loading those under a test runner both slows the
 * gate lane down and re-introduces the duplicate-plugin breakage its own header
 * comment warns about. Gate tests only need React + the @ alias.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Gate lane: deterministic, local, free. Anything slower than this belongs
    // in a different lane, not here.
    testTimeout: 5000,
  },
});
