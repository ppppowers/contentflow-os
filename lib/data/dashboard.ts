import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";

// All queries run through the RLS-scoped server client → auto-limited to the
// caller's agency. Revenue figures are only fetched for admins.

const PIPELINE_ORDER = [
  "intake_received",
  "research_complete",
  "draft_generated",
  "internal_review",
  "client_review",
  "revision_requested",
  "approved",
  "scheduled",
  "sent",
  "archived",
] as const;

export type DashboardData = {
  kpis: {
    activeClients: number;
    mrr: number | null; // null for non-admins
    inPipeline: number;
    pendingApprovals: number;
    avgAuthenticity: number | null;
  };
  pipeline: { status: string; count: number }[];
  clients: {
    id: string;
    name: string;
    status: string;
    health_score: number;
  }[];
};

export async function getDashboardData(role: Role): Promise<DashboardData> {
  const supabase = createClient();
  const canSeeRevenue = role === "owner" || role === "admin";

  const [
    activeClientsRes,
    pendingApprovalsRes,
    projectsRes,
    clientsRes,
    mrrRes,
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("approvals").select("*", { count: "exact", head: true }).eq("decision", "pending"),
    supabase.from("content_projects").select("status, authenticity_score"),
    supabase
      .from("clients")
      .select("id, name, status, health_score")
      .order("created_at", { ascending: false })
      .limit(8),
    canSeeRevenue
      ? supabase.from("v_agency_mrr").select("mrr").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const projects = projectsRes.data ?? [];

  // Pipeline distribution (exclude archived from "in pipeline" KPI)
  const counts = new Map<string, number>();
  for (const p of projects) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  const pipeline = PIPELINE_ORDER.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  const inPipeline = projects.filter(
    (p) => p.status !== "archived" && p.status !== "sent",
  ).length;

  // Average authenticity across scored projects
  const scored = projects
    .map((p) => p.authenticity_score)
    .filter((s): s is number => typeof s === "number");
  const avgAuthenticity =
    scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

  return {
    kpis: {
      activeClients: activeClientsRes.count ?? 0,
      mrr: canSeeRevenue ? Number((mrrRes.data as { mrr?: number } | null)?.mrr ?? 0) : null,
      inPipeline,
      pendingApprovals: pendingApprovalsRes.count ?? 0,
      avgAuthenticity,
    },
    pipeline,
    clients: clientsRes.data ?? [],
  };
}
