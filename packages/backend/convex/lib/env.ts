/**
 * Validated reads of Convex deployment environment variables.
 *
 * Error messages name the variable but never include its value, so a misconfigured
 * deployment cannot leak configuration into logs or client-visible errors.
 */

// An https origin with an optional path, for example the Clerk Frontend API URL
// https://example-name-00.clerk.accounts.dev. Checked by pattern because the shared
// tsconfig targets plain ES2023 without the DOM URL type.
const httpsUrl = /^https:\/\/[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(:\d{1,5})?(\/[^\s]*)?$/;

export function requireHttpsUrl(name: string, value: string | undefined): string {
  const fix = `Set ${name} to an https URL in the Convex deployment environment variables.`;
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set. ${fix}`);
  }
  if (!httpsUrl.test(value)) {
    throw new Error(`${name} is not a valid https URL. ${fix}`);
  }
  return value;
}
