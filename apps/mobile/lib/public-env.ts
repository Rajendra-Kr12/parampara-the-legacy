/**
 * Validated public configuration for the app bundle.
 *
 * Expo inlines only EXPO_PUBLIC_* variables, and only when they are read as literal
 * `process.env.NAME` expressions, so each one is read here by name. Errors name the
 * variable, never its value. Secrets such as CLERK_SECRET_KEY or a Convex deploy key
 * must never be read here: anything the app reads ships inside the app.
 */
import { requirePublicUrl } from "@parampara/validation";

export const CONVEX_URL_NAME = "EXPO_PUBLIC_CONVEX_URL";
export const CLERK_PUBLISHABLE_KEY_NAME = "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY";

export interface PublicEnv {
  readonly convexUrl: string;
  readonly clerkPublishableKey: string;
}

export interface PublicEnvInput {
  readonly convexUrl: string | undefined;
  readonly clerkPublishableKey: string | undefined;
}

export type PublicEnvResult =
  | { readonly ok: true; readonly values: PublicEnv }
  | { readonly ok: false; readonly problems: readonly string[] };

const publishableKeyPattern = /^pk_(test|live)_[A-Za-z0-9+/=_-]+$/;

/** Returns `value` when it looks like a Clerk publishable key, otherwise throws. */
export function requireClerkPublishableKey(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set. Add it to the app's .env.local (see its .env.example).`);
  }
  if (!publishableKeyPattern.test(value)) {
    throw new Error(`${name} must be a Clerk publishable key (pk_test_ or pk_live_).`);
  }
  return value;
}

function problemOf(check: () => string): string | undefined {
  try {
    check();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid configuration.";
  }
}

/** Validates both public values and reports every problem at once. */
export function parsePublicEnv(input: PublicEnvInput): PublicEnvResult {
  const problems = [
    problemOf(() => requirePublicUrl(CONVEX_URL_NAME, input.convexUrl)),
    problemOf(() =>
      requireClerkPublishableKey(CLERK_PUBLISHABLE_KEY_NAME, input.clerkPublishableKey),
    ),
  ].filter((problem) => problem !== undefined);
  if (
    problems.length > 0 ||
    input.convexUrl === undefined ||
    input.clerkPublishableKey === undefined
  ) {
    return { ok: false, problems };
  }
  return {
    ok: true,
    values: { convexUrl: input.convexUrl, clerkPublishableKey: input.clerkPublishableKey },
  };
}

export function readPublicEnv(): PublicEnvResult {
  return parsePublicEnv({
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
}
