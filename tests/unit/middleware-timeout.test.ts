import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Simulate Supabase auth: either answers immediately or never answers (paused project).
let getUserImpl: () => Promise<unknown>;
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: () => getUserImpl() } }),
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("updateSession auth timeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the user when Supabase answers", async () => {
    getUserImpl = async () => ({ data: { user: { id: "u1" } } });
    const res = await updateSession(new NextRequest("http://localhost/dashboard"));
    expect(res.user).toEqual({ id: "u1" });
    expect(res.authUnavailable).toBe(false);
  });

  it("gives up after 5s instead of hanging when Supabase never answers", async () => {
    getUserImpl = () => new Promise(() => {});
    const pending = updateSession(new NextRequest("http://localhost/dashboard"));
    await vi.advanceTimersByTimeAsync(4999);
    let settled = false;
    void pending.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const res = await pending;
    expect(res.user).toBeNull();
    expect(res.authUnavailable).toBe(true);
  });
});
