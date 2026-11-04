// OWNER: game agent. Profile: own (/:lang/me) or public (/:lang/me?u=<id>, or a future /:lang/u/:userId route).
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api } from "@web/api";
import { useLang, useStrings } from "@web/i18n";
import { notifyGameChanged, useApiData, useBadgeCatalog, useGameMe, type BadgeInfo, type EarnedBadge, type PublicProfile, type ShippedItem } from "./api";
import { fmtDate, fmtNum } from "./format";
import { Heatmap } from "./Heatmap";
import { GameIcon } from "./icons";
import { strings } from "./strings";
import { Button, Card, cx, Skeleton } from "./ui";
import { Avatar, BadgeMedal, displayName, LevelRing, streakMessage, XpBar } from "./widgets";

export default function Profile() {
  const params = useParams();
  const [sp] = useSearchParams();
  const me = useGameMe();
  const requested = params.userId ?? sp.get("u");
  const userId = requested ?? me.data?.userId ?? null;
  const prof = useApiData<PublicProfile>(userId ? `/game/profile/${encodeURIComponent(userId)}` : null);
  const s = useStrings(strings);
  const lang = useLang();

  const error = prof.error ?? (!requested ? me.error : null);
  if (error) {
    const nf = String(error.message).startsWith("404");
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted">{nf ? s.profile.notFound : s.profile.error}</p>
        <div className="mt-4 flex justify-center gap-2">
          {!nf && <Button variant="outline" onClick={() => { prof.reload(); me.reload(); }}>{s.leaderboard.retry}</Button>}
          <Link to={`/${lang}/leaderboard`} className="inline-flex items-center rounded-xl px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">{s.profile.back}</Link>
        </div>
      </Card>
    );
  }
  const p = prof.data && prof.data.userId === userId ? prof.data : null;
  if (!p) return <ProfileSkeleton />;
  const today = p.isMe && me.data ? me.data.today : new Date().toISOString().slice(0, 10);
  return <ProfileView p={p} today={today} />;
}

function ProfileView({ p, today }: { p: PublicProfile; today: string }) {
  const s = useStrings(strings);
  const P = s.profile;
  const lang = useLang();
  const catalog = useBadgeCatalog();
  const name = displayName(p.name, p.userId, s);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {!p.isMe && (
        <Link to={`/${lang}/leaderboard`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <GameIcon name="arrowLeft" size={16} />{P.back}
        </Link>
      )}

      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={name} size={56} highlight={p.isMe} />
            <div className="min-w-0">
              <NameLine p={p} name={name} />
              <p className="mt-1 text-sm text-muted">
                {p.track ? P.tracks[p.track] + " · " : ""}{P.joined(fmtDate(p.joinedAt, lang))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
            <LevelRing level={p.level} progress={p.progress} size={96} label={s.ranks[p.rank]} />
            <span className="text-sm font-medium text-gold">{s.ranks[p.rank]}</span>
          </div>
        </div>
        <XpBar me={p} className="mt-6" />

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={P.totalXp} value={fmtNum(p.xp, lang)} />
          <Stat label={P.currentStreak} value={s.streak.days(p.streak.current)} icon={<GameIcon name="flame" size={16} className={p.streak.status === "done" ? "text-gold" : "text-muted"} />} />
          <Stat label={P.bestStreak} value={s.streak.days(p.streak.best)} />
          <Stat label={s.streak.freezes} title={s.streak.freezeHint} value={`${p.streak.freezes} / ${p.streak.maxFreezes}`}
            icon={<GameIcon name="snowflake" size={16} className="text-accent" />} />
        </dl>
        {p.isMe && (
          <p className={cx("mt-4 rounded-xl px-4 py-3 text-sm",
            p.streak.status === "done" ? "bg-gold-soft text-fg" : p.streak.status === "at_risk" || p.streak.status === "frozen" ? "bg-accent-soft text-fg" : "bg-surface-2 text-muted")}>
            {streakMessage(p.streak, s)}
          </p>
        )}
      </Card>

      <Card className="p-5 sm:p-7" aria-labelledby="g-activity">
        <h2 id="g-activity" className="text-lg font-semibold">{P.activity}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">{P.activityHint}</p>
        <Heatmap cells={p.activity} today={today} />
      </Card>

      <BadgeGrid catalog={catalog} earned={p.badges} />

      <Card className="p-5 sm:p-7" aria-labelledby="g-shipped">
        <h2 id="g-shipped" className="text-lg font-semibold">{P.shipped}</h2>
        {p.shipped.length === 0 ? (
          <p className="mt-2 max-w-[60ch] text-sm text-muted">{p.isMe ? P.shippedEmpty : P.shippedEmptyOther}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {p.shipped.map((it) => <ShippedRow key={it.key} it={it} />)}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NameLine({ p, name }: { p: PublicProfile; name: string }) {
  const s = useStrings(strings);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(p.name ?? "");
  const [busy, setBusy] = useState(false);
  if (editing) {
    return (
      <form className="flex flex-wrap items-center gap-2" onSubmit={async (e) => {
        e.preventDefault();
        const v = val.trim();
        if (!v) return;
        setBusy(true);
        try { await api("/me", { method: "PATCH", json: { display_name: v } }); setEditing(false); notifyGameChanged(); } finally { setBusy(false); }
      }}>
        <input autoFocus value={val} maxLength={40} onChange={(e) => setVal(e.target.value)} placeholder={s.profile.namePlaceholder}
          aria-label={s.profile.namePlaceholder}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-base text-fg outline-none focus:border-accent" />
        <Button type="submit" disabled={busy || !val.trim()}>{s.profile.save}</Button>
        <Button variant="ghost" onClick={() => { setEditing(false); setVal(p.name ?? ""); }}>{s.profile.cancel}</Button>
      </form>
    );
  }
  return (
    <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
      <span className="truncate">{name}</span>
      {p.isMe && (
        <button type="button" onClick={() => setEditing(true)} aria-label={s.profile.editName} title={s.profile.editName}
          className="shrink-0 rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
          <GameIcon name="pencil" size={16} />
        </button>
      )}
    </h1>
  );
}

function Stat({ label, value, icon, title }: { label: string; value: string; icon?: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3.5 py-3" title={title}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-lg font-semibold tabular-nums text-fg">{icon}{value}</dd>
    </div>
  );
}

function BadgeGrid({ catalog, earned }: { catalog: BadgeInfo[] | null; earned: EarnedBadge[] }) {
  const s = useStrings(strings);
  const P = s.profile;
  const lang = useLang();
  const got = useMemo(() => new Map(earned.map((b) => [b.id, b.awardedAt])), [earned]);
  const groups = useMemo(() => {
    if (!catalog) return [];
    const all = [...catalog];
    // badges earned but not in the catalog (e.g. a curriculum id before badges.json lands)
    for (const b of earned) if (!all.some((c) => c.id === b.id)) all.push({ id: b.id, icon: "medal", title: { en: b.id, ru: b.id }, description: { en: "", ru: "" }, group: "program", secret: false });
    const order = ["start", "streak", "craft", "rhythm", "level", "program"];
    const m = new Map<string, BadgeInfo[]>();
    for (const b of all) m.set(b.group, [...(m.get(b.group) ?? []), b]);
    return [...m.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [catalog, earned]);
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  const [sel, setSel] = useState<string | null>(null);
  const selB = sel ? groups.flatMap(([, l]) => l).find((b) => b.id === sel) : null;

  return (
    <Card className="p-5 sm:p-7" aria-labelledby="g-badges">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="g-badges" className="text-lg font-semibold">{P.badges}</h2>
        {catalog && <span className="text-sm text-muted">{P.badgesHint(earned.length, total)}</span>}
      </div>
      {!catalog ? (
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        groups.map(([g, list]) => (
          <div key={g} className="mt-6">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-muted">{P.groups[g] ?? g}</h3>
            <ul className="grid grid-cols-3 gap-x-2 gap-y-2 sm:grid-cols-5">
              {list.map((b) => {
                const at = got.get(b.id);
                const tip = at ? `${b.description[lang]} — ${P.earnedOn(fmtDate(at, lang))}` : `${P.locked}: ${b.description[lang]}`;
                return (
                  <li key={b.id}>
                    <button type="button" title={tip} aria-pressed={sel === b.id} onClick={() => setSel(sel === b.id ? null : b.id)}
                      className={cx("flex w-full flex-col items-center rounded-xl px-1 py-2 text-center hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent", sel === b.id && "bg-surface-2")}>
                      <BadgeMedal badge={b} earned={!!at} size={52} />
                      <span className={cx("mt-2 text-xs font-medium leading-tight", at ? "text-fg" : "text-muted")}>{b.title[lang]}</span>
                      <span className="sr-only">{tip}</span>
                      <span aria-hidden className="mt-0.5 hidden text-[11px] leading-snug text-muted sm:block"><span className="line-clamp-2">{b.description[lang]}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {selB && list.some((b) => b.id === selB.id) && (
              <div role="status" className="mt-3 flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm">
                <BadgeMedal badge={selB} earned={got.has(selB.id)} size={36} />
                <div>
                  <p className="font-medium">{selB.title[lang]}</p>
                  <p className="text-muted">{selB.description[lang]}</p>
                  <p className="mt-1 text-xs text-muted">{got.has(selB.id) ? P.earnedOn(fmtDate(got.get(selB.id)!, lang)) : P.locked}</p>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </Card>
  );
}

function ShippedRow({ it }: { it: ShippedItem }) {
  const s = useStrings(strings);
  const lang = useLang();
  const title = it.title[lang] ?? it.title.en ?? it.title.ru ?? (it.kind === "boss" && it.day ? s.profile.bossDay(it.day) : s.profile.shipTask);
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
        <GameIcon name={it.kind === "boss" ? "flag" : "rocket"} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block text-xs text-muted">
          {it.kind === "boss" && it.day ? s.profile.bossDay(it.day) : s.profile.shipTask} · {fmtDate(it.at, lang, { day: "numeric", month: "short" })}
        </span>
      </span>
      {it.url && (
        <a href={it.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-accent hover:bg-accent-soft">
          {s.profile.open}<GameIcon name="external" size={14} />
        </a>
      )}
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-busy="true">
      <Card className="p-7">
        <div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div><Skeleton className="h-24 w-24 rounded-full" /></div>
        <Skeleton className="mt-6 h-3" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      </Card>
      <Card className="p-7"><Skeleton className="h-24" /></Card>
    </div>
  );
}
