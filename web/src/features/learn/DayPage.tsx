// OWNER: learn. /:lang/day/:day — any day: full view if done/open, teaser if waiting/locked/unwritten.
import { Link, useParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { useDay } from "./data";
import { DayHero, DayView } from "./DayView";
import { strings } from "./strings";
import { ButtonLink, Card, EmptyState } from "@web/ui";
import { ErrorState, Icon, PageSkeleton } from "./ui";

export default function DayPage() {
  const lang = useLang();
  const s = useStrings(strings);
  const n = Number(useParams().day);
  const valid = Number.isInteger(n) && n >= 1 && n <= 66;
  const day = useDay(lang, valid ? n : null);
  const d = day.data;

  const nav = valid && (
    <nav className="mt-12 flex items-center justify-between border-t border-line pt-6 text-sm" aria-label="Days">
      {n > 1 ? <Link to={`/${lang}/day/${n - 1}`} className="inline-flex items-center gap-1.5 text-muted hover:text-fg"><Icon.arrowLeft size={16} />{s.prevDay}</Link> : <span />}
      {n < 66 ? <Link to={`/${lang}/day/${n + 1}`} className="inline-flex items-center gap-1.5 text-muted hover:text-fg">{s.nextDay}<Icon.arrowRight size={16} /></Link> : <span />}
    </nav>
  );

  let body;
  if (!valid) {
    body = (
      <EmptyState icon={<Icon.map />} title={s.notFound} description={s.notFoundBody}
        action={<ButtonLink to={`/${lang}/path`} variant="outline" icon={<Icon.map />}>{s.backToPath}</ButtonLink>} />
    );
  } else if (day.loading && !d) body = <PageSkeleton />;
  else if (day.error || !d) body = <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => day.reload()} />;
  else if (!d.summary.available) {
    body = (
      <EmptyState icon={<Icon.pen />} title={s.unwrittenTitle(n)} description={s.unwrittenBody} />
    );
  } else if (d.access === "locked" || d.access === "waiting" || !d.day) {
    const firstOpen = d.access === "locked";
    body = (
      <div className="mx-auto max-w-3xl">
        <DayHero s={s} summary={d.summary} />
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-muted"><Icon.lock size={22} /></div>
          <div className="flex-1">
            <h2 className="font-semibold">{firstOpen ? s.lockedTitle : s.waitingTitle}</h2>
            <p className="mt-1 text-sm text-muted">{firstOpen ? s.lockedBody(n - 1) : s.waitingBody}</p>
          </div>
          <ButtonLink to={`/${lang}/today`} variant="outline" iconRight={<Icon.arrowRight />}>{s.todayTitle}</ButtonLink>
        </Card>
      </div>
    );
  } else {
    body = <DayView lang={lang} data={d} onChanged={() => void day.reload(true)} />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={`/${lang}/path`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><Icon.arrowLeft size={16} />{s.backToPath}</Link>
      {body}
      {nav}
    </div>
  );
}
