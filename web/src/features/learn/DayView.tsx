// OWNER: learn. Day hero + lesson + task checklist with proofs + completion moment. Used by Today and DayPage.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Award, CurriculumTask, Lang } from "@shared/types";
import { useStrings } from "@web/i18n";
import { ApiError, formatDate, learnApi, useBadges, type BadgeDef, type DayResponse, type DaySummary, type TaskResult, type TaskState } from "./data";
import { Markdown } from "./Markdown";
import { strings, type LearnStrings } from "./strings";
import { Button, ButtonLink, Card, Chip, Icon, cx, taskTypeIcon } from "./ui";

const MAX_FILE = 50 * 1024 * 1024;

export function DayHero({ s, summary, lang, extra }: { s: LearnStrings; summary: DaySummary; lang: Lang; extra?: React.ReactNode }) {
  void lang;
  return (
    <header className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="font-medium text-fg">{s.dayN(summary.day)}</span>
        <span aria-hidden="true">·</span>
        <span>{s.phaseN(summary.phase)}</span>
        {summary.track && summary.track !== "common" && <Chip>{s.track[summary.track]}</Chip>}
        {summary.boss && <Chip tone="gold"><Icon.crown size={13} />{s.boss}</Chip>}
        {summary.rest && <Chip tone="accent"><Icon.moon size={13} />{s.rest}</Chip>}
        {extra}
      </div>
      <h1 className="max-w-[24ch] text-[clamp(1.75rem,4.5vw,2.6rem)] leading-[1.12] font-semibold tracking-tight text-balance">{summary.title}</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted text-pretty">{summary.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5"><Icon.clock size={16} />{s.minutes(summary.estMinutes)}</span>
        <span className="inline-flex items-center gap-1.5 text-gold"><Icon.sparkle size={16} />{s.xp(summary.xp)}</span>
        {(summary.rest || summary.boss) && <span className="text-sm">{summary.rest ? s.restHint : s.bossHint}</span>}
      </div>
    </header>
  );
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function DayView({ lang, data, onChanged }: { lang: Lang; data: DayResponse; onChanged: () => void }) {
  const s = useStrings(strings);
  const badges = useBadges();
  const day = data.day!;
  const dayBadges = (day.badges ?? []).map((id) => badges[id]).filter(Boolean) as BadgeDef[];
  const [tasks, setTasks] = useState<Record<string, TaskState>>(data.tasks);
  const [dayDone, setDayDone] = useState(data.access === "done");
  const [celebrate, setCelebrate] = useState<{ awards: Award[]; xp: number; result: TaskResult | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setTasks(data.tasks); setDayDone(data.access === "done"); }, [data]);

  const required = day.tasks.filter((t) => !t.optional);
  const doneCount = day.tasks.filter((t) => tasks[t.id]?.done).length;
  const requiredDone = required.every((t) => tasks[t.id]?.done);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const onSubmitted = (task: CurriculumTask, r: TaskResult, wasDone: boolean) => {
    setTasks((prev) => ({ ...prev, [task.id]: r.task }));
    if (r.dayCompleted) {
      setDayDone(true);
      const xp = day.tasks.reduce((a, t) => a + ((t.id === task.id || tasks[t.id]?.done) ? t.xp : 0), 0);
      setCelebrate({ awards: r.awards, xp, result: r });
    } else if (!wasDone) {
      const xpAward = r.awards.find((a) => a.kind === "xp")?.amount;
      showToast(s.plusXp(xpAward ?? task.xp));
    }
  };

  const onUnchecked = (task: CurriculumTask) => setTasks((prev) => ({ ...prev, [task.id]: { done: false, completedAt: null, submission: prev[task.id]?.submission ?? null } }));

  const manualComplete = async () => {
    try {
      const r = await learnApi.completeDay(lang, day.day);
      setDayDone(true);
      setCelebrate({ awards: r.awards, xp: day.tasks.reduce((a, t) => a + (tasks[t.id]?.done ? t.xp : 0), 0), result: { ...r, taskId: "", task: { done: true, completedAt: null, submission: null } } });
    } catch (e) {
      showToast(s.errors[(e as ApiError).code] ?? s.errors.generic);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-12">
      <article className="min-w-0">
        <DayHero s={s} summary={data.summary} lang={lang}
          extra={dayDone && data.completedAt ? <Chip tone="accent"><Icon.check size={13} />{s.dayDoneOn(formatDate(data.completedAt, lang))}</Chip> : dayDone ? <Chip tone="accent"><Icon.check size={13} />{s.dayDone}</Chip> : null} />
        <a href="#tasks-h" className="mb-6 -mt-2 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium lg:hidden"
          onClick={(e) => { e.preventDefault(); document.getElementById("tasks-h")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
          <Icon.check size={14} className="text-accent" />{s.tasks} · {s.tasksProgress(doneCount, day.tasks.length)}<Icon.arrowRight size={14} className="rotate-90" />
        </a>
        <h2 className="sr-only">{s.lesson}</h2>
        <Markdown source={day.bodyMd} copyLabel={s.copy} copiedLabel={s.copied} />
        {day.resources.length > 0 && (
          <section className="mt-10 max-w-[70ch]" aria-labelledby="res-h">
            <h2 id="res-h" className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">{s.resources}</h2>
            <ul className="grid grid-cols-1 gap-2">
              {day.resources.map((r) => (
                <li key={r}>
                  {/^https?:/.test(r) ? (
                    <a href={r} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:bg-surface-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><Icon.external size={16} /></span>
                      <span className="min-w-0 flex-1 truncate">{hostOf(r)}<span className="ml-2 text-muted">{r.replace(/^https?:\/\/(www\.)?[^/]+/, "").slice(0, 60)}</span></span>
                    </a>
                  ) : (
                    <span className="block rounded-xl border border-line px-4 py-3 text-sm text-muted">{r}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <aside className="lg:sticky lg:top-20 lg:self-start" aria-labelledby="tasks-h">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="tasks-h" className="scroll-mt-24 text-lg font-semibold">{s.tasks}</h2>
            <span className="text-sm text-muted" aria-live="polite">{s.tasksProgress(doneCount, day.tasks.length)}</span>
          </div>
          <ol className="grid grid-cols-1 gap-3">
            {day.tasks.map((t) => (
              <TaskItem key={t.id} s={s} lang={lang} day={day.day} task={t} state={tasks[t.id]} dayDone={dayDone}
                onSubmitted={onSubmitted} onUnchecked={onUnchecked} onError={(m) => showToast(m)} />
            ))}
          </ol>
          {dayBadges.length > 0 && (
            <div className="mt-4 rounded-xl bg-gold-soft px-3 py-2.5 text-sm">
              <p className="text-xs font-semibold tracking-wide text-gold uppercase">{dayDone ? s.badgeEarned : s.badgeToEarn}</p>
              {dayBadges.map((b) => (
                <p key={b.id} className="mt-1 flex items-start gap-2">
                  <span aria-hidden="true" className="text-base leading-5">{b.icon}</span>
                  <span><span className="font-semibold">{b.title[lang]}</span><span className="text-muted"> — {b.description[lang]}</span></span>
                </p>
              ))}
            </div>
          )}
          {!dayDone && requiredDone && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-3 text-sm text-muted">{s.allRequiredDone}</p>
              <Button className="w-full" onClick={manualComplete}>{s.completeDay}</Button>
            </div>
          )}
          {dayDone && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-sm font-medium text-accent">
              <Icon.check size={16} /> {s.dayDone}
            </div>
          )}
        </Card>
        {data.next && dayDone && (() => {
          // Fresh completion in this view → use the result; otherwise what the server said about the next day.
          const r = celebrate?.result;
          const nextState = r ? (r.nextDay === data.next.day ? (r.status === "open" ? "open" : "waiting") : "other") : data.nextAccess;
          return nextState === "open" || nextState === "waiting"
            ? <NextTeaser s={s} lang={lang} next={data.next} openNow={nextState === "open"} />
            : null;
        })()}
      </aside>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-20 z-40 mx-auto w-fit rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-gold shadow-lg sm:bottom-8 fl-learn-pop">
          {toast}
        </div>
      )}
      {celebrate && (
        <Celebration s={s} lang={lang} badges={badges} dayBadges={day.badges ?? []} day={data.summary} next={data.next} xp={celebrate.xp} awards={celebrate.awards} result={celebrate.result}
          onClose={() => { setCelebrate(null); onChanged(); }} />
      )}
      <LearnKeyframes />
    </div>
  );
}

function NextTeaser({ s, lang, next, openNow }: { s: LearnStrings; lang: Lang; next: DaySummary; openNow: boolean }) {
  if (!next.available) return null;
  return (
    <Card className="mt-4 p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {openNow ? s.nextUp : s.tomorrow} · {s.dayN(next.day)}
        {next.boss && <Icon.crown size={13} className="text-gold" />}
        {next.rest && <Icon.moon size={13} className="text-accent" />}
      </div>
      <p className="font-semibold">{next.title}</p>
      <p className="mt-1 text-sm text-muted">{next.summary}</p>
      {openNow && <ButtonLink to={`/${lang}/day/${next.day}`} size="sm" className="mt-3">{s.continueNext(next.day)} <Icon.arrowRight size={15} /></ButtonLink>}
    </Card>
  );
}

function TaskItem({ s, lang, day, task, state, dayDone, onSubmitted, onUnchecked, onError }: {
  s: LearnStrings; lang: Lang; day: number; task: CurriculumTask; state?: TaskState; dayDone: boolean;
  onSubmitted: (t: CurriculumTask, r: TaskResult, wasDone: boolean) => void; onUnchecked: (t: CurriculumTask) => void; onError: (m: string) => void;
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
      catch (e) { onError(s.errors[(e as ApiError).code] ?? s.errors.generic); }
      finally { setBusy(false); }
    } else await submit({});
  };

  const circle = (
    <span className={cx("grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
      done ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-transparent", busy && "animate-pulse")}>
      <Icon.check size={15} strokeWidth={3} className={cx(done && "fl-learn-check")} />
    </span>
  );

  return (
    <li className={cx("rounded-xl border p-3 transition-colors", done ? "border-accent/25 bg-accent-soft/40" : "border-line bg-surface")}>
      <div className="flex gap-3">
        {task.proof === "none" ? (
          <button type="button" onClick={toggleNone} disabled={busy || (done && dayDone)} aria-pressed={done}
            aria-label={`${done ? s.undo : s.markDone}: ${task.title}`}
            className="mt-0.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default">
            {circle}
          </button>
        ) : (
          <span className="mt-0.5" aria-hidden="true">{circle}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><TypeIcon size={13} />{s.taskType[task.type]}</span>
            <span className="font-semibold text-gold">{s.plusXp(task.xp)}</span>
            {task.optional && <Chip className="!py-0">{s.optional}</Chip>}
            {sub && <StatusChip s={s} status={sub.status} />}
          </div>
          <p className={cx("leading-snug font-medium text-pretty", done && !editing && "text-fg/80")}>
            <span className="sr-only">{done ? `${s.dayDone}: ` : ""}</span>{task.title}
          </p>

          {done && sub && !editing && <SubmissionSummary s={s} sub={sub} onEdit={() => setEditing(true)} />}
          {done && task.proof === "none" && !dayDone && (
            <button type="button" onClick={toggleNone} className="mt-1 text-xs text-muted underline-offset-2 hover:text-fg hover:underline">{s.undo}</button>
          )}
          {!done && task.proof === "none" && (
            <Button size="sm" variant="secondary" className="mt-2" onClick={toggleNone} disabled={busy}>{busy ? s.saving : s.markDone}</Button>
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

function StatusChip({ s, status }: { s: LearnStrings; status: "submitted" | "approved" | "needs_work" }) {
  return <Chip className="!py-0" tone={status === "approved" ? "accent" : status === "needs_work" ? "danger" : "neutral"}>{s.status[status]}</Chip>;
}

function SubmissionSummary({ s, sub, onEdit }: { s: LearnStrings; sub: NonNullable<TaskState["submission"]>; onEdit: () => void }) {
  return (
    <div className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm">
      {sub.url && (
        <a href={sub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-accent hover:underline">
          <Icon.link size={14} className="shrink-0" /><span className="truncate">{sub.url.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
      {sub.file && (
        <a href={sub.file.href} target="_blank" rel="noopener" className="flex items-center gap-1.5 font-medium text-accent hover:underline">
          <Icon.file size={14} className="shrink-0" /><span className="truncate">{sub.file.name}</span>
          <span className="shrink-0 text-xs font-normal text-muted">{fmtSize(sub.file.size)}</span>
        </a>
      )}
      {sub.text && <p className={cx("whitespace-pre-line text-muted line-clamp-4", (sub.url || sub.file) && "mt-1")}>{sub.text}</p>}
      {sub.feedback && (
        <p className="mt-2 border-t border-line pt-2 text-sm"><span className="font-semibold">{s.feedback}: </span>{sub.feedback}</p>
      )}
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
  const id = `proof-${task.id}`;

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
  const field = "w-full rounded-lg border border-line bg-bg px-3 py-2 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <form onSubmit={onFormSubmit} className="mt-2 grid grid-cols-1 gap-2" noValidate>
      <label htmlFor={id} className="text-xs text-muted">{s.proofHint[task.proof]}</label>
      {task.proof === "text" && (
        <textarea id={id} value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={5000} placeholder={s.textPlaceholder}
          className={cx(field, "min-h-[84px] resize-y")} aria-invalid={!!shownErr} aria-describedby={shownErr ? `${id}-err` : undefined} />
      )}
      {task.proof === "link" && (
        <input id={id} type="url" inputMode="url" autoComplete="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={s.linkPlaceholder}
          className={field} aria-invalid={!!shownErr} aria-describedby={shownErr ? `${id}-err` : undefined} />
      )}
      {task.proof === "file" && (
        <div>
          <input ref={fileRef} id={id} type="file" className="sr-only" accept="image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,application/zip"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > MAX_FILE) { setLocalErr(s.fileTooBig); setFile(null); return; }
              setLocalErr(null); setFile(f);
            }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-line bg-bg px-3 py-3 text-left text-sm hover:border-accent focus-visible:outline-2 focus-visible:outline-accent">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><Icon.upload size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{file ? file.name : s.chooseFile}</span>
              <span className="block text-xs text-muted">{file ? fmtSize(file.size) : s.fileLimit}</span>
            </span>
          </button>
        </div>
      )}
      {shownErr && <p id={`${id}-err`} role="alert" className="text-sm text-danger">{shownErr}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? (task.proof === "file" ? s.uploading : s.saving) : editing ? s.resubmit : s.submit}</Button>
        {onCancel && <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>{s.cancel}</Button>}
      </div>
    </form>
  );
}

function awardLabel(s: LearnStrings, a: Award, lang: Lang) {
  if (a.label) return a.label;
  switch (a.kind) {
    case "xp": return s.award.xp(a.amount ?? 0);
    case "level": return s.award.level(a.amount);
    case "streak": return s.award.streak(a.amount);
    case "badge": return a.id ? `${s.award.badge}: ${a.id}` : s.award.badge;
  }
  void lang;
}

function Celebration({ s, lang, badges, dayBadges, day, next, xp, awards, result, onClose }: {
  s: LearnStrings; lang: Lang; badges: Record<string, BadgeDef>; dayBadges: string[]; day: DaySummary; next: DaySummary | null; xp: number; awards: Award[]; result: TaskResult | null; onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const nav = useNavigate();
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      // keep focus inside the dialog
      const box = closeRef.current?.closest("[role=dialog]");
      const els = box ? Array.from(box.querySelectorAll<HTMLElement>("button, a[href]")) : [];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Show game awards if the game layer returned any; otherwise show the XP the tasks are worth.
  // Several xp awards (task + day bonus) are merged into one chip.
  const gameXp = awards.filter((a) => a.kind === "xp").reduce((n, a) => n + (a.amount ?? 0), 0);
  const list: Award[] = [{ kind: "xp", amount: gameXp || xp }, ...awards.filter((a) => a.kind !== "xp")];
  // Until the game layer returns badge awards, show the day's own badges (from content) as earned.
  if (!awards.some((a) => a.kind === "badge")) for (const id of dayBadges) list.push({ kind: "badge", id });
  const openNow = result?.status === "open" && result.nextDay && next && result.nextDay === next.day && next.available;
  const body = day.boss ? s.celebrateBoss : day.rest ? s.celebrateRest : s.celebrateBody;
  const pieces = Array.from({ length: 14 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-bg/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4 fl-learn-fade" role="dialog" aria-modal="true" aria-labelledby="cel-title" onClick={onClose}>
      <div className="relative w-full max-w-md overflow-hidden rounded-t-[calc(var(--radius)+6px)] border border-line bg-surface p-6 pb-8 text-center shadow-2xl sm:rounded-[calc(var(--radius)+6px)] sm:pb-6 fl-learn-rise" onClick={(e) => e.stopPropagation()}>
        <div className="relative mx-auto mb-5 mt-2 grid size-24 place-items-center">
          {pieces.map((i) => (
            <span key={i} className="fl-learn-burst absolute top-1/2 left-1/2 block size-2 rounded-full"
              style={{ background: i % 3 === 0 ? "var(--gold)" : "var(--accent)", ["--a" as string]: `${(360 / pieces.length) * i}deg`, animationDelay: `${120 + (i % 4) * 30}ms` }} />
          ))}
          <svg viewBox="0 0 96 96" className="absolute inset-0" aria-hidden="true">
            <circle cx="48" cy="48" r="42" fill="var(--accent-soft)" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" className="fl-learn-ring" pathLength={100} strokeDasharray="100" transform="rotate(-90 48 48)" />
          </svg>
          <span className="relative text-accent fl-learn-checkpop">{day.boss ? <Icon.crown size={40} /> : <Icon.check size={44} strokeWidth={3} />}</span>
        </div>
        <h2 id="cel-title" className="text-2xl font-semibold tracking-tight">{s.celebrateTitle(day.day)}</h2>
        <p className="mx-auto mt-2 max-w-[32ch] text-muted">{body}</p>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{s.awards}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {list.map((a, i) => (
              <li key={i} className="fl-learn-pop rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold" style={{ animationDelay: `${450 + i * 120}ms` }}>
                {a.kind === "badge" && a.id && badges[a.id] ? <><span aria-hidden="true">{badges[a.id].icon} </span>{a.label ?? badges[a.id].title[lang]}</> : awardLabel(s, a, lang)}
              </li>
            ))}
          </ul>
        </div>

        {next && next.available && (
          <div className="mt-6 rounded-xl border border-line bg-bg p-4 text-left">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{openNow ? s.nextOpen : `${s.tomorrow} · ${s.dayN(next.day)}`}</p>
            <p className="mt-1 font-semibold">{next.title}</p>
            <p className="mt-0.5 text-sm text-muted line-clamp-2">{next.summary}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button ref={closeRef} variant="secondary" onClick={onClose}>{s.close}</Button>
          {openNow ? (
            <Button onClick={() => { onClose(); nav(`/${lang}/day/${next!.day}`); }}>{s.continueNext(next!.day)} <Icon.arrowRight size={16} /></Button>
          ) : (
            <Button onClick={() => { onClose(); nav(`/${lang}/path`); }}><Icon.map size={16} />{s.seePath}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Keyframes for the learn feature (scoped names; disabled under prefers-reduced-motion). */
export function LearnKeyframes() {
  return (
    <style>{`
@keyframes fl-learn-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes fl-learn-rise { from { opacity: 0; transform: translateY(24px) scale(.98) } to { opacity: 1; transform: none } }
@keyframes fl-learn-ring { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
@keyframes fl-learn-checkpop { 0%,40% { opacity: 0; transform: scale(.4) } 70% { opacity: 1; transform: scale(1.15) } 100% { transform: scale(1) } }
@keyframes fl-learn-burst { 0% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.6) } 25% { opacity: 1 } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--a)) translateY(-76px) scale(1) } }
@keyframes fl-learn-pop { 0% { opacity: 0; transform: translateY(6px) scale(.9) } 100% { opacity: 1; transform: none } }
@keyframes fl-learn-check { 0% { transform: scale(.3) } 60% { transform: scale(1.2) } 100% { transform: scale(1) } }
@keyframes fl-learn-glow { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent) } 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 0%, transparent) } }
.fl-learn-fade { animation: fl-learn-fade .2s ease-out both }
.fl-learn-rise { animation: fl-learn-rise .35s cubic-bezier(.2,.8,.2,1) both }
.fl-learn-ring { stroke-dashoffset: 0; animation: fl-learn-ring .7s .1s cubic-bezier(.4,0,.2,1) both }
.fl-learn-checkpop { animation: fl-learn-checkpop .6s .25s ease-out both }
.fl-learn-burst { animation: fl-learn-burst .9s ease-out both }
.fl-learn-pop { animation: fl-learn-pop .3s ease-out both }
.fl-learn-check { animation: fl-learn-check .3s ease-out }
.fl-learn-glow { animation: fl-learn-glow 2.4s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) {
  .fl-learn-fade, .fl-learn-rise, .fl-learn-ring, .fl-learn-checkpop, .fl-learn-pop, .fl-learn-check, .fl-learn-glow { animation: none !important }
  .fl-learn-burst { display: none }
}
`}</style>
  );
}
