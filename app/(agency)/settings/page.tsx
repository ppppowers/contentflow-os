import { requireAdmin } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireAdmin();
  return (
    <div>
      <h2 className="text-xl font-semibold">Settings</h2>
      <p className="mt-2 text-sm text-neutral-500">Agency settings, users, packages — later phases.</p>
    </div>
  );
}
