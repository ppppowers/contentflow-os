import { describe, it, expect } from "vitest";
import { cleanTranscript } from "@/lib/voice/transcript";
import { meetingReportSchema, countOpportunities, type MeetingReport } from "@/lib/validation/voice";

describe("cleanTranscript", () => {
  it("strips VTT header and timestamp cues", () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hi, thanks for joining.

00:00:04.000 --> 00:00:07.000
We closed the Johnson project.`;
    expect(cleanTranscript(vtt)).toBe("Hi, thanks for joining.\nWe closed the Johnson project.");
  });

  it("strips SRT index lines and timestamps", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
First line.

2
00:00:03,000 --> 00:00:05,000
Second line.`;
    expect(cleanTranscript(srt)).toBe("First line.\nSecond line.");
  });

  it("strips bare Zoom-style timestamps", () => {
    const zoom = `00:12\nAlex: We had a great month.\n00:20\nJordan: Two new donors signed on.`;
    expect(cleanTranscript(zoom)).toBe("Alex: We had a great month.\nJordan: Two new donors signed on.");
  });

  it("keeps plain text unchanged (minus blank lines)", () => {
    expect(cleanTranscript("Line one.\n\nLine two.")).toBe("Line one.\nLine two.");
  });
});

describe("meetingReportSchema + countOpportunities", () => {
  const report: MeetingReport = {
    summary: "Strategy call.",
    extracted: {
      stories: [{ title: "Johnson install", detail: "One-day replacement." }],
      promotions: [],
      customerWins: [{ title: "Referral", detail: "Two neighbors signed up." }],
      contentOpportunities: [{ title: "FAQ post", detail: "Common winter questions." }],
    },
    notableQuotes: ["Best service we've had."],
  };
  it("validates and counts opportunities", () => {
    expect(meetingReportSchema.safeParse(report).success).toBe(true);
    expect(countOpportunities(report)).toBe(3);
  });
  it("rejects unknown keys (strict)", () => {
    expect(meetingReportSchema.safeParse({ ...report, x: 1 }).success).toBe(false);
  });
});
