import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { listClients } from "@/lib/data/clients";
import { getRecentCaptures } from "@/lib/data/harvest";
import { QuickCapture } from "@/components/harvest/QuickCapture";
import { HarvestMedia } from "@/components/harvest/HarvestMedia";
import { INTAKE_TYPE_LABELS } from "@/lib/validation/intake";
import { Badge } from "@/components/ui/badge";

export default async function CollectPage({ searchParams }: { searchParams: { client?: string } }) {
  const ctx = await requireStaff();
  const clients = await listClients();
  const selectedId = searchParams.client ?? clients[0]?.id ?? null;
  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const captures = selected ? await getRecentCaptures(selected.id) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Content Collection Center</h2>
        <p className="text-xs text-neutral-500">
          Frictionless capture. Pick a client, tap a card, jot a sentence. It lands in this month's intake.
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-neutral-400">No clients yet. <Link href="/clients/new" className="text-blue-600 hover:underline">Add one</Link>.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/collect?client=${c.id}`}
                className={`rounded-full border px-3 py-1 text-sm ${
                  c.id === selectedId ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {selected && (
            <div className="space-y-6">
              <QuickCapture clientId={selected.id} />
              <HarvestMedia agencyId={ctx.agencyId} clientId={selected.id} />

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent captures</h3>
                {captures.length === 0 ? (
                  <p className="text-sm text-neutral-400">Nothing captured yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {captures.map((c) => (
                      <li key={c.id} className="rounded-lg border border-neutral-200 p-3">
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{INTAKE_TYPE_LABELS[c.type as keyof typeof INTAKE_TYPE_LABELS] ?? c.type}</Badge>
                          {c.title && <span className="text-sm font-medium">{c.title}</span>}
                          <span className="ml-auto text-xs text-neutral-400">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        {c.body && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{c.body}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
