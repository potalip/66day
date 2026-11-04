// OWNER: library agent. Founder analytics: growth, activity, where students are, where they get stuck, resources, pipeline.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Users, UserPlus, Activity, Flame, Flag, MapPin, RefreshCw } from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { Badge, Button, Card, CardHeader, Checkbox, EmptyState, Segmented, Skeleton, Stat, cn } from "@web/ui";
import type { Dashboard as Data } from "../../../../worker/lib/library/analytics";
import { BarChart, ChartStyles, RankList, SplitBar } from "./charts";
import { loadDays, type DaySummary } from "./parts";

const S = {
  en: {
    range: "Period", days: (n: number) => `${n} days`, demo: (n: number) => `Include demo students (${n})`, refresh: "Refresh",
    kpi: { students: "Students", visitors: (n: number) => `${n} visitors in total`, signups: "New this week", today: (n: number) => `${n} today`,
      active: "Active this week", activeToday: (n: number) => `${n} today`, day: "Median current day", finished: (n: number) => `${n} finished all 66`, streak: "Average streak", streakHint: "days, live streaks only" },
    signups: "New students per day", signupsDesc: "Counted when onboarding is finished.", active: "Active students per day", activeDesc: "Did anything that earns XP that day.",
    split: "Who they are", tracks: "Track", apps: "Apps", video: "Video", none: "Not chosen", lang: "Language",
    streaks: "Streak distribution", streaksDesc: "Current live streak in days, per student.",
    where: "Where students are now", whereDesc: "Each student's current day. Pile-ups show where people stall or leave.",
    completion: "Day completion rate", completionDesc: "Of the students who reached a day, the share who completed it. Red: where people get stuck most. Grey: fewer than 5 students so far.",
    stuck: "Where people get stuck", stuckDesc: (h: number) => `Reached the day more than ${h} h ago and still haven't finished it.`,
    stuckCols: ["Day", "Stuck", "Reached", "Tasks done"], noneStuck: "Not enough data yet to call any day sticky.",
    resources: "Library", viewed: "Most viewed", completed: "Most completed", saved: "Most added to today", noRes: "No data yet.", unknown: "Not in the library",
    pipeline: "Pipeline health", status: { draft: "Draft", processing: "Processing", review: "Needs review", published: "Published", failed: "Failed" } as Record<string, string>,
    failedLessons: "Lessons failed", needsTranscript: "Need a transcript", stuckProcessing: "Processing > 15 min", errors: "Errors in 24 h",
    ai: "AI", mediaWorker: "Media worker", on: "on", off: "off", recent: "Recent errors", open: "Open",
    day: (d: number) => `Day ${d}`, students: (n: number) => (n === 1 ? "1 student" : `${n} students`), table: "Show as table",
    colsDate: ["Date", "Students"] as [string, string], colsDay: ["Day", "Students"] as [string, string], colsRate: ["Day", "Completed"] as [string, string], colsStreak: ["Streak", "Students"] as [string, string],
    detail: (r: number, c: number, s: number) => `${c} of ${r} completed · ${s} stuck`,
    emptyTitle: "No students yet", emptyBody: "The dashboard fills up as soon as people finish onboarding.", seed: "Load demo students", seedHint: "Dev only: 30 realistic demo students from the game seed.",
    error: "Couldn't load the dashboard.", updated: (t: string) => `Updated ${t}`,
  },
  ru: {
    range: "Период", days: (n: number) => `${n} дней`, demo: (n: number) => `С демо-учениками (${n})`, refresh: "Обновить",
    kpi: { students: "Ученики", visitors: (n: number) => `всего посетителей: ${n}`, signups: "Новые за неделю", today: (n: number) => `сегодня: ${n}`,
      active: "Активны за неделю", activeToday: (n: number) => `сегодня: ${n}`, day: "Медианный текущий день", finished: (n: number) => `прошли все 66: ${n}`, streak: "Средняя серия", streakHint: "дней, только живые серии" },
    signups: "Новые ученики по дням", signupsDesc: "Считаем, когда ученик прошёл онбординг.", active: "Активные ученики по дням", activeDesc: "Сделали что-то, за что дают XP.",
    split: "Кто они", tracks: "Трек", apps: "Приложения", video: "Видео", none: "Не выбран", lang: "Язык",
    streaks: "Распределение серий", streaksDesc: "Текущая живая серия в днях у каждого ученика.",
    where: "Где ученики сейчас", whereDesc: "Текущий день каждого ученика. Скопления показывают, где застревают или уходят.",
    completion: "Доля прохождения дня", completionDesc: "Из дошедших до дня — сколько его закончили. Красным — где застревают сильнее всего, серым — пока меньше 5 учеников.",
    stuck: "Где застревают", stuckDesc: (h: number) => `Дошли до дня больше ${h} ч назад и всё ещё не закончили.`,
    stuckCols: ["День", "Застряли", "Дошли", "Задания"], noneStuck: "Пока мало данных, чтобы назвать «трудные» дни.",
    resources: "Библиотека", viewed: "Чаще смотрят", completed: "Чаще проходят", saved: "Чаще добавляют на сегодня", noRes: "Пока нет данных.", unknown: "Нет в библиотеке",
    pipeline: "Состояние конвейера", status: { draft: "Черновик", processing: "В работе", review: "На проверке", published: "Опубликовано", failed: "Ошибка" } as Record<string, string>,
    failedLessons: "Уроки с ошибкой", needsTranscript: "Нужна расшифровка", stuckProcessing: "В работе > 15 мин", errors: "Ошибок за 24 ч",
    ai: "AI", mediaWorker: "Медиа-воркер", on: "вкл", off: "выкл", recent: "Последние ошибки", open: "Открыть",
    day: (d: number) => `День ${d}`, students: (n: number) => `учеников: ${n}`, table: "Показать таблицей",
    colsDate: ["Дата", "Ученики"] as [string, string], colsDay: ["День", "Ученики"] as [string, string], colsRate: ["День", "Прошли"] as [string, string], colsStreak: ["Серия", "Ученики"] as [string, string],
    detail: (r: number, c: number, s: number) => `закончили ${c} из ${r} · застряли ${s}`,
    emptyTitle: "Учеников пока нет", emptyBody: "Дашборд заполнится, как только люди начнут проходить онбординг.", seed: "Загрузить демо-учеников", seedHint: "Только в разработке: 30 правдоподобных демо-учеников из сида игры.",
    error: "Не получилось загрузить дашборд.", updated: (t: string) => `Обновлено ${t}`,
  },
};

const pct = (v: number) => `${Math.round(v * 100)}%`;
/** Matches analytics.ts minSample: days reached by fewer students are drawn muted (too few to read). */
const MIN_SAMPLE = 5;

export default function Dashboard() {
  const s = useStrings(S);
  const lang = useLang();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [demo, setDemo] = useState(true);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [tick, setTick] = useState(0);
  const [titles, setTitles] = useState<Map<string, string>>(new Map());
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    let alive = true;
    setErr(false);
    api<Data>(`/admin/dashboard?range=${range}&demo=${demo ? 1 : 0}`).then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [range, demo, tick]);
  useEffect(() => {
    Promise.all([loadDays(lang, "apps"), loadDays(lang, "video")]).then(([a, v]) => {
      const m = new Map<string, string>();
      const put = (xs: DaySummary[], t: string) => xs.forEach((d) => m.set(`${d.day}:${t}`, d.title));
      put(a, "apps"); put(v, "video");
      setTitles(m);
    });
  }, [lang]);

  const dateLabel = useMemo(() => new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }), [lang]);
  const fmtDate = (iso: string) => dateLabel.format(new Date(`${iso}T00:00:00Z`));
  const dayTitle = (d: number) => {
    const a = titles.get(`${d}:apps`), v = titles.get(`${d}:video`);
    return !a ? "" : a === v || !v ? a : `${a} / ${v}`;
  };

  if (err) return <EmptyState tone="danger" title={s.error} action={<Button onClick={() => setTick((n) => n + 1)}>{s.refresh}</Button>} />;
  if (!data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className={cn("h-28", i > 3 && "h-56 sm:col-span-2")} />)}</div>;

  const k = data.kpis;
  const dateTicks = (series: { date: string }[]) => (i: number) => {
    const n = series.length, step = n <= 7 ? 1 : n <= 31 ? 7 : 14;
    return (n - 1 - i) % step === 0 ? fmtDate(series[i].date) : null;
  };
  const dayTicks = (i: number) => (i === 0 || (i + 1) % 7 === 0 ? String(i + 1) : null);
  const stuckSet = new Set(data.stuckDays.map((d) => d.day));

  return (
    <div className="space-y-6">
      <ChartStyles />
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label={s.range} value={range} onChange={setRange} options={(["7", "30", "90"] as const).map((v) => ({ value: v, label: s.days(+v) }))} />
        {(data.demoStudents > 0 || !demo) && <Checkbox label={s.demo(data.demoStudents)} checked={demo} onChange={(e) => setDemo(e.target.checked)} />}
        <span className="ml-auto text-xs text-muted">{s.updated(new Date(data.generatedAt * 1000).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }))}</span>
        <Button size="sm" variant="ghost" icon={<RefreshCw />} onClick={() => setTick((n) => n + 1)}>{s.refresh}</Button>
      </div>

      {k.students === 0 ? (
        <EmptyState icon={<Users />} tone="accent" title={s.emptyTitle} description={`${s.emptyBody} ${s.seedHint}`}
          action={<Button variant="outline" loading={seeding} onClick={async () => {
            setSeeding(true);
            try { await api("/game/dev/seed", { method: "POST" }); setDemo(true); setTick((n) => n + 1); } catch { /* prod: endpoint 404s */ } finally { setSeeding(false); }
          }}>{s.seed}</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Card padding="sm"><Stat icon={<Users />} label={s.kpi.students} value={k.students} hint={s.kpi.visitors(k.visitors)} /></Card>
            <Card padding="sm"><Stat icon={<UserPlus />} label={s.kpi.signups} value={k.signups7d} hint={s.kpi.today(k.signupsToday)} /></Card>
            <Card padding="sm"><Stat icon={<Activity />} label={s.kpi.active} value={k.active7d} hint={s.kpi.activeToday(k.activeToday)} tone="accent" /></Card>
            <Card padding="sm"><Stat icon={<MapPin />} label={s.kpi.day} value={k.medianDay ?? "—"} hint={s.kpi.finished(k.finished)} /></Card>
            <Card padding="sm" className="col-span-2 lg:col-span-1"><Stat icon={<Flame />} label={s.kpi.streak} value={k.avgStreak ?? "—"} hint={s.kpi.streakHint} /></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={s.signups} description={s.signupsDesc} />
              <BarChart ariaLabel={s.signups} tableLabel={s.table} columns={s.colsDate} bars={data.signups.map((d) => ({ label: fmtDate(d.date), value: d.n }))} tick={dateTicks(data.signups)} height={120} />
            </Card>
            <Card>
              <CardHeader title={s.active} description={s.activeDesc} />
              <BarChart ariaLabel={s.active} tableLabel={s.table} columns={s.colsDate} bars={data.active.map((d) => ({ label: fmtDate(d.date), value: d.n }))} tick={dateTicks(data.active)} height={120} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={s.split} />
              <div className="space-y-5">
                <div><div className="mb-2 text-sm font-medium">{s.tracks}</div>
                  <SplitBar ariaLabel={s.tracks} parts={[{ label: s.apps, value: data.tracks.apps, color: 1 }, { label: s.video, value: data.tracks.video, color: 2 }, ...(data.tracks.none ? [{ label: s.none, value: data.tracks.none, color: "muted" as const }] : [])]} /></div>
                <div><div className="mb-2 text-sm font-medium">{s.lang}</div>
                  <SplitBar ariaLabel={s.lang} parts={[{ label: "RU", value: data.langs.ru, color: 1 }, { label: "EN", value: data.langs.en, color: 2 }]} /></div>
              </div>
            </Card>
            <Card>
              <CardHeader title={s.streaks} description={s.streaksDesc} />
              <BarChart ariaLabel={s.streaks} tableLabel={s.table} columns={s.colsStreak} height={110}
                bars={data.streaks.map((b) => ({ label: b.label, value: b.n, tone: b.min === 0 ? "muted" : "default" }))} tick={(i) => data.streaks[i].label} format={(v) => s.students(v)} />
            </Card>
          </div>

          <Card>
            <CardHeader title={s.where} description={s.whereDesc} />
            <BarChart ariaLabel={s.where} tableLabel={s.table} columns={s.colsDay} height={150} tick={dayTicks} format={(v) => s.students(v)}
              bars={data.currentDay.map((n, i) => ({ label: s.day(i + 1), value: n, detail: dayTitle(i + 1) || undefined }))} />
          </Card>

          <Card>
            <CardHeader title={s.completion} description={s.completionDesc} />
            <BarChart ariaLabel={s.completion} tableLabel={s.table} columns={s.colsRate} height={150} tick={dayTicks} format={pct}
              bars={data.funnel.map((d) => ({
                label: s.day(d.day), value: d.completionRate ?? 0, tone: d.reached < MIN_SAMPLE ? "muted" : stuckSet.has(d.day) ? "alert" : "default",
                detail: d.reached ? <>{s.detail(d.reached, d.completed, d.stuck)}{dayTitle(d.day) ? <><br />{dayTitle(d.day)}</> : null}</> : undefined,
              }))} />
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="font-semibold">{s.stuck}</h3>
              <p className="mt-0.5 text-sm text-muted">{s.stuckDesc(48)}</p>
              {data.stuckDays.length === 0 ? <p className="mt-3 text-sm text-muted">{s.noneStuck}</p> : (
                <>
                <ul className="mt-3 divide-y divide-line sm:hidden">
                  {data.stuckDays.map((d) => (
                    <li key={d.day} className="py-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link to={`/${lang}/day/${d.day}`} className="font-medium hover:underline">{s.day(d.day)}</Link>
                        <Badge tone="danger" size="sm">{pct(d.stuckRate ?? 0)}</Badge>
                      </div>
                      {dayTitle(d.day) && <div className="text-sm text-muted">{dayTitle(d.day)}</div>}
                      <div className="mt-1 text-xs text-muted tabular-nums">
                        {s.stuckCols[1]} {d.stuck}/{d.eligible} · {s.stuckCols[2]} {d.reached} · {s.stuckCols[3]} {d.taskRate === null ? "—" : pct(d.taskRate)}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 hidden sm:block">
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead className="text-xs text-muted"><tr>{s.stuckCols.map((c, i) => <th key={c} className={cn("pb-2 font-medium", i > 0 && "text-right")}>{c}</th>)}</tr></thead>
                    <tbody>
                      {data.stuckDays.map((d) => (
                        <tr key={d.day} className="border-t border-line">
                          <td className="py-2 pr-3"><Link to={`/${lang}/day/${d.day}`} className="font-medium hover:underline">{s.day(d.day)}</Link>{dayTitle(d.day) && <span className="ml-2 text-muted">{dayTitle(d.day)}</span>}</td>
                          <td className="py-2 text-right"><Badge tone="danger" size="sm">{pct(d.stuckRate ?? 0)}</Badge> <span className="text-muted">{d.stuck}/{d.eligible}</span></td>
                          <td className="py-2 text-right">{d.reached}</td>
                          <td className="py-2 text-right">{d.taskRate === null ? "—" : pct(d.taskRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {([["viewed", data.resources.viewed], ["completed", data.resources.done], ["saved", data.resources.saved]] as const).map(([key, rows]) => (
          <Card key={key}>
            <CardHeader title={s[key]} description={s.resources} />
            <RankList empty={s.noRes} rows={rows.map((r) => ({
              key: r.id, value: r.n,
              label: r.title ? <Link to={`/${lang}/admin/r/${r.id}`} className="hover:underline">{r.title}</Link> : <span className="text-muted">{s.unknown} · <code className="text-xs">{r.id}</code></span>,
            }))} />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title={s.pipeline} icon={<Flag />} action={<div className="flex gap-1.5">
          <Badge tone={data.pipeline.ai ? "accent" : "gold"}>{s.ai}: {data.pipeline.ai ? s.on : s.off}</Badge>
          <Badge tone={data.pipeline.mediaWorker ? "accent" : "neutral"}>{s.mediaWorker}: {data.pipeline.mediaWorker ? s.on : s.off}</Badge>
        </div>} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.pipeline.byStatus).map(([st, n]) => (
            <Link key={st} to={`/${lang}/admin?status=${st}`} className="rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2">
              {s.status[st] ?? st} <span className="font-medium tabular-nums">{n}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["failedLessons", data.pipeline.failedLessons], ["needsTranscript", data.pipeline.needsTranscript], ["stuckProcessing", data.pipeline.stuckProcessing], ["errors", data.pipeline.errors24h]] as const).map(([key, n]) => (
            <div key={key} className={cn("rounded-[var(--radius-sm)] border p-3", n > 0 ? "border-danger/30 bg-danger-soft" : "border-line")}>
              <div className="text-xs text-muted">{s[key]}</div>
              <div className={cn("mt-0.5 text-xl font-semibold tabular-nums", n > 0 && "text-danger-ink")}>{n}</div>
            </div>
          ))}
        </div>
        {data.pipeline.recentErrors.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">{s.recent}</h3>
            <ul className="space-y-1.5 text-sm">
              {data.pipeline.recentErrors.map((e, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                  <Link to={`/${lang}/admin/r/${e.resourceId}`} className="font-medium hover:underline">{e.title || e.resourceId}</Link>
                  <code className="text-xs text-muted">{e.step}</code>
                  <span className="min-w-0 break-words text-danger-ink">{e.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
