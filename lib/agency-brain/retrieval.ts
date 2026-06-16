import { createClient } from "@/lib/supabase/server";
import {
  AGENCY_BRAIN_CATEGORIES,
  AGENCY_BRAIN_CATEGORY_LABELS,
  type AgencyBrainCategory,
} from "@/lib/validation/agency-brain";

export type AgencyBrainEntry = {
  id: string;
  category: AgencyBrainCategory;
  content: string;
  authenticity_score: number | null;
  times_used: number;
  is_active: boolean;
  source_project_id: string | null;
  created_at: string;
};

// Best entries for a category, strongest first (authenticity, then usage).
export async function getBestPatterns(
  category: AgencyBrainCategory,
  limit = 5,
): Promise<AgencyBrainEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agency_brain_entries")
    .select("id, category, content, authenticity_score, times_used, is_active, source_project_id, created_at")
    .eq("category", category)
    .eq("is_active", true)
    .order("authenticity_score", { ascending: false, nullsFirst: false })
    .order("times_used", { ascending: false })
    .limit(limit);
  return (data as AgencyBrainEntry[] | null) ?? [];
}

// Pure: format proven subject lines + CTAs into an anonymized exemplar block for
// the agent preamble. Empty input → "" (section omitted).
export function agencyPatternsText(subjectLines: string[], ctas: string[]): string {
  if (subjectLines.length === 0 && ctas.length === 0) return "";
  const parts: string[] = [];
  if (subjectLines.length > 0) {
    parts.push(`Proven subject-line shapes:\n${subjectLines.map((s) => `- ${s}`).join("\n")}`);
  }
  if (ctas.length > 0) {
    parts.push(`Proven CTA shapes:\n${ctas.map((c) => `- ${c}`).join("\n")}`);
  }
  return parts.join("\n");
}

// Convenience for the agent context layer: top subject lines + CTAs, formatted.
export async function getAgencyPatternsText(): Promise<string> {
  const [subjects, ctas] = await Promise.all([
    getBestPatterns("subject_line", 5),
    getBestPatterns("cta", 5),
  ]);
  return agencyPatternsText(subjects.map((s) => s.content), ctas.map((c) => c.content));
}

// Pure: roll up entries into per-category analytics for the dashboard.
export type CategoryStat = { category: AgencyBrainCategory; label: string; count: number; topScore: number | null };

export function summarizeStats(entries: AgencyBrainEntry[]): CategoryStat[] {
  return AGENCY_BRAIN_CATEGORIES.map((category) => {
    const group = entries.filter((e) => e.category === category && e.is_active);
    const scores = group.map((e) => e.authenticity_score ?? 0);
    return {
      category,
      label: AGENCY_BRAIN_CATEGORY_LABELS[category],
      count: group.length,
      topScore: group.length > 0 ? Math.max(...scores) : null,
    };
  });
}
