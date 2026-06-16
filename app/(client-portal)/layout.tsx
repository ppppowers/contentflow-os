import { requireClient } from "@/lib/auth/guards";
import { signOutAction } from "@/lib/auth/actions";

// Client portal shell — role=client only. Scoped, read-mostly (review + approvals).
export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  await requireClient();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
        <p className="text-sm font-semibold">Content Review</p>
        <form action={signOutAction}>
          <button className="text-xs text-neutral-500 hover:text-neutral-900">Sign out</button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
