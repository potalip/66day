// OWNER: library agent. Intake: paste a mixed batch → preview → batch settings → live tracker. Plus file/transcript upload.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { X, Upload, ChevronDown } from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { Badge, Button, Card, CardHeader, Field, Input, Textarea, cn, useToast } from "@web/ui";
import { strings } from "./strings";
import { strings as libStrings } from "../library/strings";
import { Chip, Thumb, TypeIcon, hostOf } from "../library/ui";
import { Attention, DayPicker, Stepper, type DayRef, type Step } from "./parts";

const TRACKS = ["common", "apps", "video"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const BATCH_KEY = "fl-lib-batch";

interface Found { url: string; canonicalUrl: string; sourceType: "youtube" | "instagram" | "link"; kind?: string; existing: { id: string; status: string; title: string } | null }
interface BatchItem { id: string; title: string; url: string | null; sourceType: "youtube" | "instagram" | "link" | "upload"; thumbnailUrl: string | null; status: string; steps: Step[]; attention: string | null; lastEvent: { message: string; status: string } | null }

const readBatch = (): string[] => { try { return JSON.parse(localStorage.getItem(BATCH_KEY) ?? "[]"); } catch { return []; } };
const writeBatch = (ids: string[]) => { try { localStorage.setItem(BATCH_KEY, JSON.stringify(ids.slice(0, 60))); } catch { /* private mode */ } };

export default function AddResources() {
  const [batch, setBatch] = useState<string[]>(readBatch);
  const addToBatch = (ids: string[]) => setBatch((b) => { const n = [...ids, ...b.filter((x) => !ids.includes(x))]; writeBatch(n); return n; });
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <PasteFlow onCreated={addToBatch} />
        <UploadForm onCreated={(id) => addToBatch([id])} />
      </div>
      <BatchTracker ids={batch} onClear={() => { writeBatch([]); setBatch([]); }} />
    </div>
  );
}

// ---------------- Paste → preview → settings → submit ----------------

function PasteFlow({ onCreated }: { onCreated: (ids: string[]) => void }) {
  const s = useStrings(strings), ls = useStrings(libStrings);
  const lang = useLang();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [level, setLevel] = useState("beginner");
  const [audience, setAudience] = useState<string[]>(["ru", "en"]);
  const [days, setDays] = useState<DayRef[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Debounced server-side parse, so the preview is exactly what intake will create.
  useEffect(() => {
    if (!text.trim()) { setFound([]); return; }
    setChecking(true);
    const t = setTimeout(() => {
      api<{ links: Found[] }>("/pipeline/check", { method: "POST", json: { text } })
        .then((r) => setFound(r.links)).catch(() => {}).finally(() => setChecking(false));
    }, 350);
    return () => clearTimeout(t);
  }, [text]);

  const toAdd = found.filter((f) => !f.existing && !removed.has(f.canonicalUrl));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ created: { id: string }[]; duplicates: { id: string }[] }>("/pipeline/resources", {
        method: "POST", json: { urls: toAdd.map((f) => f.url), tracks, level, audience, notes, days },
      });
      onCreated(r.created.map((x) => x.id));
      toast({ title: s.add.created(r.created.length), description: r.duplicates.length ? s.add.duplicates(r.duplicates.length) : undefined, tone: "success" });
      setText(""); setFound([]); setRemoved(new Set()); setNotes("");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader title={s.add.linksTitle} description={s.add.linksHint} />
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={s.add.placeholder} aria-label={s.add.linksTitle} className="font-mono text-sm" />

      <div className="mt-4" aria-live="polite">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          {s.preview.title}
          <Badge size="sm">{found.length}</Badge>
          {checking && <span className="text-xs font-normal text-muted">…</span>}
        </div>
        {found.length === 0 ? <p className="text-sm text-muted">{s.preview.none}</p> : (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-sm)] border border-line">
            {found.map((f) => {
              const off = removed.has(f.canonicalUrl);
              return (
                <li key={f.canonicalUrl} className={cn("flex items-center gap-3 px-3 py-2", (off || f.existing) && "bg-surface-2")}>
                  <TypeIcon type={f.sourceType} className={cn("size-4 shrink-0", off ? "text-muted" : "text-accent-ink")} />
                  <div className={cn("min-w-0 flex-1", off && "line-through opacity-60")}>
                    <div className="truncate text-sm">{hostOf(f.url)}<span className="text-muted">{pathOf(f.url)}</span></div>
                  </div>
                  <Badge size="sm" tone="outline">{f.sourceType === "instagram" ? `Instagram ${f.kind ?? ""}`.trim() : ls.type[f.sourceType]}</Badge>
                  {f.existing ? (
                    <Link to={`/${lang}/admin/r/${f.existing.id}`} className="shrink-0 text-xs font-medium text-gold-ink hover:underline">{s.preview.exists} →</Link>
                  ) : (
                    <button type="button" onClick={() => setRemoved((r) => { const n = new Set(r); if (n.has(f.canonicalUrl)) n.delete(f.canonicalUrl); else n.add(f.canonicalUrl); return n; })}
                      aria-label={`${s.preview.remove}: ${f.url}`} aria-pressed={off}
                      className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"><X className="size-4" /></button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {toAdd.length > 0 && (
        <div className="mt-6 space-y-4 border-t border-line pt-5">
          <div>
            <h3 className="text-sm font-semibold">{s.preview.settings}</h3>
            <p className="text-xs text-muted">{s.preview.settingsHint}</p>
          </div>
          <Group label={s.add.tracks}>{TRACKS.map((t) => <Chip key={t} active={tracks.includes(t)} onClick={() => setTracks(toggle(tracks, t))}>{ls.track[t]}</Chip>)}</Group>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Group label={s.add.level}>{LEVELS.map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{ls.level[l]}</Chip>)}</Group>
            <Group label={s.add.audience}>{["ru", "en"].map((l) => <Chip key={l} active={audience.includes(l)} onClick={() => { const n = toggle(audience, l); if (n.length) setAudience(n); }}>{l.toUpperCase()}</Chip>)}</Group>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium">{s.preview.days}</div>
            <DayPicker value={days} onChange={setDays} />
            <p className="mt-1 text-xs text-muted">{s.preview.daysHint}</p>
          </div>
          <Field label={s.add.notes}><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={s.add.notesPlaceholder} /></Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <Button variant="primary" size="lg" block loading={busy} onClick={submit}>{s.preview.add(toAdd.length)}</Button>
        </div>
      )}
    </Card>
  );
}

function pathOf(u: string) {
  try { const x = new URL(u); const p = `${x.pathname}${x.search}`; return p === "/" ? "" : p.length > 48 ? `${p.slice(0, 46)}…` : p; } catch { return ""; }
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}


// ---------------- Live batch tracker ----------------

function BatchTracker({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const s = useStrings(strings);
  const lang = useLang();
  const [items, setItems] = useState<BatchItem[] | null>(null);
  const [tick, setTick] = useState(0);
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) { setItems([]); return; }
    let alive = true;
    api<{ items: BatchItem[] }>(`/pipeline/batch?ids=${encodeURIComponent(key)}`).then((r) => alive && setItems(r.items)).catch(() => {});
    return () => { alive = false; };
  }, [key, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const working = !!items?.some((i) => i.steps.some((x) => x.state === "active"));
  const poll = ids.length > 0 && working;
  useEffect(() => {
    if (!poll) return;
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, [poll]);

  return (
    <Card className="self-start lg:sticky lg:top-20">
      <CardHeader title={s.batch.title}
        action={ids.length > 0 ? <Button size="sm" variant="ghost" onClick={onClear}>{s.batch.clear}</Button> : undefined} />
      {!ids.length ? <p className="text-sm text-muted">{s.batch.empty}</p> : !items ? <p className="text-sm text-muted">…</p> : (
        <>
          {!working && items.every((i) => !i.attention || i.attention === "review") && <p className="mb-3 text-sm text-accent-ink">{s.batch.allDone}</p>}
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.id} className="rounded-[var(--radius-sm)] border border-line p-3">
                <div className="flex gap-3">
                  <Thumb src={i.thumbnailUrl} type={i.sourceType} label={i.title} className="w-20 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{i.title || i.url}</div>
                    <div className="truncate text-xs text-muted">{hostOf(i.url) || "upload"}</div>
                  </div>
                  <Link to={`/${lang}/admin/r/${i.id}`} className="shrink-0 self-start text-sm font-medium text-accent-ink hover:underline">{s.batch.review}</Link>
                </div>
                <div className="mt-2.5"><Stepper steps={i.steps} /></div>
                <Attention reason={i.attention} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

// ---------------- Upload ----------------

function UploadForm({ onCreated }: { onCreated: (id: string) => void }) {
  const s = useStrings(strings), ls = useStrings(libStrings);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tFile, setTFile] = useState<File | null>(null);
  const [tText, setTText] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [level, setLevel] = useState("beginner");
  const [audience, setAudience] = useState<string[]>(["ru", "en"]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const fileCls = "block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-[var(--radius-sm)] file:border file:border-line-strong file:bg-surface file:px-3 file:text-sm file:font-medium file:text-fg hover:file:bg-surface-2";
  return (
    <Card>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink"><Upload className="size-[18px]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{s.add.uploadTitle}</span>
          <span className="mt-0.5 block text-sm text-muted">{s.add.uploadHint}</span>
        </span>
        <ChevronDown aria-hidden className={cn("mt-2 size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={s.add.fTitle}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label={s.add.fAuthor}><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></Field>
            <Field label={s.add.fFile}><input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={fileCls} /></Field>
            <Field label={s.add.fTranscript}><input type="file" accept=".srt,.vtt,.txt,text/plain" onChange={(e) => setTFile(e.target.files?.[0] ?? null)} className={fileCls} /></Field>
          </div>
          <Field label={s.add.fTranscriptText}><Textarea rows={3} value={tText} onChange={(e) => setTText(e.target.value)} /></Field>
          <Group label={s.add.tracks}>{TRACKS.map((t) => <Chip key={t} active={tracks.includes(t)} onClick={() => setTracks(toggle(tracks, t))}>{ls.track[t]}</Chip>)}</Group>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Group label={s.add.level}>{LEVELS.map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{ls.level[l]}</Chip>)}</Group>
            <Group label={s.add.audience}>{["ru", "en"].map((l) => <Chip key={l} active={audience.includes(l)} onClick={() => { const n = toggle(audience, l); if (n.length) setAudience(n); }}>{l.toUpperCase()}</Chip>)}</Group>
          </div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          {done && <p role="status" className="text-sm text-accent-ink">{s.add.uploaded}</p>}
          <Button variant="primary" loading={busy} disabled={!title.trim() || (!file && !tFile && !tText.trim())} onClick={async () => {
            setBusy(true); setErr(null); setDone(false);
            const fd = new FormData();
            fd.set("title", title); fd.set("author", author); fd.set("tracks", tracks.join(",")); fd.set("level", level); fd.set("audience", audience.join(","));
            if (file) fd.set("file", file);
            if (tFile) fd.set("transcript", tFile);
            if (tText.trim()) fd.set("transcriptText", tText);
            try {
              const r = await api<{ id: string }>("/pipeline/upload", { method: "POST", body: fd });
              onCreated(r.id); setDone(true); setTitle(""); setAuthor(""); setFile(null); setTFile(null); setTText("");
            } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
          }}>{busy ? s.add.uploading : s.add.uploadSubmit}</Button>
        </div>
      )}
    </Card>
  );
}
