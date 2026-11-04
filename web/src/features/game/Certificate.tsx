// OWNER: game agent. Public, verifiable completion certificate: /:lang/certificate/:userId.
// Shows "in progress" before day 66. Print-friendly (A4 landscape) — "Print or save as PDF".
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Award as AwardIcon, Copy, FileText, Printer, UserRound } from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { Badge, Button, ButtonLink, EmptyState, LeafMark, Logo, ProgressBar, Skeleton, cn, useFormat, useToast } from "@web/ui";
import { useApiData, useGameMe, type CertificateResponse } from "./api";
import { fmtDate } from "./format";
import { strings } from "./strings";
import { BadgeMedal, displayName } from "./widgets";

/** Print rules live with the page (styles.css is design-owned). Plain keywords, no hex: the sheet prints on white. */
const PRINT_CSS = `
@page { size: A4 landscape; margin: 0; }
@media print {
  html, body { background: white !important; }
  body * { visibility: hidden !important; }
  #fl-cert, #fl-cert * { visibility: visible !important; }
  #fl-cert { position: fixed !important; inset: 0 !important; width: 297mm !important; height: 210mm !important; max-width: none !important;
    margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: white !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; aspect-ratio: auto !important; }
  .no-print { display: none !important; }
}`;

export default function Certificate() {
  const { userId = "" } = useParams();
  const s = useStrings(strings);
  const C = s.cert;
  const lang = useLang();
  const { data, error, reload } = useApiData<CertificateResponse>(userId ? `/game/certificate/${encodeURIComponent(userId)}` : null);
  const me = useGameMe();

  if (error) {
    const nf = String(error.message).startsWith("404");
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState tone={nf ? "neutral" : "danger"} icon={<FileText />} title={nf ? C.notFound : C.error}
          action={!nf ? <Button variant="outline" onClick={reload}>{s.leaderboard.retry}</Button> : <ButtonLink variant="ghost" to={`/${lang}/leaderboard`}>{s.profile.back}</ButtonLink>} />
      </div>
    );
  }
  if (!data || data.userId !== userId) return <CertSkeleton />;
  const isMe = me.data?.userId === data.userId;
  return <CertificatePage data={data} isMe={isMe} />;
}

/** Paper is light: switch the document to the light theme tokens while printing, then restore. */
function usePrintInLight() {
  useEffect(() => {
    const el = document.documentElement;
    let prev: string | undefined;
    const before = () => { prev = el.dataset.theme; el.dataset.theme = "light"; };
    const after = () => { if (prev === undefined) delete el.dataset.theme; else el.dataset.theme = prev; };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);
}

function CertificatePage({ data, isMe }: { data: CertificateResponse; isMe: boolean }) {
  usePrintInLight();
  return (
    <div className="mx-auto max-w-5xl">
      <style>{PRINT_CSS}</style>
      <Actions cert={data} isMe={isMe} />
      <CertificateSheet cert={data} />
    </div>
  );
}

function Actions({ cert, isMe }: { cert: CertificateResponse; isMe: boolean }) {
  const s = useStrings(strings);
  const C = s.cert;
  const lang = useLang();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      toast({ tone: "success", title: C.copied });
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the URL bar still works */ }
  };
  return (
    <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <ButtonLink variant="ghost" size="sm" icon={<UserRound />} to={isMe ? `/${lang}/me` : `/${lang}/u/${encodeURIComponent(cert.userId)}`}>{C.profile}</ButtonLink>
        <ButtonLink variant="ghost" size="sm" icon={<AwardIcon />} to={`/${lang}/portfolio/${encodeURIComponent(cert.userId)}`}>{C.portfolio}</ButtonLink>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" icon={<Copy />} onClick={copy}>{copied ? C.copied : C.copy}</Button>
        <Button variant="primary" size="sm" icon={<Printer />} onClick={() => window.print()}>{C.print}</Button>
      </div>
    </div>
  );
}

export function CertificateSheet({ cert }: { cert: CertificateResponse }) {
  const s = useStrings(strings);
  const C = s.cert;
  const lang = useLang();
  const f = useFormat();
  const name = displayName(cert.name, cert.userId, s);
  const track = cert.track ? C.tracks[cert.track] : C.noTrack;
  const done = cert.status === "complete";
  const verifyUrl = typeof location !== "undefined" ? `${location.host}/${lang}/certificate/${cert.userId}` : "";
  const stats = [
    { label: C.days, value: `${cert.daysDone} / ${cert.totalDays}` },
    { label: C.streak, value: s.streak.days(cert.bestStreak) },
    { label: C.level, value: `${cert.level} · ${s.ranks[cert.rank]}` },
    { label: C.projects, value: f.number(cert.shippedCount) },
  ];
  return (
    <article id="fl-cert" aria-label={done ? C.eyebrow : C.eyebrowProgress}
      className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-3 shadow-card sm:aspect-[297/210] sm:p-4">
      {/* double frame */}
      <div className="relative flex h-full flex-col rounded-[calc(var(--radius-lg)-6px)] border border-gold-bright/50 px-5 py-7 sm:px-12 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute inset-1.5 rounded-[calc(var(--radius-lg)-10px)] border border-gold-bright/20" />
        <LeafMark aria-hidden size={220} className="pointer-events-none absolute -right-10 -bottom-12 opacity-[0.06]" />

        <header className="flex items-start justify-between gap-4">
          <Logo size={26} />
          {!done && <Badge tone="gold">{C.inProgress}</Badge>}
        </header>

        <div className="mt-6 flex flex-1 flex-col justify-center text-center sm:mt-2">
          <p className="cert-muted text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">{done ? C.eyebrow : C.eyebrowProgress}</p>
          <p className="cert-muted mt-1 text-sm text-muted">{C.program}</p>
          <p className="cert-muted mt-6 font-serif text-base italic text-muted sm:mt-7">{C.certifies}</p>
          <h1 className="mt-2 font-serif not-italic text-[2.25rem] leading-tight font-semibold tracking-tight text-fg sm:text-[3.25rem]">{name}</h1>
          <div aria-hidden className="mx-auto mt-3 h-px w-40 bg-gold-bright/60" />
          <p className="mx-auto mt-4 max-w-[60ch] text-[0.95rem] leading-relaxed text-fg sm:text-base">
            {cert.status === "not_started" ? C.notStarted : done ? C.complete(track) : C.progress(cert.daysDone, track)}
          </p>
          {!done && cert.status !== "not_started" && (
            <ProgressBar value={cert.daysDone} max={cert.totalDays} tone="gold" size="sm" label={`${cert.daysDone} / ${cert.totalDays}`} className="mx-auto mt-4 max-w-sm" />
          )}

          <dl className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {stats.map((x) => (
              <div key={x.label}>
                <dt className="cert-muted text-[11px] uppercase tracking-[0.1em] text-muted">{x.label}</dt>
                <dd className="mt-1 font-semibold tabular text-fg">{x.value}</dd>
              </div>
            ))}
          </dl>

          {cert.badges.length > 0 && (
            <div className="mt-6">
              <p className="cert-muted mb-2 text-[11px] uppercase tracking-[0.1em] text-muted">{C.keyBadges} · {cert.badgeCount} {C.badges.toLowerCase()}</p>
              <ul className="flex flex-wrap justify-center gap-3">
                {cert.badges.map((b) => (
                  <li key={b.id} className="flex items-center gap-1.5 text-xs text-fg" title={b.title[lang]}>
                    <BadgeMedal badge={b} earned size={26} /><span className="max-w-[12ch] truncate sm:max-w-none">{b.title[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="mt-7 grid grid-cols-1 items-end gap-5 text-center sm:grid-cols-3 sm:text-left">
          <div className="cert-muted text-xs text-muted">
            {cert.completedAt ? <p className="font-medium text-fg">{C.completedOn(fmtDate(cert.completedAt, lang))}</p>
              : cert.startedAt ? <p>{C.startedOn(fmtDate(cert.startedAt, lang))}</p> : null}
            <p className="mt-0.5">{C.issuedBy}</p>
          </div>
          <div className="flex justify-center">
            <Seal done={done} />
          </div>
          <div className="cert-muted text-xs text-muted sm:text-right">
            <p>{C.id}: <span className="font-mono font-medium text-fg">{cert.certId}</span></p>
            <p className="mt-0.5 break-all">{C.verify}: {verifyUrl}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function Seal({ done }: { done: boolean }) {
  return (
    <div aria-hidden className={cn("relative grid size-20 place-items-center rounded-full border-2",
      done ? "border-gold-bright bg-gold-soft" : "border-dashed border-line-strong bg-surface-2")}>
      <div className={cn("absolute inset-1.5 rounded-full border", done ? "border-gold-bright/50" : "border-line")} />
      <div className="flex flex-col items-center leading-none">
        <LeafMark size={26} mono={!done} className={done ? undefined : "text-muted"} />
        <span className={cn("mt-1 font-serif text-sm font-semibold", done ? "text-gold-ink" : "text-muted")}>66</span>
      </div>
    </div>
  );
}

function CertSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-busy="true">
      <div className="mb-5 flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-8 w-56" /></div>
      <Skeleton className="h-[480px] w-full rounded-[var(--radius-lg)] sm:aspect-[297/210] sm:h-auto" />
    </div>
  );
}
