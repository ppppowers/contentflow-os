"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-700">{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} required className={inputClass} />
    </label>
  );
}
