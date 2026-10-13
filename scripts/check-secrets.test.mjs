// Probes for the secrets gate. Fake secrets are assembled at runtime so this file does
// not contain anything the gate would flag in itself.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { isForbiddenEnvFile, scanText } from "./check-secrets.mjs";

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

test("the allow marker suppresses a reviewed line", () => {
  assert.deepEqual(scanText(`${fakes["AWS access key id"]} // secrets-gate:allow`), []);
});

test(".env files are forbidden except the committed templates", () => {
  for (const path of [".env", ".env.local", "apps/web/.env.production", "deploy/prod.env"]) {
    assert.equal(isForbiddenEnvFile(path), true, path);
  }
  for (const path of [
    ".env.example",
    "apps/web/.env.example",
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
