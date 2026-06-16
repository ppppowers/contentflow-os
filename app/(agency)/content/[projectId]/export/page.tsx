import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { buildMarkdown, type ExportPiece } from "@/lib/export/render";
import { ExportBar } from "@/components/content/ExportBar";

const CHANNEL_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  blog: "Blog",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  sms: "SMS",
  website_announcement: "Website announcement",
};

export default async function ExportPage({ params }: { params: { projectId: string } }) {
  await requireStaff();
  const supabase = createClient();

  const { data: project } = await supabase
    .from("content_projects")
    .select("id, title")
    .eq("id", params.projectId)
    .maybeSingle();
  if (!project) notFound();

  const { data: piecesData } = await supabase
    .from("content_pieces")
    .select("channel, body, metadata")
    .eq("project_id", params.projectId);
  const pieces = (piecesData as ExportPiece[]) ?? [];
  const markdown = buildMarkdown(project.title as string, pieces);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link href={`/content/${project.id}`} className="text-xs text-neutral-500 hover:underline">← Project</Link>
        <h2 className="mt-1 text-xl font-semibold">Export — {project.title}</h2>
      </div>

      <ExportBar projectId={project.id} markdown={markdown} />

      {/* Printable delivery package */}
      <article className="mx-auto max-w-2xl space-y-6">
        {pieces.length === 0 ? (
          <p className="text-sm text-neutral-400">No deliverables yet — run the pipeline first.</p>
        ) : (
          pieces.map((p, i) => {
            const m = (p.metadata ?? {}) as { subjectLines?: string[]; seoTitle?: string; slug?: string };
            return (
              <section key={i}>
                <h3 className="border-b border-neutral-200 pb-1 text-sm font-semibold">
                  {CHANNEL_LABEL[p.channel] ?? p.channel}
                </h3>
                {p.channel === "newsletter" && Array.isArray(m.subjectLines) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Subjects: {(m.subjectLines as string[]).join(" · ")}
                  </p>
                )}
                {p.channel === "blog" && (m.seoTitle || m.slug) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {m.seoTitle ? `SEO: ${m.seoTitle}` : ""} {m.slug ? `· /${m.slug}` : ""}
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{p.body || "—"}</p>
              </section>
            );
          })
        )}
      </article>
    </div>
  );
}
