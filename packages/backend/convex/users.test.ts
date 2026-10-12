import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";
import * as users from "./users";

// Synthetic identities only. tokenIdentifier is "<issuer>|<subject>", as Convex
// builds it from a verified Clerk JWT.
const issuer = "https://synthetic-test.clerk.accounts.dev";
const ravi = {
  issuer,
  subject: "user_ravi_test",
  tokenIdentifier: `${issuer}|user_ravi_test`,
  name: "Ravi Test",
};
const sita = {
  issuer,
  subject: "user_sita_test",
  tokenIdentifier: `${issuer}|user_sita_test`,
  name: "Sita Test",
};

function setup() {
  return convexTest(schema, modules);
}

describe("users.me", () => {
  it("returns null when signed out", async () => {
    const t = setup();
    expect(await t.query(api.users.me, {})).toBeNull();
  });

  it("returns the signed-in caller's name from the verified identity", async () => {
    const t = setup();
    expect(await t.withIdentity(ravi).query(api.users.me, {})).toEqual({ name: "Ravi Test" });
  });

  it("reports a missing name as null instead of inventing one", async () => {
    const t = setup();
    const nameless = { issuer, subject: ravi.subject, tokenIdentifier: ravi.tokenIdentifier };
    expect(await t.withIdentity(nameless).query(api.users.me, {})).toEqual({ name: null });
  });
});

describe("users.me authorization", () => {
  it("never returns another user's record", async () => {
    const t = setup();
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { tokenIdentifier: ravi.tokenIdentifier, name: ravi.name });
      await ctx.db.insert("users", { tokenIdentifier: sita.tokenIdentifier, name: sita.name });
    });

    expect(await t.withIdentity(sita).query(api.users.me, {})).toEqual({ name: "Sita Test" });
    expect(await t.withIdentity(ravi).query(api.users.me, {})).toEqual({ name: "Ravi Test" });

    // Same subject, but issued by a different issuer: a different user, so Ravi's
    // stored record must not be returned.
    const impostor = {
      issuer: "https://attacker.example",
      subject: ravi.subject,
      tokenIdentifier: `https://attacker.example|${ravi.subject}`,
    };
    expect(await t.withIdentity(impostor).query(api.users.me, {})).toEqual({ name: null });
  });

  it("rejects a caller who names another user in the arguments", async () => {
    const t = setup();
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { tokenIdentifier: ravi.tokenIdentifier, name: ravi.name });
    });
    const asSita = t.withIdentity(sita);
    // The cast is the attack: a client bypassing the generated types to pass a target.
    const forged = { tokenIdentifier: ravi.tokenIdentifier } as unknown as Record<string, never>;
    await expect(asSita.query(api.users.me, forged)).rejects.toThrow(/Validator error/);
  });

  it("does not let a signed-out caller read any record", async () => {
    const t = setup();
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { tokenIdentifier: ravi.tokenIdentifier, name: ravi.name });
    });
    expect(await t.query(api.users.me, {})).toBeNull();
  });

  it("exposes no public function other than me", () => {
    // A new public function here must bring its own signed-out and wrong-user tests.
    expect(Object.keys(users)).toEqual(["me"]);
  });
});
