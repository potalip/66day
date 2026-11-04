// OWNER: learn. Today: the day you should work on now, or a calm "done for today" / "finished" state.
import { Link, Navigate } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { Badge, ButtonLink, Card, EmptyState, ProgressBar } from "@web/ui";
import { StreakChip, StreakNudge, XpBar } from "@web/features/game/widgets";
import { useDay, useOverview, type Overview } from "./data";
import { DayView } from "./DayView";
import { strings, type LearnStrings } from "./strings";
import { ErrorState, Icon, PageSkeleton } from "./ui";

export default function Today() {
  const lang = useLang();
  const s = useStrings(strings);
  const ov = useOverview(lang);
  const o = ov.data;
  const lastDone = o ? Math.max(0, ...o.cells.filter((c) => c.access === "done").map((c) => c.day)) : 0;
  const dayNum = !o || !o.onboarded ? null : o.status === "open" ? o.nextDay : null;
  const nextCell = o && o.nextDay ? o.cells[o.nextDay - 1] : null;
  const day = useDay(lang, dayNum && nextCell?.available ? dayNum : null);

  if (ov.loading && !o) return <PageSkeleton />;
  if (ov.error || !o) return <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => ov.reload()} />;
  if (!o.onboarded) return <Navigate to={`/${lang}/start`} replace />;

  return (
    <div className="mx-auto max-w-6xl">
      <StreakNudge className="mb-6" />
      <TodayHeader s={s} o={o} lang={lang} />
      {o.status === "finished" ? (
        <Finished s={s} lang={lang} />
      ) : o.status === "waiting" ? (
        <DoneForToday s={s} lang={lang} o={o} lastDone={lastDone} />
      ) : nextCell && !nextCell.available ? (
        <EmptyState icon={<Icon.pen />} title={s.unwrittenTitle(nextCell.day)} description={s.unwrittenBody}
          action={<ButtonLink to={`/${lang}/path`} variant="outline" icon={<Icon.map />}>{s.seePath}</ButtonLink>} />
      ) : day.loading && !day.data ? (
        <PageSkeleton />
      ) : day.error || !day.data?.day ? (
        <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => day.reload()} />
      ) : (
        <DayView lang={lang} data={day.data} onChanged={() => { void ov.reload(true); void day.reload(true); }} />
      )}
    </div>
  );
}

function TodayHeader({ s, o, lang }: { s: LearnStrings; o: Overview; lang: "ru" | "en" }) {
  const phase = o.program.phases.find((p) => o.nextDay && o.nextDay >= p.days[0] && o.nextDay <= p.days[1]);
  return (
    <section className="mb-8 border-b border-line pb-6" aria-label={s.todayTitle}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {s.hello(o.profile?.name ?? null)}
            {o.profile && <> · <Link to={`/${lang}/start`} className="underline-offset-2 hover:text-fg hover:underline">{s.track[o.profile.track]} · {s.changeTrack}</Link></>}
          </p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">
            {s.dayOf(o.nextDay ?? o.totalDays, o.totalDays)}
            {phase && <span className="font-normal text-muted"> · {phase.title}</span>}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <StreakChip />
          <XpBar compact className="min-w-0 flex-1 sm:w-56 sm:flex-none" />
        </div>
      </div>
      <ProgressBar value={o.completedCount} max={o.totalDays} label={s.progressLabel(o.completedCount, o.totalDays)} showValue={`${o.percent}%`} className="mt-5" />
      {o.behind > 0 && o.status === "open" && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted"><Badge tone="gold">{s.catchingUp}</Badge><span>{s.behind(o.behind)}</span></p>
      )}
      {o.source === "fixtures" && <p className="mt-3 text-xs text-muted">{s.fixturesNote}</p>}
    </section>
  );
}

function DoneForToday({ s, lang, o, lastDone }: { s: LearnStrings; lang: "ru" | "en"; o: Overview; lastDone: number }) {
  const next = o.nextDay ? o.cells[o.nextDay - 1] : null;
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4">
      <Card padding="lg">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink"><Icon.check size={24} strokeWidth={3} /></div>
        <h1 className="text-2xl font-semibold tracking-tight">{s.doneForToday}</h1>
        <p className="mt-2 max-w-[56ch] text-muted">{s.doneForTodayBody}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {lastDone > 0 && <ButtonLink to={`/${lang}/day/${lastDone}`} variant="outline">{s.reviewToday}</ButtonLink>}
          <ButtonLink to={`/${lang}/path`} variant="ghost" icon={<Icon.map />}>{s.seePath}</ButtonLink>
        </div>
      </Card>
      {next && next.available && (
        <Card>
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
            <Icon.lock size={13} />{s.opensTomorrow} · {s.dayN(next.day)}
            {next.boss && <Badge tone="gold" size="sm" icon={<Icon.crown />}>{s.boss}</Badge>}
            {next.rest && <Badge tone="accent" size="sm" icon={<Icon.moon />}>{s.rest}</Badge>}
          </p>
          <p className="mt-2 text-lg font-semibold">{next.title}</p>
          <p className="mt-1 text-muted">{next.summary}</p>
          <p className="mt-3 flex gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Icon.clock size={15} />{s.approxMinutes(next.estMinutes)}</span>
            <span className="inline-flex items-center gap-1.5 text-gold"><Icon.sparkle size={15} className="text-gold-bright" />{s.xp(next.xp)}</span>
          </p>
        </Card>
      )}
      <p className="mt-2 text-sm font-medium text-muted">{s.meanwhile}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ButtonLink to={`/${lang}/library`} variant="outline" size="lg" className="justify-start" icon={<Icon.book />}>{s.meanwhileLibrary}</ButtonLink>
        <ButtonLink to={`/${lang}/studio`} variant="outline" size="lg" className="justify-start" icon={<Icon.play />}>{s.meanwhileStudio}</ButtonLink>
      </div>
    </div>
  );
}

function Finished({ s, lang }: { s: LearnStrings; lang: "ru" | "en" }) {
  return (
    <Card padding="lg" className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-gold-soft text-gold-ink"><Icon.crown size={30} /></div>
      <h1 className="text-3xl font-semibold tracking-tight">{s.finishedTitle}</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-muted">{s.finishedBody}</p>
      <ButtonLink to={`/${lang}/path`} className="mt-6" icon={<Icon.map />}>{s.seePath}</ButtonLink>
    </Card>
  );
}
