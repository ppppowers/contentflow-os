import Link from "next/link";
import { requireClient } from "@/lib/auth/guards";
import { listClientReviewProjects } from "@/lib/data/approvals";

export default async function ClientReviewPage() {
  await requireClient();
  const projects = await listClientReviewProjects();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Your content</h2>
        <p className="text-sm text-neutral-500">Items awaiting your review</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing awaiting your review right now.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {projects.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <Link href={`/review/${p.id}`} className="text-sm font-medium hover:underline">
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
