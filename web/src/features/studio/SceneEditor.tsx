import { createContext, useContext, useId, useRef, useState } from "react";
import { useLang, useStrings } from "@web/i18n";
import type { FieldDef, FieldValue, SbError, Scene, TemplateDef } from "./api";
import { strings } from "./strings";
import { Button, Card, Icon, Label, SelectInput, TextArea, TextInput, cx } from "./ui";

/** Project id, so image fields can upload into the right project. */
export const ProjectIdCtx = createContext("");

function ImageField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const s = useStrings(strings);
  const projectId = useContext(ProjectIdCtx);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (file: File) => {
    setErr(null);
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setErr(s.imageType); return; }
    if (file.size > 8 * 1024 * 1024) { setErr(s.imageTooBig); return; }
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`/api/studio/projects/${projectId}/assets`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      onChange(((await res.json()) as { url: string }).url);
    } catch { setErr(s.imageFailed); }
    setBusy(false);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line bg-surface-2">
        {value ? <img src={value} alt="" className="size-full object-cover object-top" /> : <Icon name="film" className="size-6 text-muted" />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} id={id} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <Button size="sm" loading={busy} onClick={() => input.current?.click()}>{value ? s.imageReplace : s.imageUpload}</Button>
        {value && <Button size="sm" variant="ghost" onClick={() => onChange("")}>{s.imageRemove}</Button>}
        {err && <p className="w-full text-xs text-danger" role="alert">{err}</p>}
      </div>
    </div>
  );
}

/** Words per second a narrator can comfortably speak (rough, for a "too long" hint). */
const WPS = { en: 2.6, ru: 2.1 };

export function FieldInput({ f, value, onChange, error }: { f: FieldDef; value: FieldValue | undefined; onChange: (v: FieldValue) => void; error?: SbError }) {
  const lang = useLang();
  const s = useStrings(strings);
  const id = useId();
  const label = f.label[lang];
  const invalid = !!error && !error.soft;
  const hint = f.help?.[lang] ?? (f.type === "list" ? s.listHint : undefined);
  const len = typeof value === "string" ? value.length : 0;
  const counter = (f.type === "text" || f.type === "textarea") && f.maxLen ? s.chars(len, f.maxLen) : undefined;
  const lbl = <Label htmlFor={id} hint={hint} right={counter}>{label}{f.required && <span className="text-danger" aria-label={s.required}> *</span>}</Label>;
  let input;
  switch (f.type) {
    case "textarea":
      input = <TextArea id={id} value={String(value ?? "")} onChange={onChange} maxLength={f.maxLen} rows={2} invalid={invalid} />; break;
    case "code":
      input = <TextArea id={id} value={String(value ?? "")} onChange={onChange} maxLength={f.maxLen} rows={Math.min(14, Math.max(4, String(value ?? "").split("\n").length + 1))} mono invalid={invalid} />; break;
    case "list":
      input = <TextArea id={id} value={Array.isArray(value) ? value.join("\n") : String(value ?? "")} onChange={(v) => onChange(v.split("\n"))} rows={Math.max(3, (Array.isArray(value) ? value.length : 1) + 1)} invalid={invalid} />; break;
    case "number":
      input = <TextInput id={id} value={String(value ?? "")} onChange={(v) => onChange(v === "" || v === "-" ? v : Number.isNaN(Number(v.replace(",", "."))) ? String(value ?? "") : v)} invalid={invalid} className="max-w-48 tabular-nums" />; break;
    case "select":
      input = <SelectInput id={id} value={String(value ?? f.default ?? "")} onChange={onChange} options={(f.options ?? []).map((o) => ({ value: o.value, label: o.label[lang] }))} />; break;
    case "image":
      input = <ImageField id={id} value={String(value ?? "")} onChange={onChange} />; break;
    case "lines":
      input = <TextInput id={id} value={String(value ?? "")} onChange={onChange} placeholder="2, 4-5" className="max-w-48" />; break;
    default:
      input = <TextInput id={id} value={String(value ?? "")} onChange={onChange} maxLength={f.maxLen} invalid={invalid} />;
  }
  return (
    <div className={cx(f.type === "code" || f.type === "textarea" || f.type === "list" || f.type === "image" ? "sm:col-span-2" : "")}>
      {lbl}{input}
      {invalid && <p className="mt-1 text-xs text-danger" role="alert">{error!.code === "required" ? s.required : error!.message}</p>}
    </div>
  );
}

export function SceneCard({ T, scene, index, count, errors, onChange, onMove, onDuplicate, onRemove, onFocus, voice }: {
  T: TemplateDef; scene: Scene; voice: boolean; index: number; count: number; errors: SbError[];
  onChange: (fn: (s: Scene) => Scene) => void; onMove: (d: -1 | 1) => void; onDuplicate: () => void; onRemove: () => void; onFocus: () => void;
}) {
  const lang = useLang();
  const s = useStrings(strings);
  const K = T.sceneKinds.find((k) => k.kind === scene.kind) ?? T.sceneKinds[0];
  const durId = useId(), voId = useId(), kindId = useId();
  const err = (key: string) => errors.find((e) => e.path === `scenes[${index}].fields.${key}`);
  const words = scene.voiceover.trim() ? scene.voiceover.trim().split(/\s+/).length : 0;
  const need = Math.round((words / WPS[lang === "ru" ? "ru" : "en"] + .6) * 10) / 10;
  // functional updates: an upload that finishes later must not resurrect a stale copy of the scene
  const setField = (k: string, v: FieldValue) => onChange((sc) => ({ ...sc, fields: { ...sc.fields, [k]: v } }));
  const changeKind = (kind: string) => {
    const NK = T.sceneKinds.find((k) => k.kind === kind)!;
    onChange((sc) => {
      const fields: Record<string, FieldValue> = {};
      for (const f of NK.fields) fields[f.key] = sc.fields[f.key] ?? (f.default as FieldValue) ?? (f.type === "list" ? [] : "");
      return { ...sc, kind, fields, duration: Math.min(NK.duration.max, Math.max(NK.duration.min, sc.duration)) };
    });
  };
  return (
    <Card as="article" className="p-4 sm:p-5">
      <div onFocusCapture={onFocus} onClickCapture={onFocus}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{index + 1}</span>
          <label htmlFor={kindId} className="sr-only">{s.sceneKind}</label>
          <SelectInput id={kindId} value={scene.kind} onChange={changeKind} inline className="h-9 min-w-36 py-1 text-sm font-medium"
            options={T.sceneKinds.map((k) => ({ value: k.kind, label: k.label[lang] }))} />
          <div className="ml-auto flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="px-2" disabled={index === 0} onClick={() => onMove(-1)} aria-label={s.moveUp} title={s.moveUp}><Icon name="up" /></Button>
            <Button variant="ghost" size="sm" className="px-2" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={s.moveDown} title={s.moveDown}><Icon name="down" /></Button>
            <Button variant="ghost" size="sm" className="px-2" disabled={count >= T.maxScenes} onClick={onDuplicate} aria-label={s.duplicate} title={s.duplicate}><Icon name="copy" /></Button>
            <Button variant="ghost" size="sm" className="px-2 hover:text-danger" disabled={count <= 1} onClick={onRemove} aria-label={s.remove} title={s.remove}><Icon name="trash" /></Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {K.fields.map((f) => <FieldInput key={f.key} f={f} value={scene.fields[f.key]} onChange={(v) => setField(f.key, v)} error={err(f.key)} />)}
          <div className="sm:col-span-2">
            <Label htmlFor={voId} hint={s.narrationHint} right={`${scene.voiceover.length}/260`}>{s.narration}</Label>
            <TextArea id={voId} value={scene.voiceover} onChange={(v) => onChange((sc) => ({ ...sc, voiceover: v }))} maxLength={260} rows={2} />
            {voice && need > scene.duration + .3 && <p className="mt-1 text-xs text-muted">{s.narrationTooLong(need)}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={durId} right={s.seconds(scene.duration)}>{s.duration}</Label>
            <input id={durId} type="range" min={K.duration.min} max={K.duration.max} step={0.1} value={scene.duration}
              onChange={(e) => { const d = +e.target.value; onChange((sc) => ({ ...sc, duration: d })); }} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
      </div>
    </Card>
  );
}
