import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/roles";
import { getBranding, listConnections } from "@/lib/data/extensions";
import { setIntegrationEnabled } from "@/lib/actions/extensions";
import { BrandingForm } from "@/components/extensions/BrandingForm";
import { PROVIDERS } from "@/lib/extensions/registry";
import { Badge } from "@/components/ui/badge";

export default async function IntegrationsPage() {
  const ctx = await requireStaff();
  if (!isAdmin(ctx.role)) redirect("/dashboard");

  const [branding, connections] = await Promise.all([getBranding(), listConnections()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">White Label &amp; Integrations</h2>
        <p className="text-xs text-neutral-500">
          Branding and the extension framework. Integration providers are registered but not yet
          implemented — enabling one stores config only.
        </p>
      </div>

      <BrandingForm branding={branding} />

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Integration providers</h3>
        <ul className="space-y-2">
          {PROVIDERS.map((p) => {
            const enabled = connections[p.id]?.enabled ?? false;
            const toggle = setIntegrationEnabled.bind(null, p.id, !enabled);
            return (
              <li key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge tone="neutral">{p.category}</Badge>
                    {enabled ? <Badge tone="green">enabled</Badge> : <Badge tone="neutral">off</Badge>}
                    <Badge tone="amber">framework only</Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{p.description}</p>
                  <p className="text-xs text-neutral-400">Capabilities: {p.capabilities.join(", ")}</p>
                </div>
                <form action={toggle}>
                  <button className="text-xs text-blue-600 hover:underline">{enabled ? "disable" : "enable"}</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
