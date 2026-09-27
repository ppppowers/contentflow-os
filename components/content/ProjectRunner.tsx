"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Plain-English labels for each pipeline step.
const STEP_LABELS: Record<string, string> = {
  account_manager: "Reading the brief",
  research: "Researching",
  strategist: "Planning the angle",
  newsletter: "Writing the newsletter",
  seo_blog: "Writing the blog post",
  social: "Writing social posts",
  human_editor: "Editing so it sounds human",
  compliance: "Final safety check",
  delivery: "Packaging it up",
};

type Phase = "idle" | "writing" | "images" | "done" | "stopped" | "error";

// Drives the pipeline one agent per request (each well inside the function time
// limit), shows progress, then optionally generates images.
export function ProjectRunner({
  projectId,
  steps,
  doneSteps,
  autoStart,
  wantsImages,
  hasImages,
  finished,
}: {
  projectId: string;
  steps: string[];
  doneSteps: string[];
  autoStart: boolean;
  wantsImages: boolean;
  hasImages: boolean;
  finished: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set(doneSteps));
  const [current, setCurrent] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(finished ? "done" : "idle");
  const [msg, setMsg] = useState<string | null>(null);
  const started = useRef(false);

  const makeImages = useCallback(async () => {
    setPhase("images");
    setMsg("Creating images… this can take a minute.");
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json().catch(() => ({}));
    setPhase("done");
    if (!res.ok) {
      setMsg(`Writing is done, but images failed: ${data.error || (data.errors ?? []).join("; ") || res.statusText}`);
    } else if (data.promptsOnly === "no_key") {
      setMsg("Image prompts are ready. Copy one from each post into ChatGPT to make the image (or add an OpenAI key to generate them here).");
    } else if (data.promptsOnly === "no_credits") {
      setMsg("Your OpenAI account is out of credits, so we wrote image prompts instead. Copy them from each post into ChatGPT.");
    } else if (data.promptsOnly === "failed") {
      setMsg(`OpenAI couldn't make the images (${(data.errors ?? []).join("; ") || "unknown error"}), so we wrote image prompts instead. Copy them from each post into ChatGPT.`);
    } else {
      setMsg(data.errors?.length ? `Some images failed: ${data.errors.join("; ")}` : null);
    }
    router.refresh();
  }, [projectId, router]);

  const run = useCallback(async () => {
    setPhase("writing");
    setMsg(null);
    for (let guard = 0; guard < 20; guard++) {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, maxSteps: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("error");
        setCurrent(null);
        setMsg(data.error ?? `Something went wrong (${res.status}). Try again.`);
        router.refresh();
        return;
      }
      if (data.ran?.length) setDone((d) => new Set([...d, ...data.ran]));
      if (data.stoppedAt) {
        setPhase("stopped");
        setCurrent(null);
        setMsg(friendlyStop(data.stoppedAt, data.reason));
        router.refresh();
        return;
      }
      if (!data.next) break;
      setCurrent(data.next);
    }
    setCurrent(null);
    router.refresh();
    if (wantsImages && !hasImages) await makeImages();
    else setPhase("done");
  }, [projectId, router, wantsImages, hasImages, makeImages]);

  useEffect(() => {
    if (autoStart && !finished && !started.current) {
      started.current = true;
      // First step label before the first response arrives.
      setCurrent(steps.find((s) => !done.has(s)) ?? null);
      void run();
    }
  }, [autoStart, finished, run, steps, done]);

  const busy = phase === "writing" || phase === "images";
  const progress = Math.round((done.size / steps.length) * 100);

  if (phase === "done" && !msg) return null;

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      {phase !== "done" && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {phase === "images"
                ? "Creating images…"
                : busy
                  ? `${STEP_LABELS[current ?? ""] ?? "Working"}…`
                  : done.size === 0
                    ? "Ready to write"
                    : "Paused"}
            </p>
            <span className="text-xs text-neutral-400">
              {done.size} of {steps.length} steps
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-neutral-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <ol className="grid gap-1 text-xs sm:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s}
                className={done.has(s) ? "text-green-700" : s === current && busy ? "font-medium text-neutral-900" : "text-neutral-400"}
              >
                {done.has(s) ? "✓" : s === current && busy ? "●" : "○"} {STEP_LABELS[s] ?? s}
              </li>
            ))}
          </ol>
          {busy && phase === "writing" && (
            <p className="text-xs text-neutral-400">Usually takes 3–6 minutes. Keep this tab open.</p>
          )}
        </>
      )}
      {msg && <p className={`text-sm ${phase === "done" ? "text-amber-700" : "text-neutral-700"}`}>{msg}</p>}
      {!busy && phase !== "done" && (
        <button
          onClick={run}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {done.size === 0 ? "Start writing" : "Continue"}
        </button>
      )}
    </div>
  );
}

function friendlyStop(agent: string, reason?: string): string {
  if (agent === "human_editor") {
    return "The editor couldn't get the writing to sound human enough after 3 tries. Read the drafts under Advanced, or press Continue to move on anyway.";
  }
  if (agent === "compliance") {
    return "The safety check flagged something. See Advanced → Latest agent outputs → compliance for details.";
  }
  return `Stopped at "${STEP_LABELS[agent] ?? agent}": ${reason ?? "unknown error"}. Press Continue to retry.`;
}
