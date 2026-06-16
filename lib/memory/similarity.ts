// Deterministic lexical similarity. No embeddings (Anthropic exposes no embedding
// API and the platform is Claude-only) — so similarity is computed in-process from
// token + bigram overlap. Pure functions: same inputs → same score, fully testable.

// Common words carry no topical signal; dropped before comparison.
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "as", "is", "are", "was", "were", "be", "been", "this",
  "that", "these", "those", "it", "its", "we", "our", "you", "your", "they",
  "their", "will", "can", "has", "have", "had", "not", "all", "more", "new",
  "about", "into", "out", "up", "down", "how", "what", "when", "why", "who",
]);

// Lowercase → alphanumeric tokens → drop stopwords and very short tokens.
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function bigramSet(tokens: string[]): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) s.add(`${tokens[i]} ${tokens[i + 1]}`);
  return s;
}

// 0..100. Blend single-token overlap (topic words) with bigram overlap (phrasing).
export function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const unigram = jaccard(new Set(ta), new Set(tb));
  const bigram = jaccard(bigramSet(ta), bigramSet(tb));
  return Math.round((0.65 * unigram + 0.35 * bigram) * 100);
}

export function daysBetween(iso: string, now: Date): number {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}

export type HistoryItem = { projectId: string; title: string; topicText: string; date: string };

export type SimilarityMatch = {
  projectId: string;
  title: string;
  score: number;
  daysAgo: number;
  message: string;
};

// Rank past content by similarity to a candidate topic. Returns only matches at
// or above `threshold`, highest first, capped at `limit`.
export function findSimilar(
  candidate: string,
  history: HistoryItem[],
  opts: { now: Date; threshold?: number; limit?: number },
): SimilarityMatch[] {
  const threshold = opts.threshold ?? 30;
  const limit = opts.limit ?? 3;
  return history
    .map((h) => {
      const score = similarity(candidate, h.topicText);
      const daysAgo = daysBetween(h.date, opts.now);
      return {
        projectId: h.projectId,
        title: h.title,
        score,
        daysAgo,
        message: `This topic is ${score}% similar to "${h.title}" generated ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago.`,
      };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
