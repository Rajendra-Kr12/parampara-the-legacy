/**
 * The sign-in submit sequence as a pure async function (Step 4b, D-050), so the Jest
 * unit tests can drive every failure path without a render library or a Clerk instance.
 *
 * Clerk calls can reject as well as return `{ error }` (a dropped network, a keychain
 * failure). Any rejection is treated as a refused attempt, so the screen always gets
 * an outcome, shows the one fixed error and unlocks the form instead of staying busy.
 */

/** What the screen does next: show the fixed error, leave finalizing set, or wait. */
export type SubmitOutcome = "failed" | "finalized" | "pending";

export interface SubmitSteps {
  /** Clears a stale attempt before a new one (a no-op, with no error, on a fresh attempt). */
  readonly resetIfNeeded: () => Promise<{ readonly error: unknown }>;
  readonly submitPassword: () => Promise<{ readonly error: unknown }>;
  /** Read after the password call, never captured earlier, so it is Clerk's live status. */
  readonly readStatus: () => string;
  /** Called once Clerk reports `complete`, before finalization starts. */
  readonly beginFinalizing: () => void;
  readonly finalize: () => Promise<{ readonly error: unknown }>;
}

export async function submitSignIn(steps: SubmitSteps): Promise<SubmitOutcome> {
  try {
    const reset = await steps.resetIfNeeded();
    // Finalizing trusts `complete` after the password call, and Clerk's call returns no
    // status to tie it to. So prove the attempt started clean: a failed reset, or a status
    // other than `needs_identifier`, could be a leftover `complete` from an earlier attempt.
    if (reset.error !== null || steps.readStatus() !== "needs_identifier") {
      return "failed";
    }
    const submitted = await steps.submitPassword();
    if (submitted.error !== null) {
      return "failed";
    }
    // Only `complete` finalizes; any other status is shown by the screen's view state.
    if (steps.readStatus() !== "complete") {
      return "pending";
    }
    steps.beginFinalizing();
    const finalized = await steps.finalize();
    return finalized.error === null ? "finalized" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * The reset the sign-in screen fires on mount, to clear an attempt left from an earlier
 * visit. It is never awaited by the screen, so a rejection is swallowed here rather than
 * left unhandled. That is safe: `submitSignIn` resets again and refuses to go on unless
 * the attempt then starts clean, so a failed mount-time reset cannot sign anyone in.
 */
export async function clearStaleAttempt(reset: () => Promise<unknown>): Promise<void> {
  try {
    await reset();
  } catch {
    // Handled by the clean-start check in `submitSignIn`.
  }
}

/** What `run` reports: the task's outcome, or `ignored` when another submit was in flight. */
export type GuardedOutcome = SubmitOutcome | "ignored";

/**
 * A synchronous re-entry lock for the submit button. The button only disables once Clerk
 * reports `fetching`, which is after the first await, so two quick taps could otherwise
 * run two sequences against the same mutable Clerk attempt. `run` takes the lock before
 * any await and releases it on every outcome except `finalized`: after a successful
 * finalize the screen navigates away, and keeping the lock stops a second finalize.
 */
export function createSubmitGuard(): {
  run: (task: () => Promise<SubmitOutcome>) => Promise<GuardedOutcome>;
} {
  let busy = false;
  return {
    async run(task) {
      if (busy) {
        return "ignored";
      }
      busy = true;
      let outcome: SubmitOutcome = "failed";
      try {
        outcome = await task();
        return outcome;
      } finally {
        if (outcome !== "finalized") {
          busy = false;
        }
      }
    },
  };
}
