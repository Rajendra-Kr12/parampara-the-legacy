import { useAuth } from "@clerk/expo";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";
import { Text } from "react-native";
import {
  authDiagnosticsEnabled,
  recordDiagnostic,
  useDiagnosticLines,
} from "../lib/auth-diagnostics";

/** Renders and logs Clerk/Convex auth state names for the device proof. Off by default. */
export function AuthDiagnostics() {
  if (!authDiagnosticsEnabled) return null;
  return <AuthDiagnosticsLines />;
}

function AuthDiagnosticsLines() {
  const clerk = useAuth();
  const convex = useConvexAuth();
  const started = useRef(Date.now());
  const state = `clerkLoaded=${clerk.isLoaded} clerkSignedIn=${String(clerk.isSignedIn)} convexLoading=${convex.isLoading} convexAuthed=${convex.isAuthenticated}`;
  useEffect(() => {
    recordDiagnostic(`t+${Math.round((Date.now() - started.current) / 1000)}s ${state}`);
  }, [state]);
  const lines = useDiagnosticLines();
  return (
    <Text testID="auth-diagnostics" style={{ fontSize: 10 }}>
      {[state, ...lines].join("\n")}
    </Text>
  );
}
