import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { signInView, validateSignInFields, type SignInFieldErrors } from "../lib/sign-in-state";

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

  const rejected =
    attemptFailed ||
    errors.fields.identifier !== null ||
    errors.fields.password !== null ||
    errors.fields.code !== null ||
    (errors.global?.length ?? 0) > 0;

  useEffect(() => {
    if (signIn.status !== "needs_identifier") {
      void signIn.reset();
    }
  }, []);

  const view = signInView({
    status: signIn.status,
    submitting: fetchStatus === "fetching",
    finalizing,
    rejected,
  });

  async function submit() {
    const problems = validateSignInFields({ emailAddress, password });
    setFieldErrors(problems);
    setAttemptFailed(false);
    if (problems.emailAddress !== undefined || problems.password !== undefined) {
      return;
    }
    if (signIn.status !== "needs_identifier") {
      await signIn.reset();
    }
    const result = await signIn.password({ emailAddress, password });
    if (result.error !== null) {
      setAttemptFailed(true);
      return;
    }
    if (signIn.status === "complete") {
      // Clerk reports `complete` before the session is active, so keep the progress
      // state live through `finalize()` and surface a finalize failure with the same
      // fixed error. On success `finalize` navigates away, so leave `finalizing` set.
      setFinalizing(true);
      const finalized = await signIn.finalize({
        navigate: () => {
          router.replace("/");
        },
      });
      if (finalized.error !== null) {
        setAttemptFailed(true);
        setFinalizing(false);
      }
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
