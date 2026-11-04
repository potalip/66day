// OWNER: learn. Day hero + lesson + task checklist with proofs + completion moment. Used by Today and DayPage.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Award, CurriculumTask, Lang } from "@shared/types";
import { useStrings } from "@web/i18n";
import { Badge, Button, ButtonLink, Card, Dialog, Field, Input, Textarea, useToast } from "@web/ui";
import { showAwards } from "@web/features/game/widgets";
import { ResourceCardView } from "@web/features/library/ResourceCardView";
import { ApiError, formatDate, learnApi, useBadges, useDayResources, type BadgeDef, type DayResponse, type DaySummary, type TaskResult, type TaskState } from "./data";
import { Markdown } from "./Markdown";
import { strings, type LearnStrings } from "./strings";
import { Icon, cx, taskTypeIcon } from "./ui";

const MAX_FILE = 50 * 1024 * 1024;
/** Days whose time is spread over a whole day rather than one sitting (curriculum request: boss day 65 = launch day). */
export const SPREAD_DAYS = new Set([65]);

export function DayHero({ s, summary, extra }: { s: LearnStrings; summary: DaySummary; extra?: ReactNode }) {
  return (
    <header className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="font-medium text-fg">{s.dayN(summary.day)}</span>
        <span aria-hidden="true">·</span>
        <span>{s.phaseN(summary.phase)}</span>
        {summary.track && summary.track !== "common" && <Badge tone="outline">{s.track[summary.track]}</Badge>}
        {summary.boss && <Badge tone="gold" icon={<Icon.crown />}>{s.boss}</Badge>}
        {summary.rest && <Badge tone="accent" icon={<Icon.moon />}>{s.rest}</Badge>}
        {extra}
      </div>
      <h1 className="max-w-[24ch] text-[clamp(1.75rem,4.5vw,2.6rem)] leading-[1.12] font-semibold tracking-tight text-balance">{summary.title}</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted text-pretty">{summary.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5" title={s.estimateHint}>
          <Icon.clock size={16} />{SPREAD_DAYS.has(summary.day) ? s.spreadOverDay(summary.estMinutes) : s.approxMinutes(summary.estMinutes)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-gold"><Icon.sparkle size={16} className="text-gold-bright" />{s.xp(summary.xp)}</span>
        {(summary.rest || summary.boss) && <span className="text-sm">{summary.rest ? s.restHint : s.bossHint}</span>}
      </div>
    </header>
  );
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/** Curriculum resources (resolved to library cards when the library knows them) + library picks for this day. */
function DayResources({ s, lang, day, track, urls }: { s: LearnStrings; lang: Lang; day: number; track: string; urls: string[] }) {
  const r = useDayResources(lang, day, track, urls);
  const plain = r.resolved.filter((x) => !x.card);
  const cards = [...r.resolved.filter((x) => x.card).map((x) => x.card!), ...r.extra];
  if (!plain.length && !cards.length) return null;
  return (
    <section className="mt-12 max-w-[68ch]" aria-labelledby="res-h">
      <h2 id="res-h" className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{s.resources}</h2>
      {cards.length > 0 && (
        <ul className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c) => <li key={c.id}><ResourceCardView r={c} compact /></li>)}
        </ul>
      )}
      {plain.length > 0 && (
        <ul className="grid grid-cols-1 gap-2">
          {plain.map(({ input }) => (
            <li key={input}>
              {/^https?:/.test(input) ? (
                <a href={input} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-line-strong hover:bg-surface-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><Icon.external size={16} /></span>
                  <span className="min-w-0 flex-1 truncate"><span className="font-medium">{hostOf(input)}</span><span className="ml-2 text-muted">{input.replace(/^https?:\/\/(www\.)?[^/]+/, "").slice(0, 60)}</span></span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DayView({ lang, data, onChanged }: { lang: Lang; data: DayResponse; onChanged: () => void }) {
  const s = useStrings(strings);
  const { toast } = useToast();
  const badges = useBadges();
  const day = data.day!;
  const dayBadges = (day.badges ?? []).map((id) => badges[id]).filter(Boolean) as BadgeDef[];
  const [tasks, setTasks] = useState<Record<string, TaskState>>(data.tasks);
  const [dayDone, setDayDone] = useState(data.access === "done");
  const [celebrate, setCelebrate] = useState<{ awards: Award[]; xp: number; result: TaskResult | null } | null>(null);

  useEffect(() => { setTasks(data.tasks); setDayDone(data.access === "done"); }, [data]);

  const required = day.tasks.filter((t) => !t.optional);
  const doneCount = day.tasks.filter((t) => tasks[t.id]?.done).length;
  const requiredDone = required.every((t) => tasks[t.id]?.done);
  const error = (e: unknown) => toast({ title: s.errors[(e as ApiError).code] ?? s.errors.generic, tone: "error", duration: 5000 });

  const onSubmitted = (task: CurriculumTask, r: TaskResult, wasDone: boolean) => {
    setTasks((prev) => ({ ...prev, [task.id]: r.task }));
    if (r.dayCompleted) {
      setDayDone(true);
      const xp = day.tasks.reduce((a, t) => a + ((t.id === task.id || tasks[t.id]?.done) ? t.xp : 0), 0);
      setCelebrate({ awards: r.awards, xp, result: r });
    } else if (!wasDone) {
      // The game toast (XP, badges, level) when the game returned awards; otherwise a plain reward toast.
      if (r.awards.length) showAwards(r.awards);
      else toast({ title: s.plusXp(task.xp), description: task.title, tone: "reward", duration: 2600 });
    }
  };

  const onUnchecked = (task: CurriculumTask) => setTasks((prev) => ({ ...prev, [task.id]: { done: false, completedAt: null, submission: prev[task.id]?.submission ?? null } }));

  const manualComplete = async () => {
    try {
      const r = await learnApi.completeDay(lang, day.day);
      setDayDone(true);
      setCelebrate({ awards: r.awards, xp: day.tasks.reduce((a, t) => a + (tasks[t.id]?.done ? t.xp : 0), 0), result: { ...r, taskId: "", task: { done: true, completedAt: null, submission: null } } });
    } catch (e) { error(e); }
  };

  const nextState = (() => {
    if (!data.next) return null;
    const r = celebrate?.result;
    return r ? (r.nextDay === data.next.day ? (r.status === "open" ? "open" : "waiting") : null) : data.nextAccess;
  })();

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-12">
      <article className="min-w-0">
        <DayHero s={s} summary={data.summary}
          extra={dayDone ? <Badge tone="accent" icon={<Icon.check />}>{data.completedAt ? s.dayDoneOn(formatDate(data.completedAt, lang)) : s.dayDone}</Badge> : null} />
        <a href="#tasks-h" className="-mt-2 mb-6 inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-medium hover:bg-surface-2 lg:hidden"
          onClick={(e) => { e.preventDefault(); document.getElementById("tasks-h")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
          <Icon.check size={15} className="text-accent" />{s.tasks} · {s.tasksProgress(doneCount, day.tasks.length)}<Icon.arrowRight size={14} className="rotate-90 text-muted" />
        </a>
        <h2 className="sr-only">{s.lesson}</h2>
        <Markdown source={day.bodyMd} copyLabel={s.copy} copiedLabel={s.copied} />
        <DayResources s={s} lang={lang} day={day.day} track={data.userTrack} urls={day.resources} />
      </article>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="tasks-h">
        <Card padding="sm" className="sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="tasks-h" className="scroll-mt-24 text-lg font-semibold">{s.tasks}</h2>
            <span className="tabular text-sm text-muted" aria-live="polite">{s.tasksProgress(doneCount, day.tasks.length)}</span>
          </div>
          <ol className="grid grid-cols-1 gap-3">
            {day.tasks.map((t) => (
              <TaskItem key={t.id} s={s} lang={lang} day={day.day} task={t} state={tasks[t.id]} dayDone={dayDone}
                onSubmitted={onSubmitted} onUnchecked={onUnchecked} onError={error} />
            ))}
          </ol>
          {dayBadges.length > 0 && (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-gold-bright/30 bg-gold-soft px-3.5 py-3 text-sm">
              <p className="text-xs font-semibold tracking-wide text-gold-ink uppercase">{dayDone ? s.badgeEarned : s.badgeToEarn}</p>
              {dayBadges.map((b) => (
                <p key={b.id} className="mt-1.5 flex items-start gap-2">
                  <span aria-hidden="true" className="text-base leading-5">{b.icon}</span>
                  <span><span className="font-semibold">{b.title[lang]}</span><span className="text-muted"> — {b.description[lang]}</span></span>
                </p>
              ))}
            </div>
          )}
          {!dayDone && requiredDone && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-3 text-sm text-muted">{s.allRequiredDone}</p>
              <Button block onClick={manualComplete}>{s.completeDay}</Button>
            </div>
          )}
          {dayDone && (
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2.5 text-sm font-medium text-accent-ink">
              <Icon.check size={16} /> {s.dayDone}
            </div>
          )}
        </Card>
        {data.next && dayDone && (nextState === "open" || nextState === "waiting") && (
          <NextTeaser s={s} lang={lang} next={data.next} openNow={nextState === "open"} />
        )}
      </aside>

      <Celebration open={!!celebrate} s={s} lang={lang} badges={badges} dayBadges={day.badges ?? []} day={data.summary} next={data.next}
        xp={celebrate?.xp ?? 0} awards={celebrate?.awards ?? []} result={celebrate?.result ?? null}
        onClose={() => { setCelebrate(null); onChanged(); }} />
    </div>
  );
}

function NextTeaser({ s, lang, next, openNow }: { s: LearnStrings; lang: Lang; next: DaySummary; openNow: boolean }) {
  if (!next.available) return null;
  return (
    <Card padding="sm" className="mt-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {openNow ? s.nextUp : s.tomorrow} · {s.dayN(next.day)}
        {next.boss && <Icon.crown size={13} className="text-gold-bright" />}
        {next.rest && <Icon.moon size={13} />}
      </div>
      <p className="font-semibold">{next.title}</p>
      <p className="mt-1 text-sm text-muted">{next.summary}</p>
      {openNow && <ButtonLink to={`/${lang}/day/${next.day}`} size="sm" className="mt-3" iconRight={<Icon.arrowRight />}>{s.continueNext(next.day)}</ButtonLink>}
    </Card>
  );
}

function TaskItem({ s, lang, day, task, state, dayDone, onSubmitted, onUnchecked, onError }: {
  s: LearnStrings; lang: Lang; day: number; task: CurriculumTask; state?: TaskState; dayDone: boolean;
  onSubmitted: (t: CurriculumTask, r: TaskResult, wasDone: boolean) => void; onUnchecked: (t: CurriculumTask) => void; onError: (e: unknown) => void;
}) {
  const done = !!state?.done;
  const sub = state?.submission ?? null;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const TypeIcon = taskTypeIcon[task.type];
  const showForm = task.proof !== "none" && (!done || editing);

  const submit = async (proof: { text?: string; url?: string; file?: File }) => {
    setBusy(true); setErr(null);
    try {
      const r = await learnApi.submitTask(lang, day, task.id, proof);
      setEditing(false);
      onSubmitted(task, r, done);
    } catch (e) {
      setErr(s.errors[(e as ApiError).code] ?? s.errors.generic);
    } finally { setBusy(false); }
  };
  const toggleNone = async () => {
    if (busy) return;
    if (done) {
      if (dayDone) return;
      setBusy(true);
      try { await learnApi.uncheckTask(lang, day, task.id); onUnchecked(task); }
      catch (e) { onError(e); }
      finally { setBusy(false); }
    } else await submit({});
  };

  const circle = (
    <span className={cx("grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
      done ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface text-transparent", busy && "animate-pulse")}>
      <Icon.check size={15} strokeWidth={3} className={cx(done && "animate-pop")} />
    </span>
  );

  return (
    <li className={cx("rounded-[var(--radius-sm)] border p-3 transition-colors", done ? "border-accent/25 bg-accent-soft/50" : "border-line bg-surface")}>
      <div className="flex gap-3">
        {task.proof === "none" ? (
          <button type="button" onClick={toggleNone} disabled={busy || (done && dayDone)} aria-pressed={done}
            aria-label={`${done ? s.undo : s.markDone}: ${task.title}`}
            className="mt-0.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default">
            {circle}
          </button>
        ) : (
          <span className="mt-0.5" aria-hidden="true">{circle}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><TypeIcon size={13} />{s.taskType[task.type]}</span>
            <span className="font-semibold text-gold">{s.plusXp(task.xp)}</span>
            {task.optional && <Badge size="sm">{s.optional}</Badge>}
            {sub && <Badge size="sm" tone={sub.status === "approved" ? "accent" : sub.status === "needs_work" ? "danger" : "neutral"}>{s.status[sub.status]}</Badge>}
          </div>
          <p className={cx("leading-snug font-medium text-pretty", done && !editing && "text-fg/80")}>
            <span className="sr-only">{done ? `${s.dayDone}: ` : ""}</span>{task.title}
          </p>

          {done && sub && !editing && <SubmissionSummary s={s} sub={sub} onEdit={() => setEditing(true)} />}
          {done && task.proof === "none" && !dayDone && (
            <button type="button" onClick={toggleNone} className="mt-1 text-xs text-muted underline-offset-2 hover:text-fg hover:underline">{s.undo}</button>
          )}
          {!done && task.proof === "none" && (
            <Button size="sm" variant="outline" className="mt-2" onClick={toggleNone} loading={busy}>{s.markDone}</Button>
          )}
          {showForm && (
            <ProofForm s={s} task={task} initial={sub} busy={busy} error={err} editing={editing}
              onCancel={editing ? () => { setEditing(false); setErr(null); } : undefined} onSubmit={submit} />
          )}
        </div>
      </div>
    </li>
  );
}

function SubmissionSummary({ s, sub, onEdit }: { s: LearnStrings; sub: NonNullable<TaskState["submission"]>; onEdit: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
      {sub.url && (
        <a href={sub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-accent-ink hover:underline">
          <Icon.link size={14} className="shrink-0" /><span className="truncate">{sub.url.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
      {sub.file && (
        <a href={sub.file.href} target="_blank" rel="noopener" className="flex items-center gap-1.5 font-medium text-accent-ink hover:underline">
          <Icon.file size={14} className="shrink-0" /><span className="truncate">{sub.file.name}</span>
          <span className="shrink-0 text-xs font-normal text-muted">{fmtSize(sub.file.size)}</span>
        </a>
      )}
      {sub.text && <p className={cx("line-clamp-4 whitespace-pre-line text-muted", (sub.url || sub.file) && "mt-1")}>{sub.text}</p>}
      {sub.feedback && <p className="mt-2 border-t border-line pt-2 text-sm"><span className="font-semibold">{s.feedback}: </span>{sub.feedback}</p>}
      <button type="button" onClick={onEdit} className="mt-1.5 text-xs font-medium text-muted hover:text-fg">{s.edit}</button>
    </div>
  );
}

const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function ProofForm({ s, task, initial, busy, error, editing, onCancel, onSubmit }: {
  s: LearnStrings; task: CurriculumTask; initial: TaskState["submission"]; busy: boolean; error: string | null; editing: boolean;
  onCancel?: () => void; onSubmit: (p: { text?: string; url?: string; file?: File }) => void;
}) {
  const [text, setText] = useState(task.proof === "text" ? initial?.text ?? "" : "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    if (task.proof === "text") onSubmit({ text });
    else if (task.proof === "link") onSubmit({ url });
    else if (task.proof === "file") {
      if (!file) return setLocalErr(s.errors.proof_file_required);
      onSubmit({ file });
    }
  };
  const shownErr = localErr ?? error;
  const label = <span className="text-xs font-normal text-muted">{s.proofHint[task.proof]}</span>;

  return (
    <form onSubmit={onFormSubmit} className="mt-2 grid grid-cols-1 gap-2" noValidate>
      {task.proof === "text" && (
        <Field label={label} error={shownErr ?? undefined}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={5000} placeholder={s.textPlaceholder} className="min-h-[84px] text-[0.9375rem]" />
        </Field>
      )}
      {task.proof === "link" && (
        <Field label={label} error={shownErr ?? undefined}>
          <Input type="url" inputMode="url" autoComplete="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={s.linkPlaceholder} />
        </Field>
      )}
      {task.proof === "file" && (
        <div className="grid gap-1.5">
          {label}
          <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden
            accept="image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,text/html,application/zip"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > MAX_FILE) { setLocalErr(s.fileTooBig); setFile(null); return; }
              setLocalErr(null); setFile(f);
            }} />
          <button type="button" onClick={() => fileRef.current?.click()} aria-invalid={!!shownErr || undefined}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-line-strong bg-surface px-3 py-3 text-left text-sm hover:border-accent focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-danger">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><Icon.upload size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{file ? file.name : s.chooseFile}</span>
              <span className="block text-xs text-muted">{file ? fmtSize(file.size) : s.fileLimit}</span>
            </span>
          </button>
          {shownErr && <p role="alert" className="text-xs font-medium text-danger">{shownErr}</p>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={busy}>{busy && task.proof === "file" ? s.uploading : editing ? s.resubmit : s.submit}</Button>
        {onCancel && <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>{s.cancel}</Button>}
      </div>
    </form>
  );
}

function Celebration({ open, s, lang, badges, dayBadges, day, next, xp, awards, result, onClose }: {
  open: boolean; s: LearnStrings; lang: Lang; badges: Record<string, BadgeDef>; dayBadges: string[]; day: DaySummary; next: DaySummary | null;
  xp: number; awards: Award[]; result: TaskResult | null; onClose: () => void;
}) {
  const nav = useNavigate();
  // One XP chip (task XP and any day bonus merged), then badges/level/streak. Day badges come from content until the
  // game returns its own badge awards.
  const gameXp = awards.filter((a) => a.kind === "xp").reduce((n, a) => n + (a.amount ?? 0), 0);
  const list: Award[] = [{ kind: "xp", amount: Math.max(gameXp, xp) }, ...awards.filter((a) => a.kind !== "xp")];
  for (const id of dayBadges) if (!awards.some((a) => a.kind === "badge" && a.id === id)) list.push({ kind: "badge", id });
  const openNow = !!(result?.status === "open" && result.nextDay && next && result.nextDay === next.day && next.available);
  const body = day.boss ? s.celebrateBoss : day.rest ? s.celebrateRest : s.celebrateBody;
  const pieces = Array.from({ length: 14 }, (_, i) => i);

  const label = (a: Award): ReactNode => {
    if (a.kind === "badge" && a.id && badges[a.id]) return <><span aria-hidden="true">{badges[a.id].icon} </span>{a.label ?? badges[a.id].title[lang]}</>;
    if (a.label) return a.label;
    switch (a.kind) {
      case "xp": return s.award.xp(a.amount ?? 0);
      case "level": return s.award.level(a.amount);
      case "streak": return s.award.streak(a.amount);
      case "badge": return s.award.badge;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={s.celebrateTitle(day.day)} hideTitle size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>{s.close}</Button>
        {openNow
          ? <Button onClick={() => { onClose(); nav(`/${lang}/day/${next!.day}`); }} iconRight={<Icon.arrowRight />}>{s.continueNext(next!.day)}</Button>
          : <Button onClick={() => { onClose(); nav(`/${lang}/path`); }} icon={<Icon.map />}>{s.seePath}</Button>}
      </>}>
      {open && (
        <div className="text-center">
          <div className="relative mx-auto mb-5 mt-1 grid size-24 place-items-center">
            {pieces.map((i) => (
              <span key={i} className="fl-learn-burst absolute top-1/2 left-1/2 block size-2 rounded-full"
                style={{ background: i % 3 === 0 ? "var(--gold-bright)" : "var(--accent)", ["--a" as string]: `${(360 / pieces.length) * i}deg`, animationDelay: `${120 + (i % 4) * 30}ms` }} />
            ))}
            <svg viewBox="0 0 96 96" className="absolute inset-0" aria-hidden="true">
              <circle cx="48" cy="48" r="42" fill="var(--accent-soft)" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" className="fl-learn-ring" pathLength={100} strokeDasharray="100" transform="rotate(-90 48 48)" />
            </svg>
            <span className="fl-learn-checkpop relative text-accent">{day.boss ? <Icon.crown size={40} /> : <Icon.check size={44} strokeWidth={3} />}</span>
          </div>
          <p aria-hidden="true" className="text-2xl font-semibold tracking-tight">{s.celebrateTitle(day.day)}</p>
          <p className="mx-auto mt-2 max-w-[32ch] text-muted">{body}</p>
          <p className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{s.awards}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {list.map((a, i) => (
              <li key={i} className="animate-pop rounded-full border border-gold-bright/40 bg-gold-soft px-3 py-1 text-sm font-semibold text-gold-ink" style={{ animationDelay: `${450 + i * 120}ms` }}>
                {label(a)}
              </li>
            ))}
          </ul>
          {day.boss && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-gold-bright/40 bg-gold-soft p-4 text-sm">
              <p className="text-gold-ink">{s.bossInPortfolio}</p>
              <Button size="sm" variant="gold" icon={<Icon.crown />} onClick={() => { onClose(); nav(`/${lang}/portfolio/me`); }}>{s.openPortfolio}</Button>
            </div>
          )}
          {next && next.available && (
            <div className="mt-6 rounded-[var(--radius-sm)] border border-line bg-bg p-4 text-left">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{openNow ? s.nextOpen : `${s.tomorrow} · ${s.dayN(next.day)}`}</p>
              <p className="mt-1 font-semibold">{next.title}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">{next.summary}</p>
            </div>
          )}
        </div>
      )}
      <LearnKeyframes />
    </Dialog>
  );
}

/** Celebration-only keyframes (scoped names; off under prefers-reduced-motion). Everything else uses the kit's motion. */
export function LearnKeyframes() {
  return (
    <style>{`
@keyframes fl-learn-ring { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
@keyframes fl-learn-checkpop { 0%,40% { opacity: 0; transform: scale(.4) } 70% { opacity: 1; transform: scale(1.15) } 100% { transform: scale(1) } }
@keyframes fl-learn-burst { 0% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.6) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a)) translateY(-76px) scale(1) } }
@keyframes fl-learn-glow { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent) } 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 0%, transparent) } }
.fl-learn-ring { stroke-dashoffset: 0; animation: fl-learn-ring .7s .1s cubic-bezier(.4,0,.2,1) both }
.fl-learn-checkpop { animation: fl-learn-checkpop .6s .25s ease-out both }
.fl-learn-burst { animation: fl-learn-burst .9s ease-out both }
.fl-learn-glow { animation: fl-learn-glow 2.4s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) {
  .fl-learn-ring, .fl-learn-checkpop, .fl-learn-glow { animation: none !important }
  .fl-learn-burst { display: none }
}
`}</style>
  );
}
