import { createClient } from "@/lib/supabase/server";

export type RevenueOverview = {
  mrr: number;
  arr: number;
  activeSubs: number;
  byStatus: Record<string, number>;
  clients: {
    client_id: string;
    name: string;
    monthly_amount: number;
    status: string;
    ltv: number;
    subscription_id: string;
  }[];
  packages: { id: string; name: string; monthly_price: number }[];
  recentEvents: {
    id: string;
    type: string;
    amount: number;
    payment_status: string;
    occurred_at: string;
    client: { name: string } | null;
  }[];
};

export async function getRevenueOverview(): Promise<RevenueOverview> {
  const supabase = createClient();

  const [mrrRes, subsRes, ltvRes, pkgRes, eventsRes] = await Promise.all([
    supabase.from("v_agency_mrr").select("mrr").maybeSingle(),
    supabase
      .from("subscriptions")
      .select("id, client_id, monthly_amount, status, clients(name)")
      .order("created_at", { ascending: false }),
    supabase.from("v_client_ltv").select("client_id, ltv"),
    supabase.from("packages").select("id, name, monthly_price").order("monthly_price", { ascending: false }),
    supabase
      .from("revenue_events")
      .select("id, type, amount, payment_status, occurred_at, clients(name)")
      .order("occurred_at", { ascending: false })
      .limit(15),
  ]);

  const mrr = Number((mrrRes.data as { mrr?: number } | null)?.mrr ?? 0);
  const subs =
    (subsRes.data as unknown as {
      id: string;
      client_id: string;
      monthly_amount: number;
      status: string;
      clients: { name: string } | null;
    }[]) ?? [];

  const ltvMap = new Map<string, number>();
  for (const r of (ltvRes.data as { client_id: string; ltv: number }[]) ?? []) {
    ltvMap.set(r.client_id, Number(r.ltv));
  }

  const byStatus: Record<string, number> = {};
  for (const s of subs) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;

  return {
    mrr,
    arr: mrr * 12,
    activeSubs: byStatus["active"] ?? 0,
    byStatus,
    clients: subs.map((s) => ({
      subscription_id: s.id,
      client_id: s.client_id,
      name: s.clients?.name ?? "—",
      monthly_amount: Number(s.monthly_amount),
      status: s.status,
      ltv: ltvMap.get(s.client_id) ?? 0,
    })),
    packages: (pkgRes.data as { id: string; name: string; monthly_price: number }[]) ?? [],
    recentEvents:
      (eventsRes.data as unknown as RevenueOverview["recentEvents"]) ?? [],
  };
}

// Clients + packages for the form selects.
export async function getRevenueFormOptions() {
  const supabase = createClient();
  const [clients, packages, subs] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("packages").select("id, name, monthly_price").order("name"),
    supabase.from("subscriptions").select("id, client_id, clients(name)"),
  ]);
  return {
    clients: (clients.data as { id: string; name: string }[]) ?? [],
    packages: (packages.data as { id: string; name: string; monthly_price: number }[]) ?? [],
    subscriptions:
      (subs.data as unknown as { id: string; client_id: string; clients: { name: string } | null }[]) ?? [],
  };
}
