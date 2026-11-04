// OWNER: learn. The 66-cell path map grouped by phases. Cell language matches the landing page (design request).
import { Link, Navigate } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { ButtonLink, Card, ProgressRing, Stat } from "@web/ui";
import { useOverview, type PathCell } from "./data";
import { LearnKeyframes } from "./DayView";
import { strings, type LearnStrings } from "./strings";
import { ErrorState, Icon, PageSkeleton, cx } from "./ui";

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
        <div className="flex items-center gap-5">
          <ProgressRing value={o.completedCount} max={o.totalDays} size={84} stroke={7} label={s.percentDone(o.percent)}>
            <span className="text-base">{o.percent}%</span>
          </ProgressRing>
          <div className="grid grid-cols-3 gap-5 sm:grid-cols-1 sm:gap-1">
            <Stat label={s.legend.done} value={<span className="text-lg">{o.completedCount}/{o.totalDays}</span>} />
            {bossTotal > 0 && <Stat label={s.legend.boss} value={<span className="text-lg">{bossDone}/{bossTotal}</span>} className="sm:hidden" />}
            <Stat label="XP" tone="gold" value={<span className="text-lg">{o.xpEarned}</span>} className="sm:hidden" />
          </div>
        </div>
      </header>

      {today && today.available && o.status !== "finished" && (
        <Card padding="sm" className="mb-10 flex flex-wrap items-center gap-4 sm:p-5">
          <div className={cx("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-semibold tabular",
            o.status === "open" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>{today.day}</div>
          <div className="min-w-0 flex-1 basis-[60%]">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{o.status === "open" ? s.todayTitle : s.opensTomorrow}</p>
            <p className="line-clamp-2 font-semibold text-pretty">{today.title}</p>
          </div>
          {o.status === "open" && <ButtonLink to={`/${lang}/today`} className="w-full sm:w-auto" iconRight={<Icon.arrowRight />}>{s.continueToday(today.day)}</ButtonLink>}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-10">
        {o.program.phases.map((p) => {
          const cells = o.cells.filter((c) => c.day >= p.days[0] && c.day <= p.days[1]);
          const done = cells.filter((c) => c.access === "done").length;
          return (
            <section key={p.id} aria-labelledby={`ph-${p.id}`}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`ph-${p.id}`} className="text-lg font-semibold">
                  <span className="mr-2 text-muted">{s.phaseN(p.id)}</span>{p.title}
                </h2>
                <span className="tabular text-sm text-muted">{s.daysRange(p.days[0], p.days[1])} · {done}/{cells.length}</span>
              </div>
              {p.goal && <p className="mb-4 max-w-[64ch] text-sm text-muted">{p.goal}</p>}
              <ol className="grid grid-cols-7 gap-2 sm:grid-cols-10">
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

type CellState = "done" | "open" | "waiting" | "locked" | "soon";
function cellState(c: PathCell): CellState {
  if (c.access === "done") return "done";
  if (!c.available) return "soon";
  return c.access;
}

function Cell({ c, s, lang }: { c: PathCell; s: LearnStrings; lang: "ru" | "en" }) {
  const st = cellState(c);
  const label = `${s.dayN(c.day)}${c.title ? `: ${c.title}` : ""} — ${s.cellLabel[st]}${c.boss ? ` · ${s.boss}` : ""}${c.rest ? ` · ${s.rest}` : ""}`;
  const ahead = st === "locked" || st === "soon";
  const look = cx(
    st === "done" && "bg-accent text-accent-fg",
    st === "open" && "fl-learn-glow bg-surface text-accent-ink ring-2 ring-accent ring-offset-2 ring-offset-bg",
    st === "waiting" && "bg-surface text-accent-ink ring-2 ring-accent/40 ring-offset-2 ring-offset-bg",
    ahead && c.boss && "border border-gold-bright/70 bg-gold-soft text-gold-ink",
    ahead && !c.boss && c.rest && "border border-dashed border-line-strong text-muted",
    ahead && !c.boss && !c.rest && (st === "soon" ? "border border-dashed border-line text-muted/60" : "bg-surface-2 text-muted/80"),
  );
  return (
    <li>
      <Link to={`/${lang}/day/${c.day}`} aria-label={label} title={label}
        className={cx("relative grid aspect-square place-items-center rounded-[8px] text-sm font-semibold tabular transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:rounded-[10px]",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", look)}>
        <span>{c.day}</span>
        {c.boss && <Icon.crown size={11} className={cx("absolute top-1 right-1", st === "done" ? "text-accent-fg/90" : "text-gold-bright")} />}
        {c.rest && !c.boss && <Icon.moon size={10} className={cx("absolute top-1 right-1", st === "done" ? "text-accent-fg/80" : "text-muted")} />}
        {st === "done" && <Icon.check size={10} strokeWidth={3} className="absolute right-1 bottom-1 opacity-80" />}
      </Link>
    </li>
  );
}

function Legend({ s }: { s: LearnStrings }) {
  const sw = "inline-block size-4 rounded-[5px]";
  return (
    <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs text-muted" aria-label="Legend">
      <li className="flex items-center gap-2"><span className={cx(sw, "bg-accent")} />{s.legend.done}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "bg-surface ring-2 ring-accent ring-offset-1 ring-offset-bg")} />{s.legend.today}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "bg-surface-2")} />{s.legend.locked}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "grid place-items-center border border-gold-bright/70 bg-gold-soft")}><Icon.crown size={9} className="text-gold-bright" /></span>{s.legend.boss}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "grid place-items-center border border-dashed border-line-strong")}><Icon.moon size={9} /></span>{s.legend.rest}</li>
      <li className="flex items-center gap-2"><span className={cx(sw, "border border-dashed border-line")} />{s.legend.soon}</li>
    </ul>
  );
}
