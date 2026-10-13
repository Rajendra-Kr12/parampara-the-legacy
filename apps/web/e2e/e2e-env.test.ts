import { describe, expect, it } from "vitest";
import { readE2eEnv, requiredE2eEnv, skipMessage } from "./e2e-env";

const complete = Object.fromEntries(requiredE2eEnv.map((name) => [name, `value-of-${name}`]));

describe("readE2eEnv", () => {
  it("returns every value when all are set", () => {
    const result = readE2eEnv(complete);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.E2E_CLERK_USER_NAME).toBe("value-of-E2E_CLERK_USER_NAME");
    }
  });

  it("reports missing and blank variables by name", () => {
    const result = readE2eEnv({
      ...complete,
      CLERK_SECRET_KEY: undefined,
      E2E_CLERK_USER_NAME: " ",
    });
    expect(result).toEqual({ ok: false, missing: ["CLERK_SECRET_KEY", "E2E_CLERK_USER_NAME"] });
  });

  it("skips with a message that names variables and the command, never values", () => {
    const result = readE2eEnv({ ...complete, CLERK_SECRET_KEY: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const message = skipMessage(result.missing);
      expect(
        message.startsWith(
          "NOT RUN: web sign-in proof skipped, this is not a pass: missing CLERK_SECRET_KEY.",
        ),
      ).toBe(true);
      expect(message).toContain("missing CLERK_SECRET_KEY.");
      expect(message).toContain("pnpm --filter @parampara/web test:e2e");
      expect(message).not.toContain("value-of-");
    }
  });
});
