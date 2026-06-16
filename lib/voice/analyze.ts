import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getBrainContext } from "@/lib/brain/retrieval";
import { meetingReportSchema, meetingReportJsonSchema, type MeetingSource } from "@/lib/validation/voice";
import { cleanTranscript } from "./transcript";

export type AnalyzeResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

const MAX_TRANSCRIPT_CHARS = 40000;

const SYSTEM = `You are the Voice & Meeting Intelligence agent for ContentFlow OS, a content agency.
You are given a transcript (a meeting, call, or voice note). Mine it for content:
- summary: 2-3 sentences on what was discussed.
- extracted: pull concrete items into stories / promotions / customerWins /
  contentOpportunities. Each = {title, detail}. Only what the transcript supports — no invention.
- notableQuotes: 0-5 short, usable verbatim quotes worth featuring.
Respond ONLY with JSON matching the schema.`;

export async function analyzeTranscript(
  clientId: string,
  input: { title: string; sourceType: MeetingSource; transcript: string },
  ctx: { agencyId: string; userId: string },
): Promise<AnalyzeResult> {
  const supabase = createClient();

  const cleaned = cleanTranscript(input.transcript).slice(0, MAX_TRANSCRIPT_CHARS);
  if (cleaned.length < 20) return { ok: false, error: "Transcript too short after cleaning." };

  const brainText = await getBrainContext(clientId);

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM + (brainText ? `\n\nKNOWN CLIENT KNOWLEDGE:\n${brainText}` : ""),
      user: `SOURCE: ${input.sourceType}\nTITLE: ${input.title}\n\nTRANSCRIPT:\n${cleaned}`,
      schema: meetingReportJsonSchema,
    });
    parsed = meetingReportSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Analysis failed." };
  }
  if (!parsed.success) return { ok: false, error: "Report failed validation." };

  const { data: row, error } = await supabase
    .from("meeting_intelligence")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      title: input.title,
      source_type: input.sourceType,
      transcript: cleaned,
      payload: parsed.data,
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save report." };

  return { ok: true, reportId: row.id as string };
}
