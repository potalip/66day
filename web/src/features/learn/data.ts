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

/** Tell game widgets (XP bar, streak) to refetch — same event the game area listens to; no import coupling. */
function gameChanged<T>(p: Promise<T>): Promise<T> {
  return p.then((r) => { try { window.dispatchEvent(new Event("fl:game-changed")); } catch {} return r; });
}

export const learnApi = {
  overview: (lang: Lang) => call<Overview>(`/progress?lang=${lang}`),
  onboarding: (body: Record<string, unknown>) => gameChanged(call<OnboardingResult>(`/progress/onboarding`, { method: "POST", json: body })),
  updateProfile: (lang: Lang, body: Record<string, unknown>) => call<Overview>(`/progress/profile?lang=${lang}`, { method: "PATCH", json: body }),
  submitTask: (lang: Lang, day: number, taskId: string, proof: { text?: string; url?: string; file?: File }) => {
    const path = `/progress/day/${day}/task/${encodeURIComponent(taskId)}?lang=${lang}`;
    if (proof.file) {
      const fd = new FormData();
      fd.set("file", proof.file);
      if (proof.text) fd.set("text", proof.text);
      return gameChanged(call<TaskResult>(path, { method: "POST", body: fd }));
    }
    return gameChanged(call<TaskResult>(path, { method: "POST", json: { text: proof.text, url: proof.url } }));
  },
  uncheckTask: (lang: Lang, day: number, taskId: string) =>
    call<DayResponse>(`/progress/day/${day}/task/${encodeURIComponent(taskId)}?lang=${lang}`, { method: "DELETE" }),
  completeDay: (lang: Lang, day: number) => gameChanged(call<DayCompleteResult>(`/progress/day/${day}/complete?lang=${lang}`, { method: "POST" })),
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

// ---- library resources for a day (library agent's API; see docs/requests/library-to-learn.md) ----
import type { ResourceCard } from "@web/features/library/types";
export function useDayResources(lang: Lang, day: number, track: string, urls: string[]) {
  const [state, setState] = useState<{ resolved: { input: string; card: ResourceCard | null }[]; extra: ResourceCard[] }>({
    resolved: urls.map((input) => ({ input, card: null })), extra: [],
  });
  const key = `${lang}|${day}|${track}|${urls.join(" ")}`;
  useEffect(() => {
    let live = true;
    const fallback = urls.map((input) => ({ input, card: null as ResourceCard | null }));
    setState({ resolved: fallback, extra: [] });
    const q = new URLSearchParams({ lang });
    for (const u of urls) q.append("url", u);
    const resolve = urls.length
      ? call<{ items: { input: string; card: ResourceCard | null }[] }>(`/library/resolve?${q}`).then((r) => r.items).catch(() => fallback)
      : Promise.resolve(fallback);
    const byDay = call<{ items: ResourceCard[] }>(`/library/by-day/${day}?track=${track}&lang=${lang}`).then((r) => r.items).catch(() => []);
    void Promise.all([resolve, byDay]).then(([resolved, items]) => {
      if (!live) return;
      const seen = new Set(resolved.map((x) => x.card?.id).filter(Boolean));
      setState({ resolved, extra: items.filter((c) => !seen.has(c.id)).slice(0, 4) });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

// ---- public portfolio ----
import type { PortfolioResponse, Visibility } from "../../../../worker/lib/learn/portfolio";
export type { PortfolioItem, PortfolioResponse, Visibility } from "../../../../worker/lib/learn/portfolio";
export function usePortfolio(lang: Lang, userId: string) {
  return useResource(`pf:${lang}:${userId}`, () => call<PortfolioResponse>(`/progress/portfolio/${encodeURIComponent(userId)}?lang=${lang}`));
}
export const portfolioApi = {
  update: (lang: Lang, taskId: string, patch: { visibility?: Visibility; title?: string | null; description?: string | null }) =>
    call<PortfolioResponse>(`/progress/portfolio/items/${encodeURIComponent(taskId)}?lang=${lang}`, { method: "PATCH", json: patch }),
};
