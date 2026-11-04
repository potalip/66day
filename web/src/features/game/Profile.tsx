// OWNER: game agent. Profile: own (/:lang/me) or public (/:lang/u/:userId; legacy /:lang/me?u=<id>).
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, ExternalLink, ScrollText, Flag, Flame, Pencil, Rocket, Snowflake, TrendingDown, TrendingUp, UserRoundX } from "lucide-react";
import { api } from "@web/api";
import { useLang, useStrings } from "@web/i18n";
import { Button, ButtonLink, Card, EmptyState, Input, SectionTitle, Skeleton, Stat, cn, useFormat } from "@web/ui";
import { notifyGameChanged, useApiData, useBadgeCatalog, useGameMe, type BadgeInfo, type EarnedBadge, type PublicProfile, type ShippedItem } from "./api";
import { fmtDate, fmtDay } from "./format";
import { Heatmap } from "./Heatmap";
import { strings } from "./strings";
import { Avatar, BadgeMedal, displayName, GameLayer, LevelRing, streakMessage, WeeklyQuests, XpBar } from "./widgets";
import type { WeeklyRecap } from "../../../../worker/lib/game/types";

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
      <div className="mx-auto max-w-3xl">
        <EmptyState tone={nf ? "neutral" : "danger"} icon={<UserRoundX />} title={nf ? s.profile.notFound : s.profile.error}
          action={<>
            {!nf && <Button variant="outline" onClick={() => { prof.reload(); me.reload(); }}>{s.leaderboard.retry}</Button>}
            <ButtonLink variant="ghost" to={`/${lang}/leaderboard`}>{s.profile.back}</ButtonLink>
          </>} />
      </div>
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
  const f = useFormat();
  const catalog = useBadgeCatalog();
  const name = displayName(p.name, p.userId, s);
  const lit = p.streak.status === "done";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <GameLayer />
      {!p.isMe && (
        <Link to={`/${lang}/leaderboard`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft aria-hidden className="size-4" />{P.back}
        </Link>
      )}

      <Card padding="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={name} size={56} ring={p.isMe ? "accent" : undefined} />
            <div className="min-w-0 flex-1">
              <NameLine p={p} name={name} />
              <p className="mt-1 text-sm text-muted">
                {p.track ? `${P.tracks[p.track]} · ` : ""}{P.joined(fmtDate(p.joinedAt, lang))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
            <LevelRing level={p.level} progress={p.progress} size={96} label={s.ranks[p.rank]} />
            <span className="text-sm font-medium text-gold-ink">{s.ranks[p.rank]}</span>
          </div>
        </div>
        <XpBar me={p} className="mt-6" />

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: P.totalXp, value: f.number(p.xp) },
            { label: P.currentStreak, value: s.streak.days(p.streak.current), icon: <Flame className={lit ? "fill-gold-bright/30" : undefined} />, tone: lit ? ("gold" as const) : undefined },
            { label: P.bestStreak, value: s.streak.days(p.streak.best) },
            { label: s.streak.freezes, value: `${p.streak.freezes} / ${p.streak.maxFreezes}`, icon: <Snowflake className="text-info" />, hint: s.streak.freezeHint },
          ].map((x) => (
            <div key={x.label} className="rounded-[var(--radius-sm)] bg-surface-2 px-3.5 py-3" title={x.hint}>
              <Stat label={x.label} value={<span className="text-lg">{x.value}</span>} icon={x.icon} tone={x.tone} />
            </div>
          ))}
        </dl>
        {p.isMe && (
          <p className={cn("mt-4 rounded-[var(--radius-sm)] px-4 py-3 text-sm",
            lit ? "bg-gold-soft text-fg" : p.streak.status === "at_risk" || p.streak.status === "frozen" ? "bg-accent-soft text-fg" : "bg-surface-2 text-muted")}>
            {streakMessage(p.streak, s)}
          </p>
        )}
      </Card>

      {p.isMe && p.recap && <RecapCard r={p.recap} catalog={catalog} />}
      {p.isMe && <WeeklyQuests />}
      <CertificateLink p={p} />

      <Card padding="lg" as="section" aria-labelledby="g-activity">
        <SectionTitle title={<span id="g-activity">{P.activity}</span>} description={P.activityHint} />
        <Heatmap cells={p.activity} today={today} />
      </Card>

      <BadgeGrid catalog={catalog} earned={p.badges} />

      <Card padding="lg" as="section" aria-labelledby="g-shipped">
        <SectionTitle title={<span id="g-shipped">{P.shipped}</span>} className="mb-2" />
        {p.shipped.length === 0 ? (
          <p className="max-w-[60ch] text-sm text-muted">{p.isMe ? P.shippedEmpty : P.shippedEmptyOther}</p>
        ) : (
          <ul className="divide-y divide-line">{p.shipped.map((it) => <ShippedRow key={it.key} it={it} />)}</ul>
        )}
      </Card>
    </div>
  );
}

function CertificateLink({ p }: { p: PublicProfile }) {
  const s = useStrings(strings);
  const lang = useLang();
  return (
    <Link to={`/${lang}/certificate/${encodeURIComponent(p.userId)}`}
      className="group flex items-center gap-4 rounded-[var(--radius)] border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink"><ScrollText aria-hidden className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{p.isMe ? s.cert.yours : s.cert.eyebrow}</span>
        <span className="block text-sm text-muted">{s.cert.yoursHint(p.daysDone)}</span>
      </span>
      <ArrowRight aria-hidden className="size-5 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function RecapCard({ r, catalog }: { r: WeeklyRecap; catalog: BadgeInfo[] | null }) {
  const s = useStrings(strings);
  const R = s.recap;
  const lang = useLang();
  const f = useFormat();
  const delta = r.xp - r.prevXp;
  const max = Math.max(1, ...r.days.map((d) => d.xp));
  const weekday = (d: string) => new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
  const badges = r.badges.map((id) => catalog?.find((b) => b.id === id)).filter(Boolean) as BadgeInfo[];
  return (
    <Card padding="lg" as="section" aria-labelledby="g-recap">
      <SectionTitle title={<span id="g-recap">{R.title}</span>} description={R.range(fmtDay(r.from, lang), fmtDay(r.to, lang))} />
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid grid-cols-3 gap-3">
          <Stat label={R.xp} tone="gold" value={f.number(r.xp)}
            hint={<span className="inline-flex items-center gap-1">{delta > 0 ? <TrendingUp aria-hidden className="size-3.5 text-accent" /> : delta < 0 ? <TrendingDown aria-hidden className="size-3.5" /> : null}{R.vsPrev(delta)}</span>} />
          <Stat label={R.activeDays} value={`${r.activeDays} / 7`} />
          <Stat label={R.tasks} value={f.number(r.tasks)} />
        </div>
        <ol className="flex h-20 items-end gap-1.5" aria-label={R.title}>
          {r.days.map((d) => (
            <li key={d.day} className="flex w-6 flex-col items-center gap-1" title={`${fmtDay(d.day, lang)} · ${d.xp} XP`}>
              <span className={cn("w-full rounded-[4px]", d.xp ? "bg-accent" : "bg-surface-3")} style={{ height: `${Math.max(6, (d.xp / max) * 56)}px` }} />
              <span className={cn("text-[10px] uppercase", d.day === r.to ? "font-semibold text-fg" : "text-muted")}>{weekday(d.day)}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-fg">{R.mood(r.activeDays)}{r.bestDay && <span className="text-muted"> {R.bestDay(fmtDay(r.bestDay.day, lang), r.bestDay.xp)}</span>}</p>
        {badges.length > 0 && (
          <span className="flex items-center gap-2 text-xs text-muted">
            {R.newBadges}
            <span className="flex -space-x-1">{badges.slice(0, 5).map((b) => <span key={b.id} title={b.title[lang]}><BadgeMedal badge={b} earned size={26} /></span>)}</span>
          </span>
        )}
      </div>
    </Card>
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
        <Input autoFocus value={val} maxLength={40} onChange={(e) => setVal(e.target.value)} placeholder={s.profile.namePlaceholder}
          aria-label={s.profile.namePlaceholder} className="min-w-0 flex-1" />
        <Button type="submit" size="sm" loading={busy} disabled={!val.trim()}>{s.profile.save}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setVal(p.name ?? ""); }}>{s.profile.cancel}</Button>
      </form>
    );
  }
  return (
    <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
      <span className="truncate">{name}</span>
      {p.isMe && (
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={s.profile.editName} title={s.profile.editName} className="text-muted">
          <Pencil aria-hidden />
        </Button>
      )}
    </h1>
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
    for (const b of earned) if (!all.some((c) => c.id === b.id)) all.push({ id: b.id, icon: "medal", title: { en: b.id, ru: b.id }, description: { en: "", ru: "" }, group: "program", secret: false });
    const order = ["program", "streak", "craft", "rhythm", "level", "secret"];
    const m = new Map<string, BadgeInfo[]>();
    for (const b of all) m.set(b.group, [...(m.get(b.group) ?? []), b]);
    return [...m.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [catalog, earned]);
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  const [sel, setSel] = useState<string | null>(null);

  return (
    <Card padding="lg" as="section" aria-labelledby="g-badges">
      <SectionTitle title={<span id="g-badges">{P.badges}</span>} action={catalog ? <span className="text-sm text-muted">{P.badgesHint(earned.length, total)}</span> : undefined} className="mb-2" />
      {!catalog ? (
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        groups.map(([g, list]) => {
          const selB = list.find((b) => b.id === sel);
          return (
            <div key={g} className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{P.groups[g] ?? g}</h3>
              {g === "secret" && <p className="mb-3 text-xs text-muted">{P.secretHint}</p>}
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {list.map((b) => {
                  const at = got.get(b.id);
                  const hidden = b.secret && !at;
                  const title = hidden ? P.secret : b.title[lang];
                  const desc = hidden ? P.secretHint : b.description[lang];
                  const tip = at ? `${title}. ${desc} — ${P.earnedOn(fmtDate(at, lang))}` : `${title}. ${P.locked}. ${desc}`;
                  return (
                    <li key={b.id}>
                      <button type="button" aria-label={tip} aria-pressed={sel === b.id} onClick={() => setSel(sel === b.id ? null : b.id)}
                        className={cn("flex w-full flex-col items-center rounded-[var(--radius-sm)] px-1 py-2 text-center transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring",
                          sel === b.id && "bg-surface-2")}>
                        <BadgeMedal badge={b} earned={!!at} hidden={hidden} size={52} />
                        <span className={cn("mt-2 text-xs font-medium leading-tight", at ? "text-fg" : "text-muted")}>{title}</span>
                        {!hidden && <span aria-hidden className="mt-0.5 hidden text-[11px] leading-snug text-muted sm:block"><span className="line-clamp-2">{b.description[lang]}</span></span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selB && (
                <div role="status" className="mt-3 flex items-start gap-3 rounded-[var(--radius-sm)] bg-surface-2 px-4 py-3 text-sm">
                  <BadgeMedal badge={selB} earned={got.has(selB.id)} hidden={selB.secret && !got.has(selB.id)} size={36} />
                  <div>
                    <p className="font-medium">{selB.secret && !got.has(selB.id) ? P.secret : selB.title[lang]}</p>
                    <p className="text-muted">{selB.secret && !got.has(selB.id) ? P.secretHint : selB.description[lang]}</p>
                    <p className="mt-1 text-xs text-muted">{got.has(selB.id) ? P.earnedOn(fmtDate(got.get(selB.id)!, lang)) : P.locked}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </Card>
  );
}

function ShippedRow({ it }: { it: ShippedItem }) {
  const s = useStrings(strings);
  const lang = useLang();
  const title = it.title[lang] ?? it.title.en ?? it.title.ru ?? (it.kind === "boss" && it.day ? s.profile.bossDay(it.day) : s.profile.shipTask);
  const Icon = it.kind === "boss" ? Flag : Rocket;
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-ink"><Icon aria-hidden className="size-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block text-xs text-muted">
          {it.kind === "boss" && it.day ? s.profile.bossDay(it.day) : s.profile.shipTask} · {fmtDate(it.at, lang, { day: "numeric", month: "short" })}
        </span>
      </span>
      {it.url && (
        <a href={it.url} target="_blank" rel="noopener noreferrer nofollow"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm text-accent-ink hover:bg-accent-soft">
          {s.profile.open}<ExternalLink aria-hidden className="size-3.5" />
        </a>
      )}
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" role="status" aria-busy="true">
      <Card padding="lg">
        <div className="flex items-center gap-4"><Skeleton circle className="size-14" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div><Skeleton circle className="size-24" /></div>
        <Skeleton className="mt-6 h-3" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      </Card>
      <Card padding="lg"><Skeleton className="h-24" /></Card>
    </div>
  );
}
