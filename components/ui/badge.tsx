import { cn } from "@/lib/utils/format";

const TONES = {
  neutral: "bg-neutral-100 text-neutral-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize", TONES[tone])}>
      {children}
    </span>
  );
}
