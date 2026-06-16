"use client";

import { useFormState } from "react-dom";
import { Input, Textarea, Select, SubmitButton, FormError } from "@/components/ui/form";
import { AGENCY_BRAIN_CATEGORIES, AGENCY_BRAIN_CATEGORY_LABELS } from "@/lib/validation/agency-brain";
import type { ActionResult } from "@/lib/actions/agency-brain";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

const OPTIONS = AGENCY_BRAIN_CATEGORIES.map((c) => ({ value: c, label: AGENCY_BRAIN_CATEGORY_LABELS[c] }));

export function AgencyBrainForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Category" name="category" options={OPTIONS} />
        <Input label="Authenticity score (optional)" name="authenticity_score" type="number" />
      </div>
      <Textarea
        label="Proven pattern"
        name="content"
        rows={3}
        hint="A subject line, CTA, or angle that worked. Stored as a reusable shape, not client facts."
      />
      <div className="flex justify-end">
        <SubmitButton>Add to Agency Brain</SubmitButton>
      </div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
