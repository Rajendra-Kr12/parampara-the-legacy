/**
 * Validated public configuration for the browser bundle.
 *
 * Next.js inlines only NEXT_PUBLIC_* variables into client code, and only when they
 * are read as literal `process.env.NAME` expressions, so each one is read here by
 * name. Validation is shared with the mobile app through @parampara/validation, and
 * errors name the variable, never its value. Server-only secrets such as
 * CLERK_SECRET_KEY must never be read from this module.
 */
import { requirePublicUrl } from "@parampara/validation";

export function convexUrl(): string {
  return requirePublicUrl("NEXT_PUBLIC_CONVEX_URL", process.env.NEXT_PUBLIC_CONVEX_URL);
}
