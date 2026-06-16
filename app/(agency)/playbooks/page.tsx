import { requireStaff } from "@/lib/auth/guards";
import { listPlaybooks } from "@/lib/data/playbook";
import { GeneratePlaybookButton } from "@/components/playbooks/GeneratePlaybookButton";
import { INDUSTRIES } from "@/lib/validation/playbook";
import { Badge } from "@/components/ui/badge";

function Chips({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="list-inside list-disc space-y-0.5 text-sm text-neutral-700">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

export default async function PlaybooksPage() {
  await requireStaff();
  const playbooks = await listPlaybooks();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Industry Playbooks</h2>
        <p className="text-xs text-neutral-500">
          Per-industry campaign ideas, topic libraries, seasonal content, subject lines, and CTAs.
          The Strategy Engine consults the matching playbook for each client.
        </p>
      </div>

      {INDUSTRIES.map((industry) => {
        const pb = playbooks[industry];
        return (
          <details key={industry} className="rounded-lg border border-neutral-200 p-4" open={!!pb}>
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                {industry}
                {pb ? <Badge tone="green">ready</Badge> : <Badge tone="neutral">none</Badge>}
              </span>
              <GeneratePlaybookButton industry={industry} exists={!!pb} />
            </summary>
            {pb && (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Chips title="Campaign ideas" items={pb.payload.campaignIdeas} />
                <Chips title="Topic library" items={pb.payload.topicLibrary} />
                <Chips title="Subject lines" items={pb.payload.subjectLines} />
                <Chips title="CTAs" items={pb.payload.ctas} />
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Seasonal</p>
                  <ul className="space-y-0.5 text-sm text-neutral-700">
                    {pb.payload.seasonalContent.map((s, i) => (
                      <li key={i}><span className="font-medium">{s.when}:</span> {s.idea}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}
