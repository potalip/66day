// OWNER: game agent. Data hooks for the game area + a tiny refresh bus so widgets update after awards.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@web/api";
import type { BadgeInfo, GameMe, LeaderboardResponse, PublicProfile } from "../../../../worker/lib/game/types";

export type { BadgeInfo, GameMe, LeaderboardResponse, PublicProfile };
export type { LeaderRow, ActivityCell, EarnedBadge, ShippedItem, StreakInfo } from "../../../../worker/lib/game/types";

const EVT = "fl:game-changed";
/** Call after any action that may have changed XP/streak/badges; all game widgets refetch. */
export function notifyGameChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export interface Loadable<T> { data: T | null; error: Error | null; loading: boolean; reload: () => void }

export function useApiData<T>(path: string | null): Loadable<T> {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  const seq = useRef(0);
  const load = useCallback(() => {
    if (!path) return;
    const n = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>(path)
      .then((data) => n === seq.current && setState({ data, error: null, loading: false }))
      .catch((error: Error) => n === seq.current && setState((s) => ({ data: s.data, error, loading: false })));
  }, [path]);
  useEffect(() => {
    load();
    window.addEventListener(EVT, load);
    return () => window.removeEventListener(EVT, load);
  }, [load]);
  return { ...state, reload: load };
}

let tzSynced = false;
/** Current student's game state. Also tells the server the browser's timezone once per session. */
export function useGameMe(enabled = true) {
  const r = useApiData<GameMe>(enabled ? "/game/me" : null);
  useEffect(() => {
    if (!r.data || tzSynced) return;
    tzSynced = true;
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* ignore */ }
    if (tz && tz !== r.data.timezone) {
      api("/game/timezone", { method: "PUT", json: { tz } }).then(() => r.reload()).catch(() => {});
    }
  }, [r.data]); // eslint-disable-line react-hooks/exhaustive-deps
  return r;
}

let catalogCache: Promise<BadgeInfo[]> | null = null;
export function loadBadgeCatalog(): Promise<BadgeInfo[]> {
  catalogCache ??= api<BadgeInfo[]>("/game/badges").catch((e) => {
    catalogCache = null;
    throw e;
  });
  return catalogCache;
}
export function useBadgeCatalog(): BadgeInfo[] | null {
  const [c, setC] = useState<BadgeInfo[] | null>(null);
  useEffect(() => {
    let on = true;
    loadBadgeCatalog().then((x) => on && setC(x)).catch(() => {});
    return () => { on = false; };
  }, []);
  return c;
}
