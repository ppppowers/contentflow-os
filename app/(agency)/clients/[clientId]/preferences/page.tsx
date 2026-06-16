import { requireStaff } from "@/lib/auth/guards";
import { getPreferenceProfile } from "@/lib/data/preference";
import { LearnPreferencesButton } from "@/components/preferences/LearnPreferencesButton";
import { Badge } from "@/components/ui/badge";

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <ul className="list-inside list-disc text-sm text-neutral-700">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

export default async function PreferencesPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const profile = await getPreferenceProfile(params.clientId);
  const p = profile?.payload ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Client Preferences</h3>
          <p className="text-xs text-neutral-500">Learned from revision history + approvals. Fed into future content automatically.</p>
        </div>
        <LearnPreferencesButton clientId={params.clientId} hasProfile={!!profile} />
      </div>

      {!p ? (
        <p className="text-sm text-neutral-400">No preference profile yet. Learn from this client&apos;s revision/approval history.</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            {profile!.approval_speed_days !== null && (
              <Badge tone="blue">~{profile!.approval_speed_days} day turnaround</Badge>
            )}
          </div>
          <p className="text-sm text-neutral-700">{p.summary}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ListBlock label="Prefers" items={p.preferences} />
            <ListBlock label="Avoid" items={p.avoid} />
            <ListBlock label="Common requests" items={p.commonRequests} />
            <ListBlock label="Tone adjustments" items={p.toneAdjustments} />
          </div>
          <p className="text-xs text-neutral-400">These are injected into the writers&apos; context on every run for this client.</p>
        </div>
      )}
    </div>
  );
}
