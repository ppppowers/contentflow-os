import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { generatePlan } from "@/lib/strategy/plan";
import { isHorizon } from "@/lib/validation/strategy";

// Strategy planning runs a Claude call — route handler for the longer time budget.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { clientId, horizon } = (await req.json().catch(() => ({}))) as { clientId?: string; horizon?: number };
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });
  if (typeof horizon !== "number" || !isHorizon(horizon)) {
    return NextResponse.json({ error: "horizon must be 30, 60, or 90" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const result = await generatePlan(clientId, horizon, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
