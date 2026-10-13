import { useAuth } from "@clerk/expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useState, type ReactNode } from "react";

/**
 * Connects Convex to the Clerk session: ConvexProviderWithClerk fetches the Clerk
 * token for the "convex" audience and Convex validates it server-side. Must render
 * inside ClerkProvider. The client is created on first render, not at import time,
 * mirroring apps/web. The short-lived Convex token stays in memory in this client.
 */
export function ConvexClientProvider({
  convexUrl,
  children,
}: {
  readonly convexUrl: string;
  readonly children: ReactNode;
}) {
  const [client] = useState(
    () => new ConvexReactClient(convexUrl, { unsavedChangesWarning: false }),
  );
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
