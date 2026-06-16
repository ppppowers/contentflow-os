import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { listClients } from "@/lib/data/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const STATUS_TONE: Record<string, BadgeTone> = { active: "green", paused: "amber", churned: "red" };

export default async function ClientsPage() {
  await requireStaff();
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-sm text-neutral-500">{clients.length} total</p>
        </div>
        <Link href="/clients/new" className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          New client
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-400">No clients yet. Create your first one.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {clients.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link href={`/clients/${c.id}`} className="text-sm font-medium hover:underline">{c.name}</Link>
                    <p className="text-xs text-neutral-400">{c.industry ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={c.health_score >= 80 ? "green" : c.health_score >= 50 ? "amber" : "red"}>{c.health_score}</Badge>
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
