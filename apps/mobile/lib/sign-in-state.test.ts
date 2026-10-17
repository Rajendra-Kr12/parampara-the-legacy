import { describe, expect, it } from "@jest/globals";
import {
  SIGN_IN_EMAIL_INVALID,
  SIGN_IN_EMAIL_REQUIRED,
  SIGN_IN_ERROR_MESSAGE,
  SIGN_IN_PASSWORD_REQUIRED,
  SIGN_IN_UNSUPPORTED_MESSAGE,
  signInView,
  validateSignInFields,
  type SignInSignals,
} from "./sign-in-state";

const idle: SignInSignals = {
  status: "needs_identifier",
  submitting: false,
  finalizing: false,
  rejected: false,
};

describe("validateSignInFields", () => {
  it("asks for an email and a password when both are empty", () => {
    expect(validateSignInFields({ emailAddress: "", password: "" })).toEqual({
      emailAddress: SIGN_IN_EMAIL_REQUIRED,
      password: SIGN_IN_PASSWORD_REQUIRED,
    });
  });

  it("asks only for the password when the email is present", () => {
    expect(validateSignInFields({ emailAddress: "a@b.com", password: "" })).toEqual({
      password: SIGN_IN_PASSWORD_REQUIRED,
    });
  });

  it("rejects an address that is not an email", () => {
    expect(validateSignInFields({ emailAddress: "not-an-email", password: "secret" })).toEqual({
      emailAddress: SIGN_IN_EMAIL_INVALID,
    });
  });

  it("accepts a filled form", () => {
    expect(validateSignInFields({ emailAddress: "a@b.com", password: "secret" })).toEqual({});
  });
});

describe("signInView", () => {
  it("only completes on status 'complete'", () => {
    expect(
      signInView({ status: "complete", submitting: false, finalizing: false, rejected: false }),
    ).toEqual({
      submitting: false,
      complete: true,
      errorMessage: null,
      unsupportedMessage: null,
    });
  });

  it("keeps progress live when 'complete' arrives before the session is active", () => {
    for (const signals of [
      { status: "complete", submitting: true, finalizing: false, rejected: false },
      { status: "complete", submitting: false, finalizing: true, rejected: false },
    ]) {
      const view = signInView(signals);
      expect(view.submitting).toBe(true);
      expect(view.complete).toBe(true);
      expect(view.errorMessage).toBeNull();
      expect(view.unsupportedMessage).toBeNull();
    }
  });

  it("surfaces the fixed error when finalizing fails after 'complete' (AC-1.23)", () => {
    const view = signInView({
      status: "complete",
      submitting: false,
      finalizing: false,
      rejected: true,
    });
    expect(view.errorMessage).toBe(SIGN_IN_ERROR_MESSAGE);
    expect(view.complete).toBe(false);
    expect(view.submitting).toBe(false);
    expect(view.unsupportedMessage).toBeNull();
  });

  it("treats Device Trust and a second factor as unsupported (D-050, AC-1.24)", () => {
    for (const status of ["needs_client_trust", "needs_second_factor"]) {
      const view = signInView({ status, submitting: false, finalizing: false, rejected: false });
      expect(view.complete).toBe(false);
      expect(view.unsupportedMessage).toBe(SIGN_IN_UNSUPPORTED_MESSAGE);
      expect(view.errorMessage).toBeNull();
    }
  });

  it("treats a status added later as unsupported, never as signed in", () => {
    const view = signInView({
      status: "needs_something_new",
      submitting: false,
      finalizing: false,
      rejected: false,
    });
    expect(view.complete).toBe(false);
    expect(view.unsupportedMessage).toBe(SIGN_IN_UNSUPPORTED_MESSAGE);
  });

  it("shows one fixed message for a refusal (AC-1.23)", () => {
    for (const status of ["needs_first_factor", "needs_identifier", undefined]) {
      const view = signInView({ status, submitting: false, finalizing: false, rejected: true });
      expect(view.errorMessage).toBe(SIGN_IN_ERROR_MESSAGE);
      expect(view.unsupportedMessage).toBeNull();
    }
  });

  it("never surfaces provider text: extra fields on the input are ignored", () => {
    const providerText = "form_password_incorrect: Password is incorrect.";
    const signals: SignInSignals & { readonly providerMessage: string } = {
      status: "needs_first_factor",
      submitting: false,
      finalizing: false,
      rejected: true,
      providerMessage: providerText,
    };
    const view = signInView(signals);
    expect(view.errorMessage).toBe(SIGN_IN_ERROR_MESSAGE);
    expect(JSON.stringify(view)).not.toContain(providerText);
  });

  it("stays quiet while idle and reports progress while submitting", () => {
    expect(signInView(idle)).toEqual({
      submitting: false,
      complete: false,
      errorMessage: null,
      unsupportedMessage: null,
    });
    expect(signInView({ ...idle, submitting: true }).submitting).toBe(true);
    expect(signInView({ ...idle, submitting: true, finalizing: true }).submitting).toBe(true);
  });
});
