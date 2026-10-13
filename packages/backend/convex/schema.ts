import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Account display data only. Family data (people, relationships, stories, media)
// belongs in separate tables with their own authorization rules; never add it here.
export default defineSchema({
  users: defineTable({
    // Clerk-issued identity from ctx.auth (issuer plus subject). Never taken from
    // client arguments. Access rules for this table: docs/privacy-and-governance.md.
    tokenIdentifier: v.string(),
    // Display name from the verified identity; null when the token has no name.
    name: v.union(v.string(), v.null()),
  }).index("by_token_identifier", ["tokenIdentifier"]),
});
