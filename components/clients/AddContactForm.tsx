"use client";

import { useFormState } from "react-dom";
import { Input, Checkbox, SubmitButton, FormError } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions/clients";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

export function AddContactForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium">Add contact</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Name" name="name" required />
        <Input label="Title" name="title" />
        <Input label="Email" name="email" type="email" />
        <Input label="Phone" name="phone" />
      </div>
      <Checkbox label="Primary contact" name="is_primary" />
      {state && "error" in state && <FormError message={state.error} />}
      <SubmitButton>Add contact</SubmitButton>
    </form>
  );
}
