import { createClient } from "@/lib/supabase/server";

export type StoryRow = {
  id: string;
  category: string;
  title: string;
  summary: string;
  detail: string;
  tags: string[];
  status: string;
  source: string;
  created_at: string;
};

const COLS = "id, category, title, summary, detail, tags, status, source, created_at";

// Story Bank list with optional full-text search + category filter.
export async function listStories(
  clientId: string,
  opts: { query?: string; category?: string } = {},
): Promise<StoryRow[]> {
  const supabase = createClient();
  let q = supabase.from("stories").select(COLS).eq("client_id", clientId);
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.query?.trim()) {
    q = q.textSearch("search", opts.query, { type: "websearch", config: "english" });
  } else {
    q = q.order("created_at", { ascending: false });
  }
  const { data } = await q;
  return (data as StoryRow[] | null) ?? [];
}

export async function getStory(storyId: string): Promise<StoryRow | null> {
  const supabase = createClient();
  const { data } = await supabase.from("stories").select(COLS).eq("id", storyId).maybeSingle();
  return (data as StoryRow | null) ?? null;
}
