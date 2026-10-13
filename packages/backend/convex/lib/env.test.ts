import { describe, expect, it } from "vitest";
import { requireHttpsUrl } from "./env";

const name = "CLERK_JWT_ISSUER_DOMAIN";

describe("requireHttpsUrl", () => {
  it("returns a valid https URL unchanged", () => {
    const value = "https://synthetic-test.clerk.accounts.dev";
    expect(requireHttpsUrl(name, value)).toBe(value);
  });

  it.each([
    ["with a trailing slash", "https://synthetic-test.clerk.accounts.dev/"],
    ["with a port", "https://synthetic-test.clerk.accounts.dev:8443"],
  ])("accepts an origin %s", (_label, value) => {
    expect(requireHttpsUrl(name, value)).toBe(value);
  });

  it.each([
    ["a path", "https://synthetic-test.clerk.accounts.dev/some/path"],
    ["a repeated trailing slash", "https://synthetic-test.clerk.accounts.dev//"],
    ["a query", "https://synthetic-test.clerk.accounts.dev?a=1"],
    ["a query after a slash", "https://synthetic-test.clerk.accounts.dev/?a=1"],
    ["a fragment", "https://synthetic-test.clerk.accounts.dev#frag"],
    ["a fragment after a slash", "https://synthetic-test.clerk.accounts.dev/#frag"],
    ["a port and a path", "https://synthetic-test.clerk.accounts.dev:8443/some/path"],
  ])("rejects an origin with %s", (_label, value) => {
    expect(() => requireHttpsUrl(name, value)).toThrow(/is not a valid https URL/);
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
