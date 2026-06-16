import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "green",
  paused: "amber",
  churned: "red",
};

function healthTone(score: number): BadgeTone {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

export function ClientOverview({
  clients,
}: {
  clients: { id: string; name: string; status: string; health_score: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {clients.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-400">No clients yet. Add one to get started.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/clients/${c.id}`} className="text-sm font-medium hover:underline">
                  {c.name}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge tone={healthTone(c.health_score)}>{c.health_score}</Badge>
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{c.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
