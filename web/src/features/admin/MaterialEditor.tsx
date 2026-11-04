// OWNER: library agent. Structured editor for one language's LessonMaterial.
import { useEffect, useState } from "react";
import { useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import { strings as libStrings } from "../library/strings";
import type { LessonMaterial, MaterialRecord } from "../library/types";
import { Button, Chip, Pill, Spinner, cx } from "../library/ui";

const field = "w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-sm outline-none focus:border-accent";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const TRACKS = ["common", "apps", "video"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export function MaterialEditor({ resourceId, lang, rec, onSaved }: { resourceId: string; lang: "ru" | "en"; rec: MaterialRecord; onSaved: () => void }) {
  const s = useStrings(strings).review, ls = useStrings(libStrings);
  const [m, setM] = useState<LessonMaterial>(rec.data!);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<{ path: string; message: string }[] | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setM(rec.data!); }, [rec.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof LessonMaterial>(k: K, v: LessonMaterial[K]) => { setM((x) => ({ ...x, [k]: v })); setSaved(false); };
  const bad = (p: string) => issues?.some((i) => i.path === p || i.path.startsWith(`${p}.`));

  const save = async () => {
    setBusy(true); setIssues(null);
    try {
      await api(`/admin/resources/${resourceId}/materials/${lang}`, { method: "PUT", json: m });
      setSaved(true); onSaved();
    } catch (e) {
      const msg = (e as Error).message;
      try { setIssues(JSON.parse(msg.slice(msg.indexOf("{"))).issues ?? [{ path: "", message: msg }]); } catch { setIssues([{ path: "", message: msg }]); }
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4" lang={lang}>
      {rec.state === "not_configured" && <p className="rounded-lg bg-gold-soft px-3 py-2 text-sm text-gold">{s.starterNote}</p>}
      <L label={s.m.title} bad={bad("title")}><input className={field} value={m.title} onChange={(e) => set("title", e.target.value)} /></L>
      <L label={s.m.hook} bad={bad("hook")}><input className={field} value={m.hook} onChange={(e) => set("hook", e.target.value)} /></L>
      <L label={s.m.summary} bad={bad("summary")}><textarea rows={6} className={field} value={m.summary} onChange={(e) => set("summary", e.target.value)} /></L>
      <L label={s.m.takeaways} bad={bad("takeaways")}>
        <textarea rows={4} className={field} defaultValue={m.takeaways.join("\n")} key={`tk${rec.updatedAt}`} onChange={(e) => set("takeaways", lines(e.target.value))} />
      </L>

      <fieldset className={cx("space-y-2 rounded-xl border p-3", bad("steps") ? "border-danger" : "border-line")}>
        <legend className="px-1 text-sm font-medium">{s.m.steps}</legend>
        {m.steps.map((st, i) => (
          <div key={i} className="grid gap-1.5 sm:grid-cols-[1fr_1.4fr_auto]">
            <input aria-label={`${s.m.stepTitle} ${i + 1}`} className={field} value={st.title} onChange={(e) => set("steps", m.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <input aria-label={s.m.stepDetail} className={field} value={st.detail} placeholder={s.m.stepDetail} onChange={(e) => set("steps", m.steps.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />
            <Button size="sm" variant="ghost" onClick={() => set("steps", m.steps.filter((_, j) => j !== i))}>{s.m.remove}</Button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => set("steps", [...m.steps, { title: "", detail: "" }])}>+ {s.m.addStep}</Button>
      </fieldset>

      <fieldset className={cx("space-y-2 rounded-xl border p-3", bad("exercise") ? "border-danger" : "border-line")}>
        <legend className="px-1 text-sm font-medium">{s.m.exercise}</legend>
        <L label={s.m.exTitle}><input className={field} value={m.exercise.title} onChange={(e) => set("exercise", { ...m.exercise, title: e.target.value })} /></L>
        <L label={s.m.exGoal}><input className={field} value={m.exercise.goal} onChange={(e) => set("exercise", { ...m.exercise, goal: e.target.value })} /></L>
        <L label={s.m.exInstr}><textarea rows={4} className={field} defaultValue={m.exercise.instructions.join("\n")} key={`ex${rec.updatedAt}`} onChange={(e) => set("exercise", { ...m.exercise, instructions: lines(e.target.value) })} /></L>
        <div className="flex flex-wrap gap-3">
          <L label={s.m.exProof}>
            <select className={field} value={m.exercise.proof} onChange={(e) => set("exercise", { ...m.exercise, proof: e.target.value as LessonMaterial["exercise"]["proof"] })}>
              {(["none", "link", "text", "file"] as const).map((p) => <option key={p} value={p}>{ls.exerciseProof[p]}</option>)}
            </select>
          </L>
          <L label={s.m.exMin}><input type="number" min={5} max={240} className={`${field} w-24`} value={m.exercise.estMinutes} onChange={(e) => set("exercise", { ...m.exercise, estMinutes: +e.target.value })} /></L>
        </div>
      </fieldset>

      <fieldset className={cx("space-y-3 rounded-xl border p-3", bad("quiz") ? "border-danger" : "border-line")}>
        <legend className="px-1 text-sm font-medium">{s.m.quiz}</legend>
        {m.quiz.map((q, i) => (
          <div key={i} className="space-y-1.5 rounded-lg bg-surface-2 p-2.5">
            <input aria-label={`${s.m.question} ${i + 1}`} className={field} value={q.q} onChange={(e) => set("quiz", m.quiz.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
            <textarea aria-label={s.m.options} rows={3} className={field} defaultValue={q.options.join("\n")} key={`q${i}${rec.updatedAt}`}
              onChange={(e) => set("quiz", m.quiz.map((x, j) => (j === i ? { ...x, options: lines(e.target.value) } : x)))} />
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted">{s.m.answer}
                <select className={`${field} w-16`} value={q.answer} onChange={(e) => set("quiz", m.quiz.map((x, j) => (j === i ? { ...x, answer: +e.target.value } : x)))}>
                  {q.options.map((_, k) => <option key={k} value={k}>{k + 1}</option>)}
                </select>
              </label>
              <input aria-label={s.m.explain} placeholder={s.m.explain} className={`${field} flex-1`} value={q.explain} onChange={(e) => set("quiz", m.quiz.map((x, j) => (j === i ? { ...x, explain: e.target.value } : x)))} />
              <Button size="sm" variant="ghost" onClick={() => set("quiz", m.quiz.filter((_, j) => j !== i))}>{s.m.remove}</Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => set("quiz", [...m.quiz, { q: "", options: ["", ""], answer: 0, explain: "" }])}>+ {s.m.addQuestion}</Button>
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <div><div className="mb-1 text-xs text-muted">{s.fields.tracks}</div><div className="flex gap-1.5">{TRACKS.map((t) => <Chip key={t} active={m.tracks.includes(t)} onClick={() => set("tracks", m.tracks.includes(t) ? m.tracks.filter((x) => x !== t) : [...m.tracks, t])}>{ls.track[t]}</Chip>)}</div></div>
        <div><div className="mb-1 text-xs text-muted">{s.fields.level}</div>
          <select className={field} value={m.level} onChange={(e) => set("level", e.target.value as LessonMaterial["level"])}>{LEVELS.map((l) => <option key={l} value={l}>{ls.level[l]}</option>)}</select></div>
        <L label={s.m.estMinutes}><input type="number" min={1} className={`${field} w-24`} value={m.estMinutes} onChange={(e) => set("estMinutes", +e.target.value)} /></L>
      </div>
      <L label={s.m.tags}><input className={field} defaultValue={m.tags.join(", ")} key={`tg${rec.updatedAt}`} onChange={(e) => set("tags", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></L>

      {issues && (
        <div role="alert" className="rounded-lg border border-danger/50 p-3 text-sm text-danger">
          {s.invalid}<ul className="mt-1 list-disc pl-5">{issues.map((i, k) => <li key={k}><code>{i.path}</code> {i.message}</li>)}</ul>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={busy}>{busy && <Spinner />}{s.approve}</Button>
        {saved && <Pill tone="accent">{s.saved}</Pill>}
      </div>
    </div>
  );
}

function L({ label, bad, children }: { label: string; bad?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={cx("mb-1 block text-xs", bad ? "text-danger" : "text-muted")}>{label}</span>
      {children}
    </label>
  );
}
