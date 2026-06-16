import { requireStaff } from "@/lib/auth/guards";
import { listBrainEntries } from "@/lib/data/brain";
import { addBrainEntry, deleteBrainEntry, setBrainEntryActive } from "@/lib/actions/brain";
import { BrainEntryForm } from "@/components/clients/BrainEntryForm";
import { BRAIN_CATEGORIES, BRAIN_CATEGORY_LABELS, type BrainCategory } from "@/lib/validation/brain";
import { Badge } from "@/components/ui/badge";

export default async function BrainPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const entries = await listBrainEntries(params.clientId);
  const addAction = addBrainEntry.bind(null, params.clientId);

  const byCategory = BRAIN_CATEGORIES.map((cat) => ({
    cat,
    items: entries.filter((e) => e.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-900">Business Brain</h3>
        <p className="text-xs text-neutral-500">
          Permanent client knowledge. Every content run consults active entries before writing.
        </p>
      </div>

      <BrainEntryForm action={addAction} />

      {byCategory.length === 0 ? (
        <p className="text-sm text-neutral-400">Brain is empty. Add what the writers should always know.</p>
      ) : (
        byCategory.map(({ cat, items }) => (
          <section key={cat} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {BRAIN_CATEGORY_LABELS[cat as BrainCategory]}
            </h4>
            <ul className="space-y-2">
              {items.map((e) => {
                const del = deleteBrainEntry.bind(null, params.clientId, e.id);
                const toggle = setBrainEntryActive.bind(null, params.clientId, e.id, !e.is_active);
                return (
                  <li key={e.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">{e.title}</span>
                          {!e.is_active && <Badge tone="neutral">Inactive</Badge>}
                          {e.priority > 0 && <Badge tone="amber">P{e.priority}</Badge>}
                        </div>
                        {e.body && <p className="whitespace-pre-wrap text-sm text-neutral-700">{e.body}</p>}
                        <p className="text-xs text-neutral-400">{e.source}</p>
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
        ))
      )}
    </div>
  );
}
