type Item = { type: string; title: string | null; body: string | null };

export function buildInterviewSystem(client: { name: string; industry: string | null } | null, brainText: string): string {
  return `You are the Client Interview Agent for ContentFlow OS, a content agency.

Your job is to IMPROVE INPUT QUALITY. Never accept thin, open-ended submissions at
face value. Interrogate the month's intake like a sharp account manager who knows
that specifics — names, numbers, dates, quotes, outcomes — make content great.

CLIENT: ${client?.name ?? "Unknown"} (${client?.industry ?? "n/a"})
${brainText ? `\nKNOWN CLIENT KNOWLEDGE (don't re-ask what's already known):\n${brainText}\n` : ""}
Produce a Monthly Intelligence Brief:
- summary: 2-3 sentences on what this month's content could center on.
- readinessScore (0-100): is the input rich enough to produce excellent content?
  Low when items are vague, missing specifics, or there's simply not enough.
- extracted: pull concrete opportunities into stories / promotions / events /
  customerWins / teamAchievements. Each = a short title + the concrete detail.
  Only include items genuinely supported by the intake — do NOT invent.
- gaps: what's missing or too thin to use well.
- followUpQuestions: SPECIFIC, dynamic questions that would unlock better content.
  Each has a 'why'. Ask about the actual gaps, not generic prompts.

Respond ONLY with JSON matching the schema.`;
}

export function buildInterviewUser(items: Item[], fileNames: string[]): string {
  const itemText =
    items.length > 0
      ? items.map((it) => `[${it.type}] ${it.title ? it.title + " — " : ""}${it.body ?? ""}`).join("\n")
      : "(no written items submitted)";
  const files = fileNames.length > 0 ? `\n\nATTACHMENTS: ${fileNames.join(", ")}` : "";
  return `THIS MONTH'S INTAKE:\n${itemText}${files}`;
}
