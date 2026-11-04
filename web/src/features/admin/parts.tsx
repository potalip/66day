// OWNER: library agent. Shared admin pieces: pipeline stepper, attention line, curriculum day picker.
import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Minus, Plus, ArrowRight } from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { Button, Input, Segmented, Select, Spinner, cn } from "@web/ui";
import { strings } from "./strings";

export type StepState = "todo" | "active" | "done" | "warn" | "error" | "skip" | "ready";
export interface Step { key: string; state: StepState }

/** Five-step pipeline progress. Compact = dots only (board rows); full = labelled (batch tracker). */
export function Stepper({ steps, compact }: { steps: Step[]; compact?: boolean }) {
  const s = useStrings(strings);
  return (
    <ol className={cn("flex items-center", compact ? "gap-1" : "flex-wrap gap-1")} aria-label={steps.map((x) => `${s.steps[x.key]}: ${s.stepState[x.state]}`).join(", ")}>
      {steps.map((x, i) => (
        <li key={x.key} className="flex items-center gap-1" title={`${s.steps[x.key]}: ${s.stepState[x.state]}`}>
          {i > 0 && compact && <span aria-hidden className={cn("h-px w-2", x.state === "todo" ? "bg-line" : "bg-line-strong")} />}
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full",
            compact ? "size-4 justify-center" : "h-6 px-2 text-[0.6875rem] font-medium",
            x.state === "done" && "bg-accent-soft text-accent-ink",
            x.state === "active" && "bg-info-soft text-info",
            x.state === "ready" && "border border-accent/40 bg-surface text-accent-ink",
            x.state === "warn" && "bg-gold-soft text-gold-ink",
            x.state === "error" && "bg-danger-soft text-danger-ink",
            (x.state === "todo" || x.state === "skip") && "bg-surface-2 text-muted",
          )}>
            <StepIcon state={x.state} />
            {!compact && <span className={cn(x.state === "skip" && "line-through opacity-70")}>{s.steps[x.key]}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ state }: { state: StepState }) {
  const c = "size-3 shrink-0";
  if (state === "done") return <Check aria-hidden className={c} />;
  if (state === "active") return <Spinner className={c} />;
  if (state === "warn") return <AlertTriangle aria-hidden className={c} />;
  if (state === "error") return <X aria-hidden className={c} />;
  if (state === "skip") return <Minus aria-hidden className={c} />;
  if (state === "ready") return <ArrowRight aria-hidden className={c} />;
  return <span aria-hidden className="size-1.5 rounded-full bg-current opacity-50" />;
}

export function Attention({ reason, className }: { reason: string | null; className?: string }) {
  const s = useStrings(strings);
  if (!reason) return null;
  return <p className={cn("text-xs font-medium", reason === "review" ? "text-accent-ink" : reason === "failed" || reason === "lesson_failed" ? "text-danger" : "text-gold-ink", className)}>{s.attention[reason]}</p>;
}

// ---------------- Curriculum day picker ----------------

export interface DayRef { day: number; track: "common" | "apps" | "video"; reason?: string }
interface DaySummary { day: number; track: "common" | "apps" | "video" | null; title: string }
const cache = new Map<string, Promise<DaySummary[]>>();
function loadDays(lang: string, track: "apps" | "video") {
  const k = `${lang}:${track}`;
  if (!cache.has(k)) cache.set(k, api<{ days: DaySummary[] }>(`/curriculum/program?lang=${lang}&track=${track}`).then((r) => r.days).catch(() => { cache.delete(k); return []; }));
  return cache.get(k)!;
}

/** Assign a resource to curriculum days. Shows real day titles from the learn area; falls back to a number input. */
export function DayPicker({ value, onChange }: { value: DayRef[]; onChange: (v: DayRef[]) => void }) {
  const s = useStrings(strings).days;
  const lang = useLang();
  const [days, setDays] = useState<{ apps: DaySummary[]; video: DaySummary[] } | null>(null);
  const [track, setTrack] = useState<DayRef["track"]>("common");
  const [pick, setPick] = useState("");
  useEffect(() => { Promise.all([loadDays(lang, "apps"), loadDays(lang, "video")]).then(([apps, video]) => setDays({ apps, video })); }, [lang]);

  const options = !days ? [] : track === "common"
    ? days.apps.filter((d) => d.track === "common")
    : (track === "apps" ? days.apps : days.video).filter((d) => d.track === track);
  const titleOf = (r: DayRef) => {
    const list = r.track === "video" ? days?.video : days?.apps;
    return list?.find((d) => d.day === r.day)?.title;
  };
  const offline = days && !days.apps.length;
  const add = () => {
    const n = parseInt(pick, 10);
    if (!(n >= 1 && n <= 66) || value.some((v) => v.day === n && v.track === track)) return;
    onChange([...value, { day: n, track, reason: "" }].sort((a, b) => a.day - b.day));
    setPick("");
  };

  return (
    <div className="space-y-2">
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <li key={`${v.day}-${v.track}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-3 pr-1 text-sm">
              <span className="font-medium tabular-nums">{v.day}</span>
              <span className="text-xs text-muted">{s.track[v.track]}</span>
              {titleOf(v) && <span className="truncate text-muted">· {titleOf(v)}</span>}
              <button type="button" aria-label={`${s.remove} ${v.day}`} onClick={() => onChange(value.filter((x) => x !== v))}
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"><X className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{s.none}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" label={s.pick} value={track} onChange={(t) => { setTrack(t); setPick(""); }}
          options={(["common", "apps", "video"] as const).map((t) => ({ value: t, label: s.track[t] }))} />
        {offline || !days ? (
          <Input type="number" min={1} max={66} value={pick} onChange={(e) => setPick(e.target.value)} placeholder="1–66" aria-label={s.pick} className="h-9 w-24" />
        ) : (
          <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={s.pick} className="min-w-0 flex-1 [&_select]:h-9 [&_select]:text-sm">
            <option value="">{s.pick}</option>
            {options.map((d) => <option key={d.day} value={d.day}>{d.day}. {d.title}</option>)}
          </Select>
        )}
        <Button size="sm" variant="outline" icon={<Plus />} onClick={add} disabled={!pick}>{s.add}</Button>
      </div>
      {offline && <p className="text-xs text-muted">{s.offline}</p>}
    </div>
  );
}
