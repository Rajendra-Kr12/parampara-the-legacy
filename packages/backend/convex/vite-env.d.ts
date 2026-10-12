// The one Vite API the tests use (import.meta.glob, in test.setup.ts), declared here
// instead of adding vite as a direct dependency. tsconfig.build.json excludes this
// file, so production Convex code cannot type-check against it.
interface ImportMeta {
  glob(patterns: string | readonly string[]): Record<string, () => Promise<unknown>>;
}
