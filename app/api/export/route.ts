import { getSessionContext } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { buildHtml, buildMarkdown, type ExportPiece } from "@/lib/export/render";

// GET /api/export?projectId=...&format=html|md → file download.
export async function GET(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isStaff(ctx.role)) {
    return new Response("Not authorized", { status: 403 });
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const format = (url.searchParams.get("format") ?? "html").toLowerCase();
  if (!projectId) return new Response("projectId required", { status: 400 });

  const supabase = createClient();
  const { data: project } = await supabase
    .from("content_projects")
    .select("id, title")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return new Response("Not found", { status: 404 });

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select("channel, body, metadata")
    .eq("project_id", projectId);
  const list = (pieces as ExportPiece[]) ?? [];

  const slug = (project.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (format === "md") {
    return new Response(buildMarkdown(project.title as string, list), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.md"`,
      },
    });
  }

  return new Response(buildHtml(project.title as string, list), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.html"`,
    },
  });
}
