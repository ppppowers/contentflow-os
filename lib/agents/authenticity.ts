import { BANNED_DEFAULTS } from "./prompts";

// Deterministic layer of the humanization gate. Scans text for AI tells and
// deducts from 100. Pairs with the Human Editor's LLM judgment (orchestrator
// blends the two). Pure function — no I/O, fully testable.

export type FlagKind = "banned" | "ai_tell" | "transition" | "filler" | "generic";
export type Flag = { phrase: string; kind: FlagKind; count: number; weight: number };

// Extra clichés beyond the brand/default banned list. (Phase 16 expanded.)
const AI_TELLS = [
  "delve", "tapestry", "testament to", "navigate the", "in the realm of",
  "it's worth noting", "when it comes to", "a myriad of", "seamless", "robust",
  "world-class", "best-in-class", "synergy", "paradigm", "holistic",
  "ever-evolving", "ever-changing", "game-changer", "unlock", "harness", "supercharge",
  "unparalleled", "treasure trove", "dive into", "embark", "at its core",
  "the power of", "take it to the next level", "stand out from the crowd",
];
const TRANSITIONS = [
  "moreover", "furthermore", "additionally", "that being said",
  "as we all know", "needless to say", "first and foremost",
  "in addition", "on the other hand", "with that said", "last but not least",
  "to sum up", "all in all", "in summary",
];
const FILLER = [
  "in order to", "it is important to note", "at the end of the day",
  "a wide range of", "in the world of", "the fact that", "in today's society",
  "due to the fact that", "for all intents and purposes", "each and every",
  "when it comes down to it", "the bottom line is",
];
// Generic advice / predictable openings + closings (Phase 16 expanded).
const GENERIC = [
  /in today'?s (fast-paced|ever-changing|modern|digital)\s*world/gi,
  /we (?:are|'re) (?:thrilled|excited|pleased|delighted) to/gi,
  /are you (?:tired|looking|ready)/gi,
  /in conclusion/gi,
  /when all is said and done/gi,
  /look no further/gi,
  /whether you'?re a\b/gi,
  /no matter (?:your|the|what)\b/gi,
  /in this (?:blog|post|article|newsletter)\b/gi,
  /let'?s (?:dive|take a|explore)\b/gi,
  /without further ado/gi,
];

const WEIGHT: Record<FlagKind, number> = {
  banned: 7,
  ai_tell: 4,
  transition: 3,
  filler: 2,
  generic: 8,
};

function countPhrase(haystack: string, phrase: string): number {
  const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return (haystack.match(re) ?? []).length;
}

export function scanText(text: string, extraBanned: string[] = []): {
  score: number;
  flags: Flag[];
  deductions: number;
} {
  const flags: Flag[] = [];
  const add = (phrase: string, kind: FlagKind, count: number) => {
    if (count > 0) flags.push({ phrase, kind, count, weight: WEIGHT[kind] });
  };

  const banned = [...new Set([...BANNED_DEFAULTS, ...extraBanned].map((b) => b.toLowerCase()))];
  for (const b of banned) add(b, "banned", countPhrase(text, b));
  for (const p of AI_TELLS) add(p, "ai_tell", countPhrase(text, p));
  for (const p of TRANSITIONS) add(p, "transition", countPhrase(text, p));
  for (const p of FILLER) add(p, "filler", countPhrase(text, p));
  for (const re of GENERIC) {
    const m = text.match(re);
    if (m) add(m[0].toLowerCase(), "generic", m.length);
  }

  // Each phrase contributes weight × min(count, 3) — repeats hurt but cap out.
  const deductions = flags.reduce((sum, f) => sum + f.weight * Math.min(f.count, 3), 0);
  const score = Math.max(0, 100 - deductions);
  return { score, flags, deductions };
}

// Scan all humanized drafts from a Human Editor output as one corpus.
export function scanEditorOutput(
  output: {
    humanizedNewsletter?: string;
    humanizedBlog?: string;
    humanizedSocial?: { facebook?: string; linkedin?: string; instagram?: string; sms?: string };
  },
  extraBanned: string[] = [],
) {
  const social = output.humanizedSocial ?? {};
  const corpus = [
    output.humanizedNewsletter ?? "",
    output.humanizedBlog ?? "",
    social.facebook ?? "",
    social.linkedin ?? "",
    social.instagram ?? "",
    social.sms ?? "",
  ].join("\n\n");
  return scanText(corpus, extraBanned);
}

// Feedback string fed back into the Human Editor on a rewrite pass.
export function buildRewriteFeedback(flags: Flag[]): string {
  if (flags.length === 0) return "";
  const lines = flags
    .slice(0, 25)
    .map((f) => `- "${f.phrase}" (${f.kind}, ×${f.count})`)
    .join("\n");
  return `REWRITE REQUIRED. The deterministic scanner flagged these AI tells / banned phrases in your last draft. Remove or rewrite EVERY one of them while preserving meaning and the client's voice:\n${lines}`;
}
