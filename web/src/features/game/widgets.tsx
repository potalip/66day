// OWNER: game agent. Reusable game widgets — import from "@web/features/game/widgets".
//   <XpBar />        level + progress to next level (fetches /api/game/me itself, or pass `me`)
//   <StreakChip />   flame + current streak, freezes; status-aware
//   <AwardToast />   presentational card for Award[]; or call showAwards(awards) from anywhere
//   <LevelRing />, <BadgeMedal />, <Avatar />  — building blocks used by the profile & leaderboard
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import type { Award } from "@shared/types";
import { LangContext, useLang, useStrings, type Lang } from "@web/i18n";
import { notifyGameChanged, useBadgeCatalog, useGameMe, type BadgeInfo, type GameMe, type StreakInfo } from "./api";
import { fmtNum, handleOf, initials } from "./format";
import { GameIcon } from "./icons";
import { strings, type GameStrings } from "./strings";

export { notifyGameChanged } from "./api";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function displayName(name: string | null | undefined, userId: string, s: GameStrings) {
  return name?.trim() || s.profile.anon(handleOf(userId));
}

// ---------------------------------------------------------------------------------------------
export function Avatar({ name, size = 36, highlight }: { name: string; size?: number; highlight?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        highlight ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
/** Circular level indicator: gold arc = progress inside the level. */
export function LevelRing({ level, progress, size = 112, label }: { level: number; progress: number; size?: number; label?: string }) {
  const s = useStrings(strings);
  const stroke = Math.max(4, Math.round(size / 18));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}
      role="img" aria-label={`${s.level} ${level}${label ? ` · ${label}` : ""} — ${Math.round(p * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gold-soft)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gold)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: reducedMotion() ? undefined : "stroke-dashoffset 700ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted" style={{ fontSize: Math.max(9, size / 11) }}>{s.level}</span>
        <span className="mt-1 font-semibold tabular-nums text-fg" style={{ fontSize: size * 0.32 }}>{level}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
type XpData = Pick<GameMe, "level" | "rank" | "xp" | "levelStartXp" | "nextLevelXp" | "progress">;

/** Level + progress bar. Self-fetching unless `me` is passed. `compact` = single slim line for headers. */
export function XpBar({ me, compact, className }: { me?: XpData | null; compact?: boolean; className?: string }) {
  const own = useGameMe(me === undefined);
  const d = me ?? (me === undefined ? own.data : null);
  const s = useStrings(strings);
  const lang = useLang();
  if (!d) return <div className={cx("h-10 animate-pulse rounded-xl bg-surface-2", compact && "h-6", className)} aria-hidden />;
  const inLevel = d.xp - d.levelStartXp;
  const need = d.nextLevelXp - d.levelStartXp;
  const pct = Math.max(2, Math.min(100, d.progress * 100));
  return (
    <div className={cx("w-full", className)}>
      <div className={cx("flex items-baseline justify-between gap-3", compact ? "text-xs" : "text-sm")}>
        <span className="font-medium text-fg">
          {s.level} {d.level} <span className="text-muted">· {s.ranks[d.rank]}</span>
        </span>
        <span className="tabular-nums text-muted">
          {fmtNum(inLevel, lang)} / {fmtNum(need, lang)} XP
        </span>
      </div>
      <div className={cx("mt-1.5 overflow-hidden rounded-full bg-gold-soft", compact ? "h-1.5" : "h-2.5")}
        role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={inLevel}
        aria-label={s.xpToNext(fmtNum(d.nextLevelXp - d.xp, lang))}>
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%`, transition: reducedMotion() ? undefined : "width 600ms ease" }} />
      </div>
      {!compact && <p className="mt-1.5 text-xs text-muted">{s.xpToNext(fmtNum(d.nextLevelXp - d.xp, lang))}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
export function streakMessage(st: StreakInfo, s: GameStrings) {
  switch (st.status) {
    case "done": return s.streak.done;
    case "at_risk": return s.streak.atRisk(st.current);
    case "frozen": return s.streak.frozen(st.current, st.freezesPending);
    case "lost": return s.streak.lost;
    default: return s.streak.start;
  }
}

/** Flame + streak count. Gold when today is done, outlined when the streak still needs today's action. */
export function StreakChip({ streak, showFreezes = true, className }: { streak?: StreakInfo | null; showFreezes?: boolean; className?: string }) {
  const own = useGameMe(streak === undefined);
  const st = streak ?? (streak === undefined ? own.data?.streak : null);
  const s = useStrings(strings);
  if (!st) return <span className={cx("inline-block h-8 w-20 animate-pulse rounded-full bg-surface-2", className)} aria-hidden />;
  const lit = st.status === "done";
  const frozen = st.status === "frozen";
  const title = `${st.current ? s.streak.chip(st.current) : s.streak.none}. ${streakMessage(st, s)}`;
  return (
    <span title={title} aria-label={title}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium tabular-nums",
        lit ? "border-transparent bg-gold-soft text-gold" : "border-line bg-surface text-muted",
        className,
      )}>
      <GameIcon name={frozen ? "snowflake" : "flame"} size={16} fill={lit ? "currentColor" : "none"} fillOpacity={lit ? 0.25 : 0} />
      <span className={lit ? "text-fg" : undefined}>{st.current}</span>
      {showFreezes && st.freezes > 0 && (
        <span className="ml-0.5 inline-flex items-center gap-0.5 border-l border-line pl-1.5 text-xs text-muted">
          <GameIcon name="snowflake" size={12} />{st.freezes}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
/** A badge medallion: gold ring when earned, quiet dashed silhouette when locked. */
export function BadgeMedal({ badge, earned, size = 56 }: { badge: Pick<BadgeInfo, "icon">; earned: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        earned ? "bg-gold-soft text-gold ring-2 ring-gold/70 ring-offset-2 ring-offset-surface" : "border border-dashed border-line bg-surface-2 text-muted opacity-60",
      )}
      style={{ width: size, height: size }}
    >
      <GameIcon name={badge.icon} size={Math.round(size * 0.46)} />
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
interface AwardLine { key: string; icon: string; title: string; sub?: string; tone: "gold" | "accent" | "muted" }

function describeAwards(awards: Award[], s: GameStrings, lang: Lang, catalog: BadgeInfo[] | null) {
  let xp = 0;
  const lines: AwardLine[] = [];
  for (const a of awards) {
    if (a.kind === "xp") xp += a.amount ?? 0;
    else if (a.kind === "level") {
      const rank = (a.id && (s.ranks as Record<string, string>)[a.id]) || "";
      lines.push({ key: `lvl${a.amount}`, icon: "star", title: s.awards.levelUp, sub: s.awards.level(a.amount ?? 0, rank), tone: "gold" });
    } else if (a.kind === "badge") {
      const b = catalog?.find((x) => x.id === a.id);
      lines.push({ key: `b${a.id}`, icon: b?.icon ?? "medal", title: s.awards.badge, sub: b?.title[lang] ?? a.label ?? a.id, tone: "gold" });
    } else if (a.kind === "streak") {
      if (a.id === "freeze-earned") lines.push({ key: "fe", icon: "snowflake", title: s.awards.freezeEarned, tone: "accent" });
      else if (a.id === "freeze-used") lines.push({ key: "fu", icon: "snowflake", title: s.awards.freezeUsed(a.amount ?? 1), tone: "accent" });
      else lines.push({ key: "st", icon: "flame", title: s.awards.streak(a.amount ?? 1), tone: "muted" });
    }
  }
  return { xp, lines };
}

/** Presentational award card. Renders nothing for an empty list. */
export function AwardToast({ awards, onDismiss, className }: { awards: Award[]; onDismiss?: () => void; className?: string }) {
  const s = useStrings(strings);
  const lang = useLang();
  const catalog = useBadgeCatalog();
  const { xp, lines } = describeAwards(awards, s, lang, catalog);
  if (!xp && !lines.length) return null;
  return (
    <div role="status" aria-live="polite"
      className={cx("w-[min(22rem,calc(100vw-2rem))] rounded-[var(--radius)] border border-line bg-surface p-4 shadow-lg shadow-black/5", className)}>
      <div className="flex items-start gap-3">
        {xp > 0 && (
          <div className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft px-2 text-sm font-semibold tabular-nums text-gold">
            {s.awards.xp(xp)}
          </div>
        )}
        <ul className="min-w-0 flex-1 space-y-2">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center gap-2.5">
              <span className={cx("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                l.tone === "gold" ? "bg-gold-soft text-gold" : l.tone === "accent" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted")}>
                <GameIcon name={l.icon} size={15} />
              </span>
              <span className="min-w-0 text-sm leading-tight">
                <span className="block font-medium text-fg">{l.title}</span>
                {l.sub && <span className="block truncate text-muted">{l.sub}</span>}
              </span>
            </li>
          ))}
          {!lines.length && <li className="pt-2.5 text-sm text-muted">{s.awards.nice}</li>}
        </ul>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label={s.awards.dismiss}
            className="-m-1 rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
            <GameIcon name="x" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---- toast queue -----------------------------------------------------------------------------
type Toast = { id: number; awards: Award[] };
let toasts: Toast[] = [];
let nextId = 1;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const dismiss = (id: number) => { toasts = toasts.filter((t) => t.id !== id); emit(); };
let hostMounted = 0;
let autoHost: HTMLElement | null = null;

/**
 * Show awards returned by any API (e.g. task completion). Safe to call with [] or undefined.
 * Mounts a toaster automatically if the app hasn't rendered <AwardToaster/>.
 */
export function showAwards(awards: Award[] | undefined | null) {
  notifyGameChanged();
  if (!awards?.length) return;
  toasts = [...toasts.slice(-2), { id: nextId++, awards }];
  emit();
  if (!hostMounted && !autoHost && typeof document !== "undefined") {
    autoHost = document.createElement("div");
    document.body.appendChild(autoHost);
    const m = location.pathname.match(/^\/(ru|en)(\/|$)/);
    const lang = (m?.[1] ?? "en") as Lang;
    createRoot(autoHost).render(<LangContext.Provider value={lang}><AwardToaster /></LangContext.Provider>);
  }
}

function ToastItem({ t }: { t: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!reducedMotion()) ref.current?.animate([{ opacity: 0, transform: "translateY(12px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, []);
  useEffect(() => {
    if (hover) return;
    const h = setTimeout(() => dismiss(t.id), 6000);
    return () => clearTimeout(h);
  }, [hover, t.id]);
  return (
    <div ref={ref} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <AwardToast awards={t.awards} onDismiss={() => dismiss(t.id)} />
    </div>
  );
}

/** Fixed toast stack (bottom-center on phones, bottom-right on desktop). Mount once, anywhere. */
export function AwardToaster() {
  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => toasts, () => toasts);
  useEffect(() => { hostMounted++; return () => { hostMounted--; }; }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      {list.map((t) => (
        <div key={t.id} className="pointer-events-auto"><ToastItem t={t} /></div>
      ))}
    </div>
  );
}
