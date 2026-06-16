import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { generatePlaybook } from "@/lib/playbooks/generate";
import { INDUSTRIES } from "@/lib/validation/playbook";

export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { industry } = (await req.json().catch(() => ({}))) as { industry?: string };
  if (!industry || !(INDUSTRIES as readonly string[]).includes(industry)) {
    return NextResponse.json({ error: "Unknown industry" }, { status: 400 });
  }
  const result = await generatePlaybook(industry, { agencyId: ctx.agencyId, userId: ctx.userId });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
