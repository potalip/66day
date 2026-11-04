// OWNER: learn. Onboarding: welcome → track → daily time & goal → name → Day 1.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Track } from "@shared/types";
import { useLang, useStrings } from "@web/i18n";
import { learnApi, useOverview, type GoalKey, type Overview } from "../learn/data";
import { LearnKeyframes } from "../learn/DayView";
import { Button, ButtonLink, Card, ErrorState, Icon, PageSkeleton, cx } from "../learn/ui";
import { strings, type OnboardingStrings } from "./strings";

type Step = "welcome" | "track" | "time" | "name" | "done";
const FIRST_FLOW: Step[] = ["welcome", "track", "time", "name"];
const GOALS: GoalKey[] = ["portfolio", "job", "project", "habit", "curious"];

export default function Onboarding() {
  const lang = useLang();
  const s = useStrings(strings);
  const ov = useOverview(lang);
  const nav = useNavigate();
  const [mode, setMode] = useState<"first" | "change" | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [track, setTrack] = useState<Track | null>(null);
  const [minutes, setMinutes] = useState(60);
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [goalNote, setGoalNote] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [result, setResult] = useState<Overview | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Prefill from an existing profile.
  useEffect(() => {
    const p = ov.data?.profile;
    if (!p) return;
    setTrack(p.track); setMinutes(p.dailyMinutes); setGoal(p.goal); setGoalNote(p.goalNote ?? ""); setName(p.name ?? "");
  }, [ov.data]);

  useEffect(() => { headingRef.current?.focus(); }, [step, mode]);

  if (ov.loading && !ov.data) return <PageSkeleton />;
  if (ov.error || !ov.data) return <ErrorState title={s.done.error} body="" retry={s.done.retry} onRetry={() => ov.reload()} />;
  const o = ov.data;

  if (o.onboarded && mode === null && step !== "done") {
    return (
      <Shell>
        <Card className="p-6 sm:p-8">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
            {o.nextDay ? s.already.title(o.nextDay) : s.already.titleDone}
          </h1>
          <p className="mt-2 text-muted">{s.already.body}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to={`/${lang}/today`}>{s.already.cont}<Icon.arrowRight size={16} /></ButtonLink>
            <Button variant="secondary" onClick={() => { setMode("change"); setStep("track"); }}>{s.already.change}</Button>
          </div>
        </Card>
      </Shell>
    );
  }

  const flow: Step[] = mode === "change" ? ["track", "time"] : FIRST_FLOW;
  const idx = flow.indexOf(step);
  const canNext = step === "track" ? !!track : true;

  const save = async () => {
    if (!track) return;
    setSaving(true); setSaveErr(false);
    const timezone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; } })();
    try {
      if (mode === "change") {
        const r = await learnApi.updateProfile(lang, { track, dailyMinutes: minutes, goal, goalNote, timezone });
        setResult(r);
      } else {
        const r = await learnApi.onboarding({ lang, track, dailyMinutes: minutes, goal, goalNote, name, timezone });
        setResult(r.overview);
      }
      setStep("done");
      void ov.reload(true);
    } catch {
      setSaveErr(true);
    } finally { setSaving(false); }
  };

  const next = () => {
    if (!canNext) return;
    if (idx === flow.length - 1) void save();
    else setStep(flow[idx + 1]);
  };
  const back = () => {
    if (idx > 0) setStep(flow[idx - 1]);
    else if (mode === "change") setMode(null);
  };

  if (step === "done") {
    const r = result ?? o;
    const d1 = r.cells[0];
    const changed = mode === "change";
    return (
      <Shell>
        <Card className="overflow-hidden p-6 text-center sm:p-10 fl-learn-rise">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-accent-soft text-accent fl-learn-checkpop"><Icon.leaf size={30} /></div>
          <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(1.6rem,4vw,2.2rem)] font-semibold tracking-tight outline-none">
            {changed ? s.done.updated : s.done.title(r.profile?.name ?? null)}
          </h1>
          {!changed && <p className="mx-auto mt-3 max-w-[44ch] text-muted">{s.done.body}</p>}
          {!changed && d1?.available && (
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-line bg-bg p-4 text-left">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{s.done.day1}</p>
              <p className="mt-1 font-semibold">{d1.title}</p>
              <p className="mt-1 text-sm text-muted">{d1.summary}</p>
            </div>
          )}
          <Button size="lg" className="mt-7" onClick={() => nav(`/${lang}/today`)}>{changed ? s.done.toToday : s.done.start}<Icon.arrowRight size={18} /></Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      {step !== "welcome" && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <button type="button" onClick={back} className={cx("inline-flex items-center gap-1.5 rounded-lg py-1 text-sm text-muted hover:text-fg", idx === 0 && mode !== "change" && "invisible")}>
            <Icon.arrowLeft size={16} />{s.back}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{s.stepOf(idx + (mode === "change" ? 1 : 0), flow.length - (mode === "change" ? 0 : 1))}</span>
            <div className="flex gap-1.5" aria-hidden="true">
              {flow.filter((f) => f !== "welcome").map((f) => (
                <span key={f} className={cx("h-1.5 rounded-full transition-all duration-300", f === step ? "w-6 bg-accent" : flow.indexOf(f) < idx ? "w-3 bg-accent/60" : "w-3 bg-line")} />
              ))}
            </div>
          </div>
        </div>
      )}

      <form key={step} onSubmit={(e) => { e.preventDefault(); next(); }} className="fl-learn-rise">
        {step === "welcome" && <Welcome s={s} headingRef={headingRef} />}
        {step === "track" && <TrackStep s={s} headingRef={headingRef} track={track} setTrack={setTrack} />}
        {step === "time" && (
          <TimeStep s={s} headingRef={headingRef} minutes={minutes} setMinutes={setMinutes} goal={goal} setGoal={setGoal} goalNote={goalNote} setGoalNote={setGoalNote} />
        )}
        {step === "name" && (
          <div>
            <StepTitle headingRef={headingRef} title={s.name.title} body={s.name.body} />
            <label htmlFor="ob-name" className="mb-2 block text-sm font-medium">{s.name.label}</label>
            <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="nickname" placeholder={s.name.placeholder}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" />
          </div>
        )}

        {saveErr && <p role="alert" className="mt-4 text-sm text-danger">{s.done.error}</p>}

        <div className={cx("mt-8 flex items-center gap-3", step === "welcome" ? "flex-col items-start sm:flex-row sm:items-center" : "justify-end")}>
          {step === "name" && !saving && (
            <Button variant="ghost" onClick={() => { setName(""); void save(); }}>{s.skip}</Button>
          )}
          <Button type="submit" size="lg" disabled={!canNext || saving} className={cx(step === "welcome" && "w-full sm:w-auto")}>
            {saving ? s.done.saving : step === "welcome" ? s.welcome.cta : s.next}
            {!saving && <Icon.arrowRight size={18} />}
          </Button>
          {step === "welcome" && <span className="text-sm text-muted">{s.welcome.time}</span>}
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl pb-10 sm:pt-4">{children}<LearnKeyframes /></div>;
}

function StepTitle({ headingRef, title, body }: { headingRef: React.RefObject<HTMLHeadingElement | null>; title: string; body: string }) {
  return (
    <div className="mb-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-[clamp(1.6rem,4vw,2.2rem)] leading-tight font-semibold tracking-tight text-balance outline-none">{title}</h1>
      <p className="mt-2 max-w-[56ch] text-muted">{body}</p>
    </div>
  );
}

function Welcome({ s, headingRef }: { s: OnboardingStrings; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <div>
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent"><Icon.leaf size={15} />{s.welcome.kicker}</p>
      <h1 ref={headingRef} tabIndex={-1} className="max-w-[18ch] text-[clamp(2rem,6vw,3.25rem)] leading-[1.05] font-semibold tracking-tight text-balance outline-none">{s.welcome.title}</h1>
      <p className="mt-4 max-w-[52ch] text-lg text-muted text-pretty">{s.welcome.body}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {s.welcome.points.map(([t, b], i) => (
          <li key={t} className="rounded-[var(--radius)] border border-line bg-surface p-4">
            <span className="mb-3 grid size-8 place-items-center rounded-lg bg-surface-2 text-sm font-semibold text-accent">{i + 1}</span>
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted">{b}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrackStep({ s, headingRef, track, setTrack }: { s: OnboardingStrings; headingRef: React.RefObject<HTMLHeadingElement | null>; track: Track | null; setTrack: (t: Track) => void }) {
  return (
    <fieldset>
      <legend className="contents"><StepTitle headingRef={headingRef} title={s.track.title} body={s.track.body} /></legend>
      <div className="grid gap-4 md:grid-cols-2">
        {(["apps", "video"] as const).map((t) => {
          const d = s.track[t];
          const on = track === t;
          return (
            <label key={t} className={cx("relative flex cursor-pointer flex-col rounded-[var(--radius)] border-2 bg-surface p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              on ? "border-accent" : "border-line hover:border-muted/40")}>
              <input type="radio" name="track" value={t} checked={on} onChange={() => setTrack(t)} className="sr-only" />
              <div className="mb-3 flex items-center justify-between">
                <span className={cx("grid size-11 place-items-center rounded-xl", on ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg")}>
                  {t === "apps" ? <Icon.hammer size={20} /> : <Icon.play size={20} />}
                </span>
                <span className={cx("grid size-6 place-items-center rounded-full border-2", on ? "border-accent bg-accent text-accent-fg" : "border-line")} aria-hidden="true">
                  {on && <Icon.check size={13} strokeWidth={3} />}
                </span>
              </div>
              <span className="text-xl font-semibold">{d.name}</span>
              <span className="mt-1 text-muted">{d.tagline}</span>
              <span className="mt-4 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{s.track.youBuild}</span>
              <ul className="grid gap-1.5 text-sm">
                {d.builds.map((b) => <li key={b} className="flex gap-2"><Icon.check size={15} className="mt-0.5 shrink-0 text-accent" />{b}</li>)}
              </ul>
              <span className="mt-4 border-t border-line pt-3 text-sm text-muted">{d.honest}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function TimeStep({ s, headingRef, minutes, setMinutes, goal, setGoal, goalNote, setGoalNote }: {
  s: OnboardingStrings; headingRef: React.RefObject<HTMLHeadingElement | null>; minutes: number; setMinutes: (n: number) => void;
  goal: GoalKey | null; setGoal: (g: GoalKey) => void; goalNote: string; setGoalNote: (v: string) => void;
}) {
  const opt = "flex cursor-pointer rounded-xl border-2 bg-surface p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";
  return (
    <div className="grid gap-10">
      <fieldset>
        <legend className="contents"><StepTitle headingRef={headingRef} title={s.time.title} body={s.time.body} /></legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {s.time.options.map(([v, label, hint]) => (
            <label key={v} className={cx(opt, "flex-col", minutes === v ? "border-accent" : "border-line hover:border-muted/40")}>
              <input type="radio" name="minutes" value={v} checked={minutes === v} onChange={() => setMinutes(v)} className="sr-only" />
              <span className="text-lg font-semibold">{label}</span>
              <span className="mt-1 text-xs text-muted">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 text-xl font-semibold tracking-tight">{s.time.goalTitle}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label key={g} className={cx(opt, "items-center gap-3 py-3", goal === g ? "border-accent" : "border-line hover:border-muted/40")}>
              <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} className="sr-only" />
              <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", goal === g ? "border-accent bg-accent text-accent-fg" : "border-line")} aria-hidden="true">
                {goal === g && <Icon.check size={11} strokeWidth={3} />}
              </span>
              <span className="text-[15px]">{s.time.goals[g]}</span>
            </label>
          ))}
        </div>
        <label htmlFor="ob-note" className="mt-5 mb-2 block text-sm font-medium">{s.time.noteLabel}</label>
        <input id="ob-note" value={goalNote} onChange={(e) => setGoalNote(e.target.value)} maxLength={280} placeholder={s.time.notePlaceholder}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" />
      </fieldset>
    </div>
  );
}
