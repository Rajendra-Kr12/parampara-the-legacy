// Secrets gate: fails when a tracked (or, with --staged, a staged) file is a `.env*`
// file or contains an obvious secret. It reads blobs from the git index, so it checks
// what would be committed. Output names the file, line, and rule, never the matched text.
// To suppress a reviewed false positive, put `secrets-gate:allow` on the same line.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const MAX_BYTES = 1_000_000;
const ALLOW_MARKER = "secrets-gate:allow";
// Committed templates the repo already uses. Everything else named .env* is rejected.
const ENV_TEMPLATES = new Set([".env.example"]);

const ASSIGNED_NAME = String.raw`[A-Za-z0-9_.-]*(?:secret|token|passw(?:or)?d|passwd|api[_-]?key|private[_-]?key|access[_-]?key)[A-Za-z0-9_-]*`;
const PLACEHOLDER =
  /^(?:your|example|change[-_]?me|placeholder|dummy|fake|redacted|xxx|\*+|<|\$\{|\$\(|%|process\.env|import\.meta)/i;

/** Rules matched per line. `test` receives the line and returns true on a hit. */
export const CONTENT_RULES = [
  {
    name: "private key block",
    test: (line) => /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY(?: BLOCK)?-----/.test(line),
  },
  {
    name: "Clerk or Stripe secret key",
    test: (line) => /\b[sr]k_(?:live|test)_[A-Za-z0-9]{10,}/.test(line),
  },
  { name: "AWS access key id", test: (line) => /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/.test(line) },
  {
    name: "GitHub token",
    test: (line) => /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{22,})/.test(line),
  },
  { name: "Slack token", test: (line) => /\bxox[abprs]-[A-Za-z0-9-]{10,}/.test(line) },
  {
    // A quoted literal, or an unquoted value at the start of a line (`.env` and YAML style).
    name: "secret-looking assignment with a literal value",
    test: (line) => {
      const quoted = new RegExp(
        `${ASSIGNED_NAME}["']?\\s*[:=]\\s*["']([^"'\\s]{12,})["']`,
        "i",
      ).exec(line);
      const bare = new RegExp(
        `^\\s*(?:export\\s+)?${ASSIGNED_NAME}\\s*[:=]\\s*([A-Za-z0-9/+_=~-]{12,})\\s*(?:#.*)?$`,
        "i",
      ).exec(line);
      const value = quoted?.[1] ?? bare?.[1];
      if (value === undefined || PLACEHOLDER.test(value)) return false;
      return !/[({]/.test(value) && new Set(value).size > 3;
    },
  },
];

export function isForbiddenEnvFile(path) {
  const name = path.split("/").pop() ?? "";
  if (ENV_TEMPLATES.has(name)) return false;
  return name === ".env" || name.startsWith(".env.") || name.endsWith(".env");
}

/** Returns findings `{ line, rule }` for the text of one file. */
export function scanText(text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (const rule of CONTENT_RULES) {
      if (rule.test(line)) findings.push({ line: index + 1, rule: rule.name });
    }
  });
  return findings;
}

function git(args, options = {}) {
  return execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024, ...options });
}

function listFiles(staged) {
  const args = staged
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
    : ["ls-files", "-z"];
  return git(args, { encoding: "utf8" }).split("\0").filter(Boolean);
}

/** Checks the given paths against the index and returns `{ path, line?, rule }` findings. */
export function checkPaths(paths) {
  const findings = [];
  for (const path of paths) {
    if (isForbiddenEnvFile(path)) findings.push({ path, rule: ".env file must not be committed" });
    let blob;
    try {
      blob = git(["show", `:${path}`]);
    } catch {
      continue;
    }
    if (blob.length > MAX_BYTES || blob.includes(0)) continue;
    for (const finding of scanText(blob.toString("utf8"))) findings.push({ path, ...finding });
  }
  return findings;
}

function main(argv) {
  const findings = checkPaths(listFiles(argv.includes("--staged")));
  if (findings.length === 0) {
    console.log("check-secrets: no secrets or .env files found.");
    return 0;
  }
  for (const { path, line, rule } of findings) {
    console.error(`${path}${line === undefined ? "" : `:${line}`}: ${rule}`);
  }
  console.error(
    `check-secrets: ${findings.length} finding(s). Remove the secret (and rotate it if it was real).`,
  );
  return 1;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
