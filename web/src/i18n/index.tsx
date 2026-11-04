import { createContext, useContext } from "react";
import { en } from "./en";
import { ru } from "./ru";

/**
 * UI strings only. Course CONTENT is not translated — RU and EN are separately authored
 * adaptations living in /content/curriculum/{ru,en}. Keys: dot-free camelCase grouped by area.
 * Each feature agent adds keys to BOTH en.ts and ru.ts inside its own section block.
 */
export type Lang = "ru" | "en";
export const LANGS: Lang[] = ["ru", "en"];
export const dict = { en, ru } as const;
export type Dict = typeof en;

export const LangContext = createContext<Lang>("en");
export function useLang() { return useContext(LangContext); }
export function useT() {
  const lang = useLang();
  return dict[lang] as Dict;
}
export function detectLang(): Lang {
  const n = (navigator.language || "en").toLowerCase();
  return n.startsWith("ru") || n.startsWith("uk") || n.startsWith("be") || n.startsWith("kk") ? "ru" : "en";
}

/**
 * Feature-local strings: each feature keeps its own `strings.ts` exporting { en: {...}, ru: {...} }
 * and calls `useStrings(strings)`. RU is written natively (not machine-translated) — tone: direct, warm, "ты".
 */
export function useStrings<T>(s: { en: T; ru: T }): T {
  return s[useLang()];
}
