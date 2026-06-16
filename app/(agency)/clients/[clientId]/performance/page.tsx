import { requireStaff } from "@/lib/auth/guards";
import { listMetrics, getLatestReport } from "@/lib/data/performance";
import { recordMetric, deleteMetric } from "@/lib/actions/performance";
import { computeRates } from "@/lib/validation/performance";
import { MetricForm } from "@/components/performance/MetricForm";
import { GenerateInsightsButton } from "@/components/performance/GenerateInsightsButton";

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <ul className="list-inside list-disc text-sm text-neutral-700">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}

export default async function PerformancePage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const [metrics, report] = await Promise.all([listMetrics(params.clientId), getLatestReport(params.clientId)]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Performance</h3>
          <p className="text-xs text-neutral-500">Record per-send metrics; generate insights on subject lines, CTAs, and topics.</p>
        </div>
        {metrics.length > 0 && <GenerateInsightsButton clientId={params.clientId} />}
      </div>

      <MetricForm action={recordMetric.bind(null, params.clientId)} />

      {metrics.length === 0 ? (
        <p className="text-sm text-neutral-400">No metrics yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-neutral-400">
              <tr>
                <th className="py-1 pr-3">Date</th><th className="pr-3">Channel</th><th className="pr-3">Subject</th>
                <th className="pr-3">Sent</th><th className="pr-3">Open</th><th className="pr-3">Click</th>
                <th className="pr-3">Reply</th><th className="pr-3">Conv</th><th className="pr-3">Unsub</th><th></th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const r = computeRates(m);
                const del = deleteMetric.bind(null, params.clientId, m.id);
                return (
                  <tr key={m.id} className="border-t border-neutral-100">
                    <td className="py-1 pr-3 text-neutral-500">{m.recorded_at}</td>
                    <td className="pr-3">{m.channel}</td>
                    <td className="pr-3 text-neutral-700">{m.subject_line ?? "—"}</td>
                    <td className="pr-3">{m.sent}</td>
                    <td className="pr-3">{r.openRate}%</td>
                    <td className="pr-3">{r.clickRate}%</td>
                    <td className="pr-3">{r.replyRate}%</td>
                    <td className="pr-3">{r.conversionRate}%</td>
                    <td className="pr-3">{r.unsubRate}%</td>
                    <td><form action={del}><button className="text-xs text-red-600 hover:underline">del</button></form></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {report && (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Insights</p>
            <p className="text-sm text-neutral-700">{report.payload.summary}</p>
            <p className="text-xs text-neutral-400">{new Date(report.created_at).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ListBlock label="Subject lines" items={report.payload.subjectLineInsights} />
            <ListBlock label="CTAs" items={report.payload.ctaInsights} />
            <ListBlock label="Topics" items={report.payload.topicInsights} />
            <ListBlock label="Recommendations" items={report.payload.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
