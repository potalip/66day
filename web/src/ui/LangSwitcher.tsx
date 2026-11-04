import { useLocation, useNavigate } from "react-router";
import { LANGS, useLang, type Lang } from "@web/i18n";
import { useStrings } from "@web/i18n";
import { uiStrings } from "./strings";
import { Segmented } from "./Tabs";

/** RU / EN switch. Swaps the /:lang prefix and keeps the rest of the URL (path, query, hash). */
export function LangSwitcher({ className }: { className?: string }) {
  const s = useStrings(uiStrings);
  const lang = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const go = (to: Lang) => {
    if (to === lang) return;
    try { localStorage.setItem("fl-lang", to); } catch {}
    const rest = loc.pathname.replace(/^\/(ru|en)(?=\/|$)/, "");
    nav(`/${to}${rest}${loc.search}${loc.hash}`);
  };
  return (
    <Segmented<Lang> label={s.lang.label} value={lang} onChange={go} size="sm" className={className}
      options={LANGS.map((l) => ({ value: l, label: <span lang={l}>{l.toUpperCase()}</span>, title: s.lang[l] }))} />
  );
}
