import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Config ESLint partagée du monorepo. Chaque package l'étend via son script
 * `lint`. Les règles reflètent CLAUDE.md §6 : pas de `any`, pas de
 * ts-ignore sans ticket, pas de catch vide.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/*.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-expect-error": { descriptionFormat: "^: TICKET-\\d+ .+$" },
        },
      ],
      "no-empty": ["error", { allowEmptyCatch: false }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression > TSAnyKeyword",
          message: "Assertion `as any` interdite (CLAUDE.md §6).",
        },
      ],
    },
  },
  prettier,
);
