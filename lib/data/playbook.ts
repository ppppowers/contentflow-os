import { createClient } from "@/lib/supabase/server";
import type { Playbook } from "@/lib/validation/playbook";

export type PlaybookRow = { id: string; industry: string; payload: Playbook; created_at: string };

// Latest playbook per industry (dedup newest-first in JS).
export async function listPlaybooks(): Promise<Record<string, PlaybookRow>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("industry_playbooks")
    .select("id, industry, payload, created_at")
    .order("created_at", { ascending: false });
  const out: Record<string, PlaybookRow> = {};
  for (const row of (data as PlaybookRow[] | null) ?? []) {
    if (!(row.industry in out)) out[row.industry] = row;
  }
  return out;
}

// Latest playbook matching a (free-text) industry, case-insensitive.
export async function getPlaybookByIndustry(industry: string | null): Promise<PlaybookRow | null> {
  if (!industry?.trim()) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("industry_playbooks")
    .select("id, industry, payload, created_at")
    .ilike("industry", industry.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PlaybookRow | null) ?? null;
}
