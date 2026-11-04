// OWNER: learn. Public portfolio: /:lang/portfolio/:userId (or /me). Recruiter-friendly, works for strangers with no cookie.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import {
  Avatar, Badge, Button, ButtonLink, Card, Dialog, EmptyState, Field, Input, ProgressRing, Skeleton, SkeletonCard, Switch, Textarea, useToast,
} from "@web/ui";
import { useBadgeCatalog } from "@web/features/game/api";
import { ApiError, formatDate, portfolioApi, usePortfolio, type PortfolioItem, type PortfolioResponse } from "./data";
import { portfolioStrings, type PortfolioStrings } from "./portfolioStrings";
import { ErrorState, Icon, cx } from "./ui";

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/** Keep <title> and the OG/description tags in sync for people sharing the page from the browser. */
function useDocumentMeta(title: string | null, description: string | null) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title;
    const set = (sel: string, attr: string, key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      const old = el.content;
      el.content = value;
      return () => { el!.content = old; };
    };
    const undo = [
      set('meta[property="og:title"]', "property", "og:title", title),
      description ? set('meta[property="og:description"]', "property", "og:description", description) : () => {},
      description ? set('meta[name="description"]', "name", "description", description) : () => {},
    ];
    return () => { document.title = prev; undo.forEach((u) => u()); };
  }, [title, description]);
}

export default function Portfolio() {
  const lang = useLang();
  const s = useStrings(portfolioStrings);
  const { userId = "me" } = useParams();
  const pf = usePortfolio(lang, userId);
  const [preview, setPreview] = useState(false);
  const p = pf.data;
  const name = p ? p.user.name || s.anonymous : null;
  useDocumentMeta(name ? s.docTitle(name) : null, p ? s.docDescription(p.stats.completedDays, p.stats.publicItems) : null);

  if (pf.loading && !p) return <PortfolioSkeleton />;
  if (pf.error instanceof ApiError && pf.error.status === 404) {
    return <EmptyState icon={<Icon.alert />} title={s.notFoundTitle} description={s.notFoundBody}
      action={<ButtonLink to={`/${lang}`} variant="outline">FlowLeaf 66</ButtonLink>} />;
  }
  if (pf.error || !p) return <ErrorState title={s.loadErrorTitle} body={s.loadErrorBody} retry={s.retry} onRetry={() => pf.reload()} />;

  const editable = p.isMe && !preview;
  const items = editable ? p.items : p.items.filter((i) => i.visibility === "public");
  const pub = items.filter((i) => i.visibility === "public");
  const groups = {
    boss: pub.filter((i) => i.kind === "boss"),
    ship: pub.filter((i) => i.kind === "ship"),
    other: pub.filter((i) => i.kind === "other"),
    hidden: editable ? items.filter((i) => i.visibility === "private") : [],
  };
  const shareUrl = `${location.origin}/${lang}/portfolio/${p.user.id}`;

  return (
    <div className="mx-auto max-w-5xl">
      {p.isMe && (
        <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius)] border border-line bg-surface-2 px-4 py-3 text-sm sm:flex-row sm:items-center">
          <p className="flex-1 text-muted">{preview ? s.previewAsVisitor : s.ownerBanner}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPreview((v) => !v)}>{preview ? s.backToEditing : s.previewAsVisitor}</Button>
            <ButtonLink size="sm" variant="ghost" to={`/${lang}/today`}>{s.goToday}</ButtonLink>
          </div>
        </div>
      )}

      <Header s={s} p={p} name={name!} lang={lang} shareUrl={shareUrl} />

      <div className="mt-12 grid grid-cols-1 gap-12">
        {pub.length === 0 && !groups.hidden.length && (
          <EmptyState icon={<Icon.rocket />} title={p.isMe ? s.emptyOwnerTitle : s.emptyVisitorTitle} description={p.isMe ? s.emptyOwnerBody : s.emptyVisitorBody}
            action={p.isMe ? <ButtonLink to={`/${lang}/today`}>{s.goToday}</ButtonLink> : undefined} />
        )}
        {groups.boss.length > 0 && (
          <Section title={s.featured} hint={s.featuredHint} icon={<Icon.crown className="text-gold-bright" />}>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {groups.boss.map((i) => <li key={i.taskId}><ProjectCard s={s} lang={lang} item={i} featured editable={editable} onChange={pf.setData} /></li>)}
            </ul>
          </Section>
        )}
        {groups.ship.length > 0 && (
          <Section title={s.shipped} icon={<Icon.rocket />}>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.ship.map((i) => <li key={i.taskId}><ProjectCard s={s} lang={lang} item={i} editable={editable} onChange={pf.setData} /></li>)}
            </ul>
          </Section>
        )}
        {groups.other.length > 0 && (
          <Section title={s.other}>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.other.map((i) => <li key={i.taskId}><ProjectCard s={s} lang={lang} item={i} editable={editable} onChange={pf.setData} /></li>)}
            </ul>
          </Section>
        )}
        {groups.hidden.length > 0 && <HiddenList s={s} lang={lang} items={groups.hidden} onChange={pf.setData} />}
      </div>

      {!p.isMe && (
        <Card tone="accent" padding="lg" className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-lg font-semibold">{s.ctaTitle}</p>
            <p className="mt-1 text-sm text-fg/80">{s.ctaBody}</p>
          </div>
          <ButtonLink to={`/${lang}/start`} size="lg" iconRight={<Icon.arrowRight />} className="w-full sm:w-auto">{s.ctaButton}</ButtonLink>
        </Card>
      )}
    </div>
  );
}

function Header({ s, p, name, lang, shareUrl }: { s: PortfolioStrings; p: PortfolioResponse; name: string; lang: "ru" | "en"; shareUrl: string }) {
  const { toast } = useToast();
  const [allBadges, setAllBadges] = useState(false);
  const catalog = useBadgeCatalog();
  const badges = useMemo(() => {
    const byId = new Map((catalog ?? []).map((b) => [b.id, b]));
    return (p.game?.badges ?? []).map((b) => byId.get(b.id)).filter((b): b is NonNullable<typeof b> => !!b);
  }, [catalog, p.game]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); toast({ title: s.copied, tone: "success", duration: 2500 }); }
    catch { toast({ title: s.copyFailed, tone: "error", duration: 4000 }); }
  };
  return (
    <header>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar name={name} size={72} ring="accent" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{s.program}</p>
          <h1 className="mt-1 text-[clamp(1.9rem,5vw,2.8rem)] leading-[1.08] font-semibold tracking-tight text-balance">{name}</h1>
          <p className="mt-2 text-lg text-muted">{s.tagline(p.user.track)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {p.user.track && <Badge tone="accent">{s.trackLabel[p.user.track]}</Badge>}
            {p.stats.lastActive && <Badge tone="outline">{s.lastActive(formatDate(Date.parse(`${p.stats.lastActive}T12:00:00Z`) / 1000, lang))}</Badge>}
          </div>
        </div>
        <Button variant="outline" onClick={copy} icon={<Icon.link />} className="w-full sm:w-auto">{s.copyLink}</Button>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-3">
          <ProgressRing value={p.stats.completedDays} max={p.stats.totalDays} size={48} stroke={5} label={s.stats.days}>
            <span className="text-[0.6875rem]">{p.stats.percent}%</span>
          </ProgressRing>
          <div><dt className="text-xs text-muted">{s.stats.days}</dt><dd className="tabular text-lg font-semibold">{p.stats.completedDays}/{p.stats.totalDays}</dd></div>
        </Card>
        <StatCard label={s.stats.boss} value={`${p.stats.bossDone}/${p.stats.bossTotal}`} icon={<Icon.crown className="text-gold-bright" />} />
        <StatCard label={s.stats.level} value={p.game ? String(p.game.level) : "—"} icon={<Icon.sparkle className="text-gold-bright" />} />
        <StatCard label={s.stats.streak} value={p.game ? s.streakDays(p.game.streak.best) : "—"} icon={<Icon.check />} />
      </dl>

      {badges.length > 0 && (
        <div className="mt-6">
          <h2 className="sr-only">{s.badges}</h2>
          <ul className="flex flex-wrap gap-2" aria-label={s.badges}>
            {(allBadges ? badges : badges.slice(0, 6)).map((b) => (
              <li key={b.id} title={b.description[lang]}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold-bright/40 bg-gold-soft px-3 text-sm font-medium text-gold-ink">
                <span aria-hidden="true">{/^\p{Extended_Pictographic}/u.test(b.icon) ? b.icon : "🏅"}</span>{b.title[lang]}
              </li>
            ))}
            {badges.length > 6 && (
              <li>
                <button type="button" onClick={() => setAllBadges((v) => !v)} aria-expanded={allBadges}
                  className="inline-flex h-8 items-center rounded-full border border-line px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring">
                  {allBadges ? s.showLess : s.moreBadges(badges.length - 6)}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 [&_svg]:size-5">{icon}</span>
      <div className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="tabular truncate text-lg font-semibold">{value}</dd></div>
    </Card>
  );
}

function Section({ title, hint, icon, children }: { title: string; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight [&_svg]:size-5">{icon}{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Preview({ item, featured }: { item: PortfolioItem; featured?: boolean }) {
  if (item.file?.isImage) {
    const h = featured ? "aspect-[16/9]" : "aspect-[16/10]";
    return <img src={item.file.href} alt="" loading="lazy" className={cx("w-full border-b border-line bg-surface-2 object-cover", h)} />;
  }
  const label = item.url ? hostOf(item.url) : item.file ? item.file.name : null;
  return (
    <div className={cx("relative grid w-full place-items-center overflow-hidden border-b border-line", featured ? "aspect-[3/1]" : "aspect-[5/2]",
      item.kind === "boss" ? "bg-gold-soft" : "bg-accent-soft")}>
      <div aria-hidden className="absolute inset-0 opacity-60 [background-image:radial-gradient(color-mix(in_srgb,var(--fg)_9%,transparent)_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="relative flex max-w-[85%] items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium shadow-soft">
        {item.url ? <Icon.external size={14} className="shrink-0 text-muted" /> : <Icon.file size={14} className="shrink-0 text-muted" />}
        <span className="truncate">{label ?? "—"}</span>
      </div>
    </div>
  );
}

function ProjectCard({ s, lang, item, featured, editable, onChange }: {
  s: PortfolioStrings; lang: "ru" | "en"; item: PortfolioItem; featured?: boolean; editable: boolean; onChange: (p: PortfolioResponse) => void;
}) {
  const [editing, setEditing] = useState(false);
  const desc = item.description ?? (item.url || item.file ? item.text : item.text);
  return (
    <Card padding="none" className={cx("flex h-full flex-col overflow-hidden", featured && "border-gold-bright/40")}>
      <Preview item={item} featured={featured} />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-medium text-fg">{s.dayLabel(item.day)}</span>
          <span aria-hidden>·</span><span>{s.track[item.track]}</span>
          {item.kind === "boss" && <Badge size="sm" tone="gold" icon={<Icon.crown />}>{s.boss}</Badge>}
        </p>
        <h3 className={cx("mt-1.5 font-semibold leading-snug text-pretty", featured ? "text-lg" : "text-base")}>{item.title}</h3>
        {desc && <p className={cx("mt-1.5 text-sm text-muted text-pretty whitespace-pre-line", featured ? "line-clamp-4" : "line-clamp-3")}>{desc}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer nofollow"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3 text-sm font-medium text-accent-fg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {s.openProject}<Icon.external size={14} />
            </a>
          )}
          {item.file && (
            <a href={item.file.href} target="_blank" rel="noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line-strong px-3 text-sm font-medium hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring">
              <Icon.file size={14} />{s.openFile}
            </a>
          )}
          {editable && (
            <div className="ml-auto flex items-center gap-1">
              <VisibilityToggle s={s} lang={lang} item={item} onChange={onChange} />
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} icon={<Icon.pen />}>{s.edit}</Button>
            </div>
          )}
        </div>
      </div>
      {editable && <EditDialog s={s} lang={lang} item={item} open={editing} onClose={() => setEditing(false)} onChange={onChange} />}
    </Card>
  );
}

function VisibilityToggle({ s, lang, item, onChange }: { s: PortfolioStrings; lang: "ru" | "en"; item: PortfolioItem; onChange: (p: PortfolioResponse) => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const on = item.visibility === "public";
  return (
    <Switch checked={on} disabled={busy} label={<span className="text-sm text-muted">{on ? s.public : s.private}</span>}
      onChange={async (v) => {
        setBusy(true);
        try { onChange(await portfolioApi.update(lang, item.taskId, { visibility: v ? "public" : "private" })); }
        catch { toast({ title: s.saveError, tone: "error", duration: 4000 }); }
        finally { setBusy(false); }
      }} />
  );
}

function EditDialog({ s, lang, item, open, onClose, onChange }: {
  s: PortfolioStrings; lang: "ru" | "en"; item: PortfolioItem; open: boolean; onClose: () => void; onChange: (p: PortfolioResponse) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item.title);
  const [desc, setDesc] = useState(item.description ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setTitle(item.title); setDesc(item.description ?? ""); } }, [open, item]);
  const save = async () => {
    setBusy(true);
    try {
      onChange(await portfolioApi.update(lang, item.taskId, { title: title.trim() === item.taskTitle ? null : title, description: desc }));
      toast({ title: s.saved, tone: "success", duration: 2000 });
      onClose();
    } catch { toast({ title: s.saveError, tone: "error", duration: 4000 }); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} title={s.editTitle} description={`${s.dayLabel(item.day)} · ${item.dayTitle}`}
      footer={<><Button variant="outline" onClick={onClose}>{s.cancel}</Button><Button onClick={save} loading={busy}>{s.save}</Button></>}>
      <div className="grid gap-4">
        <Field label={s.titleLabel}><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label={s.descLabel} hint={s.descHint}><Textarea value={desc} maxLength={600} rows={4} onChange={(e) => setDesc(e.target.value)} /></Field>
      </div>
    </Dialog>
  );
}

function HiddenList({ s, lang, items, onChange }: { s: PortfolioStrings; lang: "ru" | "en"; items: PortfolioItem[]; onChange: (p: PortfolioResponse) => void }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon.lock size={18} className="text-muted" />{s.privateSection}</h2>
        <p className="mt-1 text-sm text-muted">{s.privateHint}</p>
      </div>
      <Card padding="none">
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.taskId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{s.dayLabel(i.day)} · {s.track[i.track]}</p>
                <p className="truncate font-medium">{i.title}</p>
              </div>
              <VisibilityToggle s={s} lang={lang} item={i} onChange={onChange} />
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-busy="true">
      <div className="flex items-center gap-6"><Skeleton circle className="size-[72px]" /><div className="flex-1 space-y-3"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-2/3" /></div></div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
    </div>
  );
}
