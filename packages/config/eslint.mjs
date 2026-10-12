import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const typeCheckedFiles = ["**/*.ts", "**/*.tsx"];
const untypedFiles = ["**/*.js", "**/*.mjs", "**/*.cjs"];

/**
 * Base flat config for every workspace package. Type-aware strict rules apply to
 * TypeScript; plain JavaScript config files get the non-type-aware rules only.
 * Warnings are not allowed: packages run ESLint with --max-warnings 0.
 */
export const base = tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"] },
  js.configs.recommended,
  {
    files: typeCheckedFiles,
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: untypedFiles,
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
);

const forbiddenPackages = [
  "react",
  "react-dom",
  "react-native",
  "next",
  "expo",
  "convex",
  "@parampara/backend",
];

/**
 * Domain packages stay pure TypeScript: no UI framework, Convex, Clerk or app
 * imports. Add this block to packages/domain and packages/kinship-engine.
 */
export const domainPurity = [
  {
    files: typeCheckedFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: forbiddenPackages.map((name) => ({
            name,
            message: `Domain packages must stay pure TypeScript and cannot import "${name}".`,
          })),
          patterns: [
            {
              group: [
                "react/*",
                "react-dom/*",
                "react-native/*",
                "react-native-*",
                "next/*",
                "expo-*",
                "expo/*",
                "convex/*",
                "@clerk/*",
                "@convex-dev/*",
                "@parampara/backend/*",
              ],
              message:
                "Domain packages must stay pure TypeScript: no UI, Expo, Next, Convex or Clerk imports.",
            },
          ],
        },
      ],
    },
  },
];
