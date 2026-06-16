"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signInAction } from "@/lib/auth/actions";
import { SubmitButton, Field } from "@/components/auth/SubmitButton";

export default function LoginPage() {
  const [state, formAction] = useFormState(signInAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Sign in</SubmitButton>
      <div className="flex justify-between text-xs text-neutral-500">
        <Link href="/reset-password" className="hover:underline">Forgot password?</Link>
        <Link href="/signup" className="hover:underline">Create agency</Link>
      </div>
    </form>
  );
}
