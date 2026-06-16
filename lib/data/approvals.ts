import { createClient } from "@/lib/supabase/server";

export async function getApprovals(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("approvals")
    .select("id, stage, decision, comment, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return (data as { id: string; stage: string; decision: string; comment: string | null; created_at: string }[]) ?? [];
}

export async function getRevisions(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("revisions")
    .select("id, scope, instructions, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as { id: string; scope: string | null; instructions: string; status: string; created_at: string }[]) ?? [];
}

// ---- Client portal (RLS scopes to the linked client) --------------------------

export async function listClientReviewProjects() {
  const supabase = createClient();
  const { data } = await supabase
    .from("content_projects")
    .select("id, title, status, period")
    .eq("status", "client_review")
    .order("created_at", { ascending: false });
  return (data as { id: string; title: string; status: string; period: string | null }[]) ?? [];
}

export async function getClientProjectBundle(projectId: string) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id, title, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("id, channel, body, metadata")
    .eq("project_id", projectId);

  return {
    project: project as { id: string; title: string; status: string },
    pieces: (pieces as { id: string; channel: string; body: string; metadata: unknown }[]) ?? [],
  };
}
