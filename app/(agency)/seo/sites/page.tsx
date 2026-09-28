import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listClients } from "@/lib/data/clients";
import { publishingConfigured } from "@/lib/seo/publish";
import { SeoTabs } from "@/components/seo/SeoTabs";
import { SiteForm } from "@/components/seo/SeoForms";

export default async function SitesPage() {
  await requireStaff();
  const clients = (await listClients()).filter((c) => c.status !== "churned");
  const { data, error } = await createClient().from("site_connections").select("*");
  const byClient = new Map(((data as { client_id: string }[]) ?? []).map((s) => [s.client_id, s]));

  return (
    <div className="space-y-6">
      <SeoTabs active="/seo/sites" />
      {error?.code === "42P01" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Run <code>supabase/migrations/0033_seo_studio.sql</code> in the Supabase SQL Editor first.
        </p>
      )}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
        <p>
          Connect a client&apos;s Next.js site so finished articles can be published as a GitHub pull request. Each
          article is added as a JSON file (HTML, title, description, FAQ and structured data) that the site renders at{" "}
          <code>URL prefix/slug</code>, and the sitemap is updated. You review and merge; Vercel deploys.
        </p>
        <p className="mt-2">
          Publishing token:{" "}
          {publishingConfigured() ? (
            <span className="font-medium text-green-700">connected</span>
          ) : (
            <span className="font-medium text-amber-700">
              missing — add GITHUB_TOKEN in Vercel (fine-grained, Contents + Pull requests: read &amp; write)
            </span>
          )}
        </p>
      </div>
      {clients.map((c) => (
        <section key={c.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold">{c.name}</h3>
          <SiteForm clientId={c.id} site={(byClient.get(c.id) as never) ?? null} defaultUrl={c.website_url ?? ""} />
        </section>
      ))}
    </div>
  );
}
