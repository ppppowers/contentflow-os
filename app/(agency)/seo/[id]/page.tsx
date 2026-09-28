import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { rescore, type SeoArticleRow, type SiteConnection } from "@/lib/seo/studio";
import { markdownToHtml } from "@/lib/seo/html";
import { publishingConfigured } from "@/lib/seo/publish";
import { deleteSeoArticle } from "@/lib/actions/seo";
import { StepButton } from "@/components/seo/StepButton";
import { OutlineForm } from "@/components/seo/OutlineForm";
import { ArticleEditor } from "@/components/seo/ArticleEditor";
import { ScorePill } from "@/components/seo/ScorePill";

type Check = { id: string; found: boolean; position: number | null; created_at: string; detail: { matchedUrl?: string | null } };

export default async function SeoArticlePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { start?: string };
}) {
  await requireStaff();
  const db = createClient();
  const { data } = await db.from("seo_articles").select("*, clients(name)").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const a = data as SeoArticleRow & { clients: { name: string } | null };
  const [{ data: siteRow }, { data: checkRows }] = await Promise.all([
    db.from("site_connections").select("*").eq("client_id", a.client_id).maybeSingle(),
    db
      .from("seo_checks")
      .select("id, found, position, created_at, detail")
      .eq("article_id", a.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  const site = siteRow as SiteConnection | null;
  const checks = (checkRows as Check[]) ?? [];
  const r = a.research;
  const outline = a.outline?.length ? a.outline : r?.outline ?? [];
  const score = a.body_md ? rescore(a) : null;
  const api = `/api/seo/articles/${a.id}`;
  const canPublish = publishingConfigured() && !!site?.repo && !!site?.content_dir;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/seo" className="text-xs text-neutral-500 hover:underline">
          ← SEO Studio
        </Link>
        <h2 className="mt-1 text-xl font-semibold">{a.title ?? `“${a.keyword}”`}</h2>
        <p className="text-xs text-neutral-400">
          {a.clients?.name} · target search: “{a.keyword}”
        </p>
      </div>

      {/* 1. Research */}
      <Step n={1} title="Research what ranks" done={!!r}>
        {!r ? (
          <StepButton
            url={api}
            body={{ action: "research" }}
            label="Research this keyword"
            busyLabel="Searching the web and reading top results…"
            expect="Usually 1–3 minutes. Claude searches live, reads what ranks, and finds gaps."
            autoStart={searchParams.start === "1"}
          />
        ) : (
          <div className="space-y-4 text-sm">
            <p>
              <span className="font-medium">Intent:</span> {r.searchIntent}
            </p>
            {r.summary && <p className="text-neutral-600">{r.summary}</p>}
            <details open>
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-500">
                What ranks now ({r.competitors.length})
              </summary>
              <ul className="mt-2 space-y-2">
                {r.competitors.map((c, i) => (
                  <li key={i} className="rounded-md border border-neutral-100 p-2">
                    <a href={c.url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                      {i + 1}. {c.title}
                    </a>
                    <p className="text-xs text-neutral-600">{c.angle}</p>
                    <p className="text-xs text-neutral-400">Weak spot: {c.weaknesses}</p>
                  </li>
                ))}
              </ul>
            </details>
            <div className="grid gap-4 sm:grid-cols-2">
              <List title="Questions people ask" items={r.questions} miss={score?.unansweredQuestions} />
              <List title="Gaps you can win on" items={r.contentGaps} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Key terms · target ~{r.recommendedWords} words
              </p>
              <div className="flex flex-wrap gap-1.5">
                {r.keyTerms.map((t) => {
                  const missing = score?.missingTerms.includes(t.term);
                  return (
                    <span
                      key={t.term}
                      className={`rounded px-2 py-0.5 text-xs ${
                        !score ? "bg-neutral-100" : missing ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
                      }`}
                      title={t.importance}
                    >
                      {t.term}
                      {t.importance === "must" ? " ★" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
            <StepButton url={api} body={{ action: "research" }} label="Re-run research" busyLabel="Researching…" variant="secondary" />
          </div>
        )}
      </Step>

      {/* 2. Outline */}
      {r && (
        <Step n={2} title="Outline" done={!!a.body_md}>
          <OutlineForm
            articleId={a.id}
            text={outline.map((o) => `${o.level === 3 ? "###" : "##"} ${o.heading}${o.notes ? ` — ${o.notes}` : ""}`).join("\n")}
          />
          <div className="pt-3">
            <StepButton
              url={api}
              body={{ action: "write" }}
              label={a.body_md ? "Rewrite from outline" : "Write the article"}
              busyLabel="Writing…"
              expect="Usually 1–2 minutes. Uses your brand voice, Business Brain and links to your own pages."
              variant={a.body_md ? "secondary" : "primary"}
            />
          </div>
        </Step>
      )}

      {/* 3. Optimize */}
      {a.body_md && score && (
        <Step n={3} title="Optimize" done={score.score >= 80}>
          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Content score</span>
                <ScorePill score={score.score} />
              </div>
              <ul className="space-y-1 text-xs">
                {score.checks.map((c) => (
                  <li key={c.label} className={c.ok ? "text-green-800" : "text-amber-800"}>
                    {c.ok ? "✓" : "•"} {c.label}
                    <span className="block pl-3 text-neutral-400">{c.detail}</span>
                  </li>
                ))}
              </ul>
              {score.score < 95 && (
                <StepButton
                  url={api}
                  body={{ action: "improve" }}
                  label="Improve automatically"
                  busyLabel="Improving…"
                  expect="Adds missing terms and answers, removes AI-sounding phrases."
                  variant="secondary"
                />
              )}
            </div>
            <ArticleEditor
              articleId={a.id}
              title={a.title ?? ""}
              metaDescription={a.meta_description ?? ""}
              slug={a.slug ?? ""}
              bodyMd={a.body_md}
              previewHtml={markdownToHtml(a.body_md)}
            />
          </div>
          {a.faq?.length > 0 && (
            <details className="pt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-500">
                FAQ ({a.faq.length}) — published with FAQ structured data
              </summary>
              <dl className="mt-2 space-y-2 text-sm">
                {a.faq.map((f, i) => (
                  <div key={i}>
                    <dt className="font-medium">{f.question}</dt>
                    <dd className="text-neutral-600">{f.answer}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </Step>
      )}

      {/* 4. Publish */}
      {a.body_md && (
        <Step n={4} title="Publish to the website" done={!!a.pr_url}>
          {a.pr_url && (
            <p className="mb-3 text-sm">
              Pull request opened:{" "}
              <a href={a.pr_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                review &amp; merge on GitHub
              </a>
              . Once merged it goes live at{" "}
              <a href={a.published_url ?? "#"} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                {a.published_url}
              </a>
              .
            </p>
          )}
          {canPublish ? (
            <StepButton
              url={api}
              body={{ action: "publish" }}
              label={a.pr_url ? "Open a new pull request with changes" : `Open a pull request on ${site!.repo}`}
              busyLabel="Creating pull request…"
              variant={a.pr_url ? "secondary" : "primary"}
            />
          ) : (
            <div className="space-y-1 text-sm text-neutral-600">
              {!publishingConfigured() && (
                <p>
                  Add a <code>GITHUB_TOKEN</code> in Vercel → Settings → Environment Variables (a fine-grained token with
                  “Contents” and “Pull requests” write access to the site&apos;s repo).
                </p>
              )}
              {(!site?.repo || !site?.content_dir) && (
                <p>
                  <Link href="/seo/sites" className="text-blue-700 underline">
                    Connect {a.clients?.name}&apos;s site
                  </Link>{" "}
                  (repo and content folder) to publish with one click.
                </p>
              )}
              <p className="text-xs text-neutral-400">Until then, use “Copy Markdown” above to add it by hand.</p>
            </div>
          )}
        </Step>
      )}

      {/* 5. Monitor */}
      {a.pr_url && (
        <Step n={5} title="Track it" done={checks.some((c) => c.found)}>
          <p className="mb-2 text-xs text-neutral-500">
            Checks whether your site shows up when searching “{a.keyword}” (via Claude&apos;s web search — a guide, not an
            exact Google rank). Runs automatically every Monday.
          </p>
          <StepButton url={api} body={{ action: "check" }} label="Check now" busyLabel="Searching…" variant="secondary" />
          {checks.length > 0 && (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id} className="border-t border-neutral-100">
                    <td className="py-1.5 text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-1.5">
                      {c.found ? (
                        <span className="text-green-700">Found at #{c.position}</span>
                      ) : (
                        <span className="text-neutral-400">Not in top 10 yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Step>
      )}

      <form action={deleteSeoArticle.bind(null, a.id)} className="pt-4">
        <button className="text-xs text-neutral-400 hover:text-red-600">Delete this article</button>
      </form>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
            done ? "bg-green-600 text-white" : "bg-neutral-900 text-white"
          }`}
        >
          {done ? "✓" : n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function List({ title, items, miss }: { title: string; items: string[]; miss?: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <ul className="space-y-1 text-sm">
        {items.map((q, i) => (
          <li key={i} className={miss?.includes(q) ? "text-amber-800" : "text-neutral-700"}>
            {miss ? (miss.includes(q) ? "• " : "✓ ") : "• "}
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}
