import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const LABELS: Record<string, string> = {
  intake_received: "Intake",
  research_complete: "Research",
  draft_generated: "Draft",
  internal_review: "Internal",
  client_review: "Client",
  revision_requested: "Revision",
  approved: "Approved",
  scheduled: "Scheduled",
  sent: "Sent",
  archived: "Archived",
};

export function PipelineBar({ pipeline }: { pipeline: { status: string; count: number }[] }) {
  const max = Math.max(1, ...pipeline.map((p) => p.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pipeline.map((p) => (
          <div key={p.status} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-neutral-500">{LABELS[p.status]}</span>
            <div className="h-4 flex-1 rounded bg-neutral-100">
              <div
                className="h-4 rounded bg-neutral-800"
                style={{ width: `${(p.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs tabular-nums text-neutral-600">{p.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
