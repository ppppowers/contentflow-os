"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton, FormError, Select } from "@/components/ui/form";
import { captureContent, type ActionResult } from "@/lib/actions/harvest";
import { HARVEST_CARDS, type HarvestCard } from "@/lib/harvest/cards";
import { INTAKE_TYPES, INTAKE_TYPE_LABELS } from "@/lib/validation/intake";

const TYPE_OPTIONS = INTAKE_TYPES.map((t) => ({ value: t, label: INTAKE_TYPE_LABELS[t] }));

// Grid of Quick Action Cards. Clicking one opens an inline capture box preset to
// that card's type — one click to start, two fields to finish.
export function QuickCapture({ clientId }: { clientId: string }) {
  const [active, setActive] = useState<HarvestCard | null>(null);
  const action = captureContent.bind(null, clientId);
  const [state, formAction] = useFormState<ActionResult | undefined, FormData>(
    async (prev, fd) => {
      const res = await action(prev, fd);
      if (res && "ok" in res) setActive(null);
      return res;
    },
    undefined,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {HARVEST_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => setActive(card)}
            className={`rounded-lg border p-3 text-left transition hover:border-neutral-900 ${
              active?.key === card.key ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
            }`}
          >
            <div className="text-2xl">{card.icon}</div>
            <div className="mt-1 text-sm font-medium text-neutral-900">{card.label}</div>
          </button>
        ))}
      </div>

      {active && (
        <form action={formAction} className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{active.icon}</span>
            <span className="text-sm font-semibold">{active.label}</span>
          </div>
          {/* Preset type, still editable. */}
          <input type="hidden" name="_card" value={active.key} />
          <Select label="Type" name="type" options={TYPE_OPTIONS} defaultValue={active.intakeType} />
          <input
            name="title"
            placeholder="Optional headline"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            rows={3}
            placeholder={active.prompt}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setActive(null)} className="text-xs text-neutral-500 hover:underline">
              Cancel
            </button>
            <SubmitButton>Save capture</SubmitButton>
          </div>
          {state && "error" in state && <FormError message={state.error} />}
        </form>
      )}
    </div>
  );
}
