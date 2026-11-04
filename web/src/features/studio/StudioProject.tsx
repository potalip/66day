import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { blankScene, totalDuration, validateStoryboard } from "../../../../worker/lib/studio/storyboard";
import { type Catalog, type Voice, type Format, type Lang, type ProjectDetail, type Render, type SbError, type Storyboard, type TemplateDef, errorCode, loadCatalog, studioApi } from "./api";
import { PreviewPlayer } from "./Preview";
import { type ProofTarget, loadProofTargets, submitProof } from "./proof";
import { FieldInput, ProjectIdCtx, SceneCard } from "./SceneEditor";
import { StatusChip } from "./Studio";
import { strings } from "./strings";
import { Button, Card, Chip, FormatIcon, Icon, Label, Notice, ProgressBar, Segmented, SelectInput, TextArea, Toggle, cx } from "./ui";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function StudioProject() {
  const { id = "" } = useParams();
  const s = useStrings(strings);
  const lang = useLang();
  const nav = useNavigate();
  const [cat, setCat] = useState<Catalog | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [sb, setSb] = useState<Storyboard | null>(null);
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [loadErr, setLoadErr] = useState<"not_found" | "error" | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [focus, setFocus] = useState<number | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"plan" | "final" | "draft" | null>(null);
  // edit generations: every local edit bumps `gen`; a save records the generation it carried. Dirty = gen > saved.
  const gen = useRef(0), savedGen = useRef(0);
  const latest = useRef({ sb, title, brief });
  latest.current = { sb, title, brief };
  const isDirty = () => gen.current > savedGen.current;
  const [tick, setTick] = useState(0);
  const [voices, setVoices] = useState<{ available: boolean; voices: Voice[] } | null>(null);
  useEffect(() => { studioApi.voices().then(setVoices).catch(() => setVoices(null)); }, []);
  const briefId = useId(), titleId = useId();

  const load = useCallback(async (initial = false) => {
    try {
      const [c, d] = await Promise.all([loadCatalog(), studioApi.get(id)]);
      setCat(c); setDetail(d);
      if (initial || gen.current === savedGen.current) {
        setSb(d.project.storyboard); setBrief(d.project.brief); setTitle(d.project.title);
      }
      setLoadErr(null);
    } catch (e) {
      setLoadErr(String(e).includes("404") ? "not_found" : "error");
    }
  }, [id]);
  useEffect(() => { load(true); }, [load]);

  const T: TemplateDef | undefined = cat?.templates.find((t) => t.id === detail?.project.template);
  const project = detail?.project;
  const render = detail?.render ?? null;
  const planning = project?.status === "planning";
  const renderActive = !!render && ["queued", "submitted", "rendering", "ingesting"].includes(render.status);

  // poll while something is happening server-side (a failed poll schedules another one)
  useEffect(() => {
    if (!planning && !renderActive) return;
    const t = setTimeout(async () => {
      const wasPlanning = planning;
      try {
        const d = await studioApi.get(id);
        setDetail(d);
        // editing is locked while planning, so local state is clean: take the AI's storyboard
        if (wasPlanning && d.project.status !== "planning" && !isDirty()) { setSb(d.project.storyboard); setTitle(d.project.title); }
      } catch { setTick((x) => x + 1); }
    }, 2000);
    return () => clearTimeout(t);
  }, [detail, tick, planning, renderActive, id]);

  // validation (same rules as the server)
  const validation = useMemo(() => (sb ? validateStoryboard(sb) : null), [sb]);
  const errors: SbError[] = validation?.errors ?? [];
  const hardErrors = errors.filter((e) => !e.soft);

  const saveNow = useCallback(async () => {
    const g = gen.current;
    const cur = latest.current;
    if (!cur.sb) return;
    const r = await studioApi.patch(id, { storyboard: { ...cur.sb, title: cur.title }, title: cur.title, brief: cur.brief });
    if (savedGen.current < g) savedGen.current = g;
    setSave(isDirty() ? "saving" : "saved");
    setDetail((d) => (d ? { ...d, project: { ...r.project, storyboard: d.project.storyboard } } : d));
  }, [id]);

  // autosave (debounced; retries after an error)
  useEffect(() => {
    if (!isDirty() || !sb) return;
    setSave("saving");
    const t = setTimeout(() => {
      saveNow().catch(() => { setSave("error"); setTimeout(() => setTick((x) => x + 1), 3000); });
    }, 700);
    return () => clearTimeout(t);
  }, [sb, title, brief, saveNow, tick]);

  const touch = () => { gen.current++; };
  const edit = (fn: (p: Storyboard) => Storyboard) => { touch(); setSb((p) => (p ? fn(p) : p)); };
  const editScenes = (fn: (sc: Storyboard["scenes"]) => Storyboard["scenes"]) => edit((p) => ({ ...p, scenes: fn([...p.scenes]) }));
  const flush = async () => { if (isDirty()) await saveNow(); };

  const plan = async () => {
    setActionErr(null); setBusy("plan");
    try {
      await flush();
      await studioApi.plan(id, brief);
      await load();
    } catch (e) {
      const code = errorCode(e);
      setActionErr(code === "ai_not_configured" ? s.aiOffLong : code === "busy_rendering" ? s.busyRendering : s.planFailed);
    }
    setBusy(null);
  };
  const doRender = async (quality: "final" | "draft") => {
    setActionErr(null);
    if (hardErrors.length) { setActionErr(s.fixErrors); return; }
    setBusy(quality);
    try {
      await flush();
      await studioApi.render(id, quality);
      await load();
    } catch (e) {
      const code = errorCode(e);
      setActionErr(code === "renderer_not_configured" ? s.rendererOffLong : code === "invalid_storyboard" ? s.fixErrors
        : code === "too_many_active" ? s.tooManyActive : code === "daily_limit" ? s.dailyLimit : s.loadError);
    }
    setBusy(null);
  };
  const remove = async () => {
    if (!window.confirm(s.confirmDelete)) return;
    await studioApi.remove(id).catch(() => undefined);
    nav(`/${lang}/studio`);
  };

  if (loadErr) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Notice tone={loadErr === "not_found" ? "warn" : "danger"} title={loadErr === "not_found" ? s.notFound : s.loadError}
          action={loadErr === "error" ? <Button size="sm" onClick={() => load(true)}>{s.retry}</Button> : undefined} />
      </div>
    );
  }
  if (!detail || !T || !sb || !project) {
    return (
      <div className="space-y-6" aria-busy="true">
        <BackLink />
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className="h-96 animate-pulse rounded-[var(--radius)] bg-surface-2" /><div className="h-96 animate-pulse rounded-[var(--radius)] bg-surface-2" /></div>
      </div>
    );
  }

  const caps = detail.capabilities;
  const total = totalDuration(sb);
  const styleName = T.styles.find((x) => x.id === sb.style)?.name[lang] ?? sb.style;
  const planNote = project.planSource === "ai" ? s.planSourceAi : project.planSource === "manual" ? s.planSourceManual : s.planSourceExample;
  const labels = { play: s.play, pause: s.pause, restart: s.restart, scene: s.scene };

  return (
    <ProjectIdCtx.Provider value={project.id}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink />
        <div className="flex items-center gap-3 text-xs text-muted" aria-live="polite">
          {save === "saving" && <span>{s.saving}</span>}
          {save === "saved" && <span>✓ {s.saved}</span>}
          {save === "error" && <span className="text-danger">{s.saveError}</span>}
        </div>
      </div>

      <header className="space-y-3">
        <label htmlFor={titleId} className="sr-only">{s.titlePlaceholder}</label>
        <textarea id={titleId} value={title} maxLength={120} placeholder={s.titlePlaceholder} rows={1}
          onChange={(e) => { touch(); setTitle(e.target.value.replace(/\n/g, " ")); }}
          className="field-sizing-content -mx-1.5 w-[calc(100%+0.75rem)] resize-none rounded-lg bg-transparent px-1.5 leading-tight text-2xl font-semibold tracking-tight outline-none placeholder:text-muted/60 focus-visible:ring-2 focus-visible:ring-accent sm:text-3xl" />
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={project.status} label={s.status[project.status]} />
          <Chip>{T.name[lang]}</Chip>
          <Chip>{styleName}</Chip>
          <Chip><FormatIcon format={sb.format} className="size-3.5" />{sb.format.replace("x", ":")}</Chip>
          <Chip>{s.langs[sb.lang]}</Chip>
          <Chip>{s.totalLength(Math.round(total))}</Chip>
        </div>
      </header>

      {actionErr && <Notice tone="danger" title={actionErr} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* right column first on mobile: preview + render */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:order-2">
          <Card className="p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{s.preview}</h2>
              <span className="text-xs text-muted">{s.scenesCount(sb.scenes.length)}</span>
            </div>
            {sb.scenes.length ? <PreviewPlayer sb={validation?.storyboard ?? sb} T={T} labels={labels} focusScene={focus} /> : <p className="text-sm text-muted">{s.emptyScenes}</p>}
            <p className="mt-3 text-xs leading-relaxed text-muted">{s.previewNote}</p>
          </Card>
          <RenderPanel projectId={project.id} onChanged={() => load()} render={render} renders={detail.renders} renderer={caps.renderer} busy={busy} onRender={doRender} disabled={planning || renderActive} />
        </aside>

        <fieldset disabled={planning} aria-busy={planning} className="min-w-0 space-y-6 lg:order-1 disabled:opacity-70">
          {/* brief + AI */}
          <Card as="section" className="p-4 sm:p-5">
            <Label htmlFor={briefId} hint={caps.ai ? s.briefHelpAi : s.briefHelpNoAi} right={`${brief.length}/2000`}>{s.brief}</Label>
            <TextArea id={briefId} value={brief} onChange={(v) => { touch(); setBrief(v); }} rows={3} maxLength={2000} placeholder={s.briefPlaceholder} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={plan} loading={busy === "plan" || planning} disabled={!caps.ai || planning || renderActive}>
                {!planning && <Icon name="sparkle" />}{planning ? s.planning : project.planSource === "ai" ? s.replan : s.planWithAi}
              </Button>
              {!caps.ai && <Chip tone="gold">{s.aiOff}</Chip>}
              <p className="text-xs text-muted">{planNote}</p>
            </div>
            {project.planError && !planning && <p className="mt-3 text-sm text-danger" role="alert">{s.planFailed}</p>}
          </Card>

          {/* look & sound */}
          <Card as="section" className="space-y-5 p-4 sm:p-5">
            <h2 className="font-semibold">{s.settings}</h2>
            <div>
              <Label>{s.styles}</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={s.styles}>
                {T.styles.map((st) => (
                  <button key={st.id} type="button" role="radio" aria-checked={sb.style === st.id} onClick={() => edit((p) => ({ ...p, style: st.id }))}
                    className={cx("flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition focus-visible:outline-2 focus-visible:outline-accent",
                      sb.style === st.id ? "border-accent bg-accent-soft font-medium" : "border-line hover:bg-surface-2")}>
                    <span className="size-6 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${st.palette.bg} 50%, ${st.palette.accent} 50%)` }} />{st.name[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>{s.format}</Label>
                <Segmented label={s.format} value={sb.format} onChange={(f: Format) => edit((p) => ({ ...p, format: f }))}
                  options={(["9x16", "1x1", "16x9"] as Format[]).map((f) => ({ value: f, label: <span className="inline-flex items-center gap-1.5"><FormatIcon format={f} />{f.replace("x", ":")}</span> }))} />
              </div>
              <div>
                <Label>{s.videoLang}</Label>
                <Segmented label={s.videoLang} value={sb.lang} onChange={(l: Lang) => edit((p) => ({ ...p, lang: l }))} options={[{ value: "ru", label: s.langs.ru }, { value: "en", label: s.langs.en }]} />
              </div>
              <div>
                <Label>{s.music}</Label>
                <SelectInput aria-label={s.music} value={sb.music} onChange={(m) => edit((p) => ({ ...p, music: m as Storyboard["music"] }))}
                  options={Object.entries(s.musics).map(([value, label]) => ({ value, label }))} />
              </div>
              <div>
                <Label>{s.transition}</Label>
                <SelectInput aria-label={s.transition} value={sb.transition} onChange={(m) => edit((p) => ({ ...p, transition: m as Storyboard["transition"] }))}
                  options={Object.entries(s.transitions).map(([value, label]) => ({ value, label }))} />
              </div>
              <div className="space-y-3">
                <Toggle checked={sb.voiceover} onChange={(v) => edit((p) => ({ ...p, voiceover: v }))} label={s.voiceover} hint={voices?.available ? s.voiceOnHint : s.voiceoverHint} />
                {voices?.available && sb.voiceover && voices.voices.length > 0 && (
                  <VoicePicker voices={voices.voices} value={sb.voice ?? ""} onChange={(v) => edit((p) => ({ ...p, voice: v }))} />
                )}
              </div>
              <Toggle checked={sb.captions} onChange={(v) => edit((p) => ({ ...p, captions: v }))} label={s.captions} />
            </div>
            {T.fields.length > 0 && (
              <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                {T.fields.map((f) => (
                  <FieldInput key={f.key} f={f} value={sb.fields[f.key]} error={errors.find((e) => e.path === `fields.${f.key}`)}
                    onChange={(v) => edit((p) => ({ ...p, fields: { ...p.fields, [f.key]: v } }))} />
                ))}
              </div>
            )}
          </Card>

          {/* scenes */}
          <section aria-labelledby="scenes-h" className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 id="scenes-h" className="text-lg font-semibold">{s.scenes}</h2>
              <span className="text-sm text-muted">{s.totalLength(Math.round(total))}</span>
            </div>
            {hardErrors.length > 0 && <Notice tone="warn" title={s.unsavedError} />}
            {sb.scenes.map((sc, i) => (
              <SceneCard key={i} T={T} scene={sc} voice={sb.voiceover} index={i} count={sb.scenes.length} onFocus={() => setFocus(i)}
                errors={errors.filter((e) => e.path.startsWith(`scenes[${i}]`))}
                onChange={(fn) => editScenes((a) => { a[i] = fn(a[i]); return a; })}
                onMove={(d) => editScenes((a) => { const j = i + d; [a[i], a[j]] = [a[j], a[i]]; return a; })}
                onDuplicate={() => editScenes((a) => { a.splice(i + 1, 0, structuredClone(a[i])); return a; })}
                onRemove={() => editScenes((a) => { a.splice(i, 1); return a; })} />
            ))}
            {sb.scenes.length < T.maxScenes && (
              <AddScene T={T} onAdd={(kind) => { editScenes((a) => { const outro = a.length && a[a.length - 1].kind === "outro" && kind !== "outro" ? a.length - 1 : a.length; a.splice(outro, 0, blankScene(T, kind)); return a; }); }} />
            )}
          </section>

          <div className="border-t border-line pt-6">
            <Button variant="danger" size="sm" onClick={remove}><Icon name="trash" />{s.deleteProject}</Button>
          </div>
        </fieldset>
      </div>
    </div>
    </ProjectIdCtx.Provider>
  );
}

function BackLink() {
  const s = useStrings(strings);
  const lang = useLang();
  return <Link to={`/${lang}/studio`} className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"><Icon name="back" />{s.back}</Link>;
}

function AddScene({ T, onAdd }: { T: TemplateDef; onAdd: (kind: string) => void }) {
  const s = useStrings(strings);
  const lang = useLang();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-dashed border-line p-3">
      <span className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-muted"><Icon name="plus" />{s.addScene}:</span>
      {T.sceneKinds.map((k) => <Button key={k.kind} size="sm" onClick={() => onAdd(k.kind)}>{k.label[lang]}</Button>)}
    </div>
  );
}

function RenderPanel({ projectId, render, renders, renderer, busy, onRender, disabled, onChanged }: {
  projectId: string; render: Render | null; renders: Render[]; renderer: boolean; busy: string | null; onRender: (q: "final" | "draft") => void;
  disabled: boolean; onChanged: () => void;
}) {
  const s = useStrings(strings);
  const active = !!render && ["queued", "submitted", "rendering", "ingesting"].includes(render.status);
  const older = renders.filter((r) => r.id !== render?.id && r.status === "done");
  return (
    <Card as="section" className="space-y-4 p-4">
      <h2 className="font-semibold">{s.render}</h2>
      {!renderer && <Notice tone="warn" title={s.rendererOff}>{s.rendererOffLong}</Notice>}
      {active && render && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex justify-between text-sm"><span className="font-medium">{s.rendering}{render.quality === "draft" ? ` · ${s.draftBadge}` : ""}</span><span className="tabular-nums text-muted">{Math.round(render.progress * 100)}%</span></div>
          <ProgressBar value={render.progress} label={s.rendering} />
          <p className="text-xs text-muted">{s.stages[render.stage ?? "queued"] ?? render.stage}</p>
        </div>
      )}
      {render?.status === "failed" && <Notice tone="danger" title={s.renderFailed}>{render.error}</Notice>}
      {render?.status === "done" && render.videoUrl && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-accent">✓ {s.renderReady}{render.quality === "draft" ? ` · ${s.draftBadge}` : ""}</p>
          <video key={render.id} src={render.videoUrl} poster={render.thumbUrl ?? undefined} controls playsInline preload="metadata"
            className="mx-auto max-h-[480px] w-full rounded-[10px] border border-line bg-black" />
          <div className="flex flex-wrap gap-2">
            <a href={`${render.videoUrl}${render.videoUrl.startsWith("/api") ? "?download=1" : ""}`} download
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-accent px-3 text-sm font-medium text-accent-fg hover:brightness-110"><Icon name="download" />{s.download}</a>
            {render.contactUrl && <a href={render.contactUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-[10px] border border-line px-3 text-sm hover:bg-surface-2">{s.contactSheet}</a>}
          </div>
          <ShareBox projectId={projectId} render={render} onChanged={onChanged} />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <Button variant="primary" className="sm:flex-1 lg:flex-none xl:flex-1" onClick={() => onRender("final")} loading={busy === "final"} disabled={!renderer || disabled}>
          <Icon name="film" />{s.render}
        </Button>
        <Button className="sm:flex-1 lg:flex-none xl:flex-1" onClick={() => onRender("draft")} loading={busy === "draft"} disabled={!renderer || disabled} title={s.renderDraftHint}>
          {s.renderDraft}
        </Button>
      </div>
      {renderer && <p className="text-xs text-muted">{s.renderDraftHint}</p>}
      {older.length > 0 && (
        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium text-muted">{s.history}</p>
          <ul className="space-y-1.5">
            {older.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted">{new Date(r.createdAt * 1000).toLocaleString()} {r.quality === "draft" && <Chip>{s.draftBadge}</Chip>}</span>
                {r.videoUrl && <a className="text-accent hover:underline" href={r.videoUrl} target="_blank" rel="noreferrer">MP4</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ShareBox({ projectId, render, onChanged }: { projectId: string; render: Render; onChanged: () => void }) {
  const s = useStrings(strings);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState(false);
  const inputId = useId();
  const url = render.shareUrl ? new URL(render.shareUrl, window.location.origin).toString() : null;
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(false);
    try { await fn(); onChanged(); } catch { setErr(true); }
    setBusy(false);
  };
  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* select fallback */ }
  };
  return (
    <div className="space-y-2 rounded-[12px] border border-line p-3">
      <p className="text-sm font-medium">{s.share}</p>
      {url ? (
        <>
          <label htmlFor={inputId} className="sr-only">{s.shareLink}</label>
          <div className="flex gap-2">
            <input id={inputId} readOnly value={url} onFocus={(e) => e.target.select()}
              className="h-9 min-w-0 flex-1 rounded-[10px] border border-line bg-surface-2 px-2.5 font-mono text-xs text-fg" />
            <Button size="sm" onClick={copy}>{copied ? s.copied : s.copy}</Button>
          </div>
          <Button size="sm" variant="ghost" loading={busy} onClick={() => act(() => studioApi.unshare(projectId, render.id))}>{s.stopSharing}</Button>
          <ProofAttach url={url} />
        </>
      ) : (
        <>
          <p className="text-xs text-muted">{s.shareHint}</p>
          <Button size="sm" loading={busy} onClick={() => act(() => studioApi.share(projectId, render.id))}>{s.createShare}</Button>
        </>
      )}
      {err && <p className="text-xs text-danger" role="alert">{s.loadError}</p>}
    </div>
  );
}

/** "Use as proof for Day N": submits the share link to an open link-proof task of the student's current day. */
function ProofAttach({ url }: { url: string }) {
  const s = useStrings(strings);
  const lang = useLang();
  const [targets, setTargets] = useState<ProofTarget[]>([]);
  const [pick, setPick] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const selId = useId();
  useEffect(() => {
    loadProofTargets(lang).then((t) => { setTargets(t); setPick(t[0]?.taskId ?? ""); });
  }, [lang]);
  if (!targets.length && state !== "done") return null;
  const target = targets.find((t) => t.taskId === pick);
  return (
    <div className="space-y-2 border-t border-line pt-3">
      {state === "done" ? <p className="text-sm text-accent" role="status">✓ {s.proofDone(target?.day ?? 0)}</p> : (
        <>
          <Label htmlFor={selId} hint={s.proofHint}>{s.proofTitle(targets[0].day)}</Label>
          <SelectInput id={selId} value={pick} onChange={setPick} options={targets.map((t) => ({ value: t.taskId, label: t.title }))} />
          <Button size="sm" loading={state === "busy"} disabled={!target}
            onClick={async () => { if (!target) return; setState("busy"); setState((await submitProof(lang, target, url)) ? "done" : "error"); }}>
            {s.proofSubmit}
          </Button>
          {state === "error" && <p className="text-xs text-danger" role="alert">{s.loadError}</p>}
        </>
      )}
    </div>
  );
}

/** ElevenLabs voice choice (only when the render server has a key), with the provider's sample when available. */
function VoicePicker({ voices, value, onChange }: { voices: Voice[]; value: string; onChange: (v: string) => void }) {
  const s = useStrings(strings);
  const id = useId();
  const audio = useRef<HTMLAudioElement | null>(null);
  const current = voices.find((v) => v.id === value);
  const play = () => {
    if (!current?.preview_url) return;
    audio.current?.pause();
    audio.current = new Audio(current.preview_url);
    audio.current.play().catch(() => undefined);
  };
  const lang = useLang();
  const g = (x: string) => (x === "male" ? s.voiceMale : x === "female" ? s.voiceFemale : "");
  return (
    <div>
      <Label htmlFor={id} hint={s.voiceHint}>{s.voice}</Label>
      <div className="flex gap-2">
        <SelectInput id={id} value={value} onChange={onChange} className="min-w-0 flex-1"
          options={[{ value: "", label: s.voiceDefault }, ...voices.map((v) => ({ value: v.id, label: [v.name, g(v.gender), lang === "en" ? v.style : ""].filter(Boolean).join(" · ") }))]} />
        {current?.preview_url && <Button size="sm" className="h-11" onClick={play} aria-label={s.voiceSample}><Icon name="play" /></Button>}
      </div>
    </div>
  );
}

