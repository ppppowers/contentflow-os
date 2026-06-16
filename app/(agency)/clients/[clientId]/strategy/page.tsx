import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { getRoadmap } from "@/lib/data/strategy";
import { GeneratePlanButton } from "@/components/strategy/GeneratePlanButton";
import {
  HORIZONS,
  RECOMMENDATION_TYPE_LABELS,
  groupByWeek,
  isHorizon,
  type Horizon,
  type RecommendationType,
} from "@/lib/validation/strategy";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const TYPE_TONE: Record<RecommendationType, BadgeTone> = {
  newsletter: "blue",
  blog: "green",
  campaign: "amber",
  promotion: "red",
};

export default async function StrategyPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { horizon?: string };
}) {
  await requireStaff();
  const horizonNum = Number(searchParams.horizon);
  const horizon: Horizon = isHorizon(horizonNum) ? horizonNum : 30;
  const roadmap = await getRoadmap(params.clientId, horizon);
  const weeks = horizon / 7;
  const base = `/clients/${params.clientId}/strategy`;
  const grouped = roadmap ? groupByWeek(roadmap.payload.recommendations, weeks) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-neutral-900">Content Strategy</h3>
        <p className="text-xs text-neutral-500">30/60/90-day roadmaps from the client&apos;s brain, stories, and site.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {HORIZONS.map((h) => (
          <Link
            key={h}
            href={`${base}?horizon=${h}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              h === horizon ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {h} days
          </Link>
        ))}
        <span className="ml-auto"><GeneratePlanButton clientId={params.clientId} horizon={horizon} /></span>
      </div>

      {!roadmap ? (
        <p className="text-sm text-neutral-400">No {horizon}-day roadmap yet. Generate one.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">{roadmap.payload.summary}</p>
          <p className="text-xs text-neutral-400">Generated {new Date(roadmap.created_at).toLocaleString()}</p>

          {grouped.map(({ week, items }) => (
            <div key={week} className="rounded-lg border border-neutral-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Week {week}</p>
              <ul className="space-y-2">
                {items.map((r, i) => (
                  <li key={i} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge tone={TYPE_TONE[r.type]}>{RECOMMENDATION_TYPE_LABELS[r.type]}</Badge>
                      <span className="text-sm font-medium text-neutral-900">{r.title}</span>
                    </div>
                    <p className="text-sm text-neutral-700">{r.angle}</p>
                    <p className="text-xs text-neutral-400">{r.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
