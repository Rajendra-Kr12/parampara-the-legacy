// Secrets gate: fails when a tracked (or, with --staged, a staged) file is a `.env*`
// file or contains an obvious secret. It reads blobs from the git index, so it checks
// what would be committed. Output names the file, line, and rule, never the matched text.
// To suppress a reviewed false positive, put `secrets-gate:allow` on the same line.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const UNREADABLE_RULE = "file could not be read, so it was not checked";
const ALLOW_MARKER = "secrets-gate:allow";
// Committed templates the repo already uses. Everything else named .env* is rejected.
const ENV_TEMPLATES = new Set([".env.example"]);
// Content scanning is skipped only for these extensions; every other file is scanned as text.
const BINARY_EXTENSIONS = new Set(
  (
    "png jpg jpeg gif webp avif bmp ico icns tif tiff heic heif psd " +
    "woff woff2 ttf otf eot " +
    "zip gz tgz bz2 xz zst 7z rar tar jar " +
    "mp3 wav ogg flac aac m4a mp4 mov webm avi mkv " +
    "pdf wasm so dylib dll exe bin class"
  ).split(" "),
);

// Affixes are length-bounded, and the unanchored quoted rule has no leading affix at all, so
// a huge single-line file cannot trigger quadratic backtracking.
const SECRET_WORD = String.raw`(?:secret|token|passw(?:or)?d|passwd|api[_-]?key|private[_-]?key|access[_-]?key)[A-Za-z0-9_-]{0,64}`;
const ASSIGNED_NAME = String.raw`[A-Za-z0-9_.-]{0,64}${SECRET_WORD}`;
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
    // A quoted literal (single, double or backtick), or an unquoted value at the start of a line (`.env` and YAML style).
    name: "secret-looking assignment with a literal value",
    test: (line) => {
      // Single, double or backtick quotes; the value may contain spaces (a passphrase) but no quote.
      const quoted = new RegExp(
        `${SECRET_WORD}["']?\\s*[:=]\\s*["'\`]([^"'\`]{12,200})["'\`]`,
        "gi",
      );
      const bare = new RegExp(
        `^\\s*(?:export\\s+)?${ASSIGNED_NAME}\\s*[:=]\\s*([A-Za-z0-9/+_=~-]{12,})\\s*(?:#.*)?$`,
        "i",
      ).exec(line);
      const values = [...line.matchAll(quoted)].map((match) => match[1]);
      if (bare !== null) values.push(bare[1]);
      return values.some(isLiteralSecretValue);
    },
  },
];

function isLiteralSecretValue(value) {
  if (PLACEHOLDER.test(value)) return false;
  // A value with spaces is a passphrase only if it is plain words; commands and paths are not.
  if (/\s/.test(value) && !/^[A-Za-z0-9 ,;:!?-]+$/.test(value)) return false;
  return !/[({]/.test(value) && new Set(value).size > 3;
}

function isBinaryPath(path) {
  const name = path.split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 && BINARY_EXTENSIONS.has(name.slice(dot + 1).toLowerCase());
}

export function isForbiddenEnvFile(path) {
  const name = (path.split("/").pop() ?? "").toLowerCase();
  if (ENV_TEMPLATES.has(name)) return false;
  return name.startsWith(".env") || name.endsWith(".env");
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
  return execFileSync("git", args, { maxBuffer: 512 * 1024 * 1024, ...options });
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
      findings.push({ path, rule: UNREADABLE_RULE });
      continue;
    }
    if (isBinaryPath(path)) continue;
    const text = blob.toString("utf8").replaceAll("\0", "");
    for (const finding of scanText(text)) findings.push({ path, ...finding });
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
