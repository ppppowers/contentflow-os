import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { listStories } from "@/lib/data/story";
import { addStory, setStoryStatus, deleteStory, sendStoryToIntake } from "@/lib/actions/stories";
import { MineButton } from "@/components/stories/MineButton";
import { StoryForm } from "@/components/stories/StoryForm";
import { STORY_CATEGORIES, STORY_CATEGORY_LABELS, type StoryCategory } from "@/lib/validation/story";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const STATUS_TONE: Record<string, BadgeTone> = { lead: "neutral", ready: "blue", used: "green" };
const NEXT_STATUS: Record<string, string> = { lead: "ready", ready: "used", used: "lead" };

export default async function StoriesPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { q?: string; category?: string };
}) {
  await requireStaff();
  const query = searchParams.q?.trim() ?? "";
  const category = STORY_CATEGORIES.includes(searchParams.category as StoryCategory) ? searchParams.category : undefined;
  const stories = await listStories(params.clientId, { query, category });
  const base = `/clients/${params.clientId}/stories`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-900">Story Bank</h3>
          <p className="text-xs text-neutral-500">Distinct, reusable stories mined from intake, meetings, and the Brain.</p>
        </div>
        <MineButton clientId={params.clientId} />
      </div>

      {/* Search + category filter */}
      <form className="flex flex-wrap gap-2" action={base}>
        <input name="q" defaultValue={query} placeholder="Search stories…" className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        <select name="category" defaultValue={category ?? ""} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {STORY_CATEGORIES.map((c) => <option key={c} value={c}>{STORY_CATEGORY_LABELS[c]}</option>)}
        </select>
        <button className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50">Filter</button>
      </form>

      <StoryForm action={addStory.bind(null, params.clientId)} />

      {stories.length === 0 ? (
        <p className="text-sm text-neutral-400">{query || category ? "No stories match." : "No stories yet. Mine some."}</p>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => {
            const toggle = setStoryStatus.bind(null, params.clientId, s.id, NEXT_STATUS[s.status] ?? "lead");
            const push = sendStoryToIntake.bind(null, params.clientId, s.id);
            const del = deleteStory.bind(null, params.clientId, s.id);
            return (
              <li key={s.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{STORY_CATEGORY_LABELS[s.category as StoryCategory] ?? s.category}</Badge>
                      <Badge tone={STATUS_TONE[s.status] ?? "neutral"}>{s.status}</Badge>
                      <span className="text-sm font-medium text-neutral-900">{s.title}</span>
                    </div>
                    {s.summary && <p className="text-sm text-neutral-700">{s.summary}</p>}
                    {s.detail && <p className="text-xs text-neutral-500">{s.detail}</p>}
                    {s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <Link key={t} href={`${base}?q=${encodeURIComponent(t)}`} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200">{t}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <form action={toggle}><button className="text-xs text-neutral-500 hover:underline">→ {NEXT_STATUS[s.status]}</button></form>
                    <form action={push}><button className="text-xs text-blue-600 hover:underline">to intake</button></form>
                    <form action={del}><button className="text-xs text-red-600 hover:underline">delete</button></form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
