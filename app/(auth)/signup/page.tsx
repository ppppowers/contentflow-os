"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signUpAction } from "@/lib/auth/actions";
import { SubmitButton, Field } from "@/components/auth/SubmitButton";

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-neutral-600">
        Creates your agency. You become the <strong>owner</strong>.
      </p>
      <Field label="Agency name" name="agencyName" />
      <Field label="Your name" name="fullName" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="new-password" />
      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton>Create agency</SubmitButton>
      <p className="text-xs text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
