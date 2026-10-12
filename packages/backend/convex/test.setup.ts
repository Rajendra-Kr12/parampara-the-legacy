// Function modules for convex-test. Under pnpm's isolated installs convex-test cannot
// find convex/_generated on its own, so the modules are passed in explicitly. The
// negative pattern skips names with more than one dot (tests, this file,
// auth.config.ts, .d.ts files), the same files the Convex bundler skips. The
// extglob form in the convex-test docs matches nothing under Vite 8.
// See https://docs.convex.dev/testing/convex-test
export const modules = import.meta.glob(["./**/*.*s", "!./**/*.*.*"]);
