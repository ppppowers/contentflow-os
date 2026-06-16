import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const preferenceProfileSchema = z
  .object({
    summary: z.string(),
    preferences: z.array(z.string()),       // what they consistently want
    avoid: z.array(z.string()),             // what they push back on
    commonRequests: z.array(z.string()),    // recurring revision asks
    toneAdjustments: z.array(z.string()),   // voice tweaks they ask for
  })
  .strict();

export type PreferenceProfile = z.infer<typeof preferenceProfileSchema>;

export const preferenceJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(preferenceProfileSchema, { target: "jsonSchema7" }) as Record<string, unknown>;
  return rest;
})();

// Pure: median of a list of day-deltas (approval turnaround). null when empty.
export function medianDays(days: number[]): number | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(m * 100) / 100;
}

// Pure: compact preference summary for injection into the agent preamble.
export function preferenceContextText(p: PreferenceProfile | null): string {
  if (!p) return "";
  const lines: string[] = [];
  if (p.preferences.length) lines.push(`Prefers: ${p.preferences.join("; ")}`);
  if (p.avoid.length) lines.push(`Avoid: ${p.avoid.join("; ")}`);
  if (p.toneAdjustments.length) lines.push(`Tone: ${p.toneAdjustments.join("; ")}`);
  return lines.join("\n");
}
