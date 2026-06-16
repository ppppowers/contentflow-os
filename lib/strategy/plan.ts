import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { getBrainContext } from "@/lib/brain/retrieval";
import { getRecentTopics } from "@/lib/memory/history";
import { getAgencyPatternsText } from "@/lib/agency-brain/retrieval";
import { getLatestAnalysis } from "@/lib/data/website";
import { listStories } from "@/lib/data/story";
import { getPlaybookByIndustry } from "@/lib/data/playbook";
import { contentRoadmapSchema, roadmapJsonSchema, type Horizon } from "@/lib/validation/strategy";

export type PlanResult = { ok: true; roadmapId: string } | { ok: false; error: string };

const SYSTEM = `You are the Strategic Planning Department for ContentFlow OS, a content agency.
Build a concrete content roadmap for this client over the given horizon. Recommend
specific newsletters, blogs, campaigns, and promotions — each with a clear angle, a
suggestedWeek (1-based), and a short rationale tied to what you know about the client.
Spread items sensibly across the weeks. Favor the client's real stories, services,
events, and promotions over generic ideas. Do NOT repeat recently covered topics
without a fresh angle. Respond ONLY with JSON matching the schema.`;

export async function generatePlan(
  clientId: string,
  horizon: Horizon,
  ctx: { agencyId: string; userId: string },
): Promise<PlanResult> {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name, industry")
    .eq("id", clientId)
    .maybeSingle();

  const [brainText, recentTopics, agencyPatterns, analysis, stories, playbook] = await Promise.all([
    getBrainContext(clientId),
    getRecentTopics(clientId, { limit: 8 }),
    getAgencyPatternsText(),
    getLatestAnalysis(clientId),
    listStories(clientId),
    getPlaybookByIndustry((client?.industry as string | null) ?? null),
  ]);

  const weeks = horizon / 7;
  const storyText = stories
    .filter((s) => s.status !== "used")
    .slice(0, 20)
    .map((s) => `[${s.category}] ${s.title}: ${s.summary}`)
    .join("\n");
  const ideaText = analysis
    ? [...analysis.payload.ideas.newsletters, ...analysis.payload.ideas.blogs, ...analysis.payload.ideas.campaigns]
        .map((i) => `${i.title}: ${i.angle}`)
        .join("\n")
    : "";

  const user = [
    `CLIENT: ${client?.name ?? ""} (${client?.industry ?? "n/a"})`,
    `HORIZON: ${horizon} days (${weeks} weeks). suggestedWeek must be 1-${weeks}.`,
    brainText ? `BUSINESS BRAIN:\n${brainText}` : "",
    storyText ? `STORY BANK (available stories):\n${storyText}` : "",
    ideaText ? `WEBSITE-DERIVED IDEAS:\n${ideaText}` : "",
    recentTopics.length ? `RECENTLY COVERED (avoid repeating):\n${recentTopics.map((t) => `- ${t}`).join("\n")}` : "",
    agencyPatterns ? `PROVEN AGENCY PATTERNS:\n${agencyPatterns}` : "",
    playbook
      ? `INDUSTRY PLAYBOOK (${playbook.industry}):\nCampaigns: ${playbook.payload.campaignIdeas.join("; ")}\nTopics: ${playbook.payload.topicLibrary.join("; ")}\nSeasonal: ${playbook.payload.seasonalContent.map((s) => `${s.when}: ${s.idea}`).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  let parsed;
  try {
    const { data } = await callStructured({ tier: "strong", system: SYSTEM, user, schema: roadmapJsonSchema });
    parsed = contentRoadmapSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Planning failed." };
  }
  if (!parsed.success) return { ok: false, error: "Roadmap failed validation." };

  // Clamp any out-of-horizon weeks the model may have emitted.
  const recommendations = parsed.data.recommendations.map((r) => ({
    ...r,
    suggestedWeek: Math.min(Math.max(r.suggestedWeek, 1), weeks),
  }));

  const { data: row, error } = await supabase
    .from("content_roadmaps")
    .insert({
      agency_id: ctx.agencyId,
      client_id: clientId,
      horizon,
      payload: { summary: parsed.data.summary, recommendations },
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save roadmap." };

  return { ok: true, roadmapId: row.id as string };
}
