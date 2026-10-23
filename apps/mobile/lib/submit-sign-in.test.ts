import { describe, expect, it, jest } from "@jest/globals";
import { submitSignIn, type SubmitSteps } from "./submit-sign-in";

function steps(overrides: Partial<SubmitSteps> = {}): SubmitSteps {
  return {
    resetIfNeeded: () => Promise.resolve(),
    submitPassword: () => Promise.resolve({ error: null }),
    readStatus: () => "complete",
    beginFinalizing: () => undefined,
    finalize: () => Promise.resolve({ error: null }),
    ...overrides,
  };
}

describe("submitSignIn", () => {
  it("finalizes once when Clerk reports complete", async () => {
    const beginFinalizing = jest.fn();
    const finalize = jest.fn(() => Promise.resolve({ error: null }));
    await expect(submitSignIn(steps({ beginFinalizing, finalize }))).resolves.toBe("finalized");
    expect(beginFinalizing).toHaveBeenCalledTimes(1);
    expect(finalize).toHaveBeenCalledTimes(1);
  });

  it("reads the status after the password call, not before", async () => {
    let status = "needs_identifier";
    const outcome = await submitSignIn(
      steps({
        submitPassword: () => {
          status = "complete";
          return Promise.resolve({ error: null });
        },
        readStatus: () => status,
      }),
    );
    expect(outcome).toBe("finalized");
  });

  it("fails without finalizing when Clerk returns an error", async () => {
    const finalize = jest.fn(() => Promise.resolve({ error: null }));
    const outcome = await submitSignIn(
      steps({
        submitPassword: () => Promise.resolve({ error: new Error("bad password") }),
        finalize,
      }),
    );
    expect(outcome).toBe("failed");
    expect(finalize).not.toHaveBeenCalled();
  });

  it("stays pending and never finalizes for a step the app does not support", async () => {
    const finalize = jest.fn(() => Promise.resolve({ error: null }));
    for (const status of ["needs_client_trust", "needs_second_factor", "a_future_status"]) {
      await expect(submitSignIn(steps({ readStatus: () => status, finalize }))).resolves.toBe(
        "pending",
      );
    }
    expect(finalize).not.toHaveBeenCalled();
  });

  it("fails when finalize returns an error", async () => {
    const outcome = await submitSignIn(
      steps({ finalize: () => Promise.resolve({ error: new Error("session not active") }) }),
    );
    expect(outcome).toBe("failed");
  });

  it("fails instead of throwing when the reset rejects", async () => {
    const outcome = await submitSignIn(
      steps({
        resetIfNeeded: () => Promise.reject(new Error("network")),
      }),
    );
    expect(outcome).toBe("failed");
  });

  it("fails instead of throwing when the password call rejects", async () => {
    const outcome = await submitSignIn(
      steps({
        submitPassword: () => Promise.reject(new Error("network")),
      }),
    );
    expect(outcome).toBe("failed");
  });

  it("fails instead of throwing when finalize rejects", async () => {
    const outcome = await submitSignIn(
      steps({
        finalize: () => Promise.reject(new Error("keychain")),
      }),
    );
    expect(outcome).toBe("failed");
  });
});
