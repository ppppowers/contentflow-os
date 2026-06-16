"use client";

import { useFormState } from "react-dom";
import { Select, Input, Textarea, SubmitButton, FormError } from "@/components/ui/form";
import { INTAKE_TYPES, INTAKE_TYPE_LABELS } from "@/lib/validation/intake";
import type { ActionResult } from "@/lib/actions/intake";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

export function AddIntakeItemForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium">Add update</p>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          name="type"
          options={INTAKE_TYPES.map((t) => ({ value: t, label: INTAKE_TYPE_LABELS[t] }))}
        />
        <Input label="Title (optional)" name="title" />
      </div>
      <Textarea label="Details" name="body" rows={3} />
      {state && "error" in state && <FormError message={state.error} />}
      <SubmitButton>Add</SubmitButton>
    </form>
  );
}
