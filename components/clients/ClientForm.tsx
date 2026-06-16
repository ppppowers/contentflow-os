"use client";

import { useFormState } from "react-dom";
import { Input, Select, SubmitButton, FormError } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions/clients";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

export function ClientForm({
  action,
  submitLabel,
  defaults,
}: {
  action: Action;
  submitLabel: string;
  defaults?: {
    name?: string;
    website_url?: string | null;
    industry?: string | null;
    status?: string;
    health_score?: number;
  };
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Input label="Name" name="name" required defaultValue={defaults?.name} />
      <Input label="Website" name="website_url" type="url" defaultValue={defaults?.website_url ?? ""} placeholder="https://…" />
      <Input label="Industry" name="industry" defaultValue={defaults?.industry ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          name="status"
          defaultValue={defaults?.status ?? "active"}
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "churned", label: "Churned" },
          ]}
        />
        <Input label="Health (0–100)" name="health_score" type="number" defaultValue={defaults?.health_score ?? 100} />
      </div>
      {state && "error" in state && <FormError message={state.error} />}
      {state && "ok" in state && <p className="text-sm text-green-600">Saved.</p>}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
