"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/format";

const base =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-neutral-700">{children}</span>;
}

export function Input({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={base}
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  rows = 3,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <Label>{label}</Label>
      <textarea name={name} defaultValue={defaultValue} rows={rows} placeholder={placeholder} className={cn(base, "resize-y")} />
      {hint && <span className="block text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-1">
      <Label>{label}</Label>
      <select name={name} defaultValue={defaultValue} className={base}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "danger" }) {
  const { pending } = useFormStatus();
  const styles =
    variant === "danger"
      ? "border border-red-300 text-red-600 hover:bg-red-50"
      : "bg-neutral-900 text-white hover:bg-neutral-800";
  return (
    <button type="submit" disabled={pending} className={cn("rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50", styles)}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-600">{message}</p>;
}
