import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only. Playwright owns e2e/*.spec.ts and e2e/*.setup.ts.
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", ".next/**"],
  },
});
