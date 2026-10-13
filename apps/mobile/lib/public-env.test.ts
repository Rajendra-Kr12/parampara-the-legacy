import { describe, expect, it } from "@jest/globals";
import { parsePublicEnv, requireClerkPublishableKey } from "./public-env";

const goodUrl = "https://example-123.convex.cloud";
const goodKey = "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk";

function problemsOf(input: Parameters<typeof parsePublicEnv>[0]): readonly string[] {
  const result = parsePublicEnv(input);
  return result.ok ? [] : result.problems;
}

describe("parsePublicEnv", () => {
  it("accepts an https Convex URL and a Clerk publishable key", () => {
    expect(parsePublicEnv({ convexUrl: goodUrl, clerkPublishableKey: goodKey })).toEqual({
      ok: true,
      values: { convexUrl: goodUrl, clerkPublishableKey: goodKey },
    });
  });

  it("rejects a missing Convex URL, naming the variable", () => {
    expect(problemsOf({ convexUrl: undefined, clerkPublishableKey: goodKey })).toEqual([
      "EXPO_PUBLIC_CONVEX_URL is not set. Add it to the app's .env.local (see its .env.example).",
    ]);
  });

  it("rejects a malformed Convex URL", () => {
    expect(problemsOf({ convexUrl: "not a url", clerkPublishableKey: goodKey })).toEqual([
      "EXPO_PUBLIC_CONVEX_URL is not a valid URL.",
    ]);
  });

  it("rejects http except on localhost", () => {
    expect(problemsOf({ convexUrl: "http://example.com", clerkPublishableKey: goodKey })).toEqual([
      "EXPO_PUBLIC_CONVEX_URL must be an https URL.",
    ]);
    expect(
      problemsOf({ convexUrl: "http://127.0.0.1:3210", clerkPublishableKey: goodKey }),
    ).toEqual([]);
  });

  it("rejects a missing or non-pk_ publishable key", () => {
    expect(problemsOf({ convexUrl: goodUrl, clerkPublishableKey: undefined })).toEqual([
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Add it to the app's .env.local (see its .env.example).",
    ]);
    expect(problemsOf({ convexUrl: goodUrl, clerkPublishableKey: "sk_test_abc" })).toEqual([
      "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must be a Clerk publishable key (pk_test_ or pk_live_).",
    ]);
  });

  it("reports both problems when both values are missing", () => {
    expect(problemsOf({ convexUrl: "", clerkPublishableKey: " " })).toHaveLength(2);
  });

  it("never echoes a rejected value", () => {
    const rejectedUrl = "ftp://user:hunter2@example.com";
    const rejectedKey = "sk_live_secret-value-123";
    const problems = problemsOf({ convexUrl: rejectedUrl, clerkPublishableKey: rejectedKey });
    expect(problems).toHaveLength(2);
    for (const problem of problems) {
      expect(problem).not.toContain("hunter2");
      expect(problem).not.toContain(rejectedKey);
    }
  });
});

describe("requireClerkPublishableKey", () => {
  it("accepts test and live keys", () => {
    expect(requireClerkPublishableKey("X", goodKey)).toBe(goodKey);
    expect(requireClerkPublishableKey("X", "pk_live_abc123")).toBe("pk_live_abc123");
  });

  it("rejects a key with only the prefix", () => {
    expect(() => requireClerkPublishableKey("X", "pk_test_")).toThrow("X must be a Clerk");
  });
});
