// OWNER: game agent. Weekly / all-time leaderboard with track filter and a pinned "you" row.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Flame, Trophy } from "lucide-react";
import { api } from "@web/api";
import { useLang, useStrings } from "@web/i18n";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, Segmented, Skeleton, cn, useFormat } from "@web/ui";
import { notifyGameChanged, useApiData, useGameMe, type LeaderboardResponse, type LeaderRow } from "./api";
import { fmtRelative } from "./format";
import { strings } from "./strings";
import { Avatar, displayName, GameLayer, StreakNudge } from "./widgets";

type Period = "week" | "all";
type TrackF = "all" | "apps" | "video";

export default function Leaderboard() {
  const s = useStrings(strings);
  const L = s.leaderboard;
  const lang = useLang();
  const [sp, setSp] = useSearchParams();
  const period: Period = sp.get("period") === "all" ? "all" : "week";
  const t = sp.get("track");
  const track: TrackF = t === "apps" || t === "video" ? t : "all";
  const set = (k: string, v: string, def: string) => {
    const n = new URLSearchParams(sp);
    if (v === def) n.delete(k); else n.set(k, v);
    setSp(n, { replace: true });
  };
  const { data, error, loading, reload } = useApiData<LeaderboardResponse>(`/game/leaderboard?period=${period}&track=${track}&limit=50`);
  const me = useGameMe();
  const fresh = data && data.period === period && data.track === track ? data : null;

  return (
    <div className="mx-auto max-w-3xl">
      <GameLayer />
      <PageHeader eyebrow={L.eyebrow} title={L.title} description={L.subtitle} />

      {me.data && <StreakNudge streak={me.data.streak} href={`/${lang}/today`} className="mb-5" />}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented label={L.period} value={period} onChange={(v) => set("period", v, "week")}
          options={[{ value: "week", label: L.week }, { value: "all", label: L.all }]} />
        <Segmented label={L.track} size="sm" value={track} onChange={(v) => set("track", v, "all")}
          options={(["all", "apps", "video"] as const).map((v) => ({ value: v, label: L.tracks[v] }))} />
      </div>

      {error && !fresh ? (
        <EmptyState tone="danger" icon={<Trophy />} title={L.error} action={<Button variant="outline" onClick={reload}>{L.retry}</Button>} />
      ) : !fresh ? (
        <Card padding="none" role="status" aria-busy="true">
          <span className="sr-only">…</span>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 sm:px-5">
              <Skeleton className="h-4 w-6" /><Skeleton circle className="size-9" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-14" />
            </div>
          ))}
        </Card>
      ) : fresh.rows.length === 0 ? (
        <EmptyBoard period={period} onSeeded={reload} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-xs text-muted sm:px-5">
            <span>{L.students(fresh.total)}</span>
            {period === "week" && <span>{L.resets(fmtRelative(fresh.resetsAt, lang))}</span>}
          </div>
          <ol aria-label={L.title} className={cn(loading && "opacity-70 transition-opacity")}>
            {fresh.rows.map((r) => <Row key={r.userId} r={r} />)}
          </ol>
          {fresh.me && !fresh.rows.some((r) => r.isMe) ? (
            <div className="sticky bottom-0 border-t border-line bg-surface">
              <p className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted sm:px-5">{L.yourPlace}</p>
              <ol><Row r={fresh.me} pinned /></ol>
            </div>
          ) : !fresh.me ? (
            <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-5">{L.notRanked}</p>
          ) : null}
        </Card>
      )}
    </div>
  );
}

function Row({ r, pinned }: { r: LeaderRow; pinned?: boolean }) {
  const s = useStrings(strings);
  const L = s.leaderboard;
  const lang = useLang();
  const f = useFormat();
  const name = displayName(r.name, r.userId, s);
  const top = r.rank <= 3;
  return (
    <li className={cn("border-b border-line last:border-0", r.isMe && "bg-accent-soft/60")}>
      <Link to={r.isMe ? `/${lang}/me` : `/${lang}/u/${encodeURIComponent(r.userId)}`}
        className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:gap-4 sm:px-5", pinned && "pt-1.5")}>
        <span className={cn("w-7 shrink-0 text-center text-sm font-semibold tabular", top ? "text-gold-ink" : "text-muted")}>
          <span className="sr-only">{L.rank} </span>
          {top ? <span className="inline-grid size-7 place-items-center rounded-full bg-gold-soft">{r.rank}</span> : r.rank}
        </span>
        <Avatar name={name} ring={r.isMe ? "accent" : top ? "gold" : undefined} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-fg">{name}</span>
            {r.isMe && <Badge tone="accent" size="sm">{L.you}</Badge>}
          </span>
          <span className="mt-0.5 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted">
            <span>{L.level}&nbsp;{r.level}</span>
            {r.track && <><span aria-hidden>·</span><span>{L.tracks[r.track]}</span></>}
            {r.streak > 0 && (
              <><span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5" title={L.streakTitle(r.streak)}>
                  <Flame aria-hidden className="size-3 text-gold-bright" />{r.streak}<span className="sr-only"> {L.streakTitle(r.streak)}</span>
                </span></>
            )}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-semibold tabular text-fg">{f.number(r.xp)}</span>
          <span className="block text-[11px] uppercase tracking-wider text-muted">XP</span>
        </span>
      </Link>
    </li>
  );
}

function EmptyBoard({ period, onSeeded }: { period: Period; onSeeded: () => void }) {
  const s = useStrings(strings);
  const L = s.leaderboard;
  const lang = useLang();
  const [dev, setDev] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ dev?: boolean }>("/game/health").then((h) => setDev(!!h.dev)).catch(() => {}); }, []);
  return (
    <EmptyState tone="gold" icon={<Trophy />} title={L.emptyTitle} description={period === "week" ? L.emptyWeek : L.emptyAll}
      action={<>
        <ButtonLink to={`/${lang}/today`}>{L.goToday}</ButtonLink>
        {dev && (
          <Button variant="outline" loading={busy} onClick={async () => {
            setBusy(true);
            try { await api("/game/dev/seed", { method: "POST" }); notifyGameChanged(); onSeeded(); } finally { setBusy(false); }
          }}>{L.seed}</Button>
        )}
      </>} />
  );
}
