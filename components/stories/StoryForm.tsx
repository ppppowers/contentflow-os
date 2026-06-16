"use client";

import { useFormState } from "react-dom";
import { Input, Textarea, Select, SubmitButton, FormError } from "@/components/ui/form";
import { STORY_CATEGORIES, STORY_CATEGORY_LABELS } from "@/lib/validation/story";
import type { ActionResult } from "@/lib/actions/stories";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

const OPTIONS = STORY_CATEGORIES.map((c) => ({ value: c, label: STORY_CATEGORY_LABELS[c] }));

export function StoryForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Category" name="category" options={OPTIONS} />
        <Input label="Tags (comma separated)" name="tags" />
      </div>
      <Input label="Title" name="title" required />
      <Textarea label="Summary" name="summary" rows={2} />
      <Textarea label="Detail" name="detail" rows={3} hint="Names, numbers, outcomes." />
      <div className="flex justify-end">
        <SubmitButton>Add story</SubmitButton>
      </div>
      {state && "error" in state && <FormError message={state.error} />}
    </form>
  );
}
