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
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-6">
          <p className="text-sm font-semibold">{brandName}</p>
          <p className="text-xs text-neutral-500 capitalize">{ctx.role}</p>
        </div>
        <nav className="space-y-1 text-sm">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/clients">Clients</NavLink>
          <NavLink href="/collect">Collect</NavLink>
          <NavLink href="/content">Content</NavLink>
          <NavLink href="/agency-brain">Agency Brain</NavLink>
          <NavLink href="/playbooks">Playbooks</NavLink>
          {admin && <NavLink href="/revenue">Revenue</NavLink>}
          {admin && <NavLink href="/integrations">Integrations</NavLink>}
          {admin && <NavLink href="/settings">Settings</NavLink>}
        </nav>
        <form action={signOutAction} className="mt-8">
          <button className="text-xs text-neutral-500 hover:text-neutral-900">Sign out</button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
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
