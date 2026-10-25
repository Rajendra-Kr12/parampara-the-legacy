// Identifiers are opaque strings issued by the backend. The domain only compares them.

/** A signed-in account (one per verified identity). */
export type AccountId = string;
/** A canonical person record: one per real individual. */
export type PersonId = string;
/** A family group, the unit of membership and access. */
export type GroupId = string;
/** An invitation into a family group. */
export type InvitationId = string;
