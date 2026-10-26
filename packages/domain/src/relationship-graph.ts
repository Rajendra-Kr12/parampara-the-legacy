/**
 * Stated relationships and the graph rules that guard them (D-058, AC-2.29, AC-2.30).
 * A statement is made between the two parties of an invitation and only becomes a
 * record, either a typed edge or a `kin_stated` record, when the other party accepts it.
 */
import type { AccountId, InvitationId, PersonId } from "./ids";
import {
  isDirectTermCode,
  type DirectTermCode,
  type KinStatedTermCode,
  type TermCode,
} from "./relationship-terms";

/** The two parties of an invitation. Anyone else is a third party. */
export type Party = "inviter" | "invitee";

export function otherParty(party: Party): Party {
  return party === "inviter" ? "invitee" : "inviter";
}

/** "`subject` is the `term` of the other party", stated by `statedBy`. */
export interface StatedRelationship {
  readonly term: TermCode;
  readonly subject: Party;
  readonly statedBy: Party;
}

export type RelationshipState = "pending" | "accepted" | "rejected" | "expired";

const relationshipTransitions: Readonly<Record<RelationshipState, readonly RelationshipState[]>> = {
  pending: ["accepted", "rejected", "expired"],
  // Changing an accepted relationship is a Feature 5 claim, never a direct transition.
  accepted: [],
  rejected: [],
  expired: [],
};

export function canTransitionRelationship(from: RelationshipState, to: RelationshipState): boolean {
  return relationshipTransitions[from].includes(to);
}

/** A typed edge. Parent-child is one directed type; partner is unordered. */
export type DirectEdge =
  | {
      readonly type: "parent_child";
      readonly parentPersonId: PersonId;
      readonly childPersonId: PersonId;
    }
  | { readonly type: "partner"; readonly personIds: readonly [PersonId, PersonId] };

interface Provenance {
  readonly statingActorId: AccountId;
  readonly invitationId: InvitationId;
}

/** What accepting a statement writes, always with relationship state `accepted`. */
export type AcceptedRelationship =
  | (Provenance & { readonly form: "edge"; readonly state: "accepted"; readonly edge: DirectEdge })
  | (Provenance & {
      readonly form: "kin_stated";
      readonly state: "accepted";
      readonly subjectPersonId: PersonId;
      readonly targetPersonId: PersonId;
      readonly termCode: KinStatedTermCode;
    });

export type GraphRejection = "self_relationship" | "ancestor_cycle" | "partner_is_ancestor";

/**
 * Every ancestor of `personId` through parent-child edges. Callers pass the accepted
 * edges only: a pending or rejected statement is not a fact.
 */
export function ancestorsOf(personId: PersonId, edges: readonly DirectEdge[]): Set<PersonId> {
  const parentsByChild = new Map<PersonId, PersonId[]>();
  for (const edge of edges) {
    if (edge.type === "parent_child") {
      const parents = parentsByChild.get(edge.childPersonId) ?? [];
      parents.push(edge.parentPersonId);
      parentsByChild.set(edge.childPersonId, parents);
    }
  }
  const ancestors = new Set<PersonId>();
  const queue = [...(parentsByChild.get(personId) ?? [])];
  for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
    if (!ancestors.has(next)) {
      ancestors.add(next);
      queue.push(...(parentsByChild.get(next) ?? []));
    }
  }
  return ancestors;
}

/**
 * Checks the direct statement "`subjectPersonId` is the `term` of `targetPersonId`"
 * against the accepted edges and returns the edge it would add. Rejects a
 * self-relationship, an edge that makes a person their own ancestor, and a partner
 * edge to one's own ancestor or descendant.
 */
export function checkDirectEdge(
  subjectPersonId: PersonId,
  targetPersonId: PersonId,
  term: DirectTermCode,
  acceptedEdges: readonly DirectEdge[],
):
  | { readonly ok: true; readonly edge: DirectEdge }
  | { readonly ok: false; readonly reason: GraphRejection } {
  if (subjectPersonId === targetPersonId) {
    return { ok: false, reason: "self_relationship" };
  }
  if (term === "partner") {
    const related =
      ancestorsOf(subjectPersonId, acceptedEdges).has(targetPersonId) ||
      ancestorsOf(targetPersonId, acceptedEdges).has(subjectPersonId);
    if (related) {
      return { ok: false, reason: "partner_is_ancestor" };
    }
    const personIds: readonly [PersonId, PersonId] =
      subjectPersonId < targetPersonId
        ? [subjectPersonId, targetPersonId]
        : [targetPersonId, subjectPersonId];
    return { ok: true, edge: { type: "partner", personIds } };
  }
  const [parentPersonId, childPersonId] =
    term === "parent" ? [subjectPersonId, targetPersonId] : [targetPersonId, subjectPersonId];
  // The new edge closes a cycle when the child is already an ancestor of the parent.
  if (ancestorsOf(parentPersonId, acceptedEdges).has(childPersonId)) {
    return { ok: false, reason: "ancestor_cycle" };
  }
  return { ok: true, edge: { type: "parent_child", parentPersonId, childPersonId } };
}

export interface AcceptingParties {
  readonly inviter: { readonly accountId: AccountId; readonly personId: PersonId };
  readonly invitee: { readonly accountId: AccountId; readonly personId: PersonId };
}

/**
 * Builds the record that accepting `statement` writes. Run it in the same mutation as
 * the acceptance, against the accepted edges read in that mutation; on a rejection
 * nothing is written and the invitation does not change (AC-2.30).
 */
export function buildAcceptedRelationship(
  statement: StatedRelationship,
  parties: AcceptingParties,
  invitationId: InvitationId,
  acceptedEdges: readonly DirectEdge[],
):
  | { readonly ok: true; readonly record: AcceptedRelationship }
  | { readonly ok: false; readonly reason: GraphRejection } {
  const subject = parties[statement.subject].personId;
  const target = parties[otherParty(statement.subject)].personId;
  const provenance = { statingActorId: parties[statement.statedBy].accountId, invitationId };
  const term = statement.term;
  if (isDirectTermCode(term)) {
    const checked = checkDirectEdge(subject, target, term, acceptedEdges);
    if (!checked.ok) {
      return checked;
    }
    return {
      ok: true,
      record: { ...provenance, form: "edge", state: "accepted", edge: checked.edge },
    };
  }
  // A `kin_stated` record is never an edge, so only the self check applies.
  if (subject === target) {
    return { ok: false, reason: "self_relationship" };
  }
  return {
    ok: true,
    record: {
      ...provenance,
      form: "kin_stated",
      state: "accepted",
      subjectPersonId: subject,
      targetPersonId: target,
      termCode: term,
    },
  };
}

/**
 * The optional graph index holds accepted typed edges only: never a `kin_stated`
 * record, and never a pending, rejected or expired relationship (docs/domain-model.md).
 */
export function isGraphIndexProjectable(record: {
  readonly form: "edge" | "kin_stated";
  readonly state: RelationshipState;
}): boolean {
  return record.form === "edge" && record.state === "accepted";
}
