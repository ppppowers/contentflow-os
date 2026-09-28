import type { Research, FaqItem } from "./schemas";
import { scanText } from "@/lib/agents/authenticity";

export type ScoreCheck = { label: string; ok: boolean; detail: string; weight: number };
export type ArticleScore = { score: number; checks: ScoreCheck[]; missingTerms: string[]; unansweredQuestions: string[] };

const words = (s: string) => (s.match(/[A-Za-z0-9'’-]+/g) ?? []).length;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// A question counts as covered if most of its meaningful words appear in the article.
function covers(haystack: string, question: string): boolean {
  const stop = new Set(["what", "how", "why", "when", "where", "which", "who", "is", "are", "do", "does", "can", "the", "a", "an", "to", "for", "of", "in", "on", "and", "or", "with", "your", "you", "i", "my", "it", "be", "best"]);
  const keys = norm(question).split(" ").filter((w) => w.length > 2 && !stop.has(w));
  if (keys.length === 0) return true;
  const hit = keys.filter((k) => haystack.includes(k)).length;
  return hit / keys.length >= 0.7;
}

// Deterministic content score (0–100), Frase-style: coverage of key terms and
// questions, length vs. what ranks, structure, metadata, and human-sounding copy.
export function scoreArticle(input: {
  keyword: string;
  title: string | null;
  metaDescription: string | null;
  bodyMd: string | null;
  faq: FaqItem[];
  research: Research | null;
}): ArticleScore {
  const body = input.bodyMd ?? "";
  const all = norm([input.title, body, ...input.faq.map((f) => `${f.question} ${f.answer}`)].join(" "));
  const kw = norm(input.keyword);
  const r = input.research;

  const terms = r?.keyTerms ?? [];
  const missingTerms = terms.filter((t) => !all.includes(norm(t.term))).map((t) => t.term);
  const weighted = terms.reduce((s, t) => s + (t.importance === "must" ? 3 : t.importance === "should" ? 2 : 1), 0);
  const coveredWeight = terms
    .filter((t) => !missingTerms.includes(t.term))
    .reduce((s, t) => s + (t.importance === "must" ? 3 : t.importance === "should" ? 2 : 1), 0);
  const termRatio = weighted ? coveredWeight / weighted : 1;

  const questions = r?.questions ?? [];
  const unansweredQuestions = questions.filter((q) => !covers(all, q));
  const qRatio = questions.length ? (questions.length - unansweredQuestions.length) / questions.length : 1;

  const wc = words(body);
  const target = r?.recommendedWords ?? 1200;
  const lengthOk = wc >= target * 0.8;
  const h2s = (body.match(/^##\s+/gm) ?? []).length;
  const title = input.title ?? "";
  const meta = input.metaDescription ?? "";
  const human = scanText(body).score;

  const checks: ScoreCheck[] = [
    { label: "Covers key terms", ok: termRatio >= 0.8, detail: `${Math.round(termRatio * 100)}% of weighted terms used`, weight: 30 * termRatio },
    { label: "Answers what people ask", ok: qRatio >= 0.7, detail: `${questions.length - unansweredQuestions.length} of ${questions.length} questions covered`, weight: 20 * qRatio },
    { label: "Length vs. what ranks", ok: lengthOk, detail: `${wc} words (target ~${target})`, weight: 15 * Math.min(1, wc / Math.max(1, target)) },
    { label: "Clear structure", ok: h2s >= 3, detail: `${h2s} sections (H2)`, weight: h2s >= 3 ? 10 : (h2s / 3) * 10 },
    { label: "Keyword in title", ok: norm(title).includes(kw), detail: title || "No title yet", weight: norm(title).includes(kw) ? 5 : 0 },
    { label: "Title length", ok: title.length >= 30 && title.length <= 60, detail: `${title.length} characters (30–60)`, weight: title.length >= 30 && title.length <= 60 ? 5 : 0 },
    { label: "Meta description", ok: meta.length >= 120 && meta.length <= 160, detail: `${meta.length} characters (120–160)`, weight: meta.length >= 120 && meta.length <= 160 ? 5 : meta ? 2 : 0 },
    { label: "FAQ section", ok: input.faq.length >= 3, detail: `${input.faq.length} questions (enables FAQ rich results)`, weight: Math.min(1, input.faq.length / 3) * 5 },
    { label: "Sounds human", ok: human >= 90, detail: `Authenticity ${human}/100`, weight: (human / 100) * 5 },
  ];
  const score = Math.round(Math.min(100, checks.reduce((s, c) => s + c.weight, 0)));
  return { score, checks, missingTerms, unansweredQuestions };
}
