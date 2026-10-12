const PINNED = /@[0-9a-f]{40}(\s|$)/;

/**
 * Policy checks for a GitHub Actions workflow file, as plain text (no YAML dependency).
 * Returns a list of problems; an empty list means the workflow passes.
 */
export function checkWorkflow(text) {
  const problems = [];
  for (const line of text.split("\n")) {
    const match = /^\s*-?\s*uses:\s*(\S+)(.*)$/.exec(line);
    if (!match) continue;
    const ref = match[1] + match[2];
    if (match[1].startsWith("./")) continue;
    if (!PINNED.test(ref)) problems.push(`action not pinned by commit SHA: ${match[1]}`);
  }
  const topLevel = /^permissions:\n((?: {2}\S.*\n)+)/m.exec(text);
  if (!topLevel) {
    problems.push("missing top-level permissions block");
  } else if (topLevel[1].trim() !== "contents: read") {
    problems.push(
      `top-level permissions must be exactly "contents: read", found: ${topLevel[1].trim()}`,
    );
  }
  if (/^[ \t]+permissions:/m.test(text)) problems.push("job-level permissions are not allowed yet");
  if (/pull_request_target/.test(text)) problems.push("pull_request_target is not allowed");
  return problems;
}
