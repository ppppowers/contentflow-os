import { createClient } from "@/lib/supabase/server";
import {
  BRAIN_CATEGORIES,
  BRAIN_CATEGORY_LABELS,
  type BrainCategory,
} from "@/lib/validation/brain";

// Business Brain retrieval. Every content run consults this BEFORE writing.
// The Brain is the durable client knowledge layer; it is assembled fresh from
// brain_entries each run so a run is reconstructable from the DB.

export type BrainEntry = {
  id: string;
  category: BrainCategory;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority: number;
  source: string;
  is_active: boolean;
  created_at: string;
};

// Active entries for a client, highest-priority first within each category.
export async function getBrainEntries(clientId: string): Promise<BrainEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("brain_entries")
    .select("id, category, title, body, data, priority, source, is_active, created_at")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as BrainEntry[] | null) ?? [];
}

// Pure: format entries into a prompt-ready knowledge block grouped by category.
// Empty Brain → "" (preamble omits the section entirely).
export function brainContextText(entries: BrainEntry[]): string {
  if (entries.length === 0) return "";

  const byCategory = new Map<BrainCategory, BrainEntry[]>();
  for (const cat of BRAIN_CATEGORIES) {
    const group = entries.filter((e) => e.category === cat);
    if (group.length > 0) byCategory.set(cat, group);
  }

  const sections: string[] = [];
  for (const [cat, group] of byCategory) {
    const lines = group.map((e) => {
      const body = e.body?.trim() ? ` — ${e.body.trim()}` : "";
      return `- ${e.title}${body}`;
    });
    sections.push(`## ${BRAIN_CATEGORY_LABELS[cat]}\n${lines.join("\n")}`);
  }
  return sections.join("\n\n");
}

// Convenience: fetch + format in one call for the agent context layer.
export async function getBrainContext(clientId: string): Promise<string> {
  return brainContextText(await getBrainEntries(clientId));
}
