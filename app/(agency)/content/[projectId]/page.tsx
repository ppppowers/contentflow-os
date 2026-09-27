import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { getProjectBundle } from "@/lib/data/content";
import { getApprovals, getRevisions } from "@/lib/data/approvals";
import { checkProjectSimilarity } from "@/lib/memory/engine";
import { evidenceScore } from "@/lib/evidence/score";
import { getLatestQARun } from "@/lib/data/qa";
import { QAControls } from "@/components/qa/QAControls";
import { getLatestScorecard } from "@/lib/data/scorecard";
import { ScorecardButton } from "@/components/scorecard/ScorecardButton";
import { SCORECARD_DIMENSIONS, SCORECARD_LABELS, SCORECARD_TARGET } from "@/lib/validation/scorecard";
import {
  internalDecision,
  resubmitForReview,
  markRevisionAddressed,
} from "@/lib/actions/approvals";
import { DecisionForm } from "@/components/approvals/DecisionForm";
import { archiveProject, unarchiveProject } from "@/lib/actions/content";
import { promoteProject } from "@/lib/actions/agency-brain";
import { SEQUENCE } from "@/lib/agents/registry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProjectRunner } from "@/components/content/ProjectRunner";
import { PieceCard } from "@/components/content/PieceCard";
import { listProjectImages } from "@/lib/data/images";
import { IMAGE_CHANNELS } from "@/lib/images/service";
import { RegenerateButton } from "@/components/content/RegenerateButton";

const RUN_TONE: Record<string, BadgeTone> = {
  succeeded: "green",
  running: "blue",
  failed: "red",
  queued: "neutral",
};

// Display order for finished pieces: the things people post most, first.
const CHANNEL_ORDER = ["linkedin", "instagram", "facebook", "newsletter", "blog", "sms", "website_announcement"];

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: { run?: string };
}) {
  await requireStaff();
  const bundle = await getProjectBundle(params.projectId);
  if (!bundle) notFound();
  const { project, runs, latest, pieces, authenticity } = bundle;
  const [approvals, revisions, similar, qaRun, images] = await Promise.all([
    getApprovals(project.id),
    getRevisions(project.id),
    checkProjectSimilarity(project.id),
    getLatestQARun(project.id),
    listProjectImages(project.id),
  ]);
  const finished = SEQUENCE.every((a) => a in latest);
  const orderedPieces = pieces
    .filter((p) => p.body?.trim())
    .sort((a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel));
  const scorecard = await getLatestScorecard(project.id);

  // Latest run status per agent for the timeline.
  const runByAgent = new Map<string, { status: string; cost_usd: number | null; error: string | null }>();
  for (const r of runs as { agent: string; status: string; cost_usd: number | null; error: string | null }[]) {
    runByAgent.set(r.agent, r);
  }
  const totalCost = (runs as { cost_usd: number | null }[]).reduce((a, r) => a + (r.cost_usd ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content" className="text-xs text-neutral-500 hover:underline">← Content</Link>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="text-xl font-semibold">{project.title}</h2>
          <Badge tone="neutral">{project.status.replace(/_/g, " ")}</Badge>
          {project.authenticity_score !== null && (
            <Badge tone={project.authenticity_score >= 90 ? "green" : "amber"}>
              Authenticity {project.authenticity_score}
            </Badge>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          {project.clients?.name} · spend ${totalCost.toFixed(4)}
        </p>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <Link href={`/content/${project.id}/export`} className="text-blue-600 hover:underline">
            Export
          </Link>
          {project.status === "approved" && (
            <form action={promoteProject.bind(null, project.id)}>
              <button className="text-neutral-500 hover:underline">Promote to Agency Brain</button>
            </form>
          )}
          {project.status === "archived" ? (
            <form action={unarchiveProject.bind(null, project.id)}>
              <button className="text-neutral-500 hover:underline">Unarchive</button>
            </form>
          ) : (
            <form action={archiveProject.bind(null, project.id)}>
              <button className="text-neutral-500 hover:underline">Archive</button>
            </form>
          )}
        </div>
      </div>

      {/* Client memory — similarity warnings against past content */}
      {similar.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">⚠ Content memory</p>
          <ul className="mt-1 space-y-1 text-sm text-amber-800">
            {similar.map((m) => (
              <li key={m.projectId}>
                <Link href={`/content/${m.projectId}`} className="underline hover:no-underline">{m.message}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.brief && (
        <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">Brief: </span>
          {project.brief}
        </p>
      )}

      <ProjectRunner
        projectId={project.id}
        steps={SEQUENCE}
        doneSteps={SEQUENCE.filter((a) => a in latest)}
        autoStart={searchParams.run === "1"}
        wantsImages={project.options?.images === true}
        hasImages={images.length > 0}
        finished={finished}
      />

      {/* Finished content — the point of the page */}
      {orderedPieces.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700">Your content</h3>
          {orderedPieces.map((p) => (
            <PieceCard
              key={p.id}
              projectId={project.id}
              piece={{
                id: p.id,
                channel: p.channel,
                body: p.body,
                metadata: (p.metadata as Record<string, unknown>) ?? {},
              }}
              images={images.filter((i) => i.channel === p.channel)}
              canHaveImages={p.channel in IMAGE_CHANNELS}
            />
          ))}
        </section>
      )}

      {/* Review & approval */}
      <Card>
        <CardHeader><CardTitle>Review &amp; approval</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {project.status === "internal_review" && (
            <div className="max-w-md">
              <p className="mb-2 text-sm font-medium">Internal review</p>
              <DecisionForm action={internalDecision.bind(null, project.id)} label="Submit internal decision" />
              <p className="mt-2 text-xs text-neutral-400">Approving sends it to the client for review.</p>
            </div>
          )}

          {project.status === "revision_requested" && (
            <form action={resubmitForReview.bind(null, project.id)}>
              <button className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                Re-submit for internal review
              </button>
            </form>
          )}

          {project.status === "client_review" && (
            <p className="text-sm text-amber-600">Awaiting client decision.</p>
          )}
          {project.status === "approved" && (
            <p className="text-sm text-green-600">Client approved. Ready to schedule/send (Phase 11/12).</p>
          )}

          {/* History */}
          {approvals.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Approvals</p>
              <ul className="space-y-1 text-sm">
                {approvals.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="capitalize">{a.stage} — {a.decision.replace(/_/g, " ")}</span>
                    {a.comment && <span className="text-xs text-neutral-500">{a.comment}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {revisions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Revisions</p>
              <ul className="space-y-1">
                {revisions.map((r) => {
                  const addressed = markRevisionAddressed.bind(null, project.id, r.id);
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3 text-sm">
                      <span>
                        <Badge tone={r.status === "open" ? "amber" : "green"}>{r.scope ?? "—"} · {r.status}</Badge>{" "}
                        {r.instructions}
                      </span>
                      {r.status === "open" && (
                        <form action={addressed}>
                          <button className="shrink-0 text-xs text-blue-600 hover:underline">mark addressed</button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Everything below is for power users: pipeline internals, QA, scores. */}
      <details className="rounded-xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-neutral-600">
          Advanced — pipeline steps, quality checks, costs
        </summary>
        <div className="space-y-6 p-5 pt-2">
      {/* Agent timeline */}
      <Card>
        <CardHeader><CardTitle>Agent pipeline</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {SEQUENCE.map((agent) => {
            const run = runByAgent.get(agent);
            const has = agent in latest;
            return (
              <div key={agent} className="flex items-center justify-between border-b border-neutral-50 py-1.5 text-sm last:border-0">
                <span className="font-medium">{agent.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  {has && <Badge tone="green">output ✓</Badge>}
                  {run && <Badge tone={RUN_TONE[run.status] ?? "neutral"}>{run.status}</Badge>}
                  {!run && !has && <span className="text-xs text-neutral-300">not run</span>}
                  {has && <RegenerateButton projectId={project.id} agent={agent} />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Authenticity report (humanization gate) */}
      {authenticity && (
        <Card>
          <CardHeader><CardTitle>Authenticity report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={authenticity.passed ? "green" : "amber"}>
                Final {authenticity.score} {authenticity.passed ? "· passed" : "· below 90"}
              </Badge>
              <Badge tone="neutral">LLM {authenticity.breakdown?.llm_score ?? "—"}</Badge>
              <Badge tone="neutral">Scanner {authenticity.breakdown?.deterministic_score ?? "—"}</Badge>
              <Badge tone="neutral">−{authenticity.breakdown?.deductions ?? 0} deductions</Badge>
              {authenticity.breakdown?.pass && <Badge tone="neutral">pass {authenticity.breakdown.pass}</Badge>}
            </div>
            {authenticity.flagged_phrases?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {authenticity.flagged_phrases.map((f, i) => (
                  <span key={i} className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    {f.phrase} <span className="text-red-400">({f.kind}×{f.count})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No AI tells flagged by the deterministic scanner.</p>
            )}
            <p className="text-xs text-neutral-400">
              Final score is the stricter of the LLM judgment and the deterministic scanner. Below 90
              triggers up to 3 rewrite passes, then a human flag.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quality Assurance (Phase 19/20) — Red Team + multi-layer QA */}
      <Card>
        <CardHeader><CardTitle>Quality assurance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <QAControls projectId={project.id} />
          {qaRun && (
            <div className="space-y-1">
              {qaRun.layers.map((l) => (
                <div key={l.layer} className="flex items-start justify-between gap-3 border-b border-neutral-50 py-1.5 text-sm last:border-0">
                  <span className={`font-medium ${l.layer === "final" ? "text-neutral-900" : "text-neutral-600"}`}>
                    {l.layer.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    {l.findings.length > 0 && l.layer !== "final" && (
                      <span className="max-w-md text-right text-xs text-neutral-400">{l.findings[0]}</span>
                    )}
                    {l.score !== null && <Badge tone="neutral">{l.score}</Badge>}
                    <Badge tone={l.passed ? "green" : "red"}>{l.passed ? "pass" : "fail"}</Badge>
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-neutral-400">
                Content cannot ship until Red Team and every QA layer pass.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Quality Scorecard (Phase 21) — 8 dimensions, target 95+ */}
      <Card>
        <CardHeader><CardTitle>Output quality scorecard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <ScorecardButton projectId={project.id} has={!!scorecard} />
            {scorecard && (
              <Badge tone={scorecard.passed ? "green" : "amber"}>
                Overall {scorecard.overall} {scorecard.passed ? `· ≥${SCORECARD_TARGET}` : `· below ${SCORECARD_TARGET}`}
              </Badge>
            )}
          </div>
          {scorecard && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SCORECARD_DIMENSIONS.map((d) => {
                  const v = scorecard.scores[d] ?? 0;
                  return (
                    <div key={d} className="rounded border border-neutral-100 p-2">
                      <p className="text-xs text-neutral-500">{SCORECARD_LABELS[d]}</p>
                      <p className={`text-lg font-semibold ${v >= SCORECARD_TARGET ? "text-green-600" : v >= 80 ? "text-amber-600" : "text-red-600"}`}>{v}</p>
                    </div>
                  );
                })}
              </div>
              {scorecard.summary && <p className="text-sm text-neutral-600">{scorecard.summary}</p>}
              {!scorecard.passed && <p className="text-xs text-amber-600">Below {SCORECARD_TARGET} — revision required.</p>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Evidence strength (Phase 17) — specificity per piece */}
      {pieces.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Evidence strength</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {pieces.filter((p) => p.body?.trim()).map((p) => {
              const ev = evidenceScore(p.body);
              return (
                <div key={p.id} className="flex items-center justify-between border-b border-neutral-50 py-1.5 text-sm last:border-0">
                  <span className="font-medium">{p.channel}</span>
                  <div className="flex items-center gap-2">
                    {ev.suggestions.length > 0 && (
                      <span className="text-xs text-neutral-400">{ev.suggestions[0]}</span>
                    )}
                    <Badge tone={ev.score >= 60 ? "green" : ev.score >= 30 ? "amber" : "red"}>
                      Evidence {ev.score}
                    </Badge>
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-neutral-400">Specificity score: concrete numbers, dates, quotes, and named people/places.</p>
          </CardContent>
        </Card>
      )}

      {/* Raw agent outputs (audit) */}
      <Card>
        <CardHeader><CardTitle>Latest agent outputs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Object.keys(latest).length === 0 ? (
            <p className="text-sm text-neutral-400">No outputs yet. Run the pipeline.</p>
          ) : (
            Object.entries(latest).map(([agent, payload]) => (
              <details key={agent} className="rounded border border-neutral-200 p-2">
                <summary className="cursor-pointer text-sm font-medium">{agent.replace(/_/g, " ")}</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-neutral-600">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </details>
            ))
          )}
        </CardContent>
      </Card>
        </div>
      </details>
    </div>
  );
}
