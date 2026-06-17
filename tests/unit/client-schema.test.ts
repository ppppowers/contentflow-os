import { describe, it, expect } from "vitest";
import { sanitizeSchema } from "@/lib/claude/client";
import { jsonSchemaFor } from "@/lib/validation/agent-io";

// Recursively assert no unsupported keyword survives anywhere in the schema.
const BANNED = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "pattern", "format", "minItems", "maxItems", "uniqueItems", "default"];
function findBanned(node: unknown, hits: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => findBanned(n, hits));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (BANNED.includes(k)) hits.push(k);
      findBanned(v, hits);
    }
  }
  return hits;
}

describe("sanitizeSchema", () => {
  it("strips numeric range keywords from integer fields", () => {
    const input = { type: "object", properties: { score: { type: "integer", minimum: 0, maximum: 100 } } };
    const out = sanitizeSchema(input);
    expect(findBanned(out)).toEqual([]);
    // structure + type preserved
    expect((out as any).properties.score.type).toBe("integer");
  });

  it("recurses into nested objects, arrays, $defs", () => {
    const input = {
      type: "object",
      properties: { items: { type: "array", items: { type: "object", properties: { n: { type: "integer", minimum: 1 } } } } },
      $defs: { x: { type: "string", minLength: 2, pattern: "^a" } },
    };
    expect(findBanned(sanitizeSchema(input))).toEqual([]);
  });

  it("leaves a real agent schema free of banned keywords", () => {
    // human_editor carries authenticityScore (0-100) → would emit min/max
    const cleaned = sanitizeSchema(jsonSchemaFor("human_editor"));
    expect(findBanned(cleaned)).toEqual([]);
  });
});
