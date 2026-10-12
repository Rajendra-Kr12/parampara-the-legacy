import { base } from "@parampara/config/eslint";

// convex/_generated is written by the Convex CLI and committed as-is.
export default [{ ignores: ["convex/_generated/**"] }, ...base];
