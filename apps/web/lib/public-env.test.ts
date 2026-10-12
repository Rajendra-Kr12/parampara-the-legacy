import { describe, expect, it } from "vitest";
import { requirePublicUrl } from "./public-env";

describe("requirePublicUrl", () => {
  it("accepts an https URL", () => {
    expect(requirePublicUrl("X", "https://example-123.convex.cloud")).toBe(
      "https://example-123.convex.cloud",
    );
  });

  it("accepts http only on localhost", () => {
    expect(requirePublicUrl("X", "http://127.0.0.1:3210")).toBe("http://127.0.0.1:3210");
    expect(() => requirePublicUrl("X", "http://example.com")).toThrow("X must be an https URL.");
  });

  it("rejects a missing or blank value, naming the variable", () => {
    expect(() => requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", undefined)).toThrow(
      /^NEXT_PUBLIC_CONVEX_URL is not set/,
    );
    expect(() => requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", "  ")).toThrow(/is not set/);
  });

  it("never echoes the value in the error", () => {
    const value = "not a url with-secret-looking-text";
    let message = "";
    try {
      requirePublicUrl("X", value);
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }
    expect(message).toBe("X is not a valid URL.");
    expect(message).not.toContain(value);
  });
});
