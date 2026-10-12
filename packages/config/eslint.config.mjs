import { base } from "./eslint.mjs";

// The probe fixtures are deliberately broken; probes/enforcement.test.mjs lints them
// with its own config and asserts that each one is rejected.
export default [{ ignores: ["probes/fixtures/**"] }, ...base];
