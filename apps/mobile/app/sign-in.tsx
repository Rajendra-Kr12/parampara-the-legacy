import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  normalizeEmail,
  signInView,
  validateSignInFields,
  type SignInFieldErrors,
} from "../lib/sign-in-state";
import { clearStaleAttempt, createSubmitGuard, submitSignIn } from "../lib/submit-sign-in";

/**
 * Email and password sign-in (Step 4b; scope D-050). A custom Clerk Core 3 flow, not
 * the prebuilt UI, so it behaves the same on iOS and Android and shares web's test
 * IDs. The screen never decides that the user is signed in: it finalizes the session
 * only when Clerk reports status `complete`, and the home screen's Convex
 * `Authenticated` state decides from there. Device Trust, MFA and any other
 * unsupported step show one fixed message; Clerk's error text is never rendered
 * (lib/sign-in-state.ts).
 */
export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const guard = useRef(createSubmitGuard()).current;

  const rejected =
    attemptFailed ||
    errors.fields.identifier !== null ||
    errors.fields.password !== null ||
    errors.fields.code !== null ||
    (errors.global?.length ?? 0) > 0;

  // Mount only: clears a stale attempt left from an earlier visit, never one in progress.
  useEffect(() => {
    if (signIn.status !== "needs_identifier") {
      void clearStaleAttempt(() => signIn.reset());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = signInView({
    status: signIn.status,
    submitting: fetchStatus === "fetching",
    finalizing,
    rejected,
  });

  async function submit() {
    // The lock is taken before any await, so a second quick tap is ignored outright.
    const outcome = await guard.run(async () => {
      const problems = validateSignInFields({ emailAddress, password });
      setFieldErrors(problems);
      setAttemptFailed(false);
      if (problems.emailAddress !== undefined || problems.password !== undefined) {
        return "pending";
      }
      // Clerk reports `complete` before the session is active, so keep the progress state
      // live through `finalize()`. A refusal or a thrown failure shows the same fixed error
      // and unlocks the form; on success `finalize` navigates away, so `finalizing` stays set.
      return submitSignIn({
        resetIfNeeded: () =>
          signIn.status === "needs_identifier" ? Promise.resolve({ error: null }) : signIn.reset(),
        submitPassword: () =>
          signIn.password({ emailAddress: normalizeEmail(emailAddress), password }),
        readStatus: () => signIn.status,
        beginFinalizing: () => {
          setFinalizing(true);
        },
        finalize: () =>
          signIn.finalize({
            navigate: () => {
              router.replace("/");
            },
          }),
      });
    });
    if (outcome === "failed") {
      setAttemptFailed(true);
      setFinalizing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        Sign in
      </Text>
      {view.unsupportedMessage === null ? null : (
        <Text accessibilityRole="alert" testID="sign-in-unsupported">
          {view.unsupportedMessage}
        </Text>
      )}
      {view.errorMessage === null ? null : (
        <Text accessibilityRole="alert" testID="sign-in-error">
          {view.errorMessage}
        </Text>
      )}
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!view.submitting}
        inputMode="email"
        onChangeText={setEmailAddress}
        placeholder="Email address"
        testID="sign-in-email"
        value={emailAddress}
      />
      {fieldErrors.emailAddress === undefined ? null : (
        <Text testID="sign-in-email-error">{fieldErrors.emailAddress}</Text>
      )}
      <TextInput
        autoCapitalize="none"
        autoComplete="current-password"
        editable={!view.submitting}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        testID="sign-in-password"
        value={password}
      />
      {fieldErrors.password === undefined ? null : (
        <Text testID="sign-in-password-error">{fieldErrors.password}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={view.submitting}
        onPress={() => {
          void submit();
        }}
        style={styles.button}
        testID="sign-in-submit"
      >
        {view.submitting ? <ActivityIndicator /> : <Text style={styles.buttonText}>Sign in</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "600" },
  button: {
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 14,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
