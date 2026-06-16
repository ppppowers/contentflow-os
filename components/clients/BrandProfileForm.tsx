"use client";

import { useFormState } from "react-dom";
import { Input, Textarea, SubmitButton, FormError } from "@/components/ui/form";
import type { ActionResult } from "@/lib/actions/clients";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

// Brand profile = the voice spec the agents must honor. List fields are one-per-line.
export function BrandProfileForm({
  action,
  defaults,
}: {
  action: Action;
  defaults?: {
    voice_summary?: string | null;
    tone_descriptors?: string[] | null;
    audience?: string | null;
    products_services?: string[] | null;
    sample_copy?: string | null;
    banned_phrases?: string[] | null;
    required_disclaimers?: string[] | null;
    reading_level?: string | null;
  } | null;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const join = (v?: string[] | null) => (v ?? []).join("\n");

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <Textarea label="Voice summary" name="voice_summary" rows={3} defaultValue={defaults?.voice_summary ?? ""}
        hint="Who is the narrator? e.g. 'Warm, plainspoken Executive Director.'" />
      <Textarea label="Tone descriptors (one per line)" name="tone_descriptors" defaultValue={join(defaults?.tone_descriptors)} />
      <Textarea label="Audience" name="audience" rows={2} defaultValue={defaults?.audience ?? ""} />
      <Textarea label="Products / services (one per line)" name="products_services" defaultValue={join(defaults?.products_services)} />
      <Textarea label="Sample copy" name="sample_copy" rows={4} defaultValue={defaults?.sample_copy ?? ""}
        hint="Real writing in their voice — agents anchor on this." />
      <Textarea label="Banned phrases (one per line)" name="banned_phrases" defaultValue={join(defaults?.banned_phrases)}
        hint="Human Editor hard-rejects these. AI clichés go here." />
      <Textarea label="Required disclaimers (one per line)" name="required_disclaimers" defaultValue={join(defaults?.required_disclaimers)} />
      <Input label="Reading level" name="reading_level" defaultValue={defaults?.reading_level ?? ""} placeholder="e.g. grade 7" />
      {state && "error" in state && <FormError message={state.error} />}
      {state && "ok" in state && <p className="text-sm text-green-600">Brand profile saved.</p>}
      <SubmitButton>Save brand profile</SubmitButton>
    </form>
  );
}
