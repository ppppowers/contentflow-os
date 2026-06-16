import { requireStaff } from "@/lib/auth/guards";
import { getContacts } from "@/lib/data/clients";
import { addContact, deleteContact } from "@/lib/actions/clients";
import { AddContactForm } from "@/components/clients/AddContactForm";
import { Badge } from "@/components/ui/badge";

export default async function ContactsPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const contacts = await getContacts(params.clientId);
  const addAction = addContact.bind(null, params.clientId);

  return (
    <div className="space-y-6">
      <AddContactForm action={addAction} />

      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
        {contacts.length === 0 ? (
          <li className="px-4 py-6 text-sm text-neutral-400">No contacts yet.</li>
        ) : (
          contacts.map((c) => {
            const del = deleteContact.bind(null, params.clientId, c.id);
            return (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {c.name} {c.is_primary && <Badge tone="blue">Primary</Badge>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {[c.title, c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <form action={del}>
                  <button className="text-xs text-red-600 hover:underline">Remove</button>
                </form>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
