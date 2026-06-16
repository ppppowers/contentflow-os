"use client";

import { useFormState } from "react-dom";
import { Select, Textarea, SubmitButton, FormError } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions/approvals";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

export function DecisionForm({ action, label }: { action: Action; label: string }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <Select
        label="Decision"
        name="decision"
        options={[
          { value: "approved", label: "Approve" },
          { value: "changes_requested", label: "Request changes" },
        ]}
      />
      <Textarea label="Comment (required if requesting changes)" name="comment" rows={3} />
      {state && "error" in state && <FormError message={state.error} />}
      {state && "ok" in state && <p className="text-sm text-green-600">Recorded.</p>}
      <SubmitButton>{label}</SubmitButton>
    </form>
  );
}
