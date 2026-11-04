// OWNER: learn. The 66-cell path map grouped by phases.
import { Link, Navigate } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { useOverview, type PathCell } from "./data";
import { LearnKeyframes } from "./DayView";
import { strings, type LearnStrings } from "./strings";
import { ButtonLink, Card, ErrorState, Icon, PageSkeleton, Ring, cx } from "./ui";

export default function PathMap() {
  const lang = useLang();
  const s = useStrings(strings);
  const ov = useOverview(lang);
  const o = ov.data;
  if (ov.loading && !o) return <PageSkeleton />;
  if (ov.error || !o) return <ErrorState title={s.errorTitle} body={s.errorBody} retry={s.retry} onRetry={() => ov.reload()} />;
  if (!o.onboarded) return <Navigate to={`/${lang}/start`} replace />;

  const today = o.nextDay ? o.cells[o.nextDay - 1] : null;
  const bossDone = o.cells.filter((c) => c.boss && c.access === "done").length;
  const bossTotal = o.cells.filter((c) => c.boss).length;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold tracking-tight">{s.pathTitle}</h1>
          <p className="mt-2 max-w-[52ch] text-muted">{s.pathSubtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Ring value={o.percent} size={84} stroke={7} label={s.percentDone(o.percent)}>
            <span className="text-lg leading-none font-semibold">{o.percent}%</span>
          </Ring>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2"><dt className="text-muted">{s.legend.done}:</dt><dd className="font-medium">{o.completedCount}/{o.totalDays}</dd></div>
            {bossTotal > 0 && <div className="flex gap-2"><dt className="text-muted">{s.legend.boss}:</dt><dd className="font-medium">{bossDone}/{bossTotal}</dd></div>}
            <div className="flex gap-2"><dt className="text-muted">XP:</dt><dd className="font-semibold text-gold">{o.xpEarned}</dd></div>
          </dl>
        </div>
      </header>

      {today && today.available && o.status !== "finished" && (
        <Card className="mb-10 flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <div className={cx("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-semibold", o.status === "open" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>{today.day}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{o.status === "open" ? s.todayTitle : s.opensTomorrow}</p>
            <p className="truncate font-semibold">{today.title}</p>
          </div>
          {o.status === "open" && <ButtonLink to={`/${lang}/today`}>{s.continueToday(today.day)}<Icon.arrowRight size={16} /></ButtonLink>}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-10">
        {o.program.phases.map((p) => {
          const cells = o.cells.filter((c) => c.day >= p.days[0] && c.day <= p.days[1]);
          const done = cells.filter((c) => c.access === "done").length;
          return (
            <section key={p.id} aria-labelledby={`ph-${p.id}`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`ph-${p.id}`} className="text-lg font-semibold">
                  <span className="mr-2 text-muted">{s.phaseN(p.id)}</span>{p.title}
                </h2>
                <span className="text-sm text-muted">{s.daysRange(p.days[0], p.days[1])} · {done}/{cells.length}</span>
              </div>
              {p.goal && <p className="-mt-2 mb-4 max-w-[64ch] text-sm text-muted">{p.goal}</p>}
              <ol className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 sm:gap-2">
                {cells.map((c) => <Cell key={c.day} c={c} s={s} lang={lang} />)}
              </ol>
            </section>
          );
        })}
      </div>

      <Legend s={s} />
      <LearnKeyframes />
    </div>
  );
}

function cellState(c: PathCell): "done" | "open" | "waiting" | "locked" | "soon" {
  if (c.access === "done") return "done";
  if (!c.available) return "soon";
  return c.access;
}

function Cell({ c, s, lang }: { c: PathCell; s: LearnStrings; lang: "ru" | "en" }) {
  const st = cellState(c);
  const label = `${s.dayN(c.day)}${c.title ? `: ${c.title}` : ""} — ${s.cellLabel[st]}${c.boss ? ` · ${s.boss}` : ""}${c.rest ? ` · ${s.rest}` : ""}`;
  const base = "group relative grid aspect-square place-items-center rounded-xl text-sm font-semibold transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";
  const styles = {
    done: "bg-accent text-accent-fg",
    open: "border-2 border-accent bg-accent-soft text-accent fl-learn-glow",
    waiting: "border-2 border-dashed border-accent/60 bg-surface text-accent",
    locked: "border border-line bg-surface text-muted",
    soon: "border border-dashed border-line bg-transparent text-muted/60",
  }[st];
  const bossRing = c.boss && st !== "done" ? "!border-gold/70 border-2" : "";
  const bossDone = c.boss && st === "done" ? "ring-2 ring-gold ring-offset-2 ring-offset-bg" : "";
  return (
    <li>
      <Link to={`/${lang}/day/${c.day}`} aria-label={label} title={label} className={cx(base, styles, bossRing, bossDone)}>
        <span>{c.day}</span>
        {c.boss && <Icon.crown size={11} className={cx("absolute top-1 right-1", st === "done" ? "text-accent-fg/90" : "text-gold")} />}
        {c.rest && <Icon.moon size={10} className={cx("absolute top-1 right-1", st === "done" ? "text-accent-fg/80" : "text-accent/70")} />}
        {st === "done" && <Icon.check size={10} strokeWidth={3} className="absolute bottom-1 right-1 opacity-80" />}
        {st === "locked" && <Icon.lock size={9} className="absolute bottom-1 right-1 opacity-50" />}
      </Link>
    </li>
  );
}

function Legend({ s }: { s: LearnStrings }) {
  const sw = "inline-block size-4 rounded-md";
  return (
    <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs text-muted" aria-label="Legend">
      <li className="flex items-center gap-2"><span className={cx(sw, "bg-accent")} />{s.legend.done}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "border-2 border-accent bg-accent-soft")} />{s.legend.today}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "border border-line bg-surface")} />{s.legend.locked}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "border-2 border-gold/70 bg-surface")} /><Icon.crown size={12} className="-ml-1 text-gold" />{s.legend.boss}</li>
      <li className="flex items-center gap-2"><Icon.moon size={13} className="text-accent" />{s.legend.rest}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "border border-dashed border-line")} />{s.legend.soon}</li>
    </ul>
  );
}
