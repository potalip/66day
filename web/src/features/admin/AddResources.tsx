// OWNER: library agent. Intake: bulk links + file/transcript upload.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import { strings as libStrings } from "../library/strings";
import { Button, Card, Chip, Spinner } from "../library/ui";

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'`,]+|(?:youtu\.be|youtube\.com|instagram\.com)\/[^\s<>"'`,]+/gi;
const TRACKS = ["common", "apps", "video"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const input = "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent";

export default function AddResources() {
  const s = useStrings(strings);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LinksForm />
      <UploadForm />
      <p className="text-xs text-muted lg:col-span-2">{s.add.linksHint}</p>
    </div>
  );
}

function Options({ tracks, setTracks, level, setLevel, audience, setAudience }: {
  tracks: string[]; setTracks: (t: string[]) => void; level: string; setLevel: (l: string) => void; audience: string[]; setAudience: (a: string[]) => void;
}) {
  const s = useStrings(strings), ls = useStrings(libStrings);
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="space-y-3">
      <fieldset><legend className="mb-1.5 text-sm font-medium">{s.add.tracks}</legend>
        <div className="flex flex-wrap gap-2">{TRACKS.map((t) => <Chip key={t} active={tracks.includes(t)} onClick={() => setTracks(toggle(tracks, t))}>{ls.track[t]}</Chip>)}</div>
      </fieldset>
      <div className="flex flex-wrap gap-6">
        <fieldset><legend className="mb-1.5 text-sm font-medium">{s.add.level}</legend>
          <div className="flex flex-wrap gap-2">{LEVELS.map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{ls.level[l]}</Chip>)}</div>
        </fieldset>
        <fieldset><legend className="mb-1.5 text-sm font-medium">{s.add.audience}</legend>
          <div className="flex gap-2">{["ru", "en"].map((l) => <Chip key={l} active={audience.includes(l)} onClick={() => { const n = toggle(audience, l); if (n.length) setAudience(n); }}>{l.toUpperCase()}</Chip>)}</div>
        </fieldset>
      </div>
    </div>
  );
}

function LinksForm() {
  const s = useStrings(strings);
  const lang = useLang();
  const [text, setText] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [level, setLevel] = useState("beginner");
  const [audience, setAudience] = useState<string[]>(["ru", "en"]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ created: { id: string; url: string }[]; duplicates: { id: string; url: string }[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const found = useMemo(() => new Set(text.match(URL_RE) ?? []).size, [text]);
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold">{s.add.linksTitle}</h2>
      <label className="block">
        <span className="sr-only">{s.add.linksTitle}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={s.add.placeholder} className={`${input} font-mono`} />
        <span className="mt-1 block text-xs text-muted" aria-live="polite">{s.add.found(found)}</span>
      </label>
      <Options {...{ tracks, setTracks, level, setLevel, audience, setAudience }} />
      <label className="block">
        <span className="text-sm font-medium">{s.add.notes}</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={s.add.notesPlaceholder} className={`${input} mt-1`} />
      </label>
      <Button variant="primary" disabled={!found || busy} onClick={async () => {
        setBusy(true); setErr(null); setRes(null);
        try {
          setRes(await api("/pipeline/resources", { method: "POST", json: { text, tracks, level, audience, notes } }));
          setText("");
        } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }}>{busy && <Spinner />}{s.add.submit}</Button>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      {res && (
        <div className="space-y-1 text-sm" role="status">
          {res.created.length > 0 && <p className="text-accent">{s.add.created(res.created.length)}</p>}
          {res.duplicates.length > 0 && <p className="text-muted">{s.add.duplicates(res.duplicates.length)}</p>}
          <ul className="space-y-0.5">
            {[...res.created, ...res.duplicates].map((r) => (
              <li key={r.id}><Link className="text-muted underline-offset-2 hover:text-fg hover:underline" to={`/${lang}/admin/r/${r.id}`}>{r.url}</Link></li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function UploadForm() {
  const s = useStrings(strings);
  const lang = useLang();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tFile, setTFile] = useState<File | null>(null);
  const [tText, setTText] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [level, setLevel] = useState("beginner");
  const [audience, setAudience] = useState<string[]>(["ru", "en"]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">{s.add.uploadTitle}</h2>
        <p className="mt-1 text-sm text-muted">{s.add.uploadHint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-medium">{s.add.fTitle}</span><input value={title} onChange={(e) => setTitle(e.target.value)} className={`${input} mt-1`} required /></label>
        <label className="block"><span className="text-sm font-medium">{s.add.fAuthor}</span><input value={author} onChange={(e) => setAuthor(e.target.value)} className={`${input} mt-1`} /></label>
        <label className="block"><span className="text-sm font-medium">{s.add.fFile}</span><input type="file" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-fg" /></label>
        <label className="block"><span className="text-sm font-medium">{s.add.fTranscript}</span><input type="file" accept=".srt,.vtt,.txt,text/plain" onChange={(e) => setTFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-fg" /></label>
      </div>
      <label className="block"><span className="text-sm font-medium">{s.add.fTranscriptText}</span><textarea rows={3} value={tText} onChange={(e) => setTText(e.target.value)} className={`${input} mt-1`} /></label>
      <Options {...{ tracks, setTracks, level, setLevel, audience, setAudience }} />
      <Button variant="primary" disabled={!title.trim() || (!file && !tFile && !tText.trim()) || busy} onClick={async () => {
        setBusy(true); setErr(null); setDone(null);
        const fd = new FormData();
        fd.set("title", title); fd.set("author", author); fd.set("tracks", tracks.join(",")); fd.set("level", level); fd.set("audience", audience.join(","));
        if (file) fd.set("file", file);
        if (tFile) fd.set("transcript", tFile);
        if (tText.trim()) fd.set("transcriptText", tText);
        try { const r = await api<{ id: string }>("/pipeline/upload", { method: "POST", body: fd }); setDone(r.id); setTitle(""); setAuthor(""); setFile(null); setTFile(null); setTText(""); }
        catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
      }}>{busy ? <><Spinner />{s.add.uploading}</> : s.add.uploadSubmit}</Button>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      {done && <p role="status" className="text-sm text-accent">{s.add.uploaded} <Link className="underline" to={`/${lang}/admin/r/${done}`}>{s.open}</Link></p>}
    </Card>
  );
}
