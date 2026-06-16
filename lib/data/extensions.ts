import { createClient } from "@/lib/supabase/server";

export type Branding = {
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  custom_domain: string | null;
  white_label: boolean;
};

export async function getBranding(): Promise<Branding | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agency_branding")
    .select("brand_name, logo_url, primary_color, custom_domain, white_label")
    .maybeSingle();
  return (data as Branding | null) ?? null;
}

export async function listConnections(): Promise<Record<string, { enabled: boolean }>> {
  const supabase = createClient();
  const { data } = await supabase.from("integration_connections").select("provider_id, enabled");
  const out: Record<string, { enabled: boolean }> = {};
  for (const r of ((data as { provider_id: string; enabled: boolean }[] | null) ?? [])) {
    out[r.provider_id] = { enabled: r.enabled };
  }
  return out;
}
