// OWNER: learn. Today: the day you should work on now, or a calm "done for today" / "finished" state.
import { Link, Navigate } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { useDay, useOverview, type Overview } from "./data";
import { DayView, LearnKeyframes } from "./DayView";
import { strings, type LearnStrings } from "./strings";
import { ButtonLink, Card, Chip, ErrorState, Icon, PageSkeleton, ProgressBar } from "./ui";

export default function Today() {
  const lang = useLang();
  const s = useStrings(strings);
  const ov = useOverview(lang);
  const o = ov.data;
  // When waiting for tomorrow, show the last completed day as "re-read" material; otherwise the next day.
  const lastDone = o ? Math.max(0, ...o.cells.filter((c) => c.access === "done").map((c) => c.day)) : 0;
  const dayNum = !o || !o.onboarded ? null : o.status === "open" ? o.nextDay : null;
  const nextCell = o && o.nextDay ? o.cells[o.nextDay - 1] : null;
  const day = useDay(lang, dayNum && nextCell?.available ? dayNum : null);

  if (ov.loading && !o) return <PageSkeleton />;
  if (ov.error || !o) return <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => ov.reload()} />;
  if (!o.onboarded) return <Navigate to={`/${lang}/start`} replace />;

  return (
    <div className="mx-auto max-w-6xl">
      <TodayHeader s={s} o={o} lang={lang} />
      {o.status === "finished" ? (
        <Finished s={s} lang={lang} />
      ) : o.status === "waiting" ? (
        <DoneForToday s={s} lang={lang} o={o} lastDone={lastDone} />
      ) : nextCell && !nextCell.available ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-surface-2 text-muted"><Icon.pen /></div>
          <h1 className="text-xl font-semibold">{s.unwrittenTitle(nextCell.day)}</h1>
          <p className="mx-auto mt-2 max-w-md text-muted">{s.unwrittenBody}</p>
          <ButtonLink to={`/${lang}/path`} variant="secondary" className="mt-5"><Icon.map size={16} />{s.seePath}</ButtonLink>
        </Card>
      ) : day.loading && !day.data ? (
        <PageSkeleton />
      ) : day.error || !day.data?.day ? (
        <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => day.reload()} />
      ) : (
        <DayView lang={lang} data={day.data} onChanged={() => { void ov.reload(true); void day.reload(true); }} />
      )}
      <LearnKeyframes />
    </div>
  );
}

function TodayHeader({ s, o, lang }: { s: LearnStrings; o: Overview; lang: "ru" | "en" }) {
  const phase = o.program.phases.find((p) => o.nextDay && o.nextDay >= p.days[0] && o.nextDay <= p.days[1]);
  return (
    <section className="mb-8 border-b border-line pb-6" aria-label={s.todayTitle}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {s.hello(o.profile?.name ?? null)}
            {o.profile && <> · <Link to={`/${lang}/start`} className="hover:text-fg hover:underline">{s.track[o.profile.track]} · {s.changeTrack}</Link></>}
          </p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">
            {o.nextDay ? s.dayOf(o.nextDay, o.totalDays) : s.dayOf(o.totalDays, o.totalDays)}
            {phase && <span className="font-normal text-muted"> · {phase.title}</span>}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">{s.progressLabel(o.completedCount, o.totalDays)}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-gold"><Icon.sparkle size={15} />{s.xp(o.xpEarned)}</span>
        </div>
      </div>
      <ProgressBar value={o.percent} label={s.percentDone(o.percent)} className="mt-4" />
      {o.behind > 0 && o.status === "open" && (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted"><Chip tone="gold">{s.catchingUp}</Chip><span>{s.behind(o.behind)}</span></p>
      )}
      {o.source === "fixtures" && <p className="mt-3 text-xs text-muted">{s.fixturesNote}</p>}
    </section>
  );
}

function DoneForToday({ s, lang, o, lastDone }: { s: LearnStrings; lang: "ru" | "en"; o: Overview; lastDone: number }) {
  const next = o.nextDay ? o.cells[o.nextDay - 1] : null;
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4">
      <Card className="p-6 sm:p-8">
        <div className="mb-4 grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Icon.check size={24} strokeWidth={3} /></div>
        <h1 className="text-2xl font-semibold tracking-tight">{s.doneForToday}</h1>
        <p className="mt-2 max-w-[56ch] text-muted">{s.doneForTodayBody}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {lastDone > 0 && <ButtonLink to={`/${lang}/day/${lastDone}`} variant="secondary">{s.reviewToday}</ButtonLink>}
          <ButtonLink to={`/${lang}/path`} variant="ghost"><Icon.map size={16} />{s.seePath}</ButtonLink>
        </div>
      </Card>
      {next && next.available && (
        <Card className="p-6">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
            <Icon.lock size={13} />{s.opensTomorrow} · {s.dayN(next.day)}
            {next.boss && <Chip tone="gold"><Icon.crown size={12} />{s.boss}</Chip>}
            {next.rest && <Chip tone="accent"><Icon.moon size={12} />{s.rest}</Chip>}
          </p>
          <p className="mt-2 text-lg font-semibold">{next.title}</p>
          <p className="mt-1 text-muted">{next.summary}</p>
          <p className="mt-3 flex gap-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Icon.clock size={15} />{s.minutes(next.estMinutes)}</span>
            <span className="inline-flex items-center gap-1.5 text-gold"><Icon.sparkle size={15} />{s.xp(next.xp)}</span>
          </p>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <p className="sr-only">{s.meanwhile}</p>
        <ButtonLink to={`/${lang}/library`} variant="secondary" className="!h-auto justify-start py-4"><Icon.book size={18} />{s.meanwhileLibrary}</ButtonLink>
        <ButtonLink to={`/${lang}/studio`} variant="secondary" className="!h-auto justify-start py-4"><Icon.play size={18} />{s.meanwhileStudio}</ButtonLink>
      </div>
    </div>
  );
}

function Finished({ s, lang }: { s: LearnStrings; lang: "ru" | "en" }) {
  return (
    <Card className="mx-auto max-w-2xl p-8 text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-gold-soft text-gold"><Icon.crown size={30} /></div>
      <h1 className="text-3xl font-semibold tracking-tight">{s.finishedTitle}</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-muted">{s.finishedBody}</p>
      <ButtonLink to={`/${lang}/path`} className="mt-6"><Icon.map size={16} />{s.seePath}</ButtonLink>
    </Card>
  );
}
