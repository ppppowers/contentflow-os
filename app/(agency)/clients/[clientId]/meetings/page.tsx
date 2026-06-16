import { requireStaff } from "@/lib/auth/guards";
import { listMeetingReports } from "@/lib/data/voice";
import { captureReportToIntake } from "@/lib/actions/voice";
import { VoiceIntake } from "@/components/voice/VoiceIntake";
import { MEETING_SOURCE_LABELS, type MeetingSource } from "@/lib/validation/voice";
import { Badge } from "@/components/ui/badge";

function Section({ title, items }: { title: string; items: { title: string; detail: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i}><span className="font-medium">{it.title}</span> — <span className="text-neutral-700">{it.detail}</span></li>
        ))}
      </ul>
    </div>
  );
}

export default async function MeetingsPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const reports = await listMeetingReports(params.clientId);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-900">Voice &amp; Meeting Intelligence</h3>
        <p className="text-xs text-neutral-500">
          Turn transcripts, Zoom exports, and call summaries into content. Extracts stories, promos, wins, and opportunities.
        </p>
      </div>

      <VoiceIntake clientId={params.clientId} />

      {reports.length === 0 ? (
        <p className="text-sm text-neutral-400">No reports yet.</p>
      ) : (
        reports.map((r) => {
          const e = r.payload.extracted;
          const push = captureReportToIntake.bind(null, params.clientId, r.id);
          return (
            <div key={r.id} className="space-y-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{r.title}</span>
                <Badge tone="neutral">{MEETING_SOURCE_LABELS[r.source_type as MeetingSource] ?? r.source_type}</Badge>
                <span className="ml-auto text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-neutral-700">{r.payload.summary}</p>

              <Section title="Stories" items={e.stories} />
              <Section title="Promotions" items={e.promotions} />
              <Section title="Customer wins" items={e.customerWins} />
              <Section title="Content opportunities" items={e.contentOpportunities} />

              {r.payload.notableQuotes.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Notable quotes</p>
                  <ul className="space-y-1 text-sm italic text-neutral-600">
                    {r.payload.notableQuotes.map((q, i) => <li key={i}>“{q}”</li>)}
                  </ul>
                </div>
              )}

              <form action={push}>
                <button className="text-xs text-blue-600 hover:underline">Send opportunities to this month&apos;s intake →</button>
              </form>
            </div>
          );
        })
      )}
    </div>
  );
}
