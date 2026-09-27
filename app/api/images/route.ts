import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { generateProjectImages, IMAGE_CHANNELS } from "@/lib/images/service";
import { imagesConfigured } from "@/lib/images/openai";

// Image generation can take ~30-60s per image; a set runs in parallel.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (!imagesConfigured()) {
    return NextResponse.json(
      { error: "Images aren't set up yet: add OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { projectId?: string; channel?: string; prompt?: string };
  if (!body.projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
  if (body.channel && !(body.channel in IMAGE_CHANNELS)) {
    return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
  }
  const prompt = body.prompt?.trim().slice(0, 4000) || undefined;

  // RLS-scoped existence check (also enforces tenant).
  const supabase = createClient();
  const { data: project } = await supabase.from("content_projects").select("id").eq("id", body.projectId).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const result = await generateProjectImages(
      body.projectId,
      { agencyId: ctx.agencyId, userId: ctx.userId },
      { channel: body.channel, prompt },
    );
    return NextResponse.json(result, { status: result.created === 0 ? 502 : 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Image generation failed" }, { status: 500 });
  }
}
