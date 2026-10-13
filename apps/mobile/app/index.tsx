import { api } from "@parampara/backend/api";
import { Show, useClerk } from "@clerk/expo";
import { Authenticated, AuthLoading, Unauthenticated, useConvexAuth, useQuery } from "convex/react";
import { Button, StyleSheet, Text, View } from "react-native";

/**
 * Mobile home screen, the same three states as apps/web/app/page.tsx. Signed-in
 * state comes from Convex (Authenticated and useConvexAuth), which means the Convex
 * backend accepted the Clerk token, and the name comes from the users.me query, not
 * from Clerk's client-side user object. Test IDs match web's data-testid values.
 * Step 4a has no sign-in screen; Step 4b adds it and the sign-in link.
 */
export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <Text accessibilityLiveRegion="polite">Checking your sign-in...</Text>
      </AuthLoading>
      <Unauthenticated>
        <SignedOutView />
      </Unauthenticated>
      <Authenticated>
        <MyName />
        <SignOut />
      </Authenticated>
    </View>
  );
}

function SignedOutView() {
  return (
    <>
      <Show when="signed-out">
        <Text testID="signed-out">You are signed out.</Text>
      </Show>
      {/* Clerk has a session but Convex did not accept its token. Offer sign-out
          rather than a sign-in entry that would bounce straight back here. */}
      <Show when="signed-in">
        <Text accessibilityRole="alert">
          Your sign-in could not be confirmed. Sign out and try again.
        </Text>
        <SignOut />
      </Show>
    </>
  );
}

function MyName() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (me === undefined) {
    return <Text accessibilityLiveRegion="polite">Loading your name...</Text>;
  }
  if (me === null) {
    return (
      <Text accessibilityRole="alert">
        Your sign-in could not be confirmed. Sign out and try again.
      </Text>
    );
  }
  if (me.name === null) {
    return <Text testID="my-name-missing">Your account has no display name yet.</Text>;
  }
  return (
    <Text>
      Signed in as <Text testID="my-name">{me.name}</Text>
    </Text>
  );
}

function SignOut() {
  const { signOut } = useClerk();
  return (
    <Button
      title="Sign out"
      testID="sign-out"
      onPress={() => {
        void signOut();
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
});
