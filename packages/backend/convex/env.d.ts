// Convex functions read deployment environment variables through process.env.
// Declared here instead of adding @types/node, because the default Convex runtime
// is not Node.js and must not appear to offer Node APIs.
declare const process: {
  readonly env: Readonly<Record<string, string | undefined>>;
};
