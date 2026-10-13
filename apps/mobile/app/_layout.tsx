import { ClerkProvider } from "@clerk/expo";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConfigError } from "../components/config-error";
import { ConvexClientProvider } from "../components/convex-client-provider";
import { deviceTokenCache } from "../lib/device-token-cache";
import { readPublicEnv } from "../lib/public-env";

const publicEnv = readPublicEnv();

/**
 * Clerk must wrap Convex so ConvexProviderWithClerk can read the session (D-038).
 * Clerk keeps its client token in the device-only secure store and its SDK
 * telemetry is off, as on web. The UI is light-only (app.json) until the shared
 * styling approach is chosen, so the dark status bar always sits on a light header.
 */
export default function RootLayout() {
  if (!publicEnv.ok) {
    return <ConfigError problems={publicEnv.problems} />;
  }
  return (
    <ClerkProvider
      publishableKey={publicEnv.values.clerkPublishableKey}
      tokenCache={deviceTokenCache}
      telemetry={false}
    >
      <ConvexClientProvider convexUrl={publicEnv.values.convexUrl}>
        <Stack screenOptions={{ title: "Parampara" }} />
        <StatusBar style="dark" />
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
