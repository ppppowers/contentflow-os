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
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/brand`, label: "Brand" },
    { href: `${base}/voice`, label: "Voice" },
    { href: `${base}/brain`, label: "Brain" },
    { href: `${base}/vault`, label: "Vault" },
    { href: `${base}/website`, label: "Website" },
    { href: `${base}/meetings`, label: "Meetings" },
    { href: `${base}/stories`, label: "Stories" },
    { href: `${base}/strategy`, label: "Strategy" },
    { href: `${base}/gaps`, label: "Gaps" },
    { href: `${base}/preferences`, label: "Preferences" },
    { href: `${base}/performance`, label: "Performance" },
    { href: `${base}/intake`, label: "Intake" },
    { href: `${base}/contacts`, label: "Contacts" },
    { href: `${base}/notes`, label: "Notes" },
  ];

  return (
    <div className="space-y-6">
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

      <nav className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="border-b-2 border-transparent px-3 py-2 text-sm text-neutral-600 hover:border-neutral-300 hover:text-neutral-900">
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
