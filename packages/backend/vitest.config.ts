import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Closest match to the Convex runtime. See https://docs.convex.dev/testing/convex-test
    environment: "edge-runtime",
    // Without this, pnpm's isolated installs leave convex-test unprocessed by Vite
    // and import.meta.glob is undefined inside it.
    server: { deps: { inline: ["convex-test"] } },
  },
});
