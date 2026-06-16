"use client";

import { useFormState } from "react-dom";
import { Input, Select, Textarea, SubmitButton, FormError } from "@/components/ui/form";
import {
  createPackage,
  createSubscription,
  recordRevenueEvent,
  type ActionResult,
} from "@/lib/actions/revenue";

type Options = {
  clients: { id: string; name: string }[];
  packages: { id: string; name: string; monthly_price: number }[];
  subscriptions: { id: string; client_id: string; clients: { name: string } | null }[];
};
type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

function Result({ state }: { state: ActionResult | undefined }) {
  if (!state) return null;
  if ("error" in state) return <FormError message={state.error} />;
  return <p className="text-sm text-green-600">Saved.</p>;
}

export function AddPackageForm() {
  const [state, action] = useFormState(createPackage as Action, undefined);
  return (
    <form action={action} className="space-y-3">
      <Input label="Package name" name="name" required />
      <Input label="Monthly price (USD)" name="monthly_price" type="number" defaultValue={0} />
      <Textarea label="Deliverables (one per line)" name="deliverables" rows={2} />
      <Result state={state} />
      <SubmitButton>Add package</SubmitButton>
    </form>
  );
}

export function AddSubscriptionForm({ options }: { options: Options }) {
  const [state, action] = useFormState(createSubscription as Action, undefined);
  return (
    <form action={action} className="space-y-3">
      <Select
        label="Client"
        name="client_id"
        options={options.clients.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Select
        label="Package (optional)"
        name="package_id"
        options={[
          { value: "", label: "—" },
          ...options.packages.map((p) => ({ value: p.id, label: `${p.name} ($${p.monthly_price})` })),
        ]}
      />
      <Input label="Monthly amount (USD)" name="monthly_amount" type="number" defaultValue={0} />
      <Select
        label="Status"
        name="status"
        options={[
          { value: "active", label: "Active" },
          { value: "past_due", label: "Past due" },
          { value: "paused", label: "Paused" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />
      <Result state={state} />
      <SubmitButton>Add subscription</SubmitButton>
    </form>
  );
}

export function RecordEventForm({ options }: { options: Options }) {
  const [state, action] = useFormState(recordRevenueEvent as Action, undefined);
  return (
    <form action={action} className="space-y-3">
      <Select
        label="Client"
        name="client_id"
        options={options.clients.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Select
        label="Subscription (optional)"
        name="subscription_id"
        options={[
          { value: "", label: "—" },
          ...options.subscriptions.map((s) => ({ value: s.id, label: s.clients?.name ?? s.id })),
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          name="type"
          options={[
            { value: "charge", label: "Charge" },
            { value: "refund", label: "Refund" },
            { value: "adjustment", label: "Adjustment" },
          ]}
        />
        <Input label="Amount (USD)" name="amount" type="number" />
      </div>
      <Select
        label="Payment status"
        name="payment_status"
        options={[
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
        ]}
      />
      <Result state={state} />
      <SubmitButton>Record event</SubmitButton>
    </form>
  );
}
