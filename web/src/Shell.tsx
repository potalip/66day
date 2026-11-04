import { Suspense, useEffect, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router";
import { CalendarCheck2, Clapperboard, Library, Map as MapIcon, Trophy, UserRound } from "lucide-react";
import { LangContext, LANGS, type Lang, dict } from "./i18n";
import { Logo, LeafMark, ThemeToggle, LangSwitcher, ToastProvider, ButtonLink, RouteFallback, cn, uiStrings, useResolvedTheme } from "./ui";

// OWNER: design agent (layout/visuals). Keep nav items + routes in sync with App.tsx.
type NavKey = "today" | "path" | "library" | "studio" | "leaderboard";
const NAV: { key: NavKey; to: string; icon: ReactNode }[] = [
  { key: "today", to: "today", icon: <CalendarCheck2 aria-hidden /> },
  { key: "path", to: "path", icon: <MapIcon aria-hidden /> },
  { key: "library", to: "library", icon: <Library aria-hidden /> },
  { key: "studio", to: "studio", icon: <Clapperboard aria-hidden /> },
  { key: "leaderboard", to: "leaderboard", icon: <Trophy aria-hidden /> },
];

export function Shell() {
  const { lang = "en" } = useParams();
  const l = (LANGS.includes(lang as Lang) ? lang : "en") as Lang;
  const s = uiStrings[l];
  const loc = useLocation();
  const rest = loc.pathname.replace(/^\/(ru|en)/, "").replace(/\/$/, "");
  const isLanding = rest === "";
  const isFocus = rest === "/start"; // onboarding: no tab bar, minimal chrome

  useEffect(() => { document.documentElement.lang = l; }, [l]);
  const resolved = useResolvedTheme();
  useEffect(() => {
    // Keep the browser chrome colour in sync when the theme is forced (index.html only knows the system scheme).
    const c = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { if (c) m.content = c; });
  }, [resolved]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  // keep orchestrator dict import alive for title/brand consistency
  useEffect(() => { document.title = dict[l].shell.brand; }, [l]);

  const desktopItem = cn(
    "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors",
    "hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg",
  );

  return (
    <LangContext.Provider value={l}>
      <ToastProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-sm focus:text-bg">
          {s.skip}
        </a>
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
              <Link to={`/${l}`} className="-ml-1 rounded-lg px-1 py-1" aria-label={s.brand}>
                <Logo size={26} />
              </Link>
              {!isFocus && (
                <nav aria-label={s.mainNav} className="ml-4 hidden flex-1 items-center gap-0.5 md:flex">
                  {NAV.map((n) => (
                    <NavLink key={n.key} to={`/${l}/${n.to}`} className={cn(desktopItem, "[&_svg]:size-4")}>
                      {n.icon}{n.key === "leaderboard" ? s.navLong.leaderboard : s.nav[n.key]}
                    </NavLink>
                  ))}
                </nav>
              )}
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <LangSwitcher />
                <ThemeToggle variant="icon" />
                {isLanding ? (
                  <span className="ml-1 hidden sm:block"><ButtonLink to={`/${l}/start`} size="sm">{s.start}</ButtonLink></span>
                ) : !isFocus && (
                  <NavLink to={`/${l}/me`} aria-label={s.nav.me} title={s.nav.me}
                    className="grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:text-fg aria-[current=page]:border-accent aria-[current=page]:text-accent-ink">
                    <UserRound className="size-[18px]" aria-hidden />
                  </NavLink>
                )}
              </div>
            </div>
          </header>

          <main id="main" tabIndex={-1} className={cn("flex-1 focus:outline-none",
            isLanding ? "" : "mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-16")}>
            <Suspense fallback={isLanding ? null : <RouteFallback />}>
              <Outlet />
            </Suspense>
          </main>

          {(isLanding || !isFocus) && <Footer lang={l} compact={!isLanding} />}

          {!isLanding && !isFocus && (
            <nav aria-label={s.mainNav}
              className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-md md:hidden">
              <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
                {NAV.map((n) => (
                  <li key={n.key} className="contents">
                    <NavLink to={`/${l}/${n.to}`}
                      className={cn(
                        "group flex flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted transition-colors",
                        "aria-[current=page]:text-accent-ink [&_svg]:size-[22px] [&_svg]:transition-transform aria-[current=page]:[&_svg]:-translate-y-px",
                      )}>
                      <span className="grid h-7 w-12 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-accent-soft">{n.icon}</span>
                      <span className="max-w-full truncate px-0.5">{s.nav[n.key]}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </ToastProvider>
    </LangContext.Provider>
  );
}

function Footer({ lang: l, compact }: { lang: Lang; compact: boolean }) {
  const s = uiStrings[l];
  const year = new Date().getFullYear();
  if (compact) {
    return (
      <footer className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><LeafMark size={18} /> {s.footer.tagline}</span>
          <ThemeToggle />
        </div>
      </footer>
    );
  }
  const col = "grid content-start gap-2.5 text-sm";
  const link = "text-muted transition-colors hover:text-fg";
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="max-w-xs">
          <Logo size={26} />
          <p className="mt-3 text-sm text-muted">{s.footer.tagline}</p>
        </div>
        <div className={col}>
          <p className="font-medium">{s.footer.program}</p>
          <Link className={link} to={`/${l}/start`}>{s.start}</Link>
          <Link className={link} to={`/${l}/path`}>{s.nav.path}</Link>
          <Link className={link} to={`/${l}/today`}>{s.nav.today}</Link>
        </div>
        <div className={col}>
          <p className="font-medium">{s.footer.product}</p>
          <Link className={link} to={`/${l}/library`}>{s.nav.library}</Link>
          <Link className={link} to={`/${l}/studio`}>{s.nav.studio}</Link>
          <Link className={link} to={`/${l}/leaderboard`}>{s.navLong.leaderboard}</Link>
        </div>
        <div className="grid content-start justify-items-start gap-3">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:px-6">
          <span>© {year} {s.footer.rights}</span>
          <span>{s.footer.made}</span>
        </div>
      </div>
    </footer>
  );
}
