/**
 * Turns Clerk's sign-in state into the small, safe view state the sign-in screen
 * renders (D-050, AC-1.23 and AC-1.24). Pure and framework-free, so the Jest unit
 * tests need no render library and no Clerk instance (D-049).
 *
 * The rules this file exists to enforce:
 * - Clerk's own error text is never shown. Any refusal becomes one fixed message,
 *   which also keeps a wrong password indistinguishable from an unknown account.
 * - Device Trust (`needs_client_trust`), a second factor (`needs_second_factor`) and
 *   any other step the app does not support become one fixed "not supported yet"
 *   message (D-050).
 * - Only `status === "complete"` lets the screen finalize the session. A status this
 *   file does not know is never treated as signed in.
 * - Finalizing the session is its own in-flight step. Clerk can report `complete` before
 *   the session is active, so progress stays visible while finalization runs and a
 *   finalize failure shows the same fixed error instead of looking signed in.
 */

/** Fixed message for any refused sign-in. Never Clerk's text (AC-1.23). */
export const SIGN_IN_ERROR_MESSAGE =
  "We could not sign you in. Check your email address and password, then try again.";

/** Fixed message when Clerk asks for a step this app does not support (D-050). */
export const SIGN_IN_UNSUPPORTED_MESSAGE =
  "This sign-in needs a verification step that the app does not support yet. Try again later.";

export const SIGN_IN_EMAIL_REQUIRED = "Enter your email address.";
export const SIGN_IN_EMAIL_INVALID = "That does not look like an email address.";
export const SIGN_IN_PASSWORD_REQUIRED = "Enter your password.";

export interface SignInFields {
  readonly emailAddress: string;
  readonly password: string;
}

export interface SignInFieldErrors {
  readonly emailAddress?: string;
  readonly password?: string;
}

/**
 * Local checks run before any network call, so an empty form never reaches Clerk.
 * The email check is deliberately loose: Clerk is the authority on whether an
 * address exists or is in use.
 */
export function validateSignInFields(fields: SignInFields): SignInFieldErrors {
  const errors: { emailAddress?: string; password?: string } = {};
  const emailAddress = fields.emailAddress.trim();
  if (emailAddress === "") {
    errors.emailAddress = SIGN_IN_EMAIL_REQUIRED;
  } else if (!/^\S+@\S+\.\S+$/.test(emailAddress)) {
    errors.emailAddress = SIGN_IN_EMAIL_INVALID;
  }
  if (fields.password === "") {
    errors.password = SIGN_IN_PASSWORD_REQUIRED;
  }
  return errors;
}

export interface SignInSignals {
  /** Clerk's `signIn.status` (the `SignInStatus` union in `@clerk/shared`). */
  readonly status: string | undefined;
  /** True while a sign-in request is in flight (`fetchStatus === "fetching"`). */
  readonly submitting: boolean;
  /**
   * True while the screen is awaiting `signIn.finalize()`. Clerk can report `complete`
   * before the session is active, so this keeps the progress state honest through the
   * last asynchronous step.
   */
  readonly finalizing: boolean;
  /** True when the last submit was refused, from Clerk's returned error or parsed errors. */
  readonly rejected: boolean;
}

export interface SignInView {
  readonly submitting: boolean;
  readonly complete: boolean;
  readonly errorMessage: string | null;
  readonly unsupportedMessage: string | null;
}

/** The statuses that still leave the email and password form usable. */
const formStatuses = new Set(["needs_identifier", "needs_first_factor"]);

function isFormStatus(status: string): boolean {
  return formStatuses.has(status);
}

export function signInView(signals: SignInSignals): SignInView {
  const statusComplete = signals.status === "complete";
  const unsupported =
    signals.status !== undefined && !statusComplete && !isFormStatus(signals.status);
  // A refusal while finalizing (a finalize failure) means the sign-in did not actually
  // finish, even though Clerk's status already reads "complete". That failure takes
  // priority, so it is not hidden and the view is not treated as signed in.
  const failed = signals.rejected && !unsupported;
  const complete = statusComplete && !failed;
  const busy = signals.submitting || signals.finalizing;
  return {
    submitting: busy && !failed,
    complete,
    unsupportedMessage: unsupported ? SIGN_IN_UNSUPPORTED_MESSAGE : null,
    errorMessage: failed ? SIGN_IN_ERROR_MESSAGE : null,
  };
}
