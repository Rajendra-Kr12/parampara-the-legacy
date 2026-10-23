import { describe, expect, it, jest } from "@jest/globals";
import {
  clearStaleAttempt,
  createSubmitGuard,
  submitSignIn,
  type SubmitOutcome,
  type SubmitSteps,
} from "./submit-sign-in";

/**
 * A fresh attempt reads `needs_identifier` until the password call, then `statusAfter`.
 * Overrides replace single steps, so a test can pin a leftover status or a failure.
 */
function steps(statusAfter = "complete", overrides: Partial<SubmitSteps> = {}): SubmitSteps {
  let submitted = false;
  return {
    resetIfNeeded: () => Promise.resolve({ error: null }),
    submitPassword: () => {
      submitted = true;
      return Promise.resolve({ error: null });
    },
    readStatus: () => (submitted ? statusAfter : "needs_identifier"),
    beginFinalizing: () => undefined,
    finalize: () => Promise.resolve({ error: null }),
    ...overrides,
  };
}

describe("submitSignIn", () => {
  it("finalizes once when a clean attempt reports complete", async () => {
    const beginFinalizing = jest.fn();
    const finalize = jest.fn(() => Promise.resolve({ error: null }));
    await expect(submitSignIn(steps("complete", { beginFinalizing, finalize }))).resolves.toBe(
      "finalized",
    );
    expect(beginFinalizing).toHaveBeenCalledTimes(1);
    expect(finalize).toHaveBeenCalledTimes(1);
  });

  it("fails without finalizing when Clerk returns an error", async () => {
    const finalize = jest.fn(() => Promise.resolve({ error: null }));
    const outcome = await submitSignIn(
      steps("complete", {
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
      await expect(submitSignIn(steps(status, { finalize }))).resolves.toBe("pending");
    }
    expect(finalize).not.toHaveBeenCalled();
  });

  it("fails when finalize returns an error", async () => {
    const outcome = await submitSignIn(
      steps("complete", {
        finalize: () => Promise.resolve({ error: new Error("session not active") }),
      }),
    );
    expect(outcome).toBe("failed");
  });

  describe("a leftover status from an earlier attempt", () => {
    it("fails and never calls the password step when the reset returns an error", async () => {
      const submitPassword = jest.fn(() => Promise.resolve({ error: null }));
      const finalize = jest.fn(() => Promise.resolve({ error: null }));
      const outcome = await submitSignIn(
        steps("complete", {
          resetIfNeeded: () => Promise.resolve({ error: new Error("reset refused") }),
          submitPassword,
          finalize,
        }),
      );
      expect(outcome).toBe("failed");
      expect(submitPassword).not.toHaveBeenCalled();
      expect(finalize).not.toHaveBeenCalled();
    });

    it("fails and never finalizes when `complete` survives the reset", async () => {
      const submitPassword = jest.fn(() => Promise.resolve({ error: null }));
      const finalize = jest.fn(() => Promise.resolve({ error: null }));
      const outcome = await submitSignIn(
        steps("complete", { readStatus: () => "complete", submitPassword, finalize }),
      );
      expect(outcome).toBe("failed");
      expect(submitPassword).not.toHaveBeenCalled();
      expect(finalize).not.toHaveBeenCalled();
    });

    it("does not finalize when a new password call returns no error but does not complete", async () => {
      const finalize = jest.fn(() => Promise.resolve({ error: null }));
      const outcome = await submitSignIn(steps("needs_identifier", { finalize }));
      expect(outcome).toBe("pending");
      expect(finalize).not.toHaveBeenCalled();
    });
  });

  it("fails instead of throwing when the reset rejects", async () => {
    const outcome = await submitSignIn(
      steps("complete", { resetIfNeeded: () => Promise.reject(new Error("network")) }),
    );
    expect(outcome).toBe("failed");
  });

  it("fails instead of throwing when the password call rejects", async () => {
    const outcome = await submitSignIn(
      steps("complete", { submitPassword: () => Promise.reject(new Error("network")) }),
    );
    expect(outcome).toBe("failed");
  });

  it("fails instead of throwing when finalize rejects", async () => {
    const outcome = await submitSignIn(
      steps("complete", { finalize: () => Promise.reject(new Error("keychain")) }),
    );
    expect(outcome).toBe("failed");
  });
});

describe("clearStaleAttempt", () => {
  it("calls the reset once", async () => {
    const reset = jest.fn(() => Promise.resolve({ error: null }));
    await clearStaleAttempt(reset);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("resolves instead of rejecting when the reset rejects", async () => {
    await expect(
      clearStaleAttempt(() => Promise.reject(new Error("keychain"))),
    ).resolves.toBeUndefined();
  });

  it("resolves when the reset returns an error", async () => {
    await expect(
      clearStaleAttempt(() => Promise.resolve({ error: new Error("refused") })),
    ).resolves.toBeUndefined();
  });
});

describe("createSubmitGuard", () => {
  /** A task that stays in flight until the test calls `settle`. */
  function pending(): { task: () => Promise<SubmitOutcome>; settle: (o: SubmitOutcome) => void } {
    let settle: (o: SubmitOutcome) => void = () => undefined;
    const task = () =>
      new Promise<SubmitOutcome>((resolve) => {
        settle = resolve;
      });
    return {
      task,
      settle: (o) => {
        settle(o);
      },
    };
  }

  it("ignores a second submit while the first is in flight, without running it", async () => {
    const guard = createSubmitGuard();
    const first = pending();
    const second = jest.fn(() => Promise.resolve<SubmitOutcome>("finalized"));
    const firstRun = guard.run(first.task);
    await expect(guard.run(second)).resolves.toBe("ignored");
    expect(second).not.toHaveBeenCalled();
    first.settle("failed");
    await expect(firstRun).resolves.toBe("failed");
  });

  it("takes the lock before the task's first await", async () => {
    const guard = createSubmitGuard();
    const first = pending();
    void guard.run(first.task);
    await expect(guard.run(() => Promise.resolve<SubmitOutcome>("failed"))).resolves.toBe(
      "ignored",
    );
  });

  it.each<SubmitOutcome>(["failed", "pending"])("unlocks after a %s outcome", async (outcome) => {
    const guard = createSubmitGuard();
    await expect(guard.run(() => Promise.resolve(outcome))).resolves.toBe(outcome);
    await expect(guard.run(() => Promise.resolve<SubmitOutcome>("pending"))).resolves.toBe(
      "pending",
    );
  });

  it("stays locked after a finalized outcome so the session is never finalized twice", async () => {
    const guard = createSubmitGuard();
    await expect(guard.run(() => Promise.resolve<SubmitOutcome>("finalized"))).resolves.toBe(
      "finalized",
    );
    await expect(guard.run(() => Promise.resolve<SubmitOutcome>("failed"))).resolves.toBe(
      "ignored",
    );
  });

  it("unlocks when the task rejects", async () => {
    const guard = createSubmitGuard();
    await expect(guard.run(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(guard.run(() => Promise.resolve<SubmitOutcome>("pending"))).resolves.toBe(
      "pending",
    );
  });
});
