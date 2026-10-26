import { describe, expect, it } from "vitest";
import {
  DIRECT_TERM_CODES,
  KIN_STATED_TERM_CODES,
  TERM_REGISTRY_VERSION,
  inverseTermCodes,
  isDirectTermCode,
  parseTermCode,
  resolveDisplayTerm,
} from "./relationship-terms";

describe("canonical term registry v1 (D-058)", () => {
  it("is version 1 with the normative closed sets", () => {
    expect(TERM_REGISTRY_VERSION).toBe(1);
    expect(DIRECT_TERM_CODES).toEqual(["parent", "child", "partner"]);
    expect(KIN_STATED_TERM_CODES).toEqual([
      "sibling",
      "cousin",
      "uncle",
      "aunt",
      "nephew",
      "niece",
    ]);
  });

  it("keeps sibling out of the direct types until Feature 3", () => {
    expect(isDirectTermCode("sibling")).toBe(false);
  });

  describe("AC-2.29 a stated relationship that is not a supported type is rejected", () => {
    it.each([
      ["free text", "my favourite relative"],
      ["unsupported variant", "maternal uncle"],
      ["possessive variant", "mom's brother"],
      ["by-marriage variant", "uncle by marriage"],
      ["a display label, not a code", "mama"],
      ["other casing", "Cousin"],
      ["surrounding space", " cousin"],
      ["gendered term not in v1", "father"],
      ["empty", ""],
      ["not a string", 7],
      ["null", null],
      ["object", { code: "cousin" }],
    ])("rejects %s", (_name, input) => {
      expect(parseTermCode(input)).toBeNull();
    });

    it.each([...DIRECT_TERM_CODES, ...KIN_STATED_TERM_CODES])("accepts the code %s", (code) => {
      expect(parseTermCode(code)).toBe(code);
    });
  });

  describe("AC-2.32 display terms map to codes and never create one", () => {
    it.each([
      ["en", "cousin", "cousin"],
      ["en", "  Uncle ", "uncle"],
      ["te-Latn", "Mama", "uncle"],
      ["te-Latn", "babai", "uncle"],
      ["te-Latn", "Atta", "aunt"],
      ["te-Latn", "pinni", "aunt"],
    ] as const)("maps %s %j to %s, dropping any side", (locale, label, code) => {
      expect(resolveDisplayTerm(locale, label)).toBe(code);
    });

    it.each([
      ["en", "maternal uncle"],
      ["en", "mom's brother"],
      ["en", "uncle by marriage"],
      ["en", "mama"],
      ["te-Latn", "cousin"],
      ["te-Latn", "mama garu"],
      ["en", undefined],
    ] as const)("rejects %s %j", (locale, label) => {
      expect(resolveDisplayTerm(locale, label)).toBeNull();
    });
  });

  it.each([
    ["parent", ["child"]],
    ["child", ["parent"]],
    ["partner", ["partner"]],
    ["cousin", ["cousin"]],
    ["uncle", ["nephew", "niece"]],
    ["niece", ["uncle", "aunt"]],
  ] as const)("derives the inverse of %s for display", (code, inverse) => {
    expect(inverseTermCodes(code)).toEqual(inverse);
  });
});
