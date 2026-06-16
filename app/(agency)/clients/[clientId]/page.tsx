import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";
import { isAdmin } from "@/lib/auth/roles";
import { getClient } from "@/lib/data/clients";
import { updateClientRecord, deleteClientRecord } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/ClientForm";
import { SubmitButton } from "@/components/ui/form";

export default async function ClientOverviewPage({ params }: { params: { clientId: string } }) {
  const ctx = await requireStaff();
  const client = await getClient(params.clientId);
  if (!client) notFound();

  const updateAction = updateClientRecord.bind(null, client.id);
  const deleteAction = deleteClientRecord.bind(null, client.id);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">Details</h3>
        <ClientForm
          action={updateAction}
          submitLabel="Save changes"
          defaults={{
            name: client.name,
            website_url: client.website_url,
            industry: client.industry,
            status: client.status,
            health_score: client.health_score,
          }}
        />
      </section>

      {isAdmin(ctx.role) && (
        <section className="max-w-lg rounded-lg border border-red-200 p-4">
          <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
          <p className="mb-3 text-xs text-neutral-500">
            Deleting a client removes its brand profile, contacts, notes, intake, and content. Cannot be undone.
          </p>
          <form action={deleteAction}>
            <SubmitButton variant="danger">Delete client</SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
