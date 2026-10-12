import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "Parampara",
  description: "A private family legacy network.",
  // Private network: keep every page out of search engines.
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Render every page per request: pages depend on the caller's session, and
  // nothing is prerendered at build time, so `next build` needs no keys.
  await connection();
  return (
    <html lang="en">
      <body>
        {/* Clerk must wrap Convex so ConvexProviderWithClerk can read the session.
            Clerk's browser SDK telemetry (sent for development instances) is off;
            NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED=1 also turns off the server side. */}
        <ClerkProvider telemetry={false} signInUrl="/sign-in" signInFallbackRedirectUrl="/">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
