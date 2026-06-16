import { createClient } from "@/lib/supabase/server";
import { callStructured } from "@/lib/claude/client";
import { minedStoriesSchema, minedStoriesJsonSchema, normalizeTitle } from "@/lib/validation/story";

export type MineResult = { ok: true; added: number } | { ok: false; error: string };

const SOURCE_CHAR_BUDGET = 30000;

// Gather a client's raw material from every durable source for mining.
async function gatherSources(clientId: string): Promise<string> {
  const supabase = createClient();

  const { data: subs } = await supabase.from("intake_submissions").select("id").eq("client_id", clientId);
  const subIds = ((subs as { id: string }[] | null) ?? []).map((s) => s.id);

  const [items, meetings, brain] = await Promise.all([
    subIds.length
      ? supabase.from("intake_items").select("type, title, body").in("submission_id", subIds)
      : Promise.resolve({ data: [] as { type: string; title: string | null; body: string | null }[] }),
    supabase.from("meeting_intelligence").select("title, payload").eq("client_id", clientId),
    supabase.from("brain_entries").select("category, title, body").eq("client_id", clientId).eq("is_active", true),
  ]);

  const parts: string[] = [];
  for (const it of (items.data as { type: string; title: string | null; body: string | null }[]) ?? []) {
    parts.push(`[intake:${it.type}] ${it.title ? it.title + " — " : ""}${it.body ?? ""}`);
  }
  for (const m of (meetings.data as { title: string; payload: Record<string, unknown> }[]) ?? []) {
    const ex = (m.payload?.extracted ?? {}) as Record<string, { title: string; detail: string }[]>;
    for (const cat of ["stories", "customerWins", "promotions", "contentOpportunities"]) {
      for (const x of ex[cat] ?? []) parts.push(`[meeting:${cat}] ${x.title} — ${x.detail}`);
    }
  }
  for (const b of (brain.data as { category: string; title: string; body: string }[]) ?? []) {
    parts.push(`[brain:${b.category}] ${b.title}${b.body ? " — " + b.body : ""}`);
  }
  return parts.join("\n").slice(0, SOURCE_CHAR_BUDGET);
}

const SYSTEM = `You are the Story Mining Agent for ContentFlow OS, a content agency.
From the raw client material, identify distinct, reusable STORIES worth telling:
customer, volunteer, donor, employee, and project-success stories.
For each: category, a short title, a 1-2 sentence summary, the concrete detail
(names/numbers/outcomes where present), and 2-5 lowercase tags.
Only surface stories the material genuinely supports — do NOT invent. Merge
duplicates. If something isn't really a story, leave it out.
Respond ONLY with JSON matching the schema.`;

export async function mineStories(
  clientId: string,
  ctx: { agencyId: string; userId: string },
): Promise<MineResult> {
  const supabase = createClient();
  const sources = await gatherSources(clientId);
  if (sources.trim().length < 20) return { ok: false, error: "Not enough material to mine yet." };

  // Existing titles → tell the model what's already banked + skip dupes on insert.
  const { data: existing } = await supabase.from("stories").select("title").eq("client_id", clientId);
  const existingNorm = new Set(((existing as { title: string }[] | null) ?? []).map((e) => normalizeTitle(e.title)));
  const known = ((existing as { title: string }[] | null) ?? []).map((e) => e.title);

  let parsed;
  try {
    const { data } = await callStructured({
      tier: "strong",
      system: SYSTEM + (known.length ? `\n\nALREADY IN THE BANK (don't repeat):\n${known.join("\n")}` : ""),
      user: `CLIENT MATERIAL:\n${sources}`,
      schema: minedStoriesJsonSchema,
    });
    parsed = minedStoriesSchema.safeParse(data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Mining failed." };
  }
  if (!parsed.success) return { ok: false, error: "Mined output failed validation." };

  const fresh = parsed.data.stories.filter((s) => !existingNorm.has(normalizeTitle(s.title)));
  if (fresh.length === 0) return { ok: true, added: 0 };

  const { error } = await supabase.from("stories").insert(
    fresh.map((s) => ({
      agency_id: ctx.agencyId,
      client_id: clientId,
      category: s.category,
      title: s.title,
      summary: s.summary,
      detail: s.detail,
      tags: s.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
      source: "mined",
      created_by: ctx.userId,
    })),
  );
  if (error) return { ok: false, error: "Could not save mined stories." };
  return { ok: true, added: fresh.length };
}
