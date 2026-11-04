// OWNER: library agent. Resource page: player, lesson in the student's language, actions, related.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import type { ResourceDetail } from "./types";
import { Lesson } from "./Lesson";
import { Player } from "./Player";
import { ResourceCardView } from "./ResourceCardView";
import { ArrowIcon, Button, Card, CheckIcon, ClockIcon, Empty, Pill, Skeleton, TypeIcon, hostOf } from "./ui";
import MyList from "./MyList";
import { ButtonLink } from "@web/ui";
import { showAwards } from "@web/features/game/widgets";
import type { Award } from "@shared/types";

export default function ResourcePage() {
  const { id = "" } = useParams();
  if (id === "me" || id === "my") return <MyList />;
  return <Resource id={id} />;
}

function Resource({ id }: { id: string }) {
  const s = useStrings(strings);
  const lang = useLang();
  const [d, setD] = useState<ResourceDetail | null>(null);
  const [err, setErr] = useState<"404" | "net" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setD(null); setErr(null);
    api<ResourceDetail>(`/library/${encodeURIComponent(id)}?lang=${lang}`)
      .then((x) => { if (alive) { setD(x); window.scrollTo({ top: 0 }); } })
      .catch((e: Error) => alive && setErr(e.message.startsWith("404") ? "404" : "net"));
    return () => { alive = false; };
  }, [id, lang]);

  useEffect(() => {
    if (d) document.title = `${d.material?.title ?? d.resource.title} · FlowLeaf 66`;
  }, [d]);

  const back = (
    <Link to={`/${lang}/library`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowIcon dir="left" className="size-4" />{s.back}
    </Link>
  );

  // Every state has exactly one <h1> (axe page-has-heading-one): visible on errors, screen-reader-only while loading.
  if (err) return (
    <div className="space-y-6">{back}
      <h1 className="text-2xl font-semibold tracking-tight">{err === "404" ? s.notFound : s.error}</h1>
      <Empty title={s.notFoundTitle} body={err === "404" ? s.notFoundBody : undefined} action={<ButtonLink to={`/${lang}/library`} variant="primary">{s.toLibrary}</ButtonLink>} />
    </div>
  );
  if (!d) return (
    <div className="space-y-6" aria-busy="true">{back}<h1 className="sr-only">{s.title}</h1><Skeleton className="h-9 w-3/4" /><Skeleton className="aspect-video w-full max-w-4xl" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
  );

  const r = d.resource, m = d.material;
  const title = m?.title ?? r.title;
  const foreign = r.origLang !== lang && r.origLang !== "other";

  const toggleToday = async () => {
    setBusy(true);
    try {
      if (d.saved?.isToday) { await api(`/library/${r.id}/today`, { method: "DELETE" }); setD({ ...d, saved: d.saved ? { ...d.saved, forDate: null, isToday: false } : null }); }
      else { const x = await api<{ forDate: string }>(`/library/${r.id}/today`, { method: "POST" }); setD({ ...d, saved: { forDate: x.forDate, doneAt: d.saved?.doneAt ?? null, isToday: true } }); }
    } finally { setBusy(false); }
  };
  const toggleDone = async () => {
    setBusy(true);
    const done = !d.saved?.doneAt;
    try {
      const res = await api<{ awards?: Award[] }>(`/library/${r.id}/done`, { method: "POST", json: { done } });
      showAwards(res.awards);
      setD({ ...d, saved: { forDate: d.saved?.forDate ?? null, isToday: d.saved?.isToday ?? false, doneAt: done ? Date.now() / 1000 : null } });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      {back}
      <header className="max-w-4xl space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5"><TypeIcon type={r.sourceType} className="size-4" />{s.type[r.sourceType]}{r.durationSec ? ` · ${s.minutes(Math.max(1, Math.round(r.durationSec / 60)))}` : ""}</span>
          {m?.estMinutes ? <span className="inline-flex items-center gap-1.5" title={s.lessonLength}><ClockIcon className="size-4" />{s.lessonTime(s.minutes(m.estMinutes))}</span> : null}
          <span>{s.level[r.level]}</span>
          {r.tracks.map((t) => <Pill key={t}>{s.track[t]}</Pill>)}
          {foreign && <Pill>{r.origLang === "en" ? s.inEnglish : s.inRussian}</Pill>}
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {m?.hook && <p className="max-w-[70ch] text-lg text-muted">{m.hook}</p>}
        {(r.author || title !== r.title) && (
          <p className="text-sm text-muted">
            {title !== r.title && <span className="italic">“{r.title}”</span>}
            {title !== r.title && r.author && " · "}
            {r.author && <>{s.by} {r.authorUrl ? <a className="underline-offset-2 hover:underline" href={r.authorUrl} target="_blank" rel="noreferrer">{r.author}</a> : r.author}</>}
          </p>
        )}
      </header>

      <div className="max-w-4xl"><Player r={r} title={title} /></div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {m ? <Lesson m={m} /> : (
            <Card className="max-w-[70ch] p-6">
              <p className="leading-relaxed">{s.noLesson}</p>
              {d.otherLangAvailable && <p className="mt-2 text-sm text-muted">{s.otherLangHint}</p>}
            </Card>
          )}
        </div>

        <aside className="order-first space-y-6 lg:order-none lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-2 p-4">
            <Button variant={d.saved?.isToday ? "secondary" : "primary"} className="w-full" onClick={toggleToday} disabled={busy} aria-pressed={!!d.saved?.isToday}>
              {d.saved?.isToday ? <><CheckIcon className="size-4" />{s.addedToday}</> : s.addToday}
            </Button>
            <Button variant="secondary" className="w-full" onClick={toggleDone} disabled={busy} aria-pressed={!!d.saved?.doneAt}>
              {d.saved?.doneAt ? <><CheckIcon className="size-4 text-accent" />{s.done}</> : s.markDone}
            </Button>
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
                {s.openOriginal} <span className="text-xs">({hostOf(r.url)})</span><ArrowIcon dir="up-right" className="size-4" />
              </a>
            )}
          </Card>

          {r.suggestedDays.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted">{s.curriculumDays}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {r.suggestedDays.map((x) => (
                  <Link key={`${x.day}-${x.track}`} to={`/${lang}/day/${x.day}`} className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-accent/60">
                    {s.day(x.day)}{x.track !== "common" && <span className="text-muted"> · {s.track[x.track as "apps" | "video"]}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(r.topics.length > 0 || (m?.tags.length ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {r.topics.map((t) => <Link key={t} to={`/${lang}/library?topic=${t}`}><Pill tone="accent">{s.topics[t] ?? t}</Pill></Link>)}
              {m?.tags.filter((t) => !r.topics.includes(t.replace(/\s+/g, "-"))).map((t) => <Pill key={t}>#{t}</Pill>)}
            </div>
          )}
        </aside>
      </div>

      {d.related.length > 0 && (
        <section aria-labelledby="rel" className="border-t border-line pt-8">
          <h2 id="rel" className="mb-4 text-xl font-semibold tracking-tight">{s.related}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{d.related.map((x) => <ResourceCardView key={x.id} r={x} compact />)}</div>
        </section>
      )}
    </div>
  );
}
