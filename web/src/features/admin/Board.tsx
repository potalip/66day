// OWNER: library agent. Queue status board.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import type { Resource } from "../library/types";
import { Button, Card, Chip, Empty, Pill, Skeleton, Spinner, Thumb, cx } from "../library/ui";

type Item = Resource & { materials: Record<string, string>; lastEvent: { message: string; status: string } | null };
interface BoardData { counts: Record<string, number>; total: number; items: Item[] }
const STATUSES = ["review", "processing", "published", "failed", "draft"] as const;

export function statusTone(st: string) {
  return st === "published" ? "accent" : st === "failed" ? "danger" : st === "review" ? "gold" : "neutral";
}

export default function Board() {
  const s = useStrings(strings);
  const lang = useLang();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const [data, setData] = useState<BoardData | null>(null);
  const [tick, setTick] = useState(0);
  const live = !!data?.items.some((i) => i.status === "processing" || ["queued", "generating"].some((x) => Object.values(i.materials).includes(x)));

  useEffect(() => {
    let alive = true;
    api<BoardData>(`/pipeline/board?${new URLSearchParams({ ...(status && { status }), ...(q && { q }) })}`).then((d) => alive && setData(d)).catch(() => {});
    return () => { alive = false; };
  }, [status, q, tick]);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Chip active={!status} onClick={() => setParams({})}>{s.all} {data && <span className="text-muted">{data.total}</span>}</Chip>
          {STATUSES.map((st) => (
            <Chip key={st} active={status === st} onClick={() => setParams(status === st ? {} : { status: st })}>
              {s.status[st]} {data && <span className="text-muted">{data.counts[st] ?? 0}</span>}
            </Chip>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.search} aria-label={s.search}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent lg:ml-auto lg:w-72" />
        <div className="flex items-center gap-2 text-xs text-muted">
          {live ? <><Spinner className="size-3" />{s.autoRefresh}</> : <Button size="sm" variant="ghost" onClick={() => setTick((n) => n + 1)}>{s.refresh}</Button>}
        </div>
      </div>

      {!data ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        : data.items.length === 0 ? <Empty title={status ? s.emptyFilter : s.empty} action={!status && <Link to={`/${lang}/admin/add`}><Button variant="primary">{s.nav.add}</Button></Link>} />
        : (
          <Card className="divide-y divide-line overflow-hidden">
            {data.items.map((r) => (
              <Link key={r.id} to={`/${lang}/admin/r/${r.id}`} className="flex gap-3 p-3 hover:bg-surface-2 sm:items-center sm:gap-4 sm:p-4">
                <Thumb src={r.thumbnailUrl} type={r.sourceType} label={r.title} className="w-24 shrink-0 rounded-lg sm:w-32" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={statusTone(r.status)}>{r.status === "processing" && <Spinner className="size-2.5" />}{s.status[r.status]}</Pill>
                    <span className="truncate font-medium">{r.title || r.url}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {r.audience.map((l) => (
                      <span key={l} className={cx(r.materials[l] === "ready" && "text-accent", r.materials[l] === "failed" && "text-danger")}>
                        {l.toUpperCase()}: {s.lessonState[r.materials[l] ?? "empty"]}
                      </span>
                    ))}
                    <span className={cx(r.transcriptState === "needed" && "text-gold")}>{s.transcript[r.transcriptState]}</span>
                    <span>{s.time(r.updatedAt)}</span>
                  </div>
                  {r.lastEvent && <p className={cx("line-clamp-1 text-xs", r.lastEvent.status === "error" ? "text-danger" : "text-muted")}>{r.lastEvent.message}</p>}
                </div>
              </Link>
            ))}
          </Card>
        )}
    </div>
  );
}
