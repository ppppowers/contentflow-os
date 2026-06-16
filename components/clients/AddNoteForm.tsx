"use client";

import { useFormState } from "react-dom";
import { Textarea, Checkbox, SubmitButton, FormError } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions/clients";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

export function AddNoteForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <Textarea label="New note" name="body" rows={3} />
      <div className="flex items-center justify-between">
        <Checkbox label="Pin to top" name="pinned" />
        <SubmitButton>Add note</SubmitButton>
      </div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
