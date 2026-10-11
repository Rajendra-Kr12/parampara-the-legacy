import { DATA_CLASSES, TIERS, type Catalog, type CatalogModel, type DataClass, type Tier } from "./types.js";

const FREE_HEADING = "## OpenCode Zen: free models";
const PAID_HEADING = "## OpenCode Zen: paid models worth routing to";
const FREE_HEADER = ["Model", "ID", "Class", "Notes"];
const PAID_HEADER = ["Model", "ID", "Input / Output", "Suggested tier"];

function isDataClass(value: string): value is DataClass {
  return (DATA_CLASSES as readonly string[]).includes(value);
}

function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

function cells(line: string): readonly string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    throw new Error("Expected a Markdown table row in model catalog.");
  }
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function headerMatches(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function tableAfterHeading(
  source: string,
  heading: string,
  expectedHeader: readonly string[],
): readonly (readonly string[])[] {
  const headingIndex = source.indexOf(heading);
  if (headingIndex < 0) {
    throw new Error(`Missing required model-catalog heading: ${heading}`);
  }

  const lines = source.slice(headingIndex + heading.length).split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim().startsWith("|"));
  if (headerIndex < 0) {
    throw new Error(`Missing table after model-catalog heading: ${heading}`);
  }

  const actualHeader = cells(lines[headerIndex] ?? "");
  if (!headerMatches(actualHeader, expectedHeader)) {
    throw new Error(
      `Changed model-catalog header after ${heading}. Expected: ${expectedHeader.join(" | ")}.`,
    );
  }

  const separator = lines[headerIndex + 1];
  if (separator === undefined || !/^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(separator)) {
    throw new Error(`Missing Markdown table separator after ${heading}.`);
  }

  const rows: (readonly string[])[] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const row = cells(line);
    if (row.length !== expectedHeader.length) {
      throw new Error(`Unexpected column count in table after ${heading}.`);
    }
    rows.push(row);
  }
  return rows;
}

function parsePricePair(value: string): readonly [number, number] {
  const match = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(value);
  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error(`Invalid Input / Output price in model catalog: ${value}`);
  }
  return [Number(match[1]), Number(match[2])];
}

function parseTiers(value: string): readonly Tier[] {
  const parsed = value.split(",").map((tier) => /^\s*(T[0-3]|R|D)\b/.exec(tier)?.[1]);
  if (parsed.length === 0 || parsed.some((tier) => tier === undefined || !isTier(tier))) {
    throw new Error(`Invalid Suggested tier value in model catalog: ${value}`);
  }
  return parsed as Tier[];
}

export function parseModelCatalog(source: string): Catalog {
  const freeRows = tableAfterHeading(source, FREE_HEADING, FREE_HEADER);
  const paidRows = tableAfterHeading(source, PAID_HEADING, PAID_HEADER);

  const freeModels: CatalogModel[] = freeRows.map((row) => {
    const [name, id, dataClass] = row;
    if (name === undefined || id === undefined || dataClass === undefined || !isDataClass(dataClass)) {
      throw new Error("Invalid free-model row in model catalog.");
    }
    return { name, id, dataClass, tiers: ["T0", "T1", "D"] };
  });

  const paidModels: CatalogModel[] = paidRows.map((row) => {
    const [name, id, price, tierText] = row;
    if (name === undefined || id === undefined || price === undefined || tierText === undefined) {
      throw new Error("Invalid paid-model row in model catalog.");
    }
    const [inputPrice, outputPrice] = parsePricePair(price);
    return { name, id, dataClass: "A", tiers: parseTiers(tierText), inputPrice, outputPrice };
  });

  return { models: [...freeModels, ...paidModels] };
}
