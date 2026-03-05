// vitest.config.js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/tests/**", "src/main.jsx"],

      // ── Thresholds ────────────────────────────────────────────────────────
      // Current coverage reflects tests for shared/data.js and
      // shared/offlineSync.js only. Thresholds are set to pass at the current
      // baseline. Raise each value incrementally as new test files are added:
      //
      //   Phase 2 target (add component tests): lines 50, functions 50
      //   Phase 3 target (full coverage):       lines 80, functions 80
      thresholds: {
        lines:      20,
        functions:  15,
        branches:    2,
        statements: 20,
      },
    },
  },
});
