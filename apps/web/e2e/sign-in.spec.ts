import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { readE2eEnv, skipMessage } from "./e2e-env";

const env = readE2eEnv(process.env);
test.skip(!env.ok, env.ok ? "" : skipMessage(env.missing));

test("a signed-out visitor sees the sign-in UI and no name", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await expect(page.getByTestId("sign-in-link")).toBeVisible();
  await expect(page.getByTestId("my-name")).toHaveCount(0);

  await page.getByTestId("sign-in-link").click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.locator('input[name="identifier"]')).toBeVisible();
});

test("a signed-in test user sees their name from the Convex users.me query", async ({
  page,
}, testInfo) => {
  if (!env.ok) {
    throw new Error(skipMessage(env.missing));
  }
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: env.values.E2E_CLERK_USER_USERNAME,
      password: env.values.E2E_CLERK_USER_PASSWORD,
    },
  });
  await page.goto("/");
  await expect(page.getByTestId("my-name")).toHaveText(env.values.E2E_CLERK_USER_NAME);
  await expect(page.getByTestId("sign-in-link")).toHaveCount(0);

  // Evidence for the PR: saved under test-results/ (gitignored) and in the HTML report.
  await page.screenshot({ path: testInfo.outputPath("signed-in-my-name.png"), fullPage: true });
  await testInfo.attach("signed-in-my-name", {
    path: testInfo.outputPath("signed-in-my-name.png"),
    contentType: "image/png",
  });
});
