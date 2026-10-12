import { afterEach, describe, expect, it, vi } from "vitest";

// auth.config.ts reads its environment when the module loads, so each case stubs the
// variable and imports a fresh copy.
async function loadAuthConfig() {
  vi.resetModules();
  return (await import("./auth.config")).default;
}

describe("auth.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("trusts only the configured Clerk issuer, for the convex audience", async () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://synthetic-test.clerk.accounts.dev");
    const config = await loadAuthConfig();
    expect(config.providers).toEqual([
      { domain: "https://synthetic-test.clerk.accounts.dev", applicationID: "convex" },
    ]);
  });

  it("refuses to load when the issuer domain is missing", async () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", undefined);
    await expect(loadAuthConfig()).rejects.toThrow(/CLERK_JWT_ISSUER_DOMAIN is not set/);
  });

  it("refuses to load when the issuer domain is not https", async () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "http://synthetic-test.clerk.accounts.dev");
    await expect(loadAuthConfig()).rejects.toThrow(/is not a valid https URL/);
  });
});
