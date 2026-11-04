import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight, BookOpen, Check, ChevronDown, Clapperboard, Code2, Crown, Flame, Hammer, Library, Medal, Moon,
  PlayCircle, Send, Sparkles, Trophy, Upload, Video, Zap, FileText, Film,
} from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { Avatar, Badge, ButtonLink, Card, cn, ProgressBar, ProgressRing, LeafMark } from "@web/ui";
import { landing, type LandingStrings } from "./strings";

// OWNER: design agent. Public landing page at /:lang.

// Mirrors docs/curriculum/OUTLINE.md: boss days 13/27/41/55/65, rest every 7th day.
const BOSS = new Set([13, 27, 41, 55, 65]);
const TODAY = 12;
type CellState = "done" | "today" | "boss" | "rest" | "locked";
export function cellState(d: number, today = TODAY): CellState {
  if (d < today) return "done";
  if (d === today) return "today";
  if (BOSS.has(d)) return "boss";
  if (d % 7 === 0) return "rest";
  return "locked";
}

/** Fades content up once when it scrolls into view. Static under reduced motion (CSS kills the animation). */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn(shown ? "animate-rise" : "opacity-0", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent-ink", className)}>{children}</p>;
}
function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("max-w-[22ch] text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-[2.5rem]", className)}>{children}</h2>;
}
function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-4 max-w-[58ch] text-[1.0625rem] leading-relaxed text-muted sm:text-lg", className)}>{children}</p>;
}
function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return <section id={id} className={cn("scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28", className)}><div className="mx-auto max-w-6xl">{children}</div></section>;
}

export default function Landing() {
  const t = useStrings(landing);
  const lang = useLang();
  const start = `/${lang}/start`;
  useEffect(() => { document.title = t.meta; }, [t.meta]);

  return (
    <div className="overflow-x-clip">
      <Hero t={t} start={start} />
      <Why t={t} />
      <Paths t={t} />
      <Day t={t} />
      <Game t={t} />
      <Studio t={t} />
      <LibrarySection t={t} />
      <Phases t={t} />
      <Faq t={t} />
      <Final t={t} start={start} />
    </div>
  );
}

/* ---------------- hero ---------------- */
function Hero({ t, start }: { t: LandingStrings; start: string }) {
  return (
    <section className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-20">
      {/* quiet paper texture: a faint dot grid fading out, no gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(var(--line-strong)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] opacity-60" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-16">
        <div className="animate-rise">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-soft sm:text-[0.8125rem]">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />{t.eyebrow}
          </p>
          <h1 className="text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[3.5rem] lg:text-[4rem]">
            {t.heroA} {t.heroB}{" "}
            <em className="font-serif-em whitespace-nowrap text-accent-ink">{t.heroEm}</em>{t.heroEnd}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-muted sm:text-xl sm:leading-relaxed">{t.sub}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink to={start} size="lg" iconRight={<ArrowRight />} className="sm:px-7">{t.ctaStart}</ButtonLink>
            <a href="#how" className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] px-5 font-medium text-fg transition-colors hover:bg-surface-2">
              <PlayCircle className="size-5 text-muted" aria-hidden />{t.ctaHow}
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {t.trust.map((x) => <li key={x} className="inline-flex items-center gap-2"><Check className="size-4 text-accent" aria-hidden />{x}</li>)}
          </ul>
        </div>
        <Reveal delay={120}><PathVisual t={t} /></Reveal>
      </div>
    </section>
  );
}

function PathVisual({ t }: { t: LandingStrings }) {
  const days = Array.from({ length: 66 }, (_, i) => i + 1);
  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
      <Card padding="none" className="relative rounded-[var(--radius-lg)] p-5 shadow-float sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.map.label}</p>
            <p className="tabular mt-0.5 text-xs text-muted">{t.map.day} {TODAY} / 66</p>
          </div>
          <ProgressRing value={TODAY - 1} max={66} size={44} stroke={4} label={t.map.label}>
            <span className="text-[0.6875rem]">{Math.round(((TODAY - 1) / 66) * 100)}%</span>
          </ProgressRing>
        </div>
        <ol className="grid grid-cols-11 gap-1.5 sm:gap-2" aria-label={t.map.label}>
          {days.map((d) => {
            const s = cellState(d);
            return (
              <li key={d} title={`${t.map.day} ${d}`}
                className={cn(
                  "relative grid aspect-square place-items-center rounded-[6px] text-[0.5625rem] font-semibold tabular sm:rounded-[8px] sm:text-[0.625rem]",
                  s === "done" && "bg-accent text-accent-fg",
                  s === "today" && "bg-surface text-accent-ink ring-2 ring-accent ring-offset-2 ring-offset-surface",
                  s === "boss" && "border border-gold-bright/70 bg-gold-soft text-gold-ink",
                  s === "rest" && "border border-dashed border-line-strong text-muted",
                  s === "locked" && "bg-surface-2 text-muted/70",
                )}>
                {s === "boss" ? <Crown className="size-3 sm:size-3.5" aria-hidden /> : s === "rest" ? <Moon className="size-2.5 sm:size-3" aria-hidden /> : d}
                <span className="sr-only">{t.map[s === "locked" ? "day" : s]}</span>
              </li>
            );
          })}
        </ol>
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-accent" aria-hidden />{t.map.done}</li>
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] ring-2 ring-accent" aria-hidden />{t.map.today}</li>
          <li className="inline-flex items-center gap-1.5"><Crown className="size-3 text-gold-bright" aria-hidden />{t.map.boss}</li>
          <li className="inline-flex items-center gap-1.5"><Moon className="size-3" aria-hidden />{t.map.rest}</li>
        </ul>
      </Card>
      {/* floating moments */}
      <div aria-hidden className="absolute -left-3 -top-5 hidden items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-3.5 text-xs font-medium shadow-card sm:flex lg:-left-10">
        <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-fg"><Check className="size-3.5" /></span>{t.float.task}
      </div>
      <div aria-hidden className="absolute -bottom-4 right-6 flex items-center gap-2 rounded-full border border-gold-bright/40 bg-surface px-3 py-1.5 text-xs font-semibold shadow-card">
        <Flame className="size-4 text-gold-bright" />{t.float.streak}
        <span className="h-3 w-px bg-line" />
        <span className="text-gold">{t.float.xp}</span>
      </div>
    </div>
  );
}

/* ---------------- why 66 ---------------- */
function Why({ t }: { t: LandingStrings }) {
  return (
    <section className="border-y border-line bg-surface px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="mx-auto grid max-w-6xl items-start gap-6 md:grid-cols-[auto_1fr] md:gap-16">
        <div className="flex items-baseline gap-3">
          <span className="font-serif-em text-[5.5rem] leading-[0.85] text-accent sm:text-[7.5rem]">66</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{t.whyTitle}</h2>
          <p className="mt-3 max-w-[64ch] text-[1.0625rem] leading-relaxed text-muted sm:text-lg">{t.whyBody}</p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- paths ---------------- */
function Paths({ t }: { t: LandingStrings }) {
  const cards = [
    { k: "apps" as const, icon: <Code2 />, data: t.apps },
    { k: "video" as const, icon: <Video />, data: t.video },
  ];
  return (
    <Section>
      <Reveal>
        <Eyebrow>{t.pathsEyebrow}</Eyebrow>
        <H2>{t.pathsTitle}</H2>
        <Lead>{t.pathsSub}</Lead>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.k} delay={i * 90}>
            <Card padding="lg" className="flex h-full flex-col rounded-[var(--radius-lg)]">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("grid size-12 place-items-center rounded-2xl [&_svg]:size-6",
                  c.k === "apps" ? "bg-accent-soft text-accent-ink" : "bg-info-soft text-info")} aria-hidden>{c.icon}</span>
                <Badge tone="outline">{c.data.tag}</Badge>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{c.data.name}</h3>
              <p className="mt-2 text-muted">{c.data.lead}</p>
              <ul className="mt-6 grid gap-3 border-t border-line pt-6">
                {c.data.items.map((x) => (
                  <li key={x} className="flex gap-3 text-[0.9375rem]">
                    <Check className="mt-0.5 size-[18px] shrink-0 text-accent" aria-hidden />{x}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal><p className="mt-8 flex items-start gap-2.5 text-sm text-muted"><Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{t.noNoCode}</p></Reveal>
    </Section>
  );
}

/* ---------------- a day ---------------- */
function Day({ t }: { t: LandingStrings }) {
  const icons = [<BookOpen key="a" />, <Hammer key="b" />, <Upload key="c" />, <Zap key="d" />];
  return (
    <Section id="how" className="bg-surface-2/60">
      <div className="grid gap-12 lg:grid-cols-[1fr_440px] lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow>{t.dayEyebrow}</Eyebrow>
            <H2>{t.dayTitle}</H2>
          </Reveal>
          <ol className="mt-10 grid gap-2">
            {t.steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 70}>
                <li className="grid grid-cols-[auto_1fr] gap-4 rounded-[var(--radius)] p-3 sm:gap-5 sm:p-4">
                  <div className="relative">
                    <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-accent-ink shadow-soft [&_svg]:size-5" aria-hidden>{icons[i]}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold"><span className="tabular mr-2 text-muted">{i + 1}</span>{s.t}</h3>
                      <span className="tabular text-sm text-muted">{s.m}</span>
                    </div>
                    <p className="mt-1 max-w-[52ch] text-muted">{s.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
        <Reveal delay={100} className="lg:pt-24"><TodayMock t={t} /></Reveal>
      </div>
    </Section>
  );
}

function TodayMock({ t }: { t: LandingStrings }) {
  const c = t.todayCard;
  return (
    <Card padding="none" className="overflow-hidden rounded-[var(--radius-lg)] shadow-float" aria-hidden>
      <div className="border-b border-line p-5">
        <div className="flex items-center justify-between">
          <Badge tone="accent">{c.label}</Badge>
          <Badge tone="gold" icon={<Zap />}>{c.xp}</Badge>
        </div>
        <p className="mt-4 text-lg font-semibold tracking-tight">{c.title}</p>
        <p className="mt-0.5 text-sm text-muted">{c.meta}</p>
        <ProgressBar value={2} max={4} label={c.title} size="sm" className="mt-4" />
      </div>
      <ul className="grid gap-1 p-3">
        {c.tasks.map((x, i) => (
          <li key={x} className={cn("flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[0.9375rem]", i === 2 && "bg-accent-soft/60")}>
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border",
              i < 2 ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface")}>
              {i < 2 && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className={cn(i < 2 && "text-muted line-through decoration-line-strong")}>{x}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- game ---------------- */
function Game({ t }: { t: LandingStrings }) {
  const icons = [<Zap key="a" />, <Flame key="b" />, <Medal key="c" />, <Trophy key="d" />];
  const p = t.profile;
  return (
    <Section>
      <div className="grid items-center gap-12 lg:grid-cols-[440px_1fr] lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <Card padding="none" className="rounded-[var(--radius-lg)] p-6 shadow-float sm:p-7" aria-hidden>
            <div className="flex items-center gap-4">
              <Avatar name={p.name} size={56} ring="gold" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-muted">{p.track}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-[var(--radius)] border border-line">
              {[{ v: "23", l: p.streak, i: <Flame className="size-4 text-gold-bright" /> }, { v: "2 840", l: p.xp, i: <Zap className="size-4 text-gold-bright" /> }, { v: "#14", l: p.rank, i: <Trophy className="size-4 text-gold-bright" /> }].map((s) => (
                <div key={s.l} className="px-3 py-3.5 text-center">
                  <p className="tabular inline-flex items-center gap-1 text-lg font-semibold">{s.i}{s.v}</p>
                  <p className="text-xs text-muted">{s.l}</p>
                </div>
              ))}
            </div>
            <ProgressBar value={340} max={500} tone="gold" label={p.track} showValue="340 / 500 XP" className="mt-6" />
            <div className="mt-6 flex flex-wrap gap-2">
              {p.badges.map((b, i) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-gold-bright/40 bg-gold-soft py-1 pl-1 pr-3 text-xs font-medium text-gold-ink">
                  <span className="grid size-5 place-items-center rounded-full bg-gold-bright text-white dark:text-bg">
                    {[<Send key="a" className="size-3" />, <Sparkles key="b" className="size-3" />, <Flame key="c" className="size-3" />][i]}
                  </span>{b}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>
        <div className="order-1 lg:order-2">
          <Reveal>
            <Eyebrow className="text-gold">{t.gameEyebrow}</Eyebrow>
            <H2>{t.gameTitle}</H2>
            <Lead>{t.gameSub}</Lead>
          </Reveal>
          <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {t.gameItems.map((g, i) => (
              <Reveal key={g.t} delay={i * 60}>
                <div className="flex gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-gold-soft text-gold-ink [&_svg]:size-[18px]" aria-hidden>{icons[i]}</span>
                  <div>
                    <h3 className="font-semibold">{g.t}</h3>
                    <p className="mt-1 text-[0.9375rem] text-muted">{g.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- studio ---------------- */
function Studio({ t }: { t: LandingStrings }) {
  return (
    <Section className="bg-surface-2/60">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Eyebrow>{t.studioEyebrow}</Eyebrow>
          <H2>{t.studioTitle}</H2>
          <Lead>{t.studioSub}</Lead>
        </Reveal>
        <Reveal delay={100}>
          <Card padding="none" className="overflow-hidden rounded-[var(--radius-lg)] shadow-float" aria-hidden>
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
              <Clapperboard className="size-4 text-muted" />
              <span className="text-sm font-medium">{t.studioEyebrow}</span>
            </div>
            <div className="grid gap-5 p-5">
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
                {t.studioTypes.map((x, i) => (
                  <span key={x} className={cn("inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-sm font-medium",
                    i === 1 ? "border-fg bg-fg text-bg" : "border-line text-muted")}>{x}</span>
                ))}
              </div>
              <div className="rounded-[var(--radius-sm)] border border-line-strong bg-surface p-3.5 text-[0.9375rem]">{t.studioBrief}</div>
              <div className="grid grid-cols-5 gap-2">
                {t.studioScenes.map((s, i) => (
                  <div key={s} className="min-w-0">
                    <div className={cn("relative grid aspect-[9/14] place-items-center overflow-hidden rounded-[10px] border",
                      i < 2 ? "border-accent/30 bg-accent-soft" : i === 2 ? "border-accent bg-surface" : "border-line bg-surface-2")}>
                      {i < 2 ? <Film className="size-4 text-accent-ink" /> : i === 2 ? <span className="size-4 animate-spin-soft rounded-full border-2 border-accent border-r-transparent" /> : <FileText className="size-4 text-muted/70" />}
                      <span className="tabular absolute left-1.5 top-1 text-[0.625rem] font-semibold text-muted">{i + 1}</span>
                    </div>
                    <p className="mt-1.5 truncate text-center text-[0.6875rem] text-muted">{s}</p>
                  </div>
                ))}
              </div>
              <ProgressBar value={52} label={t.studioStatus} showValue size="sm" />
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------- library ---------------- */
function LibrarySection({ t }: { t: LandingStrings }) {
  const kindIcon = (k: string) => k === "YouTube" ? <PlayCircle /> : k === "Reel" || k === "Рилс" ? <Video /> : k === "Telegram" ? <Send /> : <FileText />;
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <Eyebrow>{t.libEyebrow}</Eyebrow>
          <H2>{t.libTitle}</H2>
          <Lead>{t.libSub}</Lead>
        </Reveal>
        <div className="grid content-center gap-3">
          {t.libItems.map((r, i) => (
            <Reveal key={r.t} delay={i * 80}>
              <Card padding="sm" className="flex items-center gap-4" aria-hidden>
                <span className="grid size-14 shrink-0 place-items-center rounded-[12px] bg-surface-2 text-muted [&_svg]:size-6">{kindIcon(r.kind)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{r.t}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    <span>{r.kind}</span><span aria-hidden>·</span><span>{r.meta}</span>
                  </p>
                </div>
                <Library className="hidden size-4 shrink-0 text-muted sm:block" />
              </Card>
            </Reveal>
          ))}
          <Reveal><p className="pl-1 pt-1 text-sm text-muted"><span className="font-medium text-accent-ink">↳</span> {t.libMore}</p></Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ---------------- phases ---------------- */
function Phases({ t }: { t: LandingStrings }) {
  return (
    <Section className="border-t border-line">
      <Reveal>
        <Eyebrow>{t.phasesEyebrow}</Eyebrow>
        <H2>{t.phasesTitle}</H2>
      </Reveal>
      <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {t.phases.map((p, i) => (
          <li key={p.t} className="bg-surface p-6 sm:p-7">
            <Reveal delay={i * 70}>
              <p className="tabular text-sm font-medium text-muted">{t.phaseDays[i]}</p>
              <div className="mt-4 flex items-center gap-2">
                {Array.from({ length: 4 }, (_, j) => (
                  <span key={j} className={cn("h-1.5 flex-1 rounded-full", j <= i ? "bg-accent" : "bg-surface-3")} aria-hidden />
                ))}
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{p.t}</h3>
              <p className="mt-1.5 text-[0.9375rem] text-muted">{p.d}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------- faq ---------------- */
function Faq({ t }: { t: LandingStrings }) {
  return (
    <Section className="pt-4 sm:pt-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal><H2>{t.faqTitle}</H2></Reveal>
        <div className="divide-y divide-line border-y border-line">
          {t.faq.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-[1.0625rem] font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="max-w-[62ch] pb-5 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------- final CTA ---------------- */
function Final({ t, start }: { t: LandingStrings; start: string }) {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] bg-accent px-6 py-14 text-center text-accent-fg sm:px-12 sm:py-20">
          <LeafMark size={260} mono className="pointer-events-none absolute -bottom-16 -right-10 text-accent-fg opacity-[0.08]" />
          <h2 className="mx-auto max-w-[20ch] text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">{t.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[1.0625rem] opacity-90 sm:text-lg">{t.finalSub}</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to={start} size="lg" variant="secondary" iconRight={<ArrowRight />}
              className="bg-accent-fg text-accent hover:bg-accent-fg/90 focus-visible:outline-accent-fg sm:px-8">{t.ctaStart}</ButtonLink>
          </div>
          <p className="mt-4 text-sm opacity-90">{t.finalNote}</p>
        </div>
      </Reveal>
    </section>
  );
}
