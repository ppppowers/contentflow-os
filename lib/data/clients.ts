import { createClient } from "@/lib/supabase/server";

export type ClientRow = {
  id: string;
  name: string;
  website_url: string | null;
  industry: string | null;
  status: "active" | "paused" | "churned";
  health_score: number;
  created_at: string;
};

export async function listClients(): Promise<ClientRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, website_url, industry, status, health_score, created_at")
    .order("name");
  return (data as ClientRow[]) ?? [];
}

export async function getClient(clientId: string): Promise<ClientRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, website_url, industry, status, health_score, created_at")
    .eq("id", clientId)
    .maybeSingle();
  return (data as ClientRow) ?? null;
}

export async function getBrandProfile(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function getContacts(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("client_contacts")
    .select("id, name, email, phone, title, is_primary")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function getNotes(clientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("client_notes")
    .select("id, body, pinned, created_at")
    .eq("client_id", clientId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}
