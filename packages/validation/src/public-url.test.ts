import { describe, expect, it } from "vitest";
import { requirePublicUrl } from "./public-url";

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

  it("accepts an origin with a port or one trailing slash", () => {
    expect(requirePublicUrl("X", "https://example-123.convex.cloud/")).toBe(
      "https://example-123.convex.cloud/",
    );
    expect(requirePublicUrl("X", "http://localhost:3210")).toBe("http://localhost:3210");
  });

  it("accepts ports up to 65535 and rejects anything above", () => {
    expect(requirePublicUrl("X", "https://example.com:1")).toBe("https://example.com:1");
    expect(requirePublicUrl("X", "https://example.com:65535")).toBe("https://example.com:65535");
    for (const port of ["0", "65536", "99999", "00080"]) {
      expect(() => requirePublicUrl("X", `https://example.com:${port}`)).toThrow(
        "X is not a valid URL.",
      );
    }
  });

  it("rejects anything that is not a plain origin", () => {
    for (const value of [
      "https://example.com/path",
      "https://example.com?query=1",
      "https://example.com#fragment",
      "https://user:password@example.com",
      "https://exa mple.com",
      "ftp://example.com",
      "https://",
    ]) {
      expect(() => requirePublicUrl("X", value)).toThrow("X is not a valid URL.");
    }
  });

  it("rejects a missing or blank value, naming the variable", () => {
    expect(() => requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", undefined)).toThrow(
      /^NEXT_PUBLIC_CONVEX_URL is not set/,
    );
    expect(() => requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", "  ")).toThrow(/is not set/);
    expect(() => requirePublicUrl("EXPO_PUBLIC_CONVEX_URL", undefined)).toThrow(
      /^EXPO_PUBLIC_CONVEX_URL is not set/,
    );
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
