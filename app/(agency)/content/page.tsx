import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { listProjects } from "@/lib/data/content";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "neutral" | "blue" | "green" | "amber"> = {
  intake_received: "neutral",
  research_complete: "blue",
  draft_generated: "blue",
  internal_review: "amber",
  client_review: "amber",
  revision_requested: "amber",
  approved: "green",
  scheduled: "green",
  sent: "green",
  archived: "neutral",
};

export default async function ContentPage({ searchParams }: { searchParams: { archived?: string } }) {
  await requireStaff();
  const archived = searchParams.archived === "1";
  const projects = await listProjects(archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content</h2>
          <p className="text-sm text-neutral-500">
            {projects.length} {archived ? "archived" : "active"} projects
          </p>
        </div>
        <Link
          href={archived ? "/content" : "/content?archived=1"}
          className="text-sm text-blue-600 hover:underline"
        >
          {archived ? "← Active" : "View archived"}
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-400">
              No content yet.{" "}
              <Link href="/create" className="font-medium text-neutral-900 underline">
                Create your first piece →
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link href={`/content/${p.id}`} className="text-sm font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-neutral-400">{p.clients?.name ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.authenticity_score !== null && (
                      <Badge tone={p.authenticity_score >= 90 ? "green" : "amber"}>
                        {p.authenticity_score}
                      </Badge>
                    )}
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status.replace(/_/g, " ")}</Badge>
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
