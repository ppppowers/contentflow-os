"use client";

import { useFormState } from "react-dom";
import { Input, Select, SubmitButton, FormError } from "@/components/ui/form";
import { PERF_CHANNELS } from "@/lib/validation/performance";
import type { ActionResult } from "@/lib/actions/performance";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;
const CHANNEL_OPTS = PERF_CHANNELS.map((c) => ({ value: c, label: c }));

export function MetricForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Channel" name="channel" options={CHANNEL_OPTS} />
        <Input label="Subject line" name="subject_line" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Input label="Sent" name="sent" type="number" defaultValue={0} />
        <Input label="Opens" name="opens" type="number" defaultValue={0} />
        <Input label="Clicks" name="clicks" type="number" defaultValue={0} />
        <Input label="Replies" name="replies" type="number" defaultValue={0} />
        <Input label="Conv." name="conversions" type="number" defaultValue={0} />
        <Input label="Unsubs" name="unsubscribes" type="number" defaultValue={0} />
      </div>
      <div className="flex justify-end">
        <SubmitButton>Record metric</SubmitButton>
      </div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
