// OWNER: game agent. Reusable game widgets — import from "@web/features/game/widgets".
//   <XpBar />          level + progress (fetches /api/game/me itself, or pass `me`)
//   <StreakChip />     flame + current streak + freezes; status-aware
//   <StreakNudge />    calm card shown only when today's action keeps/restarts the streak (put it on Today)
//   showAwards(awards) reward toast + level-up moment + refresh of every game widget. Safe with [] / undefined.
//   <GameLayer />      the host for toasts/level-up (game widgets include it automatically; mounting it once in the
//                      Shell guarantees level-ups are celebrated on every page)
//   <AwardToast />, <LevelRing />, <BadgeMedal />, <Avatar />  — building blocks
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Link } from "react-router";
import { Check, Compass, Flame, Snowflake, Sparkles } from "lucide-react";
import type { Award } from "@shared/types";
import { LangContext, useLang, useStrings, type Lang } from "@web/i18n";
import { Avatar as UiAvatar, Button, ButtonLink, Card, Dialog, ProgressBar, ProgressRing, Skeleton, ToastProvider, cn, useFormat, useToast } from "@web/ui";
import { notifyGameChanged, useApiData, useBadgeCatalog, useGameMe, type BadgeInfo, type GameMe, type QuestsResponse, type StreakInfo } from "./api";
import { fmtRelative } from "./format";
import { handleOf, localHour } from "./format";
import { GameIcon } from "./icons";
import { strings, type GameStrings } from "./strings";
import { GameShareDialog, SHARE_MILESTONES, streakShareData } from "./share";
import type { RankKey } from "../../../../worker/lib/game/levels";

export { notifyGameChanged } from "./api";

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function displayName(name: string | null | undefined, userId: string, s: GameStrings) {
  return name?.trim() || s.profile.anon(handleOf(userId));
}

export function Avatar({ name, size = 36, ring }: { name: string; size?: number; ring?: "accent" | "gold" }) {
  // "Leaf #4057" → initials "L4" instead of "L#"
  return <UiAvatar name={name.replace(/#/g, "")} size={size} ring={ring} />;
}

// ---------------------------------------------------------------------------------------------
/** Circular level indicator: gold arc = progress inside the current level. */
export function LevelRing({ level, progress, size = 112, label }: { level: number; progress: number; size?: number; label?: string }) {
  const s = useStrings(strings);
  return (
    <ProgressRing value={Math.round(Math.min(1, Math.max(0, progress)) * 100)} size={size} stroke={Math.max(5, Math.round(size / 16))} tone="gold"
      label={`${s.level} ${level}${label ? ` · ${label}` : ""}`}>
      <span className="flex flex-col items-center leading-none">
        <span className="font-medium uppercase tracking-[0.12em] text-muted" style={{ fontSize: Math.max(9, size / 11) }}>{s.level}</span>
        <span className="mt-1 font-semibold text-fg" style={{ fontSize: size * 0.32 }}>{level}</span>
      </span>
    </ProgressRing>
  );
}

// ---------------------------------------------------------------------------------------------
type XpData = Pick<GameMe, "level" | "rank" | "xp" | "levelStartXp" | "nextLevelXp" | "progress">;

/** Level + progress bar. Self-fetching unless `me` is passed. `compact` = slim line for headers/cards. */
export function XpBar({ me, compact, className }: { me?: XpData | null; compact?: boolean; className?: string }) {
  const own = useGameMe(me === undefined);
  const d = me ?? (me === undefined ? own.data : null);
  const s = useStrings(strings);
  const f = useFormat();
  if (!d) return <Skeleton className={cn(compact ? "h-6" : "h-12", "w-full", className)} />;
  const inLevel = d.xp - d.levelStartXp;
  const need = d.nextLevelXp - d.levelStartXp;
  return (
    <div className={cn("w-full", className)}>
      {me === undefined && <GameLayer />}
      <div className={cn("mb-1.5 flex items-baseline justify-between gap-3", compact ? "text-xs" : "text-sm")}>
        <span className="font-medium text-fg">
          {s.level} {d.level} <span className="text-muted">· {s.ranks[d.rank]}</span>
        </span>
        <span className="tabular text-muted">{f.number(inLevel)} / {f.number(need)} XP</span>
      </div>
      <ProgressBar value={Math.max(need * 0.02, inLevel)} max={need} tone="gold" size={compact ? "sm" : "md"} label={s.xpToNext(f.number(d.nextLevelXp - d.xp))} />
      {!compact && <p className="mt-1.5 text-xs text-muted">{s.xpToNext(f.number(d.nextLevelXp - d.xp))}</p>}
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

/** Flame + streak count. Gold when today is done; quiet outline while today's action is still open. */
export function StreakChip({ streak, showFreezes = true, className }: { streak?: StreakInfo | null; showFreezes?: boolean; className?: string }) {
  const own = useGameMe(streak === undefined);
  const st = streak ?? (streak === undefined ? own.data?.streak : null);
  const s = useStrings(strings);
  if (!st) return <Skeleton className={cn("inline-block h-8 w-20 rounded-full", className)} />;
  const lit = st.status === "done";
  const Icon = st.status === "frozen" ? Snowflake : Flame;
  const title = `${st.current ? s.streak.chip(st.current) : s.streak.none}. ${streakMessage(st, s)}`;
  return (
    <span title={title} role="img" aria-label={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium tabular",
        lit ? "border-gold-bright/40 bg-gold-soft text-gold-ink" : "border-line bg-surface text-muted",
        className,
      )}>
      {streak === undefined && <GameLayer />}
      <Icon aria-hidden className={cn("size-4", lit ? "fill-gold-bright/30 text-gold-bright" : st.status === "frozen" && "text-info")} />
      <span className={lit ? "text-fg" : undefined}>{st.current}</span>
      {showFreezes && st.freezes > 0 && (
        <span className="ml-0.5 inline-flex items-center gap-0.5 border-l border-line pl-1.5 text-xs text-muted">
          <Snowflake aria-hidden className="size-3" />{st.freezes}
        </span>
      )}
    </span>
  );
}

/**
 * A calm nudge that appears only when it matters: the streak is at risk today, frozen days are about to be covered,
 * or a streak just ended. Renders nothing otherwise. `href` = where the CTA goes (omit on the Today page itself).
 */
export function StreakNudge({ streak, href, className }: { streak?: StreakInfo | null; href?: string; className?: string }) {
  const own = useGameMe(streak === undefined);
  const st = streak ?? (streak === undefined ? own.data?.streak : null);
  const s = useStrings(strings);
  if (!st || !["at_risk", "frozen", "lost"].includes(st.status)) return streak === undefined ? <GameLayer /> : null;
  const evening = localHour() >= 18;
  const [title, body] =
    st.status === "at_risk" ? [s.nudge.atRiskTitle(st.current), `${s.nudge.atRiskBody}${evening ? ` ${s.nudge.evening}` : ""}`]
      : st.status === "frozen" ? [s.nudge.frozenTitle, s.nudge.frozenBody(st.freezesPending)]
      : [s.nudge.lostTitle, s.nudge.lostBody(st.best)];
  const Icon = st.status === "frozen" ? Snowflake : Flame;
  return (
    <Card tone={st.status === "lost" ? "muted" : "gold"} padding="sm" className={cn("flex items-center gap-3.5", className)} role="status">
      {streak === undefined && <GameLayer />}
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-gold-bright">
        <Icon aria-hidden className={cn("size-5", st.status === "frozen" && "text-info")} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{body}</p>
        {href && <Link to={href} className="mt-1.5 inline-block text-sm font-medium text-accent-ink hover:underline sm:hidden">{s.nudge.cta} →</Link>}
      </div>
      {href && <span className="hidden shrink-0 sm:block"><ButtonLink to={href} size="sm" variant="primary">{s.nudge.cta}</ButtonLink></span>}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------
/**
 * This week's quests (1–3, rotating per track every Monday UTC) with progress and bonus XP.
 * Self-fetching; refreshes after any award. Put it on Today: <WeeklyQuests />.
 */
export function WeeklyQuests({ className, compact }: { className?: string; compact?: boolean }) {
  const s = useStrings(strings);
  const Q = s.quests;
  const lang = useLang();
  const { data, error } = useApiData<QuestsResponse>("/game/quests");
  if (error && !data) return null; // quests are a bonus: never block the page
  const allDone = !!data?.quests.length && data.quests.every((q) => q.done);
  return (
    <Card padding={compact ? "sm" : "md"} as="section" aria-labelledby="g-quests" className={className}>
      <GameLayer />
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 id="g-quests" className="flex items-center gap-2 text-base font-semibold"><Compass aria-hidden className="size-[18px] text-gold-bright" />{Q.title}</h2>
          {!compact && <p className="mt-0.5 text-sm text-muted">{Q.subtitle}</p>}
        </div>
        {data && <span className="shrink-0 text-xs text-muted sm:pt-0.5">{Q.resets(fmtRelative(data.resetsAt, lang))}</span>}
      </div>
      {!data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : !data.quests.length ? (
        <p className="text-sm text-muted">{Q.empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {data.quests.map((q) => (
            <li key={q.id} className={cn("flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5",
              q.done ? "border-gold-bright/40 bg-gold-soft" : "border-line bg-surface")}>
              <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full text-lg", q.done ? "bg-surface" : "bg-surface-2")}>
                {q.done ? <Check className="size-[18px] text-gold-bright" /> : q.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm font-medium", q.done ? "text-fg" : "text-fg")}>{q.title[lang]}</p>
                  <span className={cn("shrink-0 text-xs font-semibold tabular", q.done ? "text-gold-ink" : "text-muted")}>+{q.xp} XP</span>
                </div>
                {!compact && <p className="mt-0.5 text-xs text-muted">{q.description[lang]}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={q.progress} max={q.target} tone="gold" size="sm" label={`${q.title[lang]}: ${q.progress} / ${q.target}`} className="flex-1" />
                  <span className="text-[11px] tabular text-muted">{q.done ? Q.done : `${q.progress} / ${q.target}`}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {allDone && <p className="mt-3 text-sm text-muted">{Q.allDone}</p>}
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------
const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);

/** Badge medallion: gold ring when earned, quiet dashed silhouette when locked, "?" for unearned secrets. */
export function BadgeMedal({ badge, earned, size = 56, hidden }: { badge: Pick<BadgeInfo, "icon">; earned: boolean; size?: number; hidden?: boolean }) {
  return (
    <span aria-hidden
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full",
        earned ? "bg-gold-soft text-gold-ink ring-2 ring-gold-bright/70 ring-offset-2 ring-offset-surface"
          : "border border-dashed border-line-strong bg-surface-2 text-muted",
      )}
      style={{ width: size, height: size }}>
      {hidden ? (
        <span className="font-semibold text-muted" style={{ fontSize: size * 0.4 }}>?</span>
      ) : isEmoji(badge.icon) ? (
        <span className={cn(!earned && "opacity-45 grayscale")} style={{ fontSize: size * 0.44, lineHeight: 1 }}>{badge.icon}</span>
      ) : (
        <GameIcon name={badge.icon} size={Math.round(size * 0.46)} className={cn(!earned && "opacity-70")} />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
interface AwardLine { key: string; icon: ReactNode; text: string }

export function describeAwards(awards: Award[], s: GameStrings, lang: Lang, catalog: BadgeInfo[] | null) {
  let xp = 0;
  let level: { n: number; rank: RankKey } | null = null;
  const lines: AwardLine[] = [];
  for (const a of awards) {
    if (a.kind === "xp") {
      xp += a.amount ?? 0;
      if (a.id?.startsWith("quest:")) lines.push({ key: a.id, icon: "🧭", text: a.label ?? a.id });
    }
    else if (a.kind === "level") {
      level = { n: a.amount ?? 1, rank: (a.id as RankKey) ?? "seed" };
      lines.push({ key: `l${a.amount}`, icon: "⭐", text: s.awards.level(a.amount ?? 0, s.ranks[(a.id as RankKey) ?? "seed"] ?? "") });
    } else if (a.kind === "badge") {
      const b = catalog?.find((x) => x.id === a.id);
      lines.push({ key: `b${a.id}`, icon: b ? <BadgeMedal badge={b} earned size={22} /> : "🏅", text: `${s.awards.badge}: ${b?.title[lang] ?? a.label ?? a.id}` });
    } else if (a.kind === "streak") {
      if (a.id === "freeze-earned") lines.push({ key: "fe", icon: "❄️", text: s.awards.freezeEarned });
      else if (a.id === "freeze-used") lines.push({ key: "fu", icon: "❄️", text: s.awards.freezeUsed(a.amount ?? 1) });
      else if ((a.amount ?? 0) > 1) lines.push({ key: "st", icon: "🔥", text: s.awards.streak(a.amount ?? 1) });
    }
  }
  return { xp, level, lines };
}

/** Presentational award card (used by the toast; also usable inline). Renders nothing for an empty list. */
export function AwardToast({ awards, className }: { awards: Award[]; className?: string }) {
  const s = useStrings(strings);
  const lang = useLang();
  const catalog = useBadgeCatalog();
  const { xp, lines } = describeAwards(awards, s, lang, catalog);
  if (!xp && !lines.length) return null;
  return (
    <Card tone="gold" padding="sm" className={cn("flex items-start gap-3", className)}>
      {xp > 0 && <span className="grid h-10 min-w-10 shrink-0 place-items-center rounded-xl bg-surface px-2 text-sm font-semibold tabular text-gold-ink">{s.awards.xp(xp)}</span>}
      <AwardLines lines={lines} fallback={s.awards.nice} />
    </Card>
  );
}

function AwardLines({ lines, fallback }: { lines: AwardLine[]; fallback?: string }) {
  if (!lines.length) return fallback ? <p className="pt-2 text-sm text-muted">{fallback}</p> : null;
  return (
    <ul className="min-w-0 flex-1 space-y-1.5">
      {lines.map((l) => (
        <li key={l.key} className="flex items-center gap-2 text-sm text-fg">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center text-base leading-none">{l.icon}</span>
          <span className="min-w-0">{l.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Inline variant for the kit toast (its description is rendered inside a <p>). */
function ToastLines({ lines }: { lines: AwardLine[] }) {
  return <>{lines.map((l) => <span key={l.key} className="mt-1 flex items-center gap-1.5 text-fg"><span aria-hidden className="inline-grid size-5 place-items-center leading-none">{l.icon}</span>{l.text}</span>)}</>;
}

// ---- award bus + GameLayer -------------------------------------------------------------------
type Batch = { id: number; awards: Award[]; toast: boolean };
let queue: Batch[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let primary: symbol | null = null;
const primarySubs = new Set<() => void>();
let fallbackHost: HTMLElement | null = null;

/**
 * Show awards returned by any API (task/day completion, renders…). Refreshes every game widget.
 * opts.toast=false: skip the toast (e.g. when your screen already shows the awards) but still celebrate level-ups.
 */
export function showAwards(awards: Award[] | undefined | null, opts: { toast?: boolean } = {}) {
  notifyGameChanged();
  if (!awards?.length) return;
  queue = [...queue, { id: ++seq, awards, toast: opts.toast !== false }];
  emit();
  if (!primary && !fallbackHost && typeof document !== "undefined") {
    // Nothing on the page hosts the game layer: mount a private one (outside the app's toast provider).
    fallbackHost = document.createElement("div");
    document.body.appendChild(fallbackHost);
    const lang = (location.pathname.match(/^\/(ru|en)(\/|$)/)?.[1] ?? "en") as Lang;
    createRoot(fallbackHost).render(<LangContext.Provider value={lang}><ToastProvider><GameLayer /></ToastProvider></LangContext.Provider>);
  }
}

const SEEN_KEY = "fl-game-seen-level";
const readSeen = () => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; } };
const writeSeen = (n: number) => { try { localStorage.setItem(SEEN_KEY, String(n)); } catch { /* ignore */ } };

/**
 * Hosts reward toasts and the level-up moment. Any number may be mounted; exactly one is active.
 * Also notices level-ups that happened elsewhere (e.g. a task completed on another screen) the next time
 * game data loads, so the moment is never missed.
 */
export function GameLayer() {
  const me = useRef(Symbol("layer"));
  const isPrimary = useSyncExternalStore(
    (f) => { primarySubs.add(f); return () => primarySubs.delete(f); },
    () => primary === me.current, () => false,
  );
  useEffect(() => {
    const id = me.current;
    if (!primary) { primary = id; primarySubs.forEach((f) => f()); }
    return () => {
      if (primary === id) { primary = null; primarySubs.forEach((f) => f()); }
    };
  }, []);
  // If the active layer unmounts, let a remaining one take over.
  useEffect(() => {
    if (!isPrimary && !primary) { primary = me.current; primarySubs.forEach((f) => f()); }
  });
  return isPrimary ? <ActiveLayer /> : null;
}
/** Alias kept for round-1 callers. */
export const AwardToaster = GameLayer;

function ActiveLayer() {
  const s = useStrings(strings);
  const lang = useLang();
  const catalog = useBadgeCatalog();
  const { toast } = useToast();
  const meData = useGameMe();
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [shareStreak, setShareStreak] = useState<number | null>(null);

  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => queue, () => queue);
  useEffect(() => {
    if (!list.length) return;
    const batches = list;
    queue = [];
    for (const b of batches) {
      const d = describeAwards(b.awards, s, lang, catalog);
      if (d.level) {
        setLevelUp(d.level.n);
        writeSeen(Math.max(readSeen(), d.level.n));
      }
      if (!b.toast || (!d.xp && !d.lines.length)) continue;
      const rest = d.lines.filter((l) => !l.key.startsWith("l"));
      const milestone = b.awards.find((a) => a.kind === "streak" && a.id === "streak" && SHARE_MILESTONES.has(a.amount ?? 0))?.amount;
      toast({
        tone: "reward",
        title: d.xp ? s.awards.xp(d.xp) : rest[0]?.text ?? s.awards.nice,
        description: <ToastLines lines={d.xp ? rest : rest.slice(1)} />,
        duration: milestone ? 9000 : 5500,
        action: milestone ? { label: s.share.streak, onClick: () => setShareStreak(milestone) } : undefined,
      });
    }
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps

  // Level-ups that happened while no layer was listening.
  const level = meData.data?.level;
  useEffect(() => {
    if (!level) return;
    const seen = readSeen();
    if (!seen) writeSeen(level); // first visit: remember, don't celebrate retroactively
    else if (level > seen) {
      writeSeen(level);
      setLevelUp(level);
    }
  }, [level]);

  const m = meData.data;
  const shareData = shareStreak && m
    ? streakShareData({ lang, streak: Math.max(shareStreak, m.streak.current), xp: m.xp, name: m.name, track: m.track, completedDays: m.completedDays })
    : null;
  return (
    <>
      <LevelUpDialog level={levelUp} me={meData.data} onClose={() => setLevelUp(null)} />
      <GameShareDialog open={!!shareData} onClose={() => setShareStreak(null)} data={shareData} />
    </>
  );
}

/** The level-up moment: calm, centred, one button. */
export function LevelUpDialog({ level, me, onClose }: { level: number | null; me?: GameMe | null; onClose: () => void }) {
  const s = useStrings(strings);
  const f = useFormat();
  const [shown, setShown] = useState(0);
  const rank = (me && me.level === level ? me.rank : null) ?? rankOf(level ?? 1);
  useEffect(() => {
    if (!level) return;
    setShown(0);
    // The ring fills all the way: the level was just completed.
    const t = setTimeout(() => setShown(1), reducedMotion() ? 0 : 250);
    return () => clearTimeout(t);
  }, [level]);
  return (
    <Dialog open={!!level} onClose={onClose} side="center" size="sm" hideTitle title={s.levelUp.title(level ?? 1)}
      footer={<Button variant="primary" block onClick={onClose}>{s.levelUp.cta}</Button>}>
      <div className="flex flex-col items-center pb-2 pt-1 text-center">
        <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-gold-ink">
          <Sparkles aria-hidden className="size-3.5 text-gold-bright" />{s.levelUp.eyebrow}
        </p>
        <div className={cn("rounded-full", !reducedMotion() && "animate-pop")}>
          <LevelRing level={level ?? 1} progress={shown} size={132} label={s.ranks[rank]} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">{s.levelUp.title(level ?? 1)} · {s.ranks[rank]}</h2>
        <p className="mt-2 max-w-[34ch] text-muted">{s.rankBlurb[rank]}</p>
        {me && me.level === level && (
          <p className="mt-4 text-xs text-muted">{s.levelUp.next(level + 1, f.number(me.nextLevelXp - me.xp))}</p>
        )}
      </div>
    </Dialog>
  );
}

const RANK_FROM: [number, RankKey][] = [[26, "forest"], [21, "tree"], [16, "grove"], [11, "branch"], [7, "sapling"], [4, "leaf"], [2, "sprout"], [1, "seed"]];
const rankOf = (level: number): RankKey => RANK_FROM.find(([from]) => level >= from)?.[1] ?? "seed";
