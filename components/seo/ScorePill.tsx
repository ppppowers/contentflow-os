export function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-green-100 text-green-800" : score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  return <span className={`rounded-full px-2 py-0.5 font-semibold ${tone}`}>{score}</span>;
}
