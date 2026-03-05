// src/tests/setup.js
// Global test setup — runs before every test file.

// ── jest-dom matchers ─────────────────────────────────────────────────────────
import "@testing-library/jest-dom/vitest";

// ── Mock IndexedDB ────────────────────────────────────────────────────────────
// happy-dom does not include IndexedDB. fake-indexeddb simulates it so
// offlineSync.js tests work without a real browser.
import "fake-indexeddb/auto";

// ── Mock navigator.onLine ─────────────────────────────────────────────────────
Object.defineProperty(navigator, "onLine", {
  configurable: true,
  get: () => true,
});

// ── Silence expected console warnings in tests ────────────────────────────────
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("React Router") || args[0]?.includes?.("act(")) return;
  originalWarn(...args);
};
