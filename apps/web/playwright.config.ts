import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { readE2eEnv, skipMessage } from "./e2e/e2e-env";

// The owner's keys live in the gitignored apps/web/.env.local, which `next dev`
// also reads. Load it here so the test process sees the same values. Variables
// already set in the shell win.
const envFile = fileURLToPath(new URL(".env.local", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const port = 3000;
const baseURL = `http://localhost:${String(port)}`;
const env = readE2eEnv(process.env);
const hasEnv = env.ok;

// Say why everything skips, once, in the runner process (workers set TEST_WORKER_INDEX).
if (!env.ok && process.env.TEST_WORKER_INDEX === undefined) {
  console.warn(skipMessage(env.missing));
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.(setup|spec)\.ts$/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts$/ },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  // Without the keys every test skips, so do not start a server that cannot run.
  ...(hasEnv
    ? {
        webServer: {
          command: `next dev --port ${String(port)}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
