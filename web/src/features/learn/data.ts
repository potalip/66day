// OWNER: learn. Data hooks for the learn + onboarding features (plain fetch, no extra deps).
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@shared/types";
import type {
  DayCompleteResult, DayResponse, OnboardingResult, Overview, TaskResult,
} from "../../../../worker/lib/learn/api-types";

export type * from "../../../../worker/lib/learn/api-types";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "content-type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    credentials: "include",
  });
  if (!res.ok) {
    let code = "generic", message = res.statusText;
    try { const b = await res.json() as { error?: string; message?: string }; code = b.error ?? code; message = b.message ?? message; } catch {}
    throw new ApiError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}

/** Tiny fetch-state hook with reload + optimistic replace. */
function useResource<T>(key: string | null, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const f = useRef(fetcher);
  f.current = fetcher;
  const seq = useRef(0);
  const load = useCallback(async (quiet = false) => {
    const my = ++seq.current;
    if (!quiet) setLoading(true);
    try {
      const d = await f.current();
      if (my === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(e as Error);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);
  useEffect(() => { if (key !== null) void load(); }, [key, load]);
  return { data, error, loading, reload: load, setData };
}

export function useOverview(lang: Lang) {
  return useResource(`ov:${lang}`, () => call<Overview>(`/progress?lang=${lang}`));
}

export function useDay(lang: Lang, day: number | null) {
  return useResource(day ? `day:${lang}:${day}` : null, () => call<DayResponse>(`/progress/day/${day}?lang=${lang}`));
}

export const learnApi = {
  overview: (lang: Lang) => call<Overview>(`/progress?lang=${lang}`),
  onboarding: (body: Record<string, unknown>) => call<OnboardingResult>(`/progress/onboarding`, { method: "POST", json: body }),
  updateProfile: (lang: Lang, body: Record<string, unknown>) => call<Overview>(`/progress/profile?lang=${lang}`, { method: "PATCH", json: body }),
  submitTask: (lang: Lang, day: number, taskId: string, proof: { text?: string; url?: string; file?: File }) => {
    const path = `/progress/day/${day}/task/${encodeURIComponent(taskId)}?lang=${lang}`;
    if (proof.file) {
      const fd = new FormData();
      fd.set("file", proof.file);
      if (proof.text) fd.set("text", proof.text);
      return call<TaskResult>(path, { method: "POST", body: fd });
    }
    return call<TaskResult>(path, { method: "POST", json: { text: proof.text, url: proof.url } });
  },
  uncheckTask: (lang: Lang, day: number, taskId: string) =>
    call<DayResponse>(`/progress/day/${day}/task/${encodeURIComponent(taskId)}?lang=${lang}`, { method: "DELETE" }),
  completeDay: (lang: Lang, day: number) => call<DayCompleteResult>(`/progress/day/${day}/complete?lang=${lang}`, { method: "POST" }),
};

export function formatDate(sec: number, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long" }).format(new Date(sec * 1000));
}

// Badge definitions (content/badges.json via API), fetched once per page load.
import type { BadgeDef } from "../../../../worker/lib/learn/api-types";
let badgeCache: Promise<Record<string, BadgeDef>> | null = null;
export function useBadges(): Record<string, BadgeDef> {
  const [map, setMap] = useState<Record<string, BadgeDef>>({});
  useEffect(() => {
    badgeCache ??= call<BadgeDef[]>("/curriculum/badges")
      .then((list) => Object.fromEntries(list.map((b) => [b.id, b])))
      .catch(() => { badgeCache = null; return {}; });
    let live = true;
    void badgeCache.then((m) => { if (live) setMap(m); });
    return () => { live = false; };
  }, []);
  return map;
}
