/**
 * Validated public configuration for the browser bundle.
 *
 * Next.js inlines only NEXT_PUBLIC_* variables into client code, and only when they
 * are read as literal `process.env.NAME` expressions, so each one is read here by
 * name. Errors name the variable, never its value. Server-only secrets such as
 * CLERK_SECRET_KEY must never be read from this module.
 */

const localHosts = new Set(["localhost", "127.0.0.1"]);

/** Returns `value` when it is an https URL (or http on localhost), otherwise throws. */
export function requirePublicUrl(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set. Add it to apps/web/.env.local (see .env.example).`);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL.`);
  }
  const isLocalHttp = url.protocol === "http:" && localHosts.has(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error(`${name} must be an https URL.`);
  }
  return value;
}

export function convexUrl(): string {
  return requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", process.env.NEXT_PUBLIC_CONVEX_URL);
}
