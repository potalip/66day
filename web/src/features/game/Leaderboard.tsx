// OWNER: game agent. Weekly / all-time leaderboard with track filter and a pinned "you" row.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "@web/api";
import { useLang, useStrings } from "@web/i18n";
import { notifyGameChanged, useApiData, type LeaderboardResponse, type LeaderRow } from "./api";
import { fmtNum, fmtRelative } from "./format";
import { GameIcon } from "./icons";
import { strings } from "./strings";
import { Button, Card, cx, Segmented, Skeleton } from "./ui";
import { Avatar, displayName } from "./widgets";

type Period = "week" | "all";
type TrackF = "all" | "apps" | "video";

export default function Leaderboard() {
  const s = useStrings(strings);
  const L = s.leaderboard;
  const lang = useLang();
  const [sp, setSp] = useSearchParams();
  const period: Period = sp.get("period") === "all" ? "all" : "week";
  const track: TrackF = sp.get("track") === "apps" || sp.get("track") === "video" ? (sp.get("track") as TrackF) : "all";
  const set = (k: string, v: string, def: string) => {
    const n = new URLSearchParams(sp);
    if (v === def) n.delete(k); else n.set(k, v);
    setSp(n, { replace: true });
  };
  const { data, error, loading, reload } = useApiData<LeaderboardResponse>(`/game/leaderboard?period=${period}&track=${track}&limit=50`);
  const fresh = data && data.period === period && data.track === track ? data : null;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{L.title}</h1>
        <p className="mt-1.5 max-w-[60ch] text-muted">{L.subtitle}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented label={L.title} value={period} onChange={(v) => set("period", v, "week")}
          options={[{ value: "week", label: L.week }, { value: "all", label: L.all }]} />
        <Segmented label={L.tracks.all} size="sm" value={track} onChange={(v) => set("track", v, "all")}
          options={(["all", "apps", "video"] as const).map((v) => ({ value: v, label: L.tracks[v] }))} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-xs text-muted sm:px-5">
          <span>{fresh ? L.students(fresh.total) : " "}</span>
          {period === "week" && fresh && <span>{L.resets(fmtRelative(fresh.resetsAt, lang))}</span>}
        </div>

        {error && !fresh ? (
          <div className="p-8 text-center">
            <p className="text-muted">{L.error}</p>
            <Button variant="outline" className="mt-4" onClick={reload}>{L.retry}</Button>
          </div>
        ) : !fresh ? (
          <ul aria-busy="true" aria-label={L.title}>
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:px-5">
                <Skeleton className="h-4 w-6" /><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-14" />
              </li>
            ))}
          </ul>
        ) : fresh.rows.length === 0 ? (
          <EmptyBoard period={period} onSeeded={reload} />
        ) : (
          <ol aria-label={L.title} className={cx(loading && "opacity-70 transition-opacity")}>
            {fresh.rows.map((r) => <Row key={r.userId} r={r} period={period} />)}
          </ol>
        )}

        {fresh && fresh.rows.length > 0 && (
          fresh.me && !fresh.rows.some((r) => r.isMe) ? (
            <div className="sticky bottom-0 border-t border-line bg-surface">
              <p className="px-4 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted sm:px-5">{L.yourPlace}</p>
              <ol><Row r={fresh.me} period={period} pinned /></ol>
            </div>
          ) : !fresh.me ? (
            <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-5">{L.notRanked}</p>
          ) : null
        )}
      </Card>
    </div>
  );
}

function Row({ r, period, pinned }: { r: LeaderRow; period: Period; pinned?: boolean }) {
  const s = useStrings(strings);
  const L = s.leaderboard;
  const lang = useLang();
  const name = displayName(r.name, r.userId, s);
  const top = r.rank <= 3;
  return (
    <li className={cx("border-b border-line last:border-0", r.isMe && "bg-accent-soft/60")}>
      <Link to={r.isMe ? `/${lang}/me` : `/${lang}/me?u=${encodeURIComponent(r.userId)}`}
        className={cx("flex items-center gap-3 px-4 py-3 hover:bg-surface-2/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:gap-4 sm:px-5", pinned && "pt-1.5")}>
        <span className={cx("w-7 shrink-0 text-center text-sm font-semibold tabular-nums", top ? "text-gold" : "text-muted")}
          aria-label={`${L.rank} ${r.rank}`}>
          {top ? <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft">{r.rank}</span> : r.rank}
        </span>
        <Avatar name={name} highlight={r.isMe} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-fg">{name}</span>
            {r.isMe && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">{L.you}</span>}
          </span>
          <span className="mt-0.5 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted">
            <span>{L.level}&nbsp;{r.level}</span>
            {r.track && <><span aria-hidden>·</span><span>{L.tracks[r.track]}</span></>}
            {r.streak > 0 && (
              <><span aria-hidden>·</span><span className="inline-flex items-center gap-0.5" title={L.streakTitle(r.streak)}>
                <GameIcon name="flame" size={12} className="text-gold" />{r.streak}
              </span></>
            )}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-semibold tabular-nums text-fg">{fmtNum(r.xp, lang)}</span>
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
    <div className="px-6 py-12 text-center">
      <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold"><GameIcon name="trophy" size={24} /></span>
      <h2 className="font-semibold">{L.emptyTitle}</h2>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-sm text-muted">{period === "week" ? L.emptyWeek : L.emptyAll}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to={`/${lang}/today`} className="inline-flex items-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90">
          {L.goToday}
        </Link>
        {dev && (
          <Button variant="outline" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await api("/game/dev/seed", { method: "POST" }); notifyGameChanged(); onSeeded(); } finally { setBusy(false); }
          }}>{busy ? L.seeding : L.seed}</Button>
        )}
      </div>
    </div>
  );
}
