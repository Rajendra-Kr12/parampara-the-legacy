import { fileURLToPath } from "node:url";
import { base, domainPurity } from "../eslint.mjs";

// Same rules the packages use, pointed at the probe fixtures. Type-aware linting
// reads probes/tsconfig.json instead of a package tsconfig.
export default [
  ...base,
  ...domainPurity,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: [fileURLToPath(new URL("./tsconfig.json", import.meta.url))],
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
      },
    },
  },
];
