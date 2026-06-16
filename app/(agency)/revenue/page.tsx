import { requireAdmin } from "@/lib/auth/guards";
import { getRevenueOverview, getRevenueFormOptions } from "@/lib/data/revenue";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SubStatusControl } from "@/components/revenue/SubStatusControl";
import { AddPackageForm, AddSubscriptionForm, RecordEventForm } from "@/components/revenue/RevenueForms";

const SUB_TONE: Record<string, BadgeTone> = {
  active: "green",
  past_due: "amber",
  paused: "neutral",
  cancelled: "red",
};
const PAY_TONE: Record<string, BadgeTone> = { paid: "green", pending: "amber", failed: "red" };

export default async function RevenuePage() {
  await requireAdmin();
  const [data, options] = await Promise.all([getRevenueOverview(), getRevenueFormOptions()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Revenue</h2>
        <p className="text-sm text-neutral-500">Recurring revenue, subscriptions, and billing (manual)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(data.mrr)} hint="Active subscriptions" />
        <StatCard label="ARR" value={formatCurrency(data.arr)} hint="MRR × 12" />
        <StatCard label="Active subs" value={formatNumber(data.activeSubs)} />
        <StatCard
          label="Total subs"
          value={formatNumber(Object.values(data.byStatus).reduce((a, b) => a + b, 0))}
        />
      </div>

      {/* Subscriptions + LTV */}
      <Card>
        <CardHeader><CardTitle>Subscriptions &amp; client LTV</CardTitle></CardHeader>
        <CardContent className="p-0">
          {data.clients.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-400">No subscriptions yet. Add one below.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <tr className="border-b border-neutral-100">
                  <th className="px-5 py-2">Client</th>
                  <th className="px-5 py-2">MRR</th>
                  <th className="px-5 py-2">LTV</th>
                  <th className="px-5 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((c) => (
                  <tr key={c.subscription_id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-5 py-2 font-medium">{c.name}</td>
                    <td className="px-5 py-2">{formatCurrency(c.monthly_amount)}</td>
                    <td className="px-5 py-2">{formatCurrency(c.ltv)}</td>
                    <td className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={SUB_TONE[c.status] ?? "neutral"}>{c.status.replace(/_/g, " ")}</Badge>
                        <SubStatusControl subId={c.subscription_id} current={c.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent revenue events */}
      <Card>
        <CardHeader><CardTitle>Recent revenue events</CardTitle></CardHeader>
        <CardContent className="p-0">
          {data.recentEvents.length === 0 ? (
            <p className="px-5 py-6 text-sm text-neutral-400">No revenue events recorded yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.recentEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-5 py-2 text-sm">
                  <span>
                    <span className="capitalize">{e.type}</span> · {e.client?.name ?? "—"}
                    <span className="ml-2 text-xs text-neutral-400">
                      {new Date(e.occurred_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span>{formatCurrency(Number(e.amount))}</span>
                    <Badge tone={PAY_TONE[e.payment_status] ?? "neutral"}>{e.payment_status}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Manual entry forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Add package</CardTitle></CardHeader>
          <CardContent><AddPackageForm /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Add subscription</CardTitle></CardHeader>
          <CardContent><AddSubscriptionForm options={options} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Record revenue event</CardTitle></CardHeader>
          <CardContent><RecordEventForm options={options} /></CardContent>
        </Card>
      </div>

      <p className="text-xs text-neutral-400">
        Billing is manual (locked default). Stripe sync is a later option — env has the Stripe MCP.
      </p>
    </div>
  );
}
