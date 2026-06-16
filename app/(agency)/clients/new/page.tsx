import Link from "next/link";
import { requireStaff } from "@/lib/auth/guards";
import { createClientRecord } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function NewClientPage() {
  await requireStaff();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className="text-xs text-neutral-500 hover:underline">← Clients</Link>
        <h2 className="mt-1 text-xl font-semibold">New client</h2>
      </div>
      <ClientForm action={createClientRecord} submitLabel="Create client" />
    </div>
  );
}
