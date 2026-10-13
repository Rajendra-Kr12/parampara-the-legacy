/**
 * Environment for the web sign-in proof. The proof needs the Clerk development
 * instance, the Convex dev deployment and a Clerk test user, none of which are
 * available in CI or to agents, so the Playwright tests skip with this message when
 * any value is missing. Only variable names are ever printed, never values.
 */

export const requiredE2eEnv = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CONVEX_URL",
  "E2E_CLERK_USER_USERNAME",
  "E2E_CLERK_USER_PASSWORD",
  "E2E_CLERK_USER_NAME",
] as const;

export type E2eEnvName = (typeof requiredE2eEnv)[number];
export type E2eEnv = Readonly<Record<E2eEnvName, string>>;

export type E2eEnvResult =
  | { readonly ok: true; readonly values: E2eEnv }
  | { readonly ok: false; readonly missing: readonly E2eEnvName[] };

export function readE2eEnv(env: Readonly<Record<string, string | undefined>>): E2eEnvResult {
  const missing = requiredE2eEnv.filter((name) => (env[name] ?? "").trim() === "");
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  const values = Object.fromEntries(requiredE2eEnv.map((name) => [name, env[name] ?? ""]));
  return { ok: true, values: values as E2eEnv };
}

export function skipMessage(missing: readonly E2eEnvName[]): string {
  return [
    `NOT RUN: web sign-in proof skipped, this is not a pass: missing ${missing.join(", ")}.`,
    "Put the Clerk development keys, the Convex dev URL and the Clerk test user in",
    "apps/web/.env.local (see apps/web/.env.example), then run",
    "`pnpm --filter @parampara/web exec playwright install chromium` once and",
    "`pnpm --filter @parampara/web test:e2e`.",
  ].join(" ");
}
