"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { SubmitButton, Field } from "@/components/auth/SubmitButton";
import { UpdatePassword } from "@/components/auth/UpdatePassword";

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordResetAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-neutral-600">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <Field label="Email" name="email" type="email" autoComplete="email" />
      {state && "ok" in state && (
        <p className="text-sm text-green-600">If that email exists, a reset link is on its way.</p>
      )}
      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Send reset link</SubmitButton>
      <p className="text-xs text-neutral-500">
        <Link href="/login" className="hover:underline">Back to sign in</Link>
      </p>
      <UpdatePassword />
    </form>
  );
}
