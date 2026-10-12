"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState, type ReactNode } from "react";
import { convexUrl } from "../lib/public-env";

/**
 * Connects Convex to the Clerk session: ConvexProviderWithClerk fetches the Clerk
 * token for the "convex" audience and Convex validates it server-side. Must render
 * inside ClerkProvider. The client is created on first render, not at import time,
 * so a missing NEXT_PUBLIC_CONVEX_URL fails the request with a named error instead
 * of breaking `next build`.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(convexUrl()));
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
