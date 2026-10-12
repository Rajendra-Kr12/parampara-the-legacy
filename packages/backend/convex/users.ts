import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * The signed-in caller's display name, read only from the verified identity.
 *
 * Returns null when signed out. Takes no arguments, so a client cannot ask for
 * another user. `name` is null when the identity token carries no name: a missing
 * name is reported as missing, not filled in from elsewhere.
 */
export const me = query({
  args: {},
  returns: v.union(v.null(), v.object({ name: v.union(v.string(), v.null()) })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return { name: identity.name ?? null };
  },
});
