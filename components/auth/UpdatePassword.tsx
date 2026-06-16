"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Shown only when the user arrives via a Supabase recovery link (a session
// exists / PASSWORD_RECOVERY fires). Lets them set a new password.
export function UpdatePassword() {
  const [recovering, setRecovering] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecovering(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!recovering) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("At least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError("Could not update password.");
      return;
    }
    router.push("/");
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-neutral-100 pt-4">
      <p className="text-sm font-medium">Set a new password</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="New password"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
