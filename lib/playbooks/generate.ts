import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { playbookSchema, playbookJsonSchema } from "@/lib/validation/playbook";

export type PlaybookResult = { ok: true; playbookId: string } | { ok: false; error: string };

const SYSTEM = `You are an industry content strategist for ContentFlow OS, a content agency.
Produce a practical content playbook for the given industry:
- campaignIdeas: 5-8 recurring campaign concepts that work in this industry.
- topicLibrary: 10-15 evergreen + timely topic ideas.
- seasonalContent: month/season-tied ideas, each {when, idea}.
- subjectLines: 8-10 high-performing subject-line shapes (no clickbait, no banned buzzwords).
- ctas: 6-8 effective, low-friction CTAs for this industry.
Be specific to the industry and to how small/mid businesses or orgs in it actually
communicate. Respond ONLY with JSON matching the schema.`;

export async function generatePlaybook(
  industry: string,
  ctx: { agencyId: string; userId: string },
): Promise<PlaybookResult> {
  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM,
      user: `INDUSTRY: ${industry}`,
      schema: playbookJsonSchema,
    });
    parsed = playbookSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Playbook generation failed." };
  }
  if (!parsed.success) return { ok: false, error: "Playbook failed validation." };

  const supabase = createClient();
  const { data: row, error } = await supabase
    .from("industry_playbooks")
    .insert({ agency_id: ctx.agencyId, industry, payload: parsed.data, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save playbook." };
  return { ok: true, playbookId: row.id as string };
}
