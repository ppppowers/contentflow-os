import { createClient } from "@/lib/supabase/server";
import type { AgentName } from "@/lib/validation/agent-io";
import { getBrainContext } from "@/lib/brain/retrieval";
import { getRecentTopics } from "@/lib/memory/history";
import { getAgencyPatternsText } from "@/lib/agency-brain/retrieval";
import { getVaultContext } from "@/lib/vault/retrieval";
import { getPreferenceProfile } from "@/lib/data/preference";
import { preferenceContextText } from "@/lib/validation/preference";

// Durable, project-scoped memory. Assembled fresh each run from persisted rows —
// a run can always be reconstructed from the DB, never from conversational state.
export type AssembledContext = {
  client: { name: string; industry: string | null; website_url: string | null } | null;
  brand: {
    voice_summary: string | null;
    tone_descriptors: string[] | null;
    audience: string | null;
    sample_copy: string | null;
    banned_phrases: string[] | null;
    reading_level: string | null;
  } | null;
  // Business Brain: permanent client knowledge, pre-formatted for the prompt.
  // Consulted by every agent before writing (empty string when the Brain is bare).
  brainText: string;
  // Client memory: recently covered topic titles, so agents avoid repetition.
  recentTopics: string[];
  // Agency Brain: proven cross-client exemplars (subject lines, CTAs) to adapt.
  agencyPatterns: string;
  // Knowledge Vault: relevant uploaded documents (brand guides, SOPs, flyers).
  vaultContext: string;
  // Learned client preferences (from revision history) — honored automatically.
  preferenceText: string;
  intakeText: string;
  // Latest payload per upstream agent the caller asked for.
  upstream: Record<string, unknown>;
};

export async function assembleContext(
  projectId: string,
  dependsOn: AgentName[],
): Promise<AssembledContext> {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("content_projects")
    .select("client_id, submission_id")
    .eq("id", projectId)
    .single();

  const clientId = project?.client_id;
  const submissionId = project?.submission_id;

  const [clientRes, brandRes, itemsRes] = await Promise.all([
    clientId
      ? supabase.from("clients").select("name, industry, website_url").eq("id", clientId).maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? supabase
          .from("brand_profiles")
          .select("voice_summary, tone_descriptors, audience, sample_copy, banned_phrases, reading_level")
          .eq("client_id", clientId)
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    submissionId
      ? supabase.from("intake_items").select("type, title, body").eq("submission_id", submissionId)
      : Promise.resolve({ data: [] }),
  ]);

  const intakeText = ((itemsRes.data as { type: string; title: string | null; body: string | null }[]) ?? [])
    .map((it) => `[${it.type}] ${it.title ? it.title + " — " : ""}${it.body ?? ""}`)
    .join("\n");

  // Business Brain — permanent client knowledge, consulted before generation.
  // Client memory — topics already covered for this client (excluding this project).
  // Agency Brain patterns are cross-client (agency-wide), fetched regardless of client.
  // Vault is searched with the run's topic (intake text) — "search before writing".
  const [brainText, recentTopics, agencyPatterns, vaultContext, preference] = await Promise.all([
    clientId ? getBrainContext(clientId) : Promise.resolve(""),
    clientId ? getRecentTopics(clientId, { excludeProjectId: projectId }) : Promise.resolve([]),
    getAgencyPatternsText(),
    getVaultContext(clientId ?? null, intakeText),
    clientId ? getPreferenceProfile(clientId) : Promise.resolve(null),
  ]);
  const preferenceText = preferenceContextText(preference?.payload ?? null);

  // Latest output per requested upstream agent.
  const upstream: Record<string, unknown> = {};
  if (dependsOn.length > 0) {
    const { data: outputs } = await supabase
      .from("agent_outputs")
      .select("agent, payload, version")
      .eq("project_id", projectId)
      .in("agent", dependsOn)
      .order("version", { ascending: false });
    for (const row of (outputs as { agent: string; payload: unknown }[]) ?? []) {
      if (!(row.agent in upstream)) upstream[row.agent] = row.payload; // first = highest version
    }
  }

  return {
    client: (clientRes.data as AssembledContext["client"]) ?? null,
    brand: (brandRes.data as AssembledContext["brand"]) ?? null,
    brainText,
    recentTopics,
    agencyPatterns,
    vaultContext,
    preferenceText,
    intakeText,
    upstream,
  };
}
