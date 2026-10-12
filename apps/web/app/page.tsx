"use client";

import { api } from "@parampara/backend/api";
import { Show, SignOutButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";

/**
 * Web sign-in proof. Signed-in state comes from Convex (Authenticated and
 * useConvexAuth), which means the Convex backend accepted the Clerk token, and the
 * name comes from the users.me query, not from Clerk's client-side user object.
 */
export default function HomePage() {
  return (
    <main>
      <h1>Parampara</h1>
      <AuthLoading>
        <p role="status">Checking your sign-in...</p>
      </AuthLoading>
      <Unauthenticated>
        <SignedOutView />
      </Unauthenticated>
      <Authenticated>
        <MyName />
        <SignOutButton />
      </Authenticated>
    </main>
  );
}

function SignedOutView() {
  return (
    <>
      <Show when="signed-out">
        <p>You are signed out.</p>
        <Link href="/sign-in" data-testid="sign-in-link">
          Sign in
        </Link>
      </Show>
      {/* Clerk has a session but Convex did not accept its token (for example the
          Convex integration is not set up). Offer sign-out rather than a sign-in
          link that would bounce straight back here. */}
      <Show when="signed-in">
        <p role="alert">Your sign-in could not be confirmed. Sign out and try again.</p>
        <SignOutButton />
      </Show>
    </>
  );
}

function MyName() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (me === undefined) {
    return <p role="status">Loading your name...</p>;
  }
  if (me === null) {
    return <p role="alert">Your sign-in could not be confirmed. Sign out and try again.</p>;
  }
  if (me.name === null) {
    return <p data-testid="my-name-missing">Your account has no display name yet.</p>;
  }
  return (
    <p>
      Signed in as <span data-testid="my-name">{me.name}</span>
    </p>
  );
}
