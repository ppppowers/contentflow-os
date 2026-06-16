import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { getSubmission, listSubmissions, listItems, listFiles, signedFileUrl } from "@/lib/data/intake";
import {
  startIntake,
  addIntakeItem,
  deleteIntakeItem,
  deleteIntakeFile,
  submitIntake,
  markReviewed,
} from "@/lib/actions/intake";
import { createProjectFromSubmission } from "@/lib/actions/content";
import { currentPeriod, isValidPeriod, INTAKE_TYPE_LABELS } from "@/lib/validation/intake";
import { AddIntakeItemForm } from "@/components/intake/AddIntakeItemForm";
import { FileUpload } from "@/components/intake/FileUpload";
import { GenerateBriefButton } from "@/components/interview/GenerateBriefButton";
import { getLatestBrief } from "@/lib/data/interview";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/form";

const STATUS_TONE: Record<string, BadgeTone> = { open: "neutral", submitted: "blue", reviewed: "green" };

function periodLabel(p: string) {
  return new Date(p).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { period?: string };
}) {
  const ctx = await requireStaff();
  const clientId = params.clientId;
  const period = searchParams.period && isValidPeriod(searchParams.period) ? searchParams.period : currentPeriod();

  const [submission, past] = await Promise.all([getSubmission(clientId, period), listSubmissions(clientId)]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_220px]">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-neutral-700">Intake — {periodLabel(period)}</h3>
          {submission && <Badge tone={STATUS_TONE[submission.status] ?? "neutral"}>{submission.status}</Badge>}
        </div>

        {!submission ? (
          <form action={startIntake.bind(null, clientId, period)}>
            <SubmitButton>Start this month&apos;s intake</SubmitButton>
          </form>
        ) : (
          <IntakeBody ctx={ctx} clientId={clientId} submission={submission} />
        )}
      </div>

      {/* Period switcher */}
      <aside className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Past periods</p>
        {past.length === 0 && <p className="text-xs text-neutral-400">None yet.</p>}
        {past.map((s) => (
          <Link
            key={s.id}
            href={`/clients/${clientId}/intake?period=${s.period}`}
            className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-neutral-100"
          >
            <span>{periodLabel(s.period)}</span>
            <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status}</Badge>
          </Link>
        ))}
      </aside>
    </div>
  );
}

async function IntakeBody({
  ctx,
  clientId,
  submission,
}: {
  ctx: { agencyId: string };
  clientId: string;
  submission: { id: string; status: string };
}) {
  const [items, files, brief] = await Promise.all([
    listItems(submission.id),
    listFiles(submission.id),
    getLatestBrief(submission.id),
  ]);
  const signed = await Promise.all(files.map((f) => signedFileUrl(f.storage_path)));
  const editable = submission.status !== "reviewed";

  const addAction = addIntakeItem.bind(null, clientId, submission.id);

  return (
    <div className="space-y-6">
      {editable && <AddIntakeItemForm action={addAction} />}

      {/* Items */}
      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-neutral-400">No updates yet.</li>
        ) : (
          items.map((it) => {
            const del = deleteIntakeItem.bind(null, clientId, it.id);
            return (
              <li key={it.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge tone="neutral">{INTAKE_TYPE_LABELS[it.type as keyof typeof INTAKE_TYPE_LABELS]}</Badge>
                    {it.title && <p className="text-sm font-medium">{it.title}</p>}
                    <p className="whitespace-pre-wrap text-sm text-neutral-700">{it.body}</p>
                  </div>
                  {editable && (
                    <form action={del}>
                      <button className="text-xs text-red-600 hover:underline">Delete</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Files */}
      <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-medium">Attachments</p>
        {editable && <FileUpload agencyId={ctx.agencyId} clientId={clientId} submissionId={submission.id} />}
        <ul className="space-y-1">
          {files.map((f, i) => {
            const del = deleteIntakeFile.bind(null, clientId, f.id, f.storage_path);
            return (
              <li key={f.id} className="flex items-center justify-between text-sm">
                {signed[i] ? (
                  <a href={signed[i]!} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {f.file_name}
                  </a>
                ) : (
                  <span>{f.file_name}</span>
                )}
                {editable && (
                  <form action={del}>
                    <button className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Client Interview Agent — Monthly Intelligence Brief */}
      <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Intelligence Brief</p>
            <p className="text-xs text-neutral-400">Interrogates this month&apos;s input and proposes follow-up questions.</p>
          </div>
          <GenerateBriefButton submissionId={submission.id} hasBrief={!!brief} />
        </div>

        {brief && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={(brief.readiness_score ?? 0) >= 70 ? "green" : "amber"}>
                Readiness {brief.readiness_score ?? "—"}
              </Badge>
              <span className="text-sm text-neutral-700">{brief.summary}</span>
            </div>

            {brief.payload.followUpQuestions.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Follow-up questions</p>
                <ul className="space-y-1.5">
                  {brief.payload.followUpQuestions.map((q, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-neutral-900">{q.question}</span>
                      <span className="block text-xs text-neutral-400">{q.why}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {brief.payload.gaps.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Gaps</p>
                <ul className="list-inside list-disc text-sm text-neutral-700">
                  {brief.payload.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            {(["stories", "promotions", "events", "customerWins", "teamAchievements"] as const).map((cat) => {
              const list = brief.payload.extracted[cat];
              if (list.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{cat}</p>
                  <ul className="space-y-1 text-sm">
                    {list.map((it, i) => (
                      <li key={i}><span className="font-medium">{it.title}</span> — <span className="text-neutral-700">{it.detail}</span></li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workflow */}
      <div className="flex gap-2">
        {submission.status === "open" && (
          <form action={submitIntake.bind(null, clientId, submission.id)}>
            <SubmitButton>Submit intake</SubmitButton>
          </form>
        )}
        {submission.status === "submitted" && (
          <form action={markReviewed.bind(null, clientId, submission.id)}>
            <SubmitButton>Mark reviewed</SubmitButton>
          </form>
        )}
        {submission.status === "reviewed" && (
          <form action={createProjectFromSubmission.bind(null, clientId, submission.id)}>
            <SubmitButton>Create content project →</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
