import type { AuthConfig } from "convex/server";
import { requireHttpsUrl } from "./lib/env";

// Clerk issues the JWTs (the "convex" JWT template or Clerk's Convex integration).
// Set CLERK_JWT_ISSUER_DOMAIN to the Clerk Frontend API URL in the Convex dashboard.
// See https://docs.convex.dev/auth/clerk
export default {
  providers: [
    {
      domain: requireHttpsUrl("CLERK_JWT_ISSUER_DOMAIN", process.env.CLERK_JWT_ISSUER_DOMAIN),
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
