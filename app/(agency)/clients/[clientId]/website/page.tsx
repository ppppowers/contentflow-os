import { requireStaff } from "@/lib/auth/guards";
import { getClient } from "@/lib/data/clients";
import { getLatestAnalysis } from "@/lib/data/website";
import { saveAnalysisToBrain } from "@/lib/actions/website";
import { AnalyzeWebsiteButton } from "@/components/website/AnalyzeWebsiteButton";

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className="rounded bg-neutral-100 px-2 py-0.5 text-sm text-neutral-700">{s}</span>
        ))}
      </div>
    </div>
  );
}

function Ideas({ title, ideas }: { title: string; ideas: { title: string; angle: string }[] }) {
  if (ideas.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="space-y-1.5">
        {ideas.map((it, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-neutral-900">{it.title}</span>
            <span className="block text-xs text-neutral-500">{it.angle}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function WebsitePage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const [client, analysis] = await Promise.all([getClient(params.clientId), getLatestAnalysis(params.clientId)]);
  const a = analysis?.payload ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Website Intelligence</h3>
          {client?.website_url ? (
            <a href={client.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
              {client.website_url}
            </a>
          ) : (
            <p className="text-xs text-amber-600">No website URL on this client. Add one on the Overview tab.</p>
          )}
        </div>
        {client?.website_url && <AnalyzeWebsiteButton clientId={params.clientId} hasAnalysis={!!analysis} />}
      </div>

      {a && (
        <div className="space-y-5">
          <p className="text-xs text-neutral-400">
            Analyzed {analysis!.pages.length} page(s) · {new Date(analysis!.created_at).toLocaleString()}
          </p>

          <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Brand voice</p>
              <p className="text-sm text-neutral-700">{a.brandVoice}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Audience</p>
              <p className="text-sm text-neutral-700">{a.audience}</p>
            </div>
            <List title="Services" items={a.services} />
            <List title="Keywords" items={a.keywords} />
            <List title="Unique selling points" items={a.uniqueSellingPoints} />
            <form action={saveAnalysisToBrain.bind(null, params.clientId)}>
              <button className="text-xs text-blue-600 hover:underline">Save services &amp; USPs to Business Brain →</button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Ideas title="Newsletter ideas" ideas={a.ideas.newsletters} />
            <Ideas title="Blog ideas" ideas={a.ideas.blogs} />
            <Ideas title="Campaign ideas" ideas={a.ideas.campaigns} />
          </div>
        </div>
      )}

      {!a && client?.website_url && (
        <p className="text-sm text-neutral-400">No analysis yet. Run it to extract voice, services, keywords, and content ideas.</p>
      )}
    </div>
  );
}
