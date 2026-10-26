/**
 * Canonical term registry v1 for stated relationships (D-058, docs/domain-model.md
 * "Stated relationships"). A stated relationship is always one of these codes, read as
 * "the subject is the <code> of the target". User text never becomes a code: display
 * labels map onto existing codes, and a new code needs a new registry version through
 * a later decision.
 */

export const TERM_REGISTRY_VERSION = 1;

/** Direct types, stored as typed edges between canonical person ids. */
export const DIRECT_TERM_CODES = ["parent", "child", "partner"] as const;

/**
 * Non-direct terms, stored as a `kin_stated` record that is never an edge or a graph
 * path. `sibling` stays here until Feature 3 decides the sibling edge model.
 */
export const KIN_STATED_TERM_CODES = [
  "sibling",
  "cousin",
  "uncle",
  "aunt",
  "nephew",
  "niece",
] as const;

export type DirectTermCode = (typeof DIRECT_TERM_CODES)[number];
export type KinStatedTermCode = (typeof KIN_STATED_TERM_CODES)[number];
export type TermCode = DirectTermCode | KinStatedTermCode;

const directCodes: ReadonlySet<string> = new Set(DIRECT_TERM_CODES);
const kinStatedCodes: ReadonlySet<string> = new Set(KIN_STATED_TERM_CODES);

export function isDirectTermCode(code: TermCode): code is DirectTermCode {
  return directCodes.has(code);
}

/**
 * Accepts only an exact canonical code. Anything else (a display label, other casing,
 * surrounding space, free text, a non-string) is unsupported (AC-2.29, AC-2.32).
 */
export function parseTermCode(input: unknown): TermCode | null {
  if (typeof input !== "string") {
    return null;
  }
  return directCodes.has(input) || kinStatedCodes.has(input) ? (input as TermCode) : null;
}

/**
 * The codes the target may be called from the subject's side, derived for display and
 * never stored as a second record. Feature 2 records no gender, so the inverse of
 * `uncle` is "nephew or niece" rather than one of them.
 */
export function inverseTermCodes(code: TermCode): readonly TermCode[] {
  return inverses[code];
}

const inverses: Readonly<Record<TermCode, readonly TermCode[]>> = {
  parent: ["child"],
  child: ["parent"],
  partner: ["partner"],
  sibling: ["sibling"],
  cousin: ["cousin"],
  uncle: ["nephew", "niece"],
  aunt: ["nephew", "niece"],
  nephew: ["uncle", "aunt"],
  niece: ["uncle", "aunt"],
};

/** Locales with display labels in registry v1. Telugu is romanized for now. */
export type DisplayLocale = "en" | "te-Latn";

interface DisplayTerm {
  readonly locale: DisplayLocale;
  readonly label: string;
  readonly code: TermCode;
  /** New terms stay unvalidated until native speakers check them (docs/domain-model.md). */
  readonly review: "validated" | "unvalidated";
}

/**
 * Display labels per locale. A side-carrying Telugu term maps to its coarse code and
 * the side is dropped: Feature 2 stores no maternal or paternal side (D-058).
 */
export const DISPLAY_TERMS: readonly DisplayTerm[] = [
  ...[...DIRECT_TERM_CODES, ...KIN_STATED_TERM_CODES].map((code): DisplayTerm => ({
    locale: "en",
    label: code,
    code,
    review: "validated",
  })),
  { locale: "te-Latn", label: "mama", code: "uncle", review: "unvalidated" },
  { locale: "te-Latn", label: "babai", code: "uncle", review: "unvalidated" },
  { locale: "te-Latn", label: "atta", code: "aunt", review: "unvalidated" },
  { locale: "te-Latn", label: "pinni", code: "aunt", review: "unvalidated" },
];

/**
 * Maps a registered display label to its canonical code, ignoring case and surrounding
 * space. Any other text, including variants such as "maternal uncle" or "mom's
 * brother", is unsupported and returns null (AC-2.32).
 */
export function resolveDisplayTerm(locale: DisplayLocale, label: unknown): TermCode | null {
  if (typeof label !== "string") {
    return null;
  }
  const key = label.normalize("NFC").trim().toLowerCase();
  return DISPLAY_TERMS.find((term) => term.locale === locale && term.label === key)?.code ?? null;
}
