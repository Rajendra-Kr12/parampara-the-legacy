// The mobile `build` (run by CI) and gates 5 and 6 of `pnpm --filter @parampara/mobile run check`.
// Exports the iOS and Android bundles with synthetic values only, then proves that
// both bundles exist, that a server-only secret sentinel appears nowhere in the
// output, and that the public Convex URL sentinel was inlined. Needs no keys, no
// network and no device. Real `.env*` files are never loaded (EXPO_NO_DOTENV).
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("..", import.meta.url));
const platforms = ["ios", "android"];
const nonce = randomBytes(6).toString("hex");
const secretSentinel = `sk_test_parampara_secret_sentinel_${nonce}`;
const publicSentinel = `https://parampara-public-sentinel-${nonce}.convex.cloud`;

const results = [];
const report = (ok, label) => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
};

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

const outDir = mkdtempSync(join(tmpdir(), "parampara-mobile-export-"));
try {
  const exported = spawnSync(
    join(appDir, "node_modules", ".bin", "expo"),
    // --clear: Metro's transform cache can keep an earlier run's inlined EXPO_PUBLIC_*
    // values, which would make the sentinel checks below pass or fail by accident.
    ["export", ...platforms.flatMap((p) => ["--platform", p]), "--output-dir", outDir, "--clear"],
    {
      cwd: appDir,
      stdio: ["ignore", "ignore", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "1",
        EXPO_NO_DOTENV: "1",
        EXPO_NO_TELEMETRY: "1",
        CLERK_SECRET_KEY: secretSentinel,
        EXPO_PUBLIC_CONVEX_URL: publicSentinel,
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_cGFyYW1wYXJhLXN5bnRoZXRpYy5pbnZhbGlkJA",
      },
    },
  );
  if (exported.status !== 0) {
    console.error(exported.stderr.split(secretSentinel).join("<secret sentinel>"));
    report(false, "expo export (see the error above)");
  } else {
    const metadataPath = join(outDir, "metadata.json");
    const metadata = existsSync(metadataPath)
      ? JSON.parse(readFileSync(metadataPath, "utf8"))
      : { fileMetadata: {} };
    for (const platform of platforms) {
      const bundle = metadata.fileMetadata?.[platform]?.bundle;
      report(typeof bundle === "string" && existsSync(join(outDir, bundle)), platform);
    }
    const files = filesUnder(outDir);
    const contains = (needle) =>
      files.some((file) => readFileSync(file).includes(Buffer.from(needle, "utf8")));
    report(files.length > 0 && !contains(secretSentinel), "no secret");
    report(contains(publicSentinel), "public inlined");
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

process.exitCode = results.length > 0 && results.every(Boolean) ? 0 : 1;
