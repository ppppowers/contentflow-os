import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { runResearch, writeArticle, improveArticle } from "@/lib/seo/studio";
import { publishArticle } from "@/lib/seo/publish";
import { checkWebPresence } from "@/lib/seo/monitor";

// Each step is a long Claude call (web research can take a couple of minutes).
export const maxDuration = 300;

const ACTIONS = ["research", "write", "improve", "publish", "check"] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: Action };
  if (!body.action || !ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // RLS-scoped: only the caller's agency's articles are visible.
  const db = createClient();
  const { data: article } = await db
    .from("seo_articles")
    .select("id, client_id, agency_id, keyword")
    .eq("id", params.id)
    .maybeSingle();
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  try {
    switch (body.action) {
      case "research":
        await runResearch(db, params.id);
        return NextResponse.json({ ok: true });
      case "write":
        await writeArticle(db, params.id);
        return NextResponse.json({ ok: true });
      case "improve":
        await improveArticle(db, params.id);
        return NextResponse.json({ ok: true });
      case "publish":
        return NextResponse.json({ ok: true, ...(await publishArticle(db, params.id)) });
      case "check":
        return NextResponse.json({ ok: true, check: await checkWebPresence(db, article as never) });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Step failed" }, { status: 500 });
  }
}
