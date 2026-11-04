// OWNER: library agent. Review one resource: details, transcript, log, RU | EN lessons side by side, publish.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import { strings as libStrings } from "../library/strings";
import type { LessonMaterial, MaterialRecord, PipelineEvent, Resource } from "../library/types";
import { ArrowIcon, Button, Card, Chip, Pill, Skeleton, Spinner, Thumb, cx, hostOf } from "../library/ui";
import { MaterialEditor } from "./MaterialEditor";
import { statusTone } from "./Board";

interface Detail {
  resource: Resource;
  materials: Partial<Record<"ru" | "en", MaterialRecord>>;
  transcript: { source: string; lang: string | null; chars: number; text: string; truncated: boolean; createdAt: number } | null;
  events: PipelineEvent[];
  ai: boolean;
}
const TOPICS = ["claude-code", "prompting", "llm-basics", "agents", "apis", "web-basics", "git", "deploy", "python", "motion-graphics", "remotion", "ffmpeg", "ai-video", "workflow", "career"];
const field = "w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-sm outline-none focus:border-accent";

export default function Review() {
  const { id = "" } = useParams();
  const s = useStrings(strings), r = s.review;
  const lang = useLang();
  const nav = useNavigate();
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"ru" | "en">(lang);

  const load = useCallback(() => api<Detail>(`/admin/resources/${id}`).then(setD).catch((e: Error) => setErr(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  const working = !!d && (d.resource.status === "processing" || Object.values(d.materials).some((m) => m && (m.state === "queued" || m.state === "generating")));
  useEffect(() => { if (!working) return; const t = setInterval(load, 2500); return () => clearInterval(t); }, [working, load]);

  const act = async (name: string, path: string, init?: Parameters<typeof api>[1]) => {
    setBusy(name); setNotice(null);
    try { const res = await api<{ missingLessons?: string[] }>(path, { method: "POST", ...init }); if (res.missingLessons?.length) setNotice(r.publishedNoLesson(res.missingLessons.map((x) => x.toUpperCase()).join(", "))); await load(); }
    catch (e) { setNotice((e as Error).message); } finally { setBusy(null); }
  };

  if (err) return <Card className="p-6 text-danger">{err}</Card>;
  if (!d) return <div className="space-y-3"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>;
  const res = d.resource;

  return (
    <div className="space-y-6">
      <Link to={`/${lang}/admin`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowIcon dir="left" className="size-4" />{r.back}</Link>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Thumb src={res.thumbnailUrl} type={res.sourceType} label={res.title} className="w-full max-w-xs shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={statusTone(res.status)}>{working && <Spinner className="size-2.5" />}{s.status[res.status]}</Pill>
            <Pill>{libStrings[lang].type[res.sourceType]}</Pill>
            {res.url && <a href={res.url} target="_blank" rel="noreferrer" className="truncate text-sm text-muted hover:text-fg">{hostOf(res.url)} ↗</a>}
          </div>
          <h1 className="text-xl font-semibold leading-snug sm:text-2xl">{res.title || res.url}</h1>
          {res.lastError && <p className="text-sm text-danger">{res.lastError}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {res.status === "published"
              ? <><Button size="sm" onClick={() => act("unpub", `/admin/resources/${id}/unpublish`)} disabled={!!busy}>{r.unpublish}</Button>
                  <Link to={`/${lang}/library/${id}`}><Button size="sm" variant="ghost">{libStrings[lang].title} ↗</Button></Link></>
              : <Button size="sm" variant="primary" onClick={() => act("pub", `/admin/resources/${id}/publish`)} disabled={!!busy || working}>{busy === "pub" && <Spinner />}{r.publish}</Button>}
            {res.sourceType !== "upload" && <Button size="sm" onClick={() => act("ingest", `/pipeline/resources/${id}/ingest`)} disabled={!!busy || working}>{busy === "ingest" && <Spinner />}{r.reingest}</Button>}
            <Button size="sm" onClick={() => act("build", `/pipeline/resources/${id}/build`, { json: {} })} disabled={!!busy || working}>{busy === "build" && <Spinner />}{r.rebuildBoth}</Button>
            <Button size="sm" variant="danger" disabled={!!busy} onClick={async () => {
              if (!confirm(r.confirmDelete)) return;
              await api(`/admin/resources/${id}`, { method: "DELETE" }); nav(`/${lang}/admin`);
            }}>{r.del}</Button>
          </div>
          {notice && <p role="status" className="text-sm text-gold">{notice}</p>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailsForm res={res} onSaved={load} />
        <div className="space-y-6">
          <TranscriptPanel id={id} d={d} onSaved={load} />
          <Card className="p-4">
            <h2 className="mb-2 font-semibold">{r.log}</h2>
            <ol className="max-h-72 space-y-1.5 overflow-y-auto text-sm">
              {d.events.map((e) => (
                <li key={e.id} className="flex gap-2">
                  <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", e.status === "ok" ? "bg-accent" : e.status === "error" ? "bg-danger" : e.status === "warn" ? "bg-gold" : "bg-line")} />
                  <span className="min-w-0"><span className="font-mono text-xs text-muted">{e.step}</span> <span className="break-words">{e.message}</span> <span className="text-xs text-muted">· {s.time(e.createdAt)}</span></span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{r.lessons}</h2>
          <div className="flex gap-1.5 xl:hidden">{(["ru", "en"] as const).map((l) => <Chip key={l} active={tab === l} onClick={() => setTab(l)}>{l.toUpperCase()}</Chip>)}</div>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {(["ru", "en"] as const).map((l) => (
            <div key={l} className={cx(tab !== l && "hidden xl:block")}>
              <LessonColumn id={id} lang={l} res={res} rec={d.materials[l]} ai={d.ai} onChange={load} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LessonColumn({ id, lang, res, rec, ai, onChange }: { id: string; lang: "ru" | "en"; res: Resource; rec?: MaterialRecord; ai: boolean; onChange: () => void }) {
  const r = useStrings(strings).review, s = useStrings(strings);
  const [manual, setManual] = useState<MaterialRecord | null>(null);
  const inAudience = res.audience.includes(lang);
  const shown = rec?.data ? rec : manual;
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{r.lessonFor[lang]}</h3>
        {rec && <Pill tone={rec.state === "ready" ? "accent" : rec.state === "failed" ? "danger" : "neutral"}>{(rec.state === "queued" || rec.state === "generating") && <Spinner className="size-2.5" />}{s.lessonState[rec.state]}</Pill>}
        {rec?.origin && <span className="text-xs text-muted">{r.origin[rec.origin]}{rec.edited ? ` · ${r.edited}` : ""}{rec.model ? ` · ${rec.model}` : ""}</span>}
        {ai && inAudience && <Button size="sm" variant="ghost" className="ml-auto" onClick={async () => { await api(`/pipeline/resources/${id}/build`, { method: "POST", json: { langs: [lang] } }); onChange(); }}>{r.rebuild}</Button>}
      </div>
      {!inAudience && <p className="mb-3 text-sm text-muted">{r.notInAudience}</p>}
      {rec?.state === "failed" && rec.error && <p className="mb-3 break-words rounded-lg bg-surface-2 p-2 text-xs text-danger">{rec.error}</p>}
      {rec && (rec.state === "queued" || rec.state === "generating") ? (
        <div className="space-y-2"><Skeleton className="h-8" /><Skeleton className="h-24" /><Skeleton className="h-16" /></div>
      ) : shown?.data ? (
        <MaterialEditor resourceId={id} lang={lang} rec={shown} onSaved={() => { setManual(null); onChange(); }} />
      ) : (
        <div className="py-6 text-center">
          <p className="text-sm text-muted">{r.noMaterial}</p>
          <Button size="sm" className="mt-3" onClick={() => setManual({ lang, state: "not_configured", data: blank(res, lang), origin: "manual", model: null, edited: false, error: null, updatedAt: Date.now() })}>{r.startManual}</Button>
        </div>
      )}
    </Card>
  );
}

function blank(res: Resource, lang: "ru" | "en"): LessonMaterial {
  return {
    title: res.title, hook: "", summary: res.description ?? "", takeaways: [], steps: [{ title: "", detail: "" }],
    exercise: { title: "", goal: "", instructions: [], proof: "text", estMinutes: 30 },
    quiz: [{ q: "", options: ["", ""], answer: 0, explain: "" }, { q: "", options: ["", ""], answer: 0, explain: "" }],
    suggestedDays: res.suggestedDays, tracks: res.tracks.length ? res.tracks : ["common"], topics: res.topics, tags: [],
    level: res.level, estMinutes: Math.max(10, Math.round((res.durationSec ?? 600) / 60) + 30),
  } satisfies LessonMaterial & { _l?: typeof lang };
}

function DetailsForm({ res, onSaved }: { res: Resource; onSaved: () => void }) {
  const r = useStrings(strings).review, ls = useStrings(libStrings);
  const [f, setF] = useState(() => toForm(res));
  const [state, setState] = useState<"idle" | "busy" | "saved" | string>("idle");
  const last = useRef(res.updatedAt);
  useEffect(() => { if (res.updatedAt !== last.current && state !== "busy") { last.current = res.updatedAt; setF(toForm(res)); } }, [res, state]);
  const set = (k: keyof ReturnType<typeof toForm>, v: unknown) => { setF((x) => ({ ...x, [k]: v })); setState("idle"); };
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-semibold">{r.details}</h2>
      <Lbl t={r.fields.title}><input className={field} value={f.title} onChange={(e) => set("title", e.target.value)} /></Lbl>
      <div className="grid gap-3 sm:grid-cols-2">
        <Lbl t={r.fields.author}><input className={field} value={f.author} onChange={(e) => set("author", e.target.value)} /></Lbl>
        <Lbl t={r.fields.duration}><input type="number" min={0} className={field} value={f.duration} onChange={(e) => set("duration", e.target.value)} /></Lbl>
      </div>
      <Lbl t={r.fields.thumbnail}><input className={field} value={f.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} /></Lbl>
      <div><div className="mb-1 text-xs text-muted">{r.fields.tracks}</div><div className="flex flex-wrap gap-1.5">{(["common", "apps", "video"] as const).map((t) => <Chip key={t} active={f.tracks.includes(t)} onClick={() => set("tracks", toggle(f.tracks, t))}>{ls.track[t]}</Chip>)}</div></div>
      <div><div className="mb-1 text-xs text-muted">{r.fields.topics}</div><div className="flex flex-wrap gap-1.5">{TOPICS.map((t) => <Chip key={t} active={f.topics.includes(t)} onClick={() => set("topics", toggle(f.topics, t))}>{ls.topics[t]}</Chip>)}</div></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Lbl t={r.fields.level}><select className={field} value={f.level} onChange={(e) => set("level", e.target.value)}>{(["beginner", "intermediate", "advanced"] as const).map((l) => <option key={l} value={l}>{ls.level[l]}</option>)}</select></Lbl>
        <Lbl t={r.fields.origLang}><select className={field} value={f.origLang} onChange={(e) => set("origLang", e.target.value)}><option value="en">EN</option><option value="ru">RU</option><option value="other">—</option></select></Lbl>
        <div><div className="mb-1 text-xs text-muted">{r.fields.audience}</div><div className="flex gap-1.5">{["ru", "en"].map((l) => <Chip key={l} active={f.audience.includes(l)} onClick={() => { const n = toggle(f.audience, l); if (n.length) set("audience", n); }}>{l.toUpperCase()}</Chip>)}</div></div>
      </div>
      <Lbl t={r.fields.days}><input className={field} value={f.days} onChange={(e) => set("days", e.target.value)} placeholder="3, 15:apps" /></Lbl>
      <Lbl t={r.fields.notes}><textarea rows={2} className={field} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Lbl>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[var(--accent)]" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />{r.fields.featured}</label>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" disabled={state === "busy"} onClick={async () => {
          setState("busy");
          try { await api(`/admin/resources/${res.id}`, { method: "PATCH", json: fromForm(f) }); setState("saved"); onSaved(); }
          catch (e) { setState((e as Error).message); }
        }}>{state === "busy" && <Spinner />}{r.save}</Button>
        {state === "saved" && <Pill tone="accent">{r.saved}</Pill>}
        {state.startsWith("4") && <span className="text-xs text-danger">{state.slice(0, 200)}</span>}
      </div>
    </Card>
  );
}

function toForm(res: Resource) {
  return {
    title: res.title, author: res.author ?? "", thumbnailUrl: res.thumbnailUrl ?? "", duration: res.durationSec ? String(Math.round(res.durationSec / 60)) : "",
    tracks: res.tracks as string[], topics: res.topics, level: res.level as string, origLang: res.origLang, audience: res.audience as string[],
    days: res.suggestedDays.map((x) => (x.track === "common" ? `${x.day}` : `${x.day}:${x.track}`)).join(", "), notes: res.adminNotes ?? "", featured: res.featured,
  };
}
function fromForm(f: ReturnType<typeof toForm>) {
  return {
    title: f.title, author: f.author || null, thumbnailUrl: f.thumbnailUrl || null, durationSec: f.duration ? Math.round(+f.duration * 60) : null,
    tracks: f.tracks, topics: f.topics, level: f.level, origLang: f.origLang, audience: f.audience, featured: f.featured, adminNotes: f.notes || null,
    suggestedDays: f.days.split(/[,;\s]+/).filter(Boolean).map((t) => { const [d, tr] = t.split(":"); return { day: +d, track: tr === "apps" || tr === "video" ? tr : "common", reason: "" }; }).filter((x) => x.day >= 1 && x.day <= 66),
  };
}

function TranscriptPanel({ id, d, onSaved }: { id: string; d: Detail; onSaved: () => void }) {
  const r = useStrings(strings).review;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const t = d.transcript;
  const needed = d.resource.transcriptState === "needed";
  return (
    <Card className={cx("space-y-3 p-4", needed && "border-gold/50")}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">{r.transcript}</h2>
        {t && <span className="text-xs text-muted">{t.source} · {t.lang ?? "?"} · {r.chars(t.chars)}</span>}
      </div>
      {needed && <p className="text-sm text-gold">{r.transcriptNeeded}</p>}
      {t ? <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-xs leading-relaxed text-muted">{t.text.slice(0, 3000)}{t.chars > 3000 ? "…" : ""}</pre>
        : !needed && <p className="text-sm text-muted">{r.transcriptNone}</p>}
      {open ? (
        <div className="space-y-2">
          <textarea rows={6} className={field} value={text} onChange={(e) => setText(e.target.value)} aria-label={r.transcriptPaste} />
          <Button size="sm" variant="primary" disabled={text.trim().length < 40 || busy} onClick={async () => {
            setBusy(true); setErr(null);
            try { await api(`/pipeline/resources/${id}/transcript`, { method: "POST", json: { text } }); setOpen(false); setText(""); onSaved(); }
            catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
          }}>{busy && <Spinner />}{r.transcriptSave}</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>{r.transcriptPaste}</Button>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
            {r.transcriptUpload}
            <input type="file" accept=".srt,.vtt,.txt,text/plain" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const fd = new FormData(); fd.set("file", f);
              setBusy(true); setErr(null);
              try { await api(`/pipeline/resources/${id}/transcript`, { method: "POST", body: fd }); onSaved(); }
              catch (x) { setErr((x as Error).message); } finally { setBusy(false); e.target.value = ""; }
            }} />
          </label>
          {busy && <Spinner />}
        </div>
      )}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
    </Card>
  );
}

function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs text-muted">{t}</span>{children}</label>;
}
