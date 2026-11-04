import { useMemo } from "react";
import { useLang, type Lang } from "@web/i18n";

/** Locale-aware formatters: RU "1 240", EN "1,240"; plural forms for RU (день/дня/дней). */
export function formatters(lang: Lang) {
  const loc = lang === "ru" ? "ru-RU" : "en-US";
  const nf = new Intl.NumberFormat(loc);
  const pr = new Intl.PluralRules(loc);
  return {
    number: (n: number) => nf.format(n),
    /** plural(5, { one: "day", other: "days" }) or RU { one: "день", few: "дня", many: "дней", other: "дня" } */
    plural: (n: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }) =>
      forms[pr.select(n)] ?? forms.other,
    date: (d: Date | string | number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
      new Intl.DateTimeFormat(loc, opts).format(new Date(d)),
    relative: (d: Date | string | number) => {
      const diff = (new Date(d).getTime() - Date.now()) / 1000;
      const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
      const abs = Math.abs(diff);
      if (abs < 60) return rtf.format(Math.round(diff), "second");
      if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
      return rtf.format(Math.round(diff / 86400), "day");
    },
  };
}
export function useFormat() { const lang = useLang(); return useMemo(() => formatters(lang), [lang]); }
