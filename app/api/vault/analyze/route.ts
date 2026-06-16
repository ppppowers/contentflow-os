import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { analyzeDocumentBytes } from "@/lib/vault/intelligence";

// Document intelligence runs a Claude vision call — route handler (not a Server
// Action) for the longer time budget.
export const maxDuration = 300;

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { docId } = (await req.json().catch(() => ({}))) as { docId?: string };
  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  const supabase = createClient();
  const { data: doc } = await supabase
    .from("vault_documents")
    .select("id, storage_path, file_name, mime_type, tags")
    .eq("id", docId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: file, error: dlErr } = await supabase.storage
    .from("vault")
    .download(doc.storage_path as string);
  if (dlErr || !file) return NextResponse.json({ error: "Could not read file" }, { status: 500 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const analysis = await analyzeDocumentBytes(bytes, (doc.mime_type as string) ?? "", doc.file_name as string);
  if (!analysis) {
    return NextResponse.json({ error: "Unsupported file type for analysis" }, { status: 422 });
  }

  // Merge AI tags with any manual tags already on the doc.
  const mergedTags = Array.from(new Set([...(doc.tags as string[]), ...analysis.tags]));
  const { error: upErr } = await supabase
    .from("vault_documents")
    .update({
      summary: analysis.summary,
      extracted_text: analysis.extractedText,
      tags: mergedTags,
      analyzed: true,
    })
    .eq("id", docId)
    .eq("agency_id", ctx.agencyId);
  if (upErr) return NextResponse.json({ error: "Could not save analysis" }, { status: 500 });

  return NextResponse.json({ ok: true, summary: analysis.summary, tags: mergedTags });
}
