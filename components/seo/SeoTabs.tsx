import Link from "next/link";

const TABS = [
  { href: "/seo", label: "Articles" },
  { href: "/seo/visibility", label: "AI visibility" },
  { href: "/seo/sites", label: "Sites" },
];

export function SeoTabs({ active }: { active: string }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">SEO Studio</h2>
        <p className="text-sm text-neutral-500">
          Research what ranks → outline → write → optimize → publish to your site → track rankings and AI mentions.
        </p>
      </div>
      <nav className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2 text-sm ${
              active === t.href
                ? "border-neutral-900 font-medium text-neutral-900"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
