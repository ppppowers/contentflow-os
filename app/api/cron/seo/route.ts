import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { checkAiVisibility, checkWebPresence } from "@/lib/seo/monitor";

export const maxDuration = 300;

// Weekly monitor (Vercel Cron, see vercel.json): re-checks published articles and
// tracked AI questions for every agency. Vercel sends "Authorization: Bearer $CRON_SECRET".
// Runs without a user session, so it uses the service client; every row it writes
// carries the agency_id of the record it checked.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const db = createServiceClient() as unknown as SupabaseClient;

  const [{ data: articles }, { data: prompts }] = await Promise.all([
    db
      .from("seo_articles")
      .select("id, client_id, agency_id, keyword")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(25),
    db.from("ai_prompts").select("id, client_id, agency_id, prompt").order("created_at").limit(25),
  ]);

  let ok = 0;
  const errors: string[] = [];
  const jobs = [
    ...((articles ?? []) as never[]).map((a) => () => checkWebPresence(db, a)),
    ...((prompts ?? []) as never[]).map((p) => () => checkAiVisibility(db, p)),
  ];
  for (let i = 0; i < jobs.length; i += 3) {
    await Promise.all(
      jobs.slice(i, i + 3).map((job) =>
        job()
          .then(() => ok++)
          .catch((e) => errors.push(e instanceof Error ? e.message : "failed")),
      ),
    );
  }
  return NextResponse.json({ checked: ok, errors });
}
