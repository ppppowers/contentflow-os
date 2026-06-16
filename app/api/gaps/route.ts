import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { analyzeGaps } from "@/lib/gaps/analyze";

export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { clientId } = (await req.json().catch(() => ({}))) as { clientId?: string };
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const result = await analyzeGaps(clientId, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
