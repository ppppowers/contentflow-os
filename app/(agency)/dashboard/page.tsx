import { requireStaff } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/data/dashboard";
import { isAdmin } from "@/lib/auth/roles";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineBar } from "@/components/dashboard/PipelineBar";
import { ClientOverview } from "@/components/dashboard/ClientOverview";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

// What each status means for the person using the app, and whether it needs them.
const STATUS_TEXT: Record<string, { label: string; needsYou: boolean }> = {
  intake_received: { label: "Not written yet", needsYou: true },
  research_complete: { label: "Writing in progress", needsYou: true },
  draft_generated: { label: "Writing in progress", needsYou: true },
  internal_review: { label: "Ready for your review", needsYou: true },
  revision_requested: { label: "Needs changes", needsYou: true },
  client_review: { label: "Waiting on client", needsYou: false },
  approved: { label: "Approved", needsYou: false },
  scheduled: { label: "Scheduled", needsYou: false },
  sent: { label: "Sent", needsYou: false },
};

export default async function DashboardPage() {
  const ctx = await requireStaff();
  const data = await getDashboardData(ctx.role);
  const admin = isAdmin(ctx.role);
  const { data: recentRows } = await createClient()
    .from("content_projects")
    .select("id, title, status, updated_at")
    .neq("status", "archived")
    .order("updated_at", { ascending: false })
    .limit(6);
  const recent = (recentRows as { id: string; title: string; status: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Home</h2>
      </div>

      {/* Start here */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-neutral-900 p-6 text-white">
          <div>
            <p className="text-lg font-semibold">Make this week&apos;s content</p>
            <p className="mt-1 text-sm text-neutral-300">
              Describe what&apos;s going on. You&apos;ll get a newsletter, a blog post, social posts and images.
            </p>
          </div>
          <Link
            href="/create"
            className="self-start rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            + Create content
          </Link>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold">Recent content</p>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-400">Nothing yet. Your first piece will show up here.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recent.map((p) => {
                const st = STATUS_TEXT[p.status] ?? { label: p.status.replace(/_/g, " "), needsYou: false };
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/content/${p.id}`} className="truncate text-sm hover:underline">
                      {p.title}
                    </Link>
                    <span className={`shrink-0 text-xs ${st.needsYou ? "font-medium text-amber-700" : "text-neutral-400"}`}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Active clients" value={formatNumber(data.kpis.activeClients)} />
        {admin && (
          <StatCard
            label="MRR"
            value={data.kpis.mrr === null ? "—" : formatCurrency(data.kpis.mrr)}
            hint="Active recurring revenue"
          />
        )}
        <StatCard label="In pipeline" value={formatNumber(data.kpis.inPipeline)} hint="Not sent/archived" />
        <StatCard label="Pending approvals" value={formatNumber(data.kpis.pendingApprovals)} />
        <StatCard
          label="Avg authenticity"
          value={data.kpis.avgAuthenticity === null ? "—" : data.kpis.avgAuthenticity}
          hint="Target ≥ 90"
        />
      </div>

      {/* Pipeline + clients */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PipelineBar pipeline={data.pipeline} />
        <ClientOverview clients={data.clients} />
      </div>
    </div>
  );
}
