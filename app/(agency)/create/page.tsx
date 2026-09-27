import { requireStaff } from "@/lib/auth/guards";
import { listClients } from "@/lib/data/clients";
import { createClient } from "@/lib/supabase/server";
import { CreateForm } from "@/components/create/CreateForm";

export default async function CreatePage({ searchParams }: { searchParams: { client?: string } }) {
  await requireStaff();
  const clients = (await listClients()).filter((c) => c.status !== "churned");

  const supabase = createClient();
  const { data: brands } = await supabase.from("brand_profiles").select("client_id").eq("is_active", true);
  const branded = new Set(((brands as { client_id: string }[]) ?? []).map((b) => b.client_id));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Create content</h2>
        <p className="text-sm text-neutral-500">
          Tell us what this week is about. You&apos;ll get a newsletter, a blog post and social posts
          (Facebook, LinkedIn, Instagram, SMS) — and images if you want them.
        </p>
      </div>
      <CreateForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, hasBrand: branded.has(c.id) }))}
        defaultClientId={searchParams.client}
      />
    </div>
  );
}
