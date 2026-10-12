import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { readE2eEnv, skipMessage } from "./e2e-env";

// Clerk's docs require a project-based setup (not a globalSetup function) so the
// testing token reaches the test workers, run serially.
// https://clerk.com/docs/guides/development/testing/playwright/overview
setup.describe.configure({ mode: "serial" });

setup("clerk testing token", async () => {
  const env = readE2eEnv(process.env);
  setup.skip(!env.ok, env.ok ? "" : skipMessage(env.missing));
  // playwright.config.ts has already loaded .env.local; do not load it again.
  await clerkSetup({ dotenv: false });
});
