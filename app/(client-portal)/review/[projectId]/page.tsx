import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/guards";
import { getClientProjectBundle } from "@/lib/data/approvals";
import { clientDecision } from "@/lib/actions/approvals";
import { DecisionForm } from "@/components/approvals/DecisionForm";

export default async function ClientProjectReviewPage({ params }: { params: { projectId: string } }) {
  await requireClient();
  const bundle = await getClientProjectBundle(params.projectId);
  if (!bundle) notFound();
  const { project, pieces } = bundle;
  const open = project.status === "client_review";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/review" className="text-xs text-neutral-500 hover:underline">← Back</Link>
        <h2 className="mt-1 text-xl font-semibold">{project.title}</h2>
        <p className="text-sm text-neutral-500">
          {open ? "Please review and approve, or request changes." : `Status: ${project.status.replace(/_/g, " ")}`}
        </p>
      </div>

      <div className="space-y-4">
        {pieces.length === 0 ? (
          <p className="text-sm text-neutral-400">No content to review yet.</p>
        ) : (
          pieces.map((p) => {
            const meta = (p.metadata as Record<string, unknown>) ?? {};
            return (
              <div key={p.id} className="rounded-lg border border-neutral-200 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{p.channel}</p>
                {Array.isArray(meta.subjectLines) && (meta.subjectLines as string[]).length > 0 && (
                  <p className="mb-2 text-xs text-neutral-500">
                    Subject options: {(meta.subjectLines as string[]).join(" · ")}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm text-neutral-800">{p.body || "—"}</p>
              </div>
            );
          })
        )}
      </div>

      {open && (
        <div className="max-w-md rounded-lg border border-neutral-200 p-4">
          <p className="mb-2 text-sm font-medium">Your decision</p>
          <DecisionForm action={clientDecision.bind(null, project.id)} label="Submit decision" />
        </div>
      )}
    </div>
  );
}
