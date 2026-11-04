import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { type Catalog, type Format, type Lang, type ProjectSummary, type StatusInfo, type TemplateDef, loadCatalog, studioApi } from "./api";
import { applyRecap, loadRecapData } from "./prefill";
import { strings } from "./strings";
import { Button, Card, Chip, FormatIcon, Icon, Label, Notice, Segmented, Spinner, TextArea, cx } from "./ui";

const previews = import.meta.glob("./previews/*.jpg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export const previewUrl = (template: string, style: string, lang: string = "en") =>
  previews[`./previews/${template}--${style}--${lang}.jpg`] ?? previews[`./previews/${template}--${style}--en.jpg`];

export default function Studio() {
  const s = useStrings(strings);
  const lang = useLang();
  const [cat, setCat] = useState<Catalog | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState<TemplateDef | null>(null);

  const load = () => {
    setError(false);
    // projects first: on a first visit it mints the anonymous-user cookie; parallel requests would each mint their own
    studioApi.projects()
      .then((p) => { setProjects(p.projects); studioApi.status().then(setStatus).catch(() => undefined); return loadCatalog(); })
      .then(setCat)
      .catch(() => setError(true));
  };
  useEffect(load, []);

  // keep rendering/planning cards fresh
  useEffect(() => {
    if (!projects?.some((p) => p.status === "rendering" || p.status === "planning")) return;
    const id = setTimeout(() => studioApi.projects().then((p) => setProjects(p.projects)).catch(() => setProjects((x) => (x ? [...x] : x))), 3000);
    return () => clearTimeout(id);
  }, [projects]);

  const tName = (id: string) => cat?.templates.find((t) => t.id === id)?.name[lang] ?? id;

  return (
    <div className="space-y-12">
      <header className="max-w-[70ch]">
        <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-accent"><Icon name="film" />{s.title}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.title}</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted">{s.lead}</p>
      </header>

      {status && (!status.ai || !status.renderer || !status.rendererHealth.ok) && (
        <div className="grid gap-3 md:grid-cols-2">
          {!status.ai && <Notice tone="warn" title={s.aiOff}>{s.aiOffLong}</Notice>}
          {(!status.renderer || !status.rendererHealth.ok) && (
            <Notice tone="warn" title={status.renderer ? s.rendererDown : s.rendererOff}>{s.rendererOffLong}</Notice>
          )}
        </div>
      )}

      {error && <Notice tone="danger" title={s.loadError} action={<Button size="sm" onClick={load}>{s.retry}</Button>} />}

      {(!projects || projects.length > 0) && (
        <section aria-labelledby="studio-projects">
          <h2 id="studio-projects" className="mb-4 text-xl font-semibold tracking-tight">{s.yourProjects}</h2>
          {!projects ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[0, 1, 2].map((k) => <div key={k} className="aspect-[4/5] animate-pulse rounded-[var(--radius)] bg-surface-2" />)}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link to={`/${lang}/studio/${p.id}`} className="group block rounded-[var(--radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <Card className="overflow-hidden transition group-hover:shadow-md">
                      <div className="relative aspect-square overflow-hidden bg-surface-2">
                        <img src={p.render?.thumbUrl ?? previewUrl(p.template, p.style, p.lang)} alt="" loading="lazy"
                          className={cx("size-full transition group-hover:scale-[1.02]", p.render?.thumbUrl ? "object-contain" : "object-cover")} />
                        <span className="absolute left-2 top-2"><StatusChip status={p.status} label={s.status[p.status]} /></span>
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{p.title || s.titlePlaceholder}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <FormatIcon format={p.format} className="size-3.5" />{tName(p.template)} · {s.seconds(p.seconds)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="studio-new">
        <h2 id="studio-new" className="text-xl font-semibold tracking-tight">{s.newVideo}</h2>
        <p className="mb-5 mt-1 max-w-[70ch] text-muted">{projects?.length === 0 ? s.noProjects : s.newVideoLead}</p>
        {!cat ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className="h-72 animate-pulse rounded-[var(--radius)] bg-surface-2" />)}</div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.templates.map((T) => <TemplateCard key={T.id} T={T} onPick={() => setPicked(T)} />)}
          </ul>
        )}
      </section>

      {picked && cat && <CreateSheet T={picked} ai={!!status?.ai || cat.capabilities.ai} onClose={() => setPicked(null)} />}
    </div>
  );
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const tone = status === "rendered" ? "accent" : status === "failed" ? "danger" : "neutral";
  return (
    <Chip tone={tone} className="bg-surface/90 backdrop-blur">
      {(status === "rendering" || status === "planning") && <Spinner className="size-3" />}{label}
    </Chip>
  );
}

function TemplateCard({ T, onPick }: { T: TemplateDef; onPick: () => void }) {
  const s = useStrings(strings);
  const lang = useLang();
  const [style, setStyle] = useState(T.styles[0].id);
  return (
    <li>
      <Card className="flex h-full flex-col overflow-hidden">
        <button type="button" onClick={onPick} className="group relative block aspect-[16/10] overflow-hidden bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          aria-label={`${T.name[lang]} — ${s.useTemplate}`}>
          <img src={previewUrl(T.id, style, lang)} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        </button>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-semibold">{T.name[lang]}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{T.description[lang]}</p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3">
            <div className="flex gap-1.5" role="radiogroup" aria-label={s.styles}>
              {T.styles.map((st) => (
                <button key={st.id} type="button" role="radio" aria-checked={style === st.id} aria-label={st.name[lang]} title={st.name[lang]}
                  onMouseEnter={() => setStyle(st.id)} onFocus={() => setStyle(st.id)} onClick={() => setStyle(st.id)}
                  className={cx("size-6 rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    style === st.id ? "border-fg" : "border-line")}
                  style={{ background: `linear-gradient(135deg, ${st.palette.bg} 50%, ${st.palette.accent} 50%)` }} />
              ))}
            </div>
            <Button size="sm" variant="primary" onClick={onPick}>{s.useTemplate}</Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function CreateSheet({ T, ai, onClose }: { T: TemplateDef; ai: boolean; onClose: () => void }) {
  const s = useStrings(strings);
  const uiLang = useLang();
  const nav = useNavigate();
  const [style, setStyle] = useState(T.styles[0].id);
  const [format, setFormat] = useState<Format>("9x16");
  const [lang, setLang] = useState<Lang>(uiLang);
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(), briefId = useId();

  useEffect(() => {
    // no close() in cleanup: StrictMode re-runs effects and close() would fire onClose and unmount us
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  const create = async () => {
    setBusy(true); setErr(false);
    try {
      const p = await studioApi.create({ template: T.id, style, format, lang, brief });
      if (T.id === "day-recap") {
        const d = await loadRecapData(lang);
        if (d) await studioApi.patch(p.id, { storyboard: applyRecap(p.storyboard, d) }).catch(() => undefined);
      }
      if (ai && brief.trim()) await studioApi.plan(p.id, brief).catch(() => undefined);
      nav(`/${uiLang}/studio/${p.id}`);
    } catch {
      setErr(true); setBusy(false);
    }
  };

  return (
    <dialog ref={dialog} aria-labelledby={titleId} onClose={onClose} onCancel={onClose}
      className="m-auto max-h-[92dvh] w-[min(720px,calc(100vw-24px))] overflow-y-auto rounded-[18px] border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px]">
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">{T.name[uiLang]}</h2>
          <p className="mt-0.5 text-sm text-muted">{T.description[uiLang]}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={s.close}>✕</Button>
      </div>
      <div className="space-y-6 p-5">
        <div>
          <Label>{s.styles}</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label={s.styles}>
            {T.styles.map((st) => (
              <button key={st.id} type="button" role="radio" aria-checked={style === st.id} onClick={() => setStyle(st.id)}
                className={cx("overflow-hidden rounded-[12px] border-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  style === st.id ? "border-accent" : "border-line hover:border-muted")}>
                <img src={previewUrl(T.id, st.id, lang)} alt="" className="aspect-square w-full object-cover" />
                <span className="block px-2.5 py-1.5 text-sm font-medium">{st.name[uiLang]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label>{s.format}</Label>
            <Segmented label={s.format} value={format} onChange={setFormat}
              options={(["9x16", "1x1", "16x9"] as Format[]).map((f) => ({ value: f, label: <span className="inline-flex items-center gap-1.5"><FormatIcon format={f} />{f.replace("x", ":")}</span> }))} />
            <p className="mt-1.5 text-xs text-muted">{s.formatHint[format]}</p>
          </div>
          <div>
            <Label>{s.videoLang}</Label>
            <Segmented label={s.videoLang} value={lang} onChange={setLang} options={[{ value: "ru", label: s.langs.ru }, { value: "en", label: s.langs.en }]} />
          </div>
        </div>
        <div>
          <Label htmlFor={briefId} hint={ai ? s.briefHelpAi : s.briefHelpNoAi} right={`${brief.length}/2000`}>{s.brief}</Label>
          <TextArea id={briefId} value={brief} onChange={setBrief} rows={4} maxLength={2000} placeholder={s.briefPlaceholder} />
        </div>
        {T.id === "day-recap" && <p className="text-sm text-muted">{s.recapPrefill}</p>}
        {err && <Notice tone="danger" title={s.loadError} />}
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface p-4">
        <Button variant="ghost" onClick={onClose}>{s.cancel}</Button>
        <Button variant="primary" loading={busy} onClick={create}>
          {ai && brief.trim() ? <><Icon name="sparkle" />{s.planWithAi}</> : busy ? s.creating : s.create}
        </Button>
      </div>
    </dialog>
  );
}
