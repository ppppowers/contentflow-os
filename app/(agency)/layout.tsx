import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/roles";
import { signOutAction } from "@/lib/auth/actions";
import { getBranding } from "@/lib/data/extensions";

// Agency shell — owner/admin/writer only. Clients are redirected to /review.
export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  const admin = isAdmin(ctx.role);
  const branding = await getBranding();
  const brandName = branding?.brand_name?.trim() || "ContentFlow OS";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="shrink-0 border-b border-neutral-200 bg-neutral-50 p-4 md:w-56 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between md:block">
          <div>
            <p className="text-sm font-semibold">{brandName}</p>
            <p className="text-xs capitalize text-neutral-500">{ctx.role}</p>
          </div>
        </div>
        <Link
          href="/create"
          className="mb-4 block rounded-lg bg-neutral-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-neutral-800"
        >
          + Create content
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm md:block md:space-y-1">
          <NavLink href="/dashboard">Home</NavLink>
          <NavLink href="/content">Content</NavLink>
          <NavLink href="/clients">Clients</NavLink>
          <NavGroup label="Tools">
            <NavLink href="/collect">Collect</NavLink>
            <NavLink href="/agency-brain">Agency Brain</NavLink>
            <NavLink href="/playbooks">Playbooks</NavLink>
          </NavGroup>
          {admin && (
            <NavGroup label="Admin">
              <NavLink href="/revenue">Revenue</NavLink>
              <NavLink href="/integrations">Integrations</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </NavGroup>
          )}
        </nav>
        <form action={signOutAction} className="mt-4 md:mt-8">
          <button className="text-xs text-neutral-500 hover:text-neutral-900">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents md:block md:pt-3">
      <p className="hidden px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400 md:block">
        {label}
      </p>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded px-2 py-1.5 text-neutral-700 hover:bg-neutral-200">
      {children}
    </Link>
  );
}
