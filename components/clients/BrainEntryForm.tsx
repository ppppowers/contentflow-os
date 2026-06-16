"use client";

import { useFormState } from "react-dom";
import { Input, Textarea, Select, SubmitButton, FormError } from "@/components/ui/form";
import { BRAIN_CATEGORIES, BRAIN_CATEGORY_LABELS } from "@/lib/validation/brain";
import type { ActionResult } from "@/lib/actions/brain";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

const CATEGORY_OPTIONS = BRAIN_CATEGORIES.map((c) => ({ value: c, label: BRAIN_CATEGORY_LABELS[c] }));

export function BrainEntryForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Category" name="category" options={CATEGORY_OPTIONS} />
        <Input label="Priority (0-100)" name="priority" type="number" defaultValue={0} />
      </div>
      <Input label="Title" name="title" placeholder="e.g. Spring HVAC tune-up promo" required />
      <Textarea
        label="Details"
        name="body"
        rows={3}
        hint="Concrete facts the writers must ground content in — dates, names, numbers, offers."
      />
      <div className="flex justify-end">
        <SubmitButton>Add to Brain</SubmitButton>
      </div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
