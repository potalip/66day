// OWNER: library agent. Student library: search, filters, curated shelves, grid.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import type { Collection, LibraryList } from "./types";
import { ResourceCardView } from "./ResourceCardView";
import { ButtonLink, PageHeader, Select } from "@web/ui";
import { Button, Chip, Empty, Skeleton, SearchIcon, cx } from "./ui";

const TRACKS = ["common", "apps", "video"] as const;
const TYPES = ["youtube", "instagram", "link", "upload"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function Library() {
  const s = useStrings(strings);
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const f = { q: params.get("q") ?? "", track: params.get("track") ?? "", type: params.get("type") ?? "", level: params.get("level") ?? "", topic: params.get("topic") ?? "" };
  const [q, setQ] = useState(f.q);
  const [data, setData] = useState<LibraryList | null>(null);
  const [cols, setCols] = useState<Collection[] | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const filtered = !!(f.q || f.track || f.type || f.level || f.topic);

  const set = (k: keyof typeof f, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v); else n.delete(k);
    setParams(n, { replace: true });
  };

  // Debounced search → URL
  useEffect(() => {
    const t = setTimeout(() => { if (q.trim() !== f.q) set("q", q.trim()); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const query = useMemo(() => {
    const u = new URLSearchParams({ lang });
    for (const [k, v] of Object.entries(f)) if (v) u.set(k, v);
    return u.toString();
  }, [lang, f.q, f.track, f.type, f.level, f.topic]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    setError(false);
    api<LibraryList>(`/library?${query}`).then((d) => alive && setData(d)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [query, reload]);

  useEffect(() => {
    api<Collection[]>(`/library/collections?lang=${lang}`).then(setCols).catch(() => setCols([]));
  }, [lang]);

  const facets = data?.facets;
  const topics = facets ? Object.entries(facets.topic).sort((a, b) => b[1] - a[1]).map(([k]) => k) : [];
  const types = TYPES.filter((t) => facets?.type[t]);

  return (
    <div className="space-y-8">
      <PageHeader title={s.title} description={s.lead} className="mb-0 sm:mb-0"
        actions={<ButtonLink to={`/${lang}/library/me`} variant="soft" size="sm">{s.myList}</ButtonLink>} />

      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">{s.searchLabel}</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.searchPlaceholder}
            className="h-12 w-full rounded-[var(--radius)] border border-line-strong bg-surface pl-11 pr-4 text-base text-fg placeholder:text-muted/80 transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={s.filters.track}>
          <Chip active={!f.track} onClick={() => set("track", "")}>{s.all}</Chip>
          {TRACKS.map((t) => <Chip key={t} active={f.track === t} onClick={() => set("track", f.track === t ? "" : t)}>{s.track[t]}</Chip>)}
          <span className="mx-1 w-px shrink-0 self-stretch bg-line" aria-hidden />
          {types.map((t) => <Chip key={t} active={f.type === t} onClick={() => set("type", f.type === t ? "" : t)}>{s.type[t]}</Chip>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label={s.filters.level} value={f.level} onChange={(v) => set("level", v)} options={[["", s.filters.level], ...LEVELS.map((l) => [l, s.level[l]] as [string, string])]} />
          <FilterSelect label={s.filters.topic} value={f.topic} onChange={(v) => set("topic", v)} options={[["", s.filters.anyTopic], ...topics.map((t) => [t, s.topics[t] ?? t] as [string, string])]} />
          {filtered && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setParams(new URLSearchParams(), { replace: true }); }}>{s.filters.clear}</Button>}
          {data && <span className="ml-auto text-sm text-muted" aria-live="polite">{s.results(data.total)}</span>}
        </div>
      </div>

      {error ? (
        <Empty title={s.error} action={<Button onClick={() => setReload((n) => n + 1)}>{s.retry}</Button>} />
      ) : !data ? (
        <Grid>{Array.from({ length: 6 }, (_, i) => <div key={i} className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface"><Skeleton className="aspect-video rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div></div>)}</Grid>
      ) : data.total === 0 ? (
        filtered ? <Empty title={s.emptyTitle} body={s.emptyBody} action={<Button onClick={() => { setQ(""); setParams(new URLSearchParams(), { replace: true }); }}>{s.filters.clear}</Button>} />
          : <Empty title={s.emptyLibraryTitle} body={s.emptyLibraryBody} />
      ) : (
        <>
          {!filtered && cols && cols.length > 0 && (
            <div className="space-y-10">
              {cols.map((c) => (
                <section key={c.id} aria-labelledby={`col-${c.id}`}>
                  <div className="mb-3 flex items-baseline justify-between gap-4">
                    <div>
                      <h2 id={`col-${c.id}`} className="text-xl font-semibold tracking-tight">{c.title}</h2>
                      {c.description && <p className="mt-0.5 text-sm text-muted">{c.description}</p>}
                    </div>
                  </div>
                  <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                    {c.items.map((r) => <div key={r.id} className="w-[72%] shrink-0 snap-start sm:w-64"><ResourceCardView r={r} compact /></div>)}
                  </div>
                </section>
              ))}
            </div>
          )}
          <section aria-label={s.allResources}>
            {!filtered && <h2 className="mb-3 text-xl font-semibold tracking-tight">{s.allResources}</h2>}
            <Grid>{data.items.map((r) => <ResourceCardView key={r.id} r={r} />)}</Grid>
          </section>
        </>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className={cx("[&_select]:h-9 [&_select]:rounded-full [&_select]:text-sm", value ? "[&_select]:border-fg" : "[&_select]:text-muted")}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </Select>
  );
}
