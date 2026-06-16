import { requireStaff } from "@/lib/auth/guards";
import { listAgencyBrainEntries } from "@/lib/data/agency-brain";
import { summarizeStats } from "@/lib/agency-brain/retrieval";
import { addAgencyBrainEntry, setAgencyEntryActive, deleteAgencyEntry } from "@/lib/actions/agency-brain";
import { AgencyBrainForm } from "@/components/agency-brain/AgencyBrainForm";
import { AGENCY_BRAIN_CATEGORIES, AGENCY_BRAIN_CATEGORY_LABELS, type AgencyBrainCategory } from "@/lib/validation/agency-brain";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AgencyBrainPage() {
  await requireStaff();
  const entries = await listAgencyBrainEntries();
  const stats = summarizeStats(entries);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Agency Brain</h2>
        <p className="text-xs text-neutral-500">
          Proven patterns harvested from winning work across all clients. Injected into every
          generation as exemplars. Auto-harvested when a client approves a project.
        </p>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.category}>
            <CardContent className="p-3">
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className="text-2xl font-semibold">{s.count}</p>
              <p className="text-xs text-neutral-400">{s.topScore !== null ? `top ${s.topScore}` : "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AgencyBrainForm action={addAgencyBrainEntry} />

      {AGENCY_BRAIN_CATEGORIES.map((cat) => {
        const items = entries.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {AGENCY_BRAIN_CATEGORY_LABELS[cat as AgencyBrainCategory]}
            </h3>
            <ul className="space-y-2">
              {items.map((e) => {
                const toggle = setAgencyEntryActive.bind(null, e.id, !e.is_active);
                const del = deleteAgencyEntry.bind(null, e.id);
                return (
                  <li key={e.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {e.authenticity_score !== null && <Badge tone="green">score {e.authenticity_score}</Badge>}
                          {e.times_used > 0 && <Badge tone="neutral">used {e.times_used}×</Badge>}
                          {!e.is_active && <Badge tone="neutral">Inactive</Badge>}
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-neutral-800">{e.content}</p>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <form action={toggle}>
                          <button className="text-xs text-neutral-500 hover:underline">
                            {e.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                        <form action={del}>
                          <button className="text-xs text-red-600 hover:underline">Delete</button>
                        </form>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
