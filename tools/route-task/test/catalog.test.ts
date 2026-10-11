import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseModelCatalog } from "../src/catalog.js";

const fixture = await readFile(new URL("../../test/catalog.fixture.md", import.meta.url), "utf8");

test("parses catalog tier and class columns", () => {
  const catalog = parseModelCatalog(fixture);
  assert.deepEqual(catalog.models.find((model) => model.id === "safe-free"), {
    name: "Safe Free",
    id: "safe-free",
    dataClass: "B",
    tiers: ["T0", "T1", "D"],
  });
  assert.deepEqual(catalog.models.find((model) => model.id === "claude-opus-5-5"), {
    name: "Claude Opus 5.5",
    id: "claude-opus-5-5",
    dataClass: "A",
    tiers: ["T2"],
    inputPrice: 4,
    outputPrice: 20,
  });
});

test("accepts added rows but rejects changed headers", () => {
  const addedRow = fixture.replace("| Safe Free | safe-free | B | Zero retention |", "| Safe Free | safe-free | B | Zero retention |\n| Another Free | another-free | B | Zero retention |");
  assert.equal(parseModelCatalog(addedRow).models.some((model) => model.id === "another-free"), true);
  assert.throws(() => parseModelCatalog(fixture.replace("| Model | ID | Class | Notes |", "| Name | ID | Class | Notes |")), /Changed model-catalog header/);
});
