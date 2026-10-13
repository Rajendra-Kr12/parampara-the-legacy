// Probes for the secrets gate. Fake secrets are assembled at runtime so this file does
// not contain anything the gate would flag in itself.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkPaths, isForbiddenEnvFile, scanText } from "./check-secrets.mjs";

const script = fileURLToPath(new URL("./check-secrets.mjs", import.meta.url));
const filler = (length) => "aB3dE5gH7kLm".repeat(length).slice(0, length);

const fakes = {
  "private key block": ["-----BEGIN RSA ", "PRIVATE KEY-----"].join(""),
  "Clerk or Stripe secret key": `const k = "${["sk", "test", filler(24)].join("_")}";`,
  "AWS access key id": ["AK", "IA", "ABCDEFGHIJKLMNOP"].join(""),
  "GitHub token": ["gh", "p_", filler(36)].join(""),
  "Slack token": ["xox", "b-", filler(24)].join(""),
  "secret-looking assignment with a literal value": `api_${"key"} = "${filler(24)}"`,
};

test("each content rule flags a fake secret", () => {
  for (const [rule, text] of Object.entries(fakes)) {
    assert.deepEqual(
      scanText(text).map((finding) => finding.rule),
      [rule],
      rule,
    );
  }
});

test("bare assignments are flagged at the start of a line only", () => {
  assert.equal(scanText(`CLERK_${"SECRET"}_KEY=${filler(30)}`).length, 1);
  assert.equal(scanText(`export DB_${"PASSWORD"}=${filler(16)} # local`).length, 1);
  assert.equal(scanText(`const note = "set ${"token"}=${filler(20)} first";`).length, 0);
});

test("ordinary code, placeholders and empty template values pass", () => {
  for (const text of [
    "AI_GATEWAY_API_KEY=",
    "CLERK_SECRET_KEY=your_clerk_secret_key",
    'const secret = process.env.CLERK_SECRET_KEY ?? "";',
    "password: env.values.E2E_CLERK_USER_PASSWORD,",
    "token: string;",
    "const token = await getToken({ template: 'convex' });",
    `${"secret"}: "<redacted>"`,
    "Document the password reset flow copy.",
  ]) {
    assert.deepEqual(scanText(text), [], text);
  }
});

test("every secret-looking assignment on a line is checked, not only the first", () => {
  const placeholderFirst = `{"${"token"}":"<your-api-key>","${"password"}":"${filler(16)}"}`;
  assert.equal(scanText(placeholderFirst).length, 1);
  const bothPlaceholders = `{"${"token"}":"<your-api-key>","${"password"}":"<redacted-value>"}`;
  assert.deepEqual(scanText(bothPlaceholders), []);
});

test("quoted values containing spaces are flagged, prose-like placeholders are not", () => {
  assert.equal(scanText(`${"pass"}${"word"} = "correct horse battery staple"`).length, 1);
  assert.deepEqual(scanText(`${"pass"}${"word"} = "your password goes here"`), []);
  assert.deepEqual(scanText('"check:secrets": "node scripts/check-secrets.mjs"'), []);
});

test("backtick strings are flagged unless they interpolate", () => {
  assert.equal(scanText(`const api_${"key"} = \`${filler(24)}\`;`).length, 1);
  assert.deepEqual(scanText(`const api_${"key"} = \`\${prefix}-\${suffix}-value\`;`), []);
});

test("the allow marker suppresses a reviewed line", () => {
  assert.deepEqual(scanText(`${fakes["AWS access key id"]} // secrets-gate:allow`), []);
});

test(".env files are forbidden except the committed templates", () => {
  for (const path of [
    ".env",
    ".env.local",
    "apps/web/.env.production",
    "deploy/prod.env",
    ".env-production",
    ".env_secret",
    "apps/web/.envrc",
    ".env.example.bak",
    ".ENV",
    ".Env.local",
    "Prod.ENV",
  ]) {
    assert.equal(isForbiddenEnvFile(path), true, path);
  }
  for (const path of [
    ".env.example",
    "apps/web/.env.example",
    ".ENV.EXAMPLE",
    "docs/env.md",
    "packages/backend/convex/lib/env.ts",
  ]) {
    assert.equal(isForbiddenEnvFile(path), false, path);
  }
});

function withRepo(run) {
  const dir = mkdtempSync(join(tmpdir(), "check-secrets-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    run({
      dir,
      stage(path, content) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), content);
        execFileSync("git", ["add", "-f", path], { cwd: dir });
      },
      gate(...args) {
        return spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });
      },
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("end to end: clean tree passes, a staged .env.local and a staged fake key fail", () => {
  withRepo(({ dir, stage, gate }) => {
    stage("README.md", "# Clean\n");
    stage(".env.example", "AI_GATEWAY_API_KEY=\n");
    assert.equal(gate().status, 0);
    assert.equal(gate("--staged").status, 0);

    stage(".env.local", "AI_GATEWAY_API_KEY=\n");
    const envResult = gate("--staged");
    assert.equal(envResult.status, 1);
    assert.match(envResult.stderr, /\.env\.local: \.env file must not be committed/);
    execFileSync("git", ["rm", "-q", "-f", "--cached", ".env.local"], { cwd: dir });
  });

  withRepo(({ stage, gate }) => {
    stage("src/config.ts", `${fakes["Clerk or Stripe secret key"]}\n`);
    for (const args of [[], ["--staged"]]) {
      const result = gate(...args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /src\/config\.ts:1: Clerk or Stripe secret key/);
      assert.ok(!result.stderr.includes(filler(24)), "the secret value is never printed");
    }
  });
});

test("--staged ignores committed files that are not part of the change", () => {
  withRepo(({ dir, stage, gate }) => {
    stage("old.txt", `${fakes["AWS access key id"]}\n`);
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@example.test", "commit", "-q", "-m", "x"],
      { cwd: dir },
    );
    assert.equal(gate().status, 1);
    assert.equal(gate("--staged").status, 0);
  });
});

test("a file over the old size cap is still scanned", () => {
  withRepo(({ stage, gate }) => {
    const padding = `${"// padding line of ordinary text\n".repeat(40_000)}`;
    assert.ok(padding.length > 1_000_000);
    stage("big.ts", `${padding}${fakes["AWS access key id"]}\n`);
    const result = gate();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /big\.ts:40001: AWS access key id/);
  });
});

test("a file that cannot be read fails the gate instead of being skipped", () => {
  const findings = checkPaths(["definitely/not/staged.txt"]);
  assert.deepEqual(findings, [
    { path: "definitely/not/staged.txt", rule: "file could not be read, so it was not checked" },
  ]);
});

test("very long lines are scanned in linear time and still flag a secret at the end", () => {
  for (const unit of ["a", "secret_", "token "]) {
    const started = Date.now();
    assert.deepEqual(scanText(unit.repeat(2_000_000 / unit.length)), [], unit);
    assert.ok(Date.now() - started < 5_000, `scan of repeated ${unit} was too slow`);
  }
  const line = `${"x".repeat(2_000_000)} ${fakes["AWS access key id"]}`;
  assert.equal(scanText(line).length, 1);
});

test("NUL bytes do not hide a secret in a text file, but binary extensions are skipped", () => {
  withRepo(({ stage, gate }) => {
    stage("src/config.ts", `\0${fakes["AWS access key id"]}\n`);
    const result = gate();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /src\/config\.ts:1: AWS access key id/);
  });

  withRepo(({ stage, gate }) => {
    stage("assets/logo.png", `\0${fakes["AWS access key id"]}\n`);
    assert.equal(gate().status, 0);
  });
});
