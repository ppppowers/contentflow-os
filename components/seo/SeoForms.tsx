"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addTrackedPrompt, saveSiteConnection } from "@/lib/actions/seo";

const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function AddPromptForm({ clientId }: { clientId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState(async (prev: unknown, fd: FormData) => {
    const r = await addTrackedPrompt(clientId, prev, fd);
    if ("ok" in r) ref.current?.reset();
    return r;
  }, undefined);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2 sm:flex-row">
      <input
        name="prompt"
        className={field}
        placeholder="e.g. What's the best volunteer management software for a small animal rescue?"
      />
      <Button label="Track question" pending="Adding…" />
      {state && "error" in state && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

type Site = {
  site_url: string;
  repo: string | null;
  branch: string;
  content_dir: string | null;
  url_prefix: string;
  sitemap_path: string | null;
  brand_terms: string[];
} | null;

export function SiteForm({ clientId, site, defaultUrl }: { clientId: string; site: Site; defaultUrl: string }) {
  const [state, action] = useFormState(saveSiteConnection.bind(null, clientId), undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <In label="Website" name="siteUrl" value={site?.site_url ?? defaultUrl} placeholder="https://volunteerflow.us" />
      <In label="GitHub repo" name="repo" value={site?.repo ?? ""} placeholder="owner/repo" />
      <In label="Branch to open pull requests against" name="branch" value={site?.branch ?? "main"} />
      <In label="Folder for article files (in the repo)" name="contentDir" value={site?.content_dir ?? ""} placeholder="frontend/content/articles" />
      <In label="Article URL prefix" name="urlPrefix" value={site?.url_prefix ?? "/resources"} />
      <In label="Sitemap file to update (optional)" name="sitemapPath" value={site?.sitemap_path ?? ""} placeholder="frontend/public/sitemap.xml" />
      <div className="sm:col-span-2">
        <In
          label="Brand names that count as a mention (comma-separated)"
          name="brandTerms"
          value={site?.brand_terms?.join(", ") ?? ""}
          placeholder="VolunteerFlow, volunteerflow.us"
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button label="Save" pending="Saving…" />
        {state && "error" in state && <span className="text-xs text-red-600">{state.error}</span>}
        {state && "ok" in state && <span className="text-xs text-green-700">Saved</span>}
      </div>
    </form>
  );
}

function In({ label, name, value, placeholder }: { label: string; name: string; value: string; placeholder?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-700">{label}</span>
      <input name={name} defaultValue={value} placeholder={placeholder} className={field} />
    </label>
  );
}

function Button({ label, pending }: { label: string; pending: string }) {
  const { pending: p } = useFormStatus();
  return (
    <button disabled={p} className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
      {p ? pending : label}
    </button>
  );
}
