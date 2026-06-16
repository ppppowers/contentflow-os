import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const MEETING_SOURCES = ["transcript", "zoom_export", "call_summary", "voice_note"] as const;
export type MeetingSource = (typeof MEETING_SOURCES)[number];

export const MEETING_SOURCE_LABELS: Record<MeetingSource, string> = {
  transcript: "Meeting transcript",
  zoom_export: "Zoom export",
  call_summary: "Call summary",
  voice_note: "Voice note (transcript)",
};

const item = z.object({ title: z.string(), detail: z.string() }).strict();

// Meeting Intelligence Report.
export const meetingReportSchema = z
  .object({
    summary: z.string(),
    extracted: z
      .object({
        stories: z.array(item),
        promotions: z.array(item),
        customerWins: z.array(item),
        contentOpportunities: z.array(item),
      })
      .strict(),
    notableQuotes: z.array(z.string()),
  })
  .strict();

export type MeetingReport = z.infer<typeof meetingReportSchema>;

export const meetingReportJsonSchema = (() => {
  const { $schema, ...rest } = zodToJsonSchema(meetingReportSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  return rest;
})();

// Input for analysis (transcript text required).
export const analyzeTranscriptSchema = z.object({
  title: z.string().trim().min(2, "Title required"),
  sourceType: z.enum(MEETING_SOURCES),
  transcript: z.string().trim().min(20, "Paste a transcript (at least a couple sentences)."),
});

// Pure: all extracted opportunities across categories.
export function countOpportunities(report: MeetingReport): number {
  const e = report.extracted;
  return e.stories.length + e.promotions.length + e.customerWins.length + e.contentOpportunities.length;
}
