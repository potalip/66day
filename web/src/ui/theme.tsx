import { useSyncExternalStore } from "react";

/**
 * Theme store shared by every component (ThemeToggle in the header and anywhere else stay in sync).
 * "system" follows prefers-color-scheme; "light"/"dark" set <html data-theme> and persist in localStorage("fl-theme").
 * index.html applies the saved value before first paint to avoid a flash.
 */
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const KEY = "fl-theme";
const listeners = new Set<() => void>();
function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch { return "system"; }
}
let current: Theme = typeof window === "undefined" ? "system" : read();

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === "system") { delete el.dataset.theme; try { localStorage.removeItem(KEY); } catch {} }
  else { el.dataset.theme = t; try { localStorage.setItem(KEY, t); } catch {} }
}

export function setTheme(t: Theme) {
  current = t;
  apply(t);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  mq?.addEventListener?.("change", l);
  return () => { listeners.delete(l); mq?.removeEventListener?.("change", l); };
}

function systemDark() { return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches; }

/** [theme, setTheme] — same signature as before, now a shared store. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => "system" as Theme);
  return [theme, setTheme] as const;
}

/** The theme actually on screen ("system" resolved). */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => (current === "system" ? (systemDark() ? "dark" : "light") : current),
    () => "light" as ResolvedTheme,
  );
}
