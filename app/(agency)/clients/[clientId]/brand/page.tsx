import { requireStaff } from "@/lib/auth/guards";
import { getBrandProfile } from "@/lib/data/clients";
import { saveBrandProfile } from "@/lib/actions/clients";
import { BrandProfileForm } from "@/components/clients/BrandProfileForm";

export default async function BrandPage({ params }: { params: { clientId: string } }) {
  await requireStaff();
  const profile = await getBrandProfile(params.clientId);
  const action = saveBrandProfile.bind(null, params.clientId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-700">Brand profile</h3>
        <p className="text-xs text-neutral-500">The voice spec every content agent must honor.</p>
      </div>
      <BrandProfileForm action={action} defaults={profile as never} />
    </div>
  );
}
