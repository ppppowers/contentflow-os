import { describe, it, expect } from "vitest";
import { sanitizeSchema } from "@/lib/claude/client";
import { jsonSchemaFor } from "@/lib/validation/agent-io";
import { briefJsonSchema } from "@/lib/validation/interview";
import { meetingReportJsonSchema } from "@/lib/validation/voice";
import { scorecardJudgeJsonSchema } from "@/lib/validation/scorecard";

const BANNED = [
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "pattern", "format", "minItems", "maxItems",
  "uniqueItems", "default", "$ref", "$defs", "definitions",
];
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

describe("sanitizeSchema — strips unsupported keywords", () => {
  it("removes numeric range keywords from integers", () => {
    const out = sanitizeSchema({ type: "object", properties: { score: { type: "integer", minimum: 0, maximum: 100 } } });
    expect(findBanned(out)).toEqual([]);
    expect((out as any).properties.score.type).toBe("integer");
  });
});

describe("sanitizeSchema — inlines $refs", () => {
  it("inlines a $ref pointing into /properties and drops $defs", () => {
    const schema = {
      type: "object",
      $defs: { Item: { type: "object", properties: { title: { type: "string" } } } },
      properties: {
        a: { $ref: "#/$defs/Item" },
        b: { type: "array", items: { $ref: "#/properties/a" } },
      },
    };
    const out = sanitizeSchema(schema) as any;
    expect(findBanned(out)).toEqual([]); // no $ref, no $defs
    expect(out.properties.a.properties.title.type).toBe("string"); // inlined
    expect(out.properties.b.items.properties.title.type).toBe("string"); // chained ref inlined
  });
});

describe("real agent/feature schemas are clean after sanitize", () => {
  for (const [name, schema] of [
    ["human_editor", jsonSchemaFor("human_editor")],
    ["interview brief", briefJsonSchema],
    ["meeting report", meetingReportJsonSchema],
    ["scorecard judge", scorecardJudgeJsonSchema],
  ] as const) {
    it(`${name} has no banned keywords`, () => {
      expect(findBanned(sanitizeSchema(schema as Record<string, unknown>))).toEqual([]);
    });
  }
});
