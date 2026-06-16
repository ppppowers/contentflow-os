"use client";

import { useFormState } from "react-dom";
import { Input, Checkbox, SubmitButton, FormError } from "@/components/ui/form";
import { saveBranding, type ActionResult } from "@/lib/actions/extensions";
import type { Branding } from "@/lib/data/extensions";

export function BrandingForm({ branding }: { branding: Branding | null }) {
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(saveBranding, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium">White-label branding</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Brand name" name="brand_name" defaultValue={branding?.brand_name ?? ""} />
        <Input label="Logo URL" name="logo_url" defaultValue={branding?.logo_url ?? ""} />
        <Input label="Primary color (hex)" name="primary_color" defaultValue={branding?.primary_color ?? ""} />
        <Input label="Custom domain" name="custom_domain" defaultValue={branding?.custom_domain ?? ""} />
      </div>
      <Checkbox label="Enable white-label (hide ContentFlow branding)" name="white_label" defaultChecked={branding?.white_label} />
      <div className="flex justify-end"><SubmitButton>Save branding</SubmitButton></div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
