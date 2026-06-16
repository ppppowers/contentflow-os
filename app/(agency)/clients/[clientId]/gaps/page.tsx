import { requireStaff } from "@/lib/auth/guards";
import { getLatestGapAnalysis } from "@/lib/data/gaps";
import { GenerateGapButton } from "@/components/gaps/GenerateGapButton";

function Block({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <ul className="list-inside list-disc text-sm text-neutral-700">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}

export default async function GapsPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const report = await getLatestGapAnalysis(params.clientId);
  const g = report?.payload ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Content Gap Analysis</h3>
          <p className="text-xs text-neutral-500">Missing topics, untapped services, and overused content.</p>
        </div>
        <GenerateGapButton clientId={params.clientId} hasReport={!!report} />
      </div>

      {!g ? (
        <p className="text-sm text-neutral-400">No analysis yet. Run it once the client has some content history.</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-700">{g.summary}</p>
          <p className="text-xs text-neutral-400">{new Date(report!.created_at).toLocaleString()}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Block label="Missing topics" items={g.missingTopics} />
            <Block label="Untapped services" items={g.untappedServices} />
            <Block label="Overused content" items={g.overusedContent} />
            <Block label="Recommendations" items={g.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
