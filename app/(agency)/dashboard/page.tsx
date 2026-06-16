import { requireStaff } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/data/dashboard";
import { isAdmin } from "@/lib/auth/roles";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineBar } from "@/components/dashboard/PipelineBar";
import { ClientOverview } from "@/components/dashboard/ClientOverview";

export default async function DashboardPage() {
  const ctx = await requireStaff();
  const data = await getDashboardData(ctx.role);
  const admin = isAdmin(ctx.role);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-neutral-500">Agency overview</p>
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
