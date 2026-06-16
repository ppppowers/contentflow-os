import { requireStaff } from "@/lib/auth/guards";
import { getNotes } from "@/lib/data/clients";
import { addNote, deleteNote } from "@/lib/actions/clients";
import { AddNoteForm } from "@/components/clients/AddNoteForm";
import { Badge } from "@/components/ui/badge";

export default async function NotesPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const notes = await getNotes(params.clientId);
  const addAction = addNote.bind(null, params.clientId);

  return (
    <div className="space-y-6">
      <AddNoteForm action={addAction} />

      <ul className="space-y-2">
        {notes.length === 0 ? (
          <li className="text-sm text-neutral-400">No notes yet.</li>
        ) : (
          notes.map((n) => {
            const del = deleteNote.bind(null, params.clientId, n.id);
            return (
              <li key={n.id} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {n.pinned && <Badge tone="amber">Pinned</Badge>}
                    <p className="whitespace-pre-wrap text-sm text-neutral-800">{n.body}</p>
                    <p className="text-xs text-neutral-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <form action={del}>
                    <button className="text-xs text-red-600 hover:underline">Delete</button>
                  </form>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
