import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/data/clients";
import { SeoTabs } from "@/components/seo/SeoTabs";
import { NewArticleForm } from "@/components/seo/NewArticleForm";
import { ScorePill } from "@/components/seo/ScorePill";

const STATUS: Record<string, string> = {
  new: "Not started",
  researched: "Researched",
  drafted: "Draft ready",
  published: "Pull request opened",
};

export default async function SeoPage() {
  await requireStaff();
  const clients = (await listClients()).filter((c) => c.status !== "churned");
  const { data, error } = await createClient()
    .from("seo_articles")
    .select("id, keyword, status, score, title, published_url, pr_url, updated_at, clients(name)")
    .order("updated_at", { ascending: false })
    .limit(100);
  const articles =
    (data as unknown as {
      id: string;
      keyword: string;
      status: string;
      score: number | null;
      title: string | null;
      published_url: string | null;
      clients: { name: string } | null;
    }[]) ?? [];

  return (
    <div className="space-y-6">
      <SeoTabs active="/seo" />
      {error?.code === "42P01" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          SEO Studio needs a database update: run <code>supabase/migrations/0033_seo_studio.sql</code> in the Supabase SQL Editor.
        </p>
      ) : (
        <>
          <NewArticleForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
          <div className="rounded-xl border border-neutral-200 bg-white">
            {articles.length === 0 ? (
              <p className="p-5 text-sm text-neutral-400">No SEO articles yet. Enter a search phrase above to start.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {articles.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/seo/${a.id}`} className="text-sm font-medium hover:underline">
                        {a.title ?? a.keyword}
                      </Link>
                      <p className="truncate text-xs text-neutral-400">
                        {a.clients?.name} · “{a.keyword}”
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {a.score !== null && <ScorePill score={a.score} />}
                      <span className="text-neutral-500">{STATUS[a.status] ?? a.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
