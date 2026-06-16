import { requireStaff } from "@/lib/auth/guards";
import { getVoiceProfile } from "@/lib/data/voice-profile";
import { applyVoiceToBrand } from "@/lib/actions/voice-profile";
import { LearnVoiceButton } from "@/components/voice-profile/LearnVoiceButton";

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-700">{value}</p>
    </div>
  );
}

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

export default async function VoicePage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const profile = await getVoiceProfile(params.clientId);
  const p = profile?.payload ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Brand Voice (V2)</h3>
          <p className="text-xs text-neutral-500">Learned from the website, past content, and brand samples.</p>
        </div>
        <LearnVoiceButton clientId={params.clientId} hasProfile={!!profile} />
      </div>

      {!p ? (
        <p className="text-sm text-neutral-400">No voice profile yet. Learn one from the client&apos;s existing material.</p>
      ) : (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <Field label="Summary" value={p.summary} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Tone" value={p.tone} />
            <Field label="Personality" value={p.personality} />
            <Field label="Formality" value={p.formality} />
          </div>
          <Field label="CTA style" value={p.ctaStyle} />
          {p.vocabulary.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Vocabulary</p>
              <div className="flex flex-wrap gap-1">
                {p.vocabulary.map((v, i) => <span key={i} className="rounded bg-neutral-100 px-2 py-0.5 text-sm text-neutral-700">{v}</span>)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ListBlock label="Do" items={p.doList} />
            <ListBlock label="Don't" items={p.dontList} />
          </div>
          <form action={applyVoiceToBrand.bind(null, params.clientId)}>
            <button className="text-xs text-blue-600 hover:underline">Apply to Brand Profile (used by the writers) →</button>
          </form>
        </div>
      )}
    </div>
  );
}
