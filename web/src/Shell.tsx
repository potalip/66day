import { NavLink, Outlet, useNavigate, useParams, useLocation } from "react-router";
import { LangContext, LANGS, type Lang, dict } from "./i18n";
import { useTheme } from "./ui/theme";

// OWNER: design agent (layout/visuals). Keep nav items + routes in sync with App.tsx.
export function Shell() {
  const { lang = "en" } = useParams();
  const l = (LANGS.includes(lang as Lang) ? lang : "en") as Lang;
  const t = dict[l].shell;
  const [theme, setTheme] = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const switchLang = (to: Lang) => nav(loc.pathname.replace(/^\/(ru|en)/, `/${to}`));
  const item = "px-3 py-2 rounded-lg text-sm text-muted hover:text-fg aria-[current=page]:text-fg aria-[current=page]:bg-surface-2";
  return (
    <LangContext.Provider value={l}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
            <NavLink to={`/${l}`} end className="mr-4 font-semibold tracking-tight">{t.brand}</NavLink>
            <nav className="flex flex-1 gap-1 overflow-x-auto">
              <NavLink className={item} to={`/${l}/today`}>{t.nav.today}</NavLink>
              <NavLink className={item} to={`/${l}/path`}>{t.nav.path}</NavLink>
              <NavLink className={item} to={`/${l}/library`}>{t.nav.library}</NavLink>
              <NavLink className={item} to={`/${l}/studio`}>{t.nav.studio}</NavLink>
              <NavLink className={item} to={`/${l}/leaderboard`}>{t.nav.leaderboard}</NavLink>
            </nav>
            <select aria-label="Language" value={l} onChange={(e) => switchLang(e.target.value as Lang)} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm">
              <option value="ru">RU</option><option value="en">EN</option>
            </select>
            <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value as never)} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm">
              <option value="system">{t.theme.system}</option><option value="light">{t.theme.light}</option><option value="dark">{t.theme.dark}</option>
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
      </div>
    </LangContext.Provider>
  );
}
