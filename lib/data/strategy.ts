import { createClient } from "@/lib/supabase/server";
import type { ContentRoadmap, Horizon } from "@/lib/validation/strategy";

export type RoadmapRow = {
  id: string;
  horizon: number;
  payload: ContentRoadmap;
  created_at: string;
};

// Latest roadmap for a client at a given horizon.
export async function getRoadmap(clientId: string, horizon: Horizon): Promise<RoadmapRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("content_roadmaps")
    .select("id, horizon, payload, created_at")
    .eq("client_id", clientId)
    .eq("horizon", horizon)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as RoadmapRow | null) ?? null;
}
