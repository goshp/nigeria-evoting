// eslint.config.js
// Flat ESLint config (ESLint v9+). Enforces code quality across all JS/JSX files.

import js            from "@eslint/js";
import reactPlugin   from "eslint-plugin-react";
import reactHooks    from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      react:        reactPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion:  2022,
      sourceType:   "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window:      "readonly",
        document:    "readonly",
        navigator:   "readonly",
        indexedDB:   "readonly",
        URL:         "readonly",
        Blob:        "readonly",
        console:     "readonly",
        setTimeout:  "readonly",
        Math:        "readonly",
        Date:        "readonly",
        parseInt:    "readonly",
        parseFloat:  "readonly",
        Promise:     "readonly",
        structuredClone: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React
      "react/prop-types":                    "off",   // using JS not TS
      "react/react-in-jsx-scope":            "off",   // not needed in React 17+
      "react/jsx-key":                       "error",
      "react/no-unknown-property":           "error",

      // React Hooks
      "react-hooks/rules-of-hooks":          "error",
      "react-hooks/exhaustive-deps":         "warn",

      // General
      "no-unused-vars":   ["warn", { argsIgnorePattern: "^_" }],
      "no-console":       ["warn", { allow: ["warn", "error"] }],
      "no-undef":         "error",
      "prefer-const":     "warn",
      "no-var":           "error",
      "eqeqeq":           ["error", "always"],
    },
  },
  {
    // Ignore build output and config files
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
];
