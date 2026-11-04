// OWNER: library agent. Renders a LessonMaterial: summary, takeaways, steps, exercise, quiz.
import { useState } from "react";
import { useStrings } from "@web/i18n";
import { strings } from "./strings";
import type { LessonMaterial, QuizItem } from "./types";
import { Button, Card, CheckIcon, ClockIcon, cx } from "./ui";

export function Lesson({ m }: { m: LessonMaterial }) {
  const s = useStrings(strings);
  return (
    <article className="max-w-[70ch] space-y-10">
      <section aria-labelledby="ls-summary">
        <h2 id="ls-summary" className="text-xl font-semibold tracking-tight">{s.summary}</h2>
        <div className="mt-3 space-y-3 leading-relaxed text-fg/90">
          {m.summary.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <section aria-labelledby="ls-take">
        <h2 id="ls-take" className="text-xl font-semibold tracking-tight">{s.takeaways}</h2>
        <ul className="mt-3 space-y-2.5">
          {m.takeaways.map((t, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <CheckIcon className="mt-1 size-4 shrink-0 text-accent" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ls-steps">
        <h2 id="ls-steps" className="text-xl font-semibold tracking-tight">{s.steps}</h2>
        <ol className="mt-4 space-y-4">
          {m.steps.map((st, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-sm font-semibold tabular-nums">{i + 1}</span>
              <div className="pt-0.5">
                <div className="font-medium">{st.title}</div>
                {st.detail && <p className="mt-1 leading-relaxed text-muted">{st.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ls-ex">
        <Card tone="accent" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="ls-ex" className="text-sm font-semibold uppercase tracking-wide text-accent">{s.exercise}</h2>
            <span className="inline-flex items-center gap-1 text-sm text-muted"><ClockIcon className="size-4" />{s.minutes(m.exercise.estMinutes)}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{m.exercise.title}</h3>
          <p className="mt-1 text-fg/90">{m.exercise.goal}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed marker:text-muted">
            {m.exercise.instructions.map((x, i) => <li key={i}>{x}</li>)}
          </ol>
          <p className="mt-4 text-sm text-muted">{s.exerciseProof[m.exercise.proof]}</p>
        </Card>
      </section>

      {m.quiz.length > 0 && <Quiz items={m.quiz} />}
    </article>
  );
}

function Quiz({ items }: { items: QuizItem[] }) {
  const s = useStrings(strings);
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = picked.filter((p, i) => p === items[i].answer).length;
  return (
    <section aria-labelledby="ls-quiz">
      <h2 id="ls-quiz" className="text-xl font-semibold tracking-tight">{s.quiz}</h2>
      <div className="mt-4 space-y-5">
        {items.map((it, qi) => (
          <fieldset key={qi} className="rounded-[var(--radius)] border border-line bg-surface p-4 sm:p-5">
            <legend className="sr-only">{it.q}</legend>
            <p className="font-medium" aria-hidden>{qi + 1}. {it.q}</p>
            <div className="mt-3 space-y-2">
              {it.options.map((o, oi) => {
                const sel = picked[qi] === oi;
                const right = checked && oi === it.answer;
                const wrong = checked && sel && oi !== it.answer;
                return (
                  <label key={oi} className={cx(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    right ? "border-accent bg-accent-soft" : wrong ? "border-danger/60" : sel ? "border-accent/60 bg-surface-2" : "border-line hover:bg-surface-2",
                    checked && "cursor-default",
                  )}>
                    <input
                      type="radio" name={`q${qi}`} className="mt-0.5 accent-[var(--accent)]" checked={sel} disabled={checked}
                      onChange={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    />
                    <span>{o}</span>
                  </label>
                );
              })}
            </div>
            {checked && (
              <p className={cx("mt-3 text-sm", picked[qi] === it.answer ? "text-accent" : "text-danger")}>
                {picked[qi] === it.answer ? s.quizCorrect : s.quizWrong} <span className="text-muted">{it.explain}</span>
              </p>
            )}
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        {!checked ? (
          <Button variant="primary" disabled={picked.some((p) => p === null)} onClick={() => setChecked(true)}>{s.quizCheck}</Button>
        ) : (
          <>
            <span className={cx("font-semibold", score === items.length ? "text-gold" : "text-fg")} aria-live="polite">{s.quizScore(score, items.length)}</span>
            <Button variant="ghost" onClick={() => { setChecked(false); setPicked(items.map(() => null)); }}>{s.quizRetry}</Button>
          </>
        )}
      </div>
    </section>
  );
}
