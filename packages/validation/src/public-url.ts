/**
 * Validation for public client configuration that both apps share (web and mobile
 * read the Convex URL through this). Errors name the variable, never its value, so a
 * misconfigured build cannot leak whatever was put in the variable.
 */

const localHosts = new Set(["localhost", "127.0.0.1"]);

// An http or https origin only, for example https://example-123.convex.cloud. A single
// trailing slash is allowed, and a port must be 1 to 65535 without leading zeros;
// any other path, query, fragment, or user info is rejected. Checked by pattern rather than `new URL`, as in packages/backend, so the
// browser, Node and React Native give the same answer (React Native's built-in URL
// accepts malformed input) and the shared ES2023 tsconfig needs no DOM types.
const origin = /^(https?):\/\/([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*)(?::([1-9]\d{0,4}))?\/?$/;
const maxPort = 65535;

/** Returns `value` when it is an https origin (or http on localhost), otherwise throws. */
export function requirePublicUrl(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set. Add it to the app's .env.local (see its .env.example).`);
  }
  const match = origin.exec(value);
  if (match === null) {
    throw new Error(`${name} is not a valid URL.`);
  }
  const [, scheme, host = "", port] = match;
  if (port !== undefined && Number(port) > maxPort) {
    throw new Error(`${name} is not a valid URL.`);
  }
  const isLocalHttp = scheme === "http" && localHosts.has(host);
  if (scheme !== "https" && !isLocalHttp) {
    throw new Error(`${name} must be an https URL.`);
  }
  return value;
}
