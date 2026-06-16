"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubscriptionStatus } from "@/lib/actions/revenue";

const STATUSES = ["active", "past_due", "paused", "cancelled"];

export function SubStatusControl({ subId, current }: { subId: string; current: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          await updateSubscriptionStatus(subId, status);
          router.refresh();
        });
      }}
      className="rounded border border-neutral-300 px-1.5 py-0.5 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
