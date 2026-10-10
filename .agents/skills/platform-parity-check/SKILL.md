---
name: platform-parity-check
description: Verify a Parampara change behaves consistently on web (Next.js), iOS, and Android (Expo). Use before merging any change to apps/web, apps/mobile, shared UI, navigation, auth flows, media upload or playback, or shared packages used by clients.
---

# Platform parity check

1. List the user-visible behaviors the change affects and the platforms each should reach. The default is all three; any deliberate gap must be written in the PR and `docs/scope.md`.
2. Shared logic: business rules and validation come from `packages/domain`, `packages/kinship-engine`, and `packages/validation`, never duplicated in an app.
3. Data: both apps call the same Convex functions through the generated `api`; no platform-specific backdoors.
4. Auth: sign-in, sign-out, and session restore work on web and both mobile platforms (Clerk custom screens on native; tokens in secure storage on mobile).
5. Media: upload, resize, playback, and permission prompts (camera, photos, microphone) work on iOS and Android; web handles the same file types.
6. Text: Telugu and other native scripts render and sort correctly; long names wrap; kinship labels match across platforms.
7. Accessibility: screen reader labels, focus order, contrast, touch target size, reduced motion, keyboard use on web.
8. Offline and poor network: loading, error, and retry states are present and do not leak private data.
9. Run the automated checks that exist (web e2e, mobile e2e, unit). Record manual checks per platform, including device or simulator and OS version, and list any platform not checked.
10. Be picky: flag anything that looks off on any platform, even if unrelated to the current change.
