import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { checkAiVisibility } from "@/lib/seo/monitor";

export const maxDuration = 300;

// Check one tracked prompt, or every prompt for a client (a few at a time).
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { promptId?: string; clientId?: string };

  const db = createClient();
  let q = db.from("ai_prompts").select("id, client_id, agency_id, prompt");
  if (body.promptId) q = q.eq("id", body.promptId);
  else if (body.clientId) q = q.eq("client_id", body.clientId);
  else return NextResponse.json({ error: "promptId or clientId required" }, { status: 400 });
  const { data: prompts } = await q.limit(20);
  if (!prompts?.length) return NextResponse.json({ error: "No questions to check yet." }, { status: 404 });

  const results: { promptId: string; found?: boolean; error?: string }[] = [];
  for (let i = 0; i < prompts.length; i += 3) {
    await Promise.all(
      prompts.slice(i, i + 3).map(async (p) => {
        try {
          const r = await checkAiVisibility(db, p as never);
          results.push({ promptId: p.id as string, found: r.found });
        } catch (e) {
          results.push({ promptId: p.id as string, error: e instanceof Error ? e.message : "failed" });
        }
      }),
    );
  }
  const errors = results.filter((r) => r.error).map((r) => r.error!);
  return NextResponse.json({ results, errors }, { status: errors.length === results.length ? 500 : 200 });
}
