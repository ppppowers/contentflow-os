import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/data/clients";
import { deleteTrackedPrompt } from "@/lib/actions/seo";
import { SeoTabs } from "@/components/seo/SeoTabs";
import { AddPromptForm } from "@/components/seo/SeoForms";
import { StepButton } from "@/components/seo/StepButton";

type CheckRow = {
  prompt_id: string;
  found: boolean;
  position: number | null;
  created_at: string;
  detail: { excerpt?: string; competitors?: string[] };
};

export default async function VisibilityPage({ searchParams }: { searchParams: { client?: string } }) {
  await requireStaff();
  const clients = (await listClients()).filter((c) => c.status !== "churned");
  const client = clients.find((c) => c.id === searchParams.client) ?? clients[0];
  const db = createClient();

  const { data: promptRows, error } = client
    ? await db.from("ai_prompts").select("id, prompt").eq("client_id", client.id).order("created_at")
    : { data: [], error: null };
  const prompts = (promptRows as { id: string; prompt: string }[]) ?? [];
  const { data: checkRows } = prompts.length
    ? await db
        .from("seo_checks")
        .select("prompt_id, found, position, created_at, detail")
        .in("prompt_id", prompts.map((p) => p.id))
        .order("created_at", { ascending: false })
    : { data: [] };
  const latest = new Map<string, CheckRow>();
  const history = new Map<string, boolean[]>();
  for (const c of (checkRows as CheckRow[]) ?? []) {
    if (!latest.has(c.prompt_id)) latest.set(c.prompt_id, c);
    history.set(c.prompt_id, [...(history.get(c.prompt_id) ?? []), c.found].slice(0, 8));
  }
  const checked = prompts.filter((p) => latest.has(p.id));
  const mentioned = checked.filter((p) => latest.get(p.id)!.found).length;

  return (
    <div className="space-y-6">
      <SeoTabs active="/seo/visibility" />
      {error?.code === "42P01" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0033_seo_studio.sql</code> in the Supabase SQL Editor first.
        </p>
      ) : !client ? (
        <p className="text-sm text-neutral-400">Add a client first.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/seo/visibility?client=${c.id}`}
                  className={`rounded-full px-3 py-1 text-sm ${c.id === client.id ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {checked.length > 0 && (
              <p className="text-sm">
                Claude mentions <span className="font-semibold">{client.name}</span> in{" "}
                <span className="font-semibold">
                  {mentioned} of {checked.length}
                </span>{" "}
                tracked questions
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-600">
              Add the questions your customers ask AI assistants. We ask Claude (with web search, like claude.ai does) and
              record whether it recommends {client.name}, where it ranks you, and who it names instead. Re-checked every Monday.
            </p>
            <AddPromptForm clientId={client.id} />
            {prompts.length > 0 && (
              <StepButton
                url="/api/seo/prompts"
                body={{ clientId: client.id }}
                label="Check all now"
                busyLabel="Asking Claude…"
                expect="About 30–60 seconds per question, three at a time."
                variant="secondary"
              />
            )}
          </div>

          <ul className="space-y-3">
            {prompts.map((p) => {
              const c = latest.get(p.id);
              return (
                <li key={p.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-medium">“{p.prompt}”</p>
                    <div className="flex items-center gap-2 text-xs">
                      {!c ? (
                        <span className="text-neutral-400">Not checked yet</span>
                      ) : c.found ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
                          Mentioned{c.position ? ` · #${c.position}` : ""}
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">Not mentioned</span>
                      )}
                      <span className="flex gap-0.5" title="Recent checks, newest first">
                        {(history.get(p.id) ?? []).map((f, i) => (
                          <span key={i} className={`h-2 w-2 rounded-full ${f ? "bg-green-500" : "bg-neutral-300"}`} />
                        ))}
                      </span>
                    </div>
                  </div>
                  {c?.detail?.excerpt && <p className="text-xs text-neutral-600">{c.detail.excerpt}</p>}
                  {c?.detail?.competitors && c.detail.competitors.length > 0 && (
                    <p className="text-xs text-neutral-400">Also named: {c.detail.competitors.slice(0, 8).join(", ")}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <StepButton url="/api/seo/prompts" body={{ promptId: p.id }} label="Check" busyLabel="Asking…" variant="secondary" />
                    <form action={deleteTrackedPrompt.bind(null, p.id)}>
                      <button className="text-xs text-neutral-400 hover:text-red-600">Remove</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
