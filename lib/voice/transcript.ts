// Pure transcript normalization. Strips VTT/SRT timestamp scaffolding and Zoom
// export noise so Claude sees clean dialogue. Unit-tested.

const TIMESTAMP_LINE = /^\s*\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}.*$/;
const SRT_INDEX_LINE = /^\s*\d+\s*$/;
const SHORT_TIMESTAMP = /^\s*\d{1,2}:\d{2}(:\d{2})?\s*$/; // Zoom "00:12" on its own line

export function cleanTranscript(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t === "") continue;
    if (t === "WEBVTT") continue;
    if (TIMESTAMP_LINE.test(t)) continue;
    if (SRT_INDEX_LINE.test(t)) continue;
    if (SHORT_TIMESTAMP.test(t)) continue;
    if (/^NOTE\b/.test(t)) continue; // VTT comments
    kept.push(t);
  }
  return kept.join("\n").trim();
}
