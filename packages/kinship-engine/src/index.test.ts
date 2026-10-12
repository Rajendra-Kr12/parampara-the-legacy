import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@parampara/kinship-engine", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@parampara/kinship-engine");
  });
});
