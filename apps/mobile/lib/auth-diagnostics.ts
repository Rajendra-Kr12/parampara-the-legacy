/**
 * Temporary device-proof diagnostics (enabled only when EXPO_PUBLIC_AUTH_DIAGNOSTICS=1,
 * which only the mobile-e2e workflow sets). Records non-identifying facts about why the
 * home screen might stay on "Checking your sign-in...": token cache outcomes and
 * error class names/messages. Never tokens, keys, URLs, emails, or ids.
 */
import { useSyncExternalStore } from "react";

export const authDiagnosticsEnabled = process.env.EXPO_PUBLIC_AUTH_DIAGNOSTICS === "1";

let lines: readonly string[] = [];
const listeners = new Set<() => void>();

export function recordDiagnostic(line: string): void {
  if (!authDiagnosticsEnabled) return;
  lines = [...lines.slice(-7), line];
  console.log(`[auth-diag] ${line}`);
  listeners.forEach((listener) => listener());
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 200);
  return "non-Error thrown";
}

export function useDiagnosticLines(): readonly string[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => lines,
  );
}
