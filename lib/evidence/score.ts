// Content Evidence System — deterministic Evidence Strength Score (0-100).
// Rewards concrete specifics (numbers, dates, quotes, proper nouns) over vague
// generalities. Pure + testable; pairs with the LLM layers in QA.

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
const WEEKDAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";

export function countNumbers(text: string): number {
  // Numbers, currency, percentages.
  return (text.match(/\$?\d[\d,]*(\.\d+)?%?/g) ?? []).length;
}

export function countDates(text: string): number {
  const re = new RegExp(`\\b(${MONTHS}|${WEEKDAYS})\\b|\\b(19|20)\\d{2}\\b`, "gi");
  return (text.match(re) ?? []).length;
}

export function countQuotes(text: string): number {
  // Pairs of straight or curly double quotes.
  const straight = Math.floor((text.match(/"/g) ?? []).length / 2);
  const curly = (text.match(/[“][^”]+[”]/g) ?? []).length;
  return straight + curly;
}

export function countProperNouns(text: string): number {
  // Capitalized words NOT at the start of a sentence (rough specificity signal).
  const matches = text.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b/gm) ?? [];
  return matches.length;
}

export type EvidenceResult = {
  score: number;
  signals: { numbers: number; dates: number; quotes: number; properNouns: number };
  suggestions: string[];
};

export function evidenceScore(text: string): EvidenceResult {
  const numbers = countNumbers(text);
  const dates = countDates(text);
  const quotes = countQuotes(text);
  const properNouns = Math.min(countProperNouns(text), 12); // cap so names don't dominate

  const weighted = numbers * 10 + dates * 10 + quotes * 14 + properNouns * 4;
  const score = Math.max(0, Math.min(100, weighted));

  const suggestions: string[] = [];
  if (numbers === 0) suggestions.push("Add concrete numbers (counts, amounts, percentages).");
  if (dates === 0) suggestions.push("Anchor it in time (a date, month, or day).");
  if (quotes === 0) suggestions.push("Include a real quote from a person.");
  if (properNouns === 0) suggestions.push("Name real people, places, or programs.");

  return { score, signals: { numbers, dates, quotes, properNouns }, suggestions };
}
