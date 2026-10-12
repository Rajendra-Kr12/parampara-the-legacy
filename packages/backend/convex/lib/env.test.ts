import { describe, expect, it } from "vitest";
import { requireHttpsUrl } from "./env";

const name = "CLERK_JWT_ISSUER_DOMAIN";

describe("requireHttpsUrl", () => {
  it("returns a valid https URL unchanged", () => {
    const value = "https://synthetic-test.clerk.accounts.dev";
    expect(requireHttpsUrl(name, value)).toBe(value);
  });

  it.each([
    ["unset", undefined, /is not set/],
    ["empty", "", /is not set/],
    ["blank", "   ", /is not set/],
    ["not a URL", "synthetic-secret-value", /is not a valid https URL/],
    ["plain http", "http://synthetic-secret-value.example", /is not a valid https URL/],
    ["padded", " https://synthetic-test.clerk.accounts.dev", /is not a valid https URL/],
    ["missing a host", "https://", /is not a valid https URL/],
  ])("rejects a value that is %s", (_label, value, reason) => {
    expect(() => requireHttpsUrl(name, value)).toThrow(reason);
  });

  it("never includes the rejected value in the error", () => {
    for (const value of ["synthetic-secret-value", "http://synthetic-secret-value.example"]) {
      let message = "";
      try {
        requireHttpsUrl(name, value);
      } catch (error) {
        message = error instanceof Error ? error.message : "";
      }
      expect(message).toContain(name);
      expect(message).not.toContain("synthetic-secret-value");
    }
  });
});
