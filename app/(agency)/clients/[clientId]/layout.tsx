import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { getClient } from "@/lib/data/clients";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const STATUS_TONE: Record<string, BadgeTone> = { active: "green", paused: "amber", churned: "red" };

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clientId: string };
}) {
  await requireStaff();
  const client = await getClient(params.clientId);
  if (!client) notFound();

  const base = `/clients/${client.id}`;
  // Everyday tabs stay visible; the specialist ones live under "More", grouped.
  const primary = [
    { href: base, label: "Overview" },
    { href: `${base}/brand`, label: "Brand" },
    { href: `${base}/voice`, label: "Voice" },
    { href: `${base}/intake`, label: "Intake" },
    { href: `${base}/performance`, label: "Performance" },
  ];
  const more: { group: string; tabs: { href: string; label: string }[] }[] = [
    {
      group: "Knowledge",
      tabs: [
        { href: `${base}/brain`, label: "Brain" },
        { href: `${base}/vault`, label: "Vault" },
        { href: `${base}/website`, label: "Website" },
        { href: `${base}/stories`, label: "Stories" },
      ],
    },
    {
      group: "Planning",
      tabs: [
        { href: `${base}/strategy`, label: "Strategy" },
        { href: `${base}/gaps`, label: "Gaps" },
        { href: `${base}/preferences`, label: "Preferences" },
      ],
    },
    {
      group: "Relationship",
      tabs: [
        { href: `${base}/meetings`, label: "Meetings" },
        { href: `${base}/contacts`, label: "Contacts" },
        { href: `${base}/notes`, label: "Notes" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/clients" className="text-xs text-neutral-500 hover:underline">← Clients</Link>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-xl font-semibold">{client.name}</h2>
            <Badge tone={STATUS_TONE[client.status] ?? "neutral"}>{client.status}</Badge>
          </div>
          {client.website_url && (
            <a href={client.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
              {client.website_url}
            </a>
          )}
        </div>
        <Link
          href={`/create?client=${client.id}`}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          + Create content for {client.name}
        </Link>
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-neutral-200">
        {primary.map((t) => (
          <Link key={t.href} href={t.href} className="border-b-2 border-transparent px-3 py-2 text-sm text-neutral-600 hover:border-neutral-300 hover:text-neutral-900">
            {t.label}
          </Link>
        ))}
        <details className="relative">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900">
            More ▾
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-56 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg sm:left-0 sm:right-auto">
            {more.map((g) => (
              <div key={g.group}>
                <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">{g.group}</p>
                {g.tabs.map((t) => (
                  <Link key={t.href} href={t.href} className="block rounded px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100">
                    {t.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </details>
      </nav>

      {children}
    </div>
  );
}
