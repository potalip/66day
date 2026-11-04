// OWNER: library agent. Pipeline board: status filters, live steps per resource, bulk actions.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { Button, ButtonLink, Checkbox, EmptyState, Input, Skeleton, Spinner, cn, useToast } from "@web/ui";
import { strings } from "./strings";
import type { Resource } from "../library/types";
import { Chip, LeafIcon, Pill, Thumb, hostOf } from "../library/ui";
import { Attention, Stepper, type Step } from "./parts";

type Item = Resource & { materials: Record<string, string>; steps: Step[]; attention: string | null; lastEvent: { message: string; status: string } | null };
interface BoardData { counts: Record<string, number>; total: number; items: Item[] }
const STATUSES = ["review", "processing", "published", "failed", "draft"] as const;

export function statusTone(st: string) {
  return st === "published" ? "accent" : st === "failed" ? "danger" : st === "review" ? "gold" : st === "processing" ? "info" : "neutral";
}

export default function Board() {
  const s = useStrings(strings);
  const lang = useLang();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const [data, setData] = useState<BoardData | null>(null);
  const [tick, setTick] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const live = !!data?.items.some((i) => i.steps.some((x) => x.state === "active"));

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
  useEffect(() => { setSel(new Set()); }, [status, q]);

  const bulk = async (action: "publish" | "unpublish" | "rebuild" | "delete") => {
    if (action === "delete" && !confirm(s.bulk.confirmDelete(sel.size))) return;
    setBusy(action);
    try {
      const r = await api<{ done: string[]; skipped: string[] }>("/admin/bulk", { method: "POST", json: { ids: [...sel], action } });
      toast({ title: s.bulk.done(r.done.length, r.skipped.length), tone: r.skipped.length ? "neutral" : "success" });
      setSel(new Set()); setTick((n) => n + 1);
    } catch (e) { toast({ title: (e as Error).message, tone: "error" }); } finally { setBusy(null); }
  };
  const toggle = (id: string) => setSel((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Chip active={!status} count={data?.total} onClick={() => setParams({})}>{s.all}</Chip>
          {STATUSES.map((st) => (
            <Chip key={st} active={status === st} count={data?.counts[st] ?? 0} onClick={() => setParams(status === st ? {} : { status: st })}>{s.status[st]}</Chip>
          ))}
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={s.search} aria-label={s.search} className="h-9 text-sm lg:w-64" />
          {live ? <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted"><Spinner />{s.autoRefresh}</span>
            : <Button size="sm" variant="ghost" onClick={() => setTick((n) => n + 1)}>{s.refresh}</Button>}
        </div>
      </div>

      {data && data.items.length > 0 && (
        <div className={cn("sticky top-16 z-[5] flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 transition-colors",
          sel.size ? "border-accent/30 bg-accent-soft" : "border-line bg-surface")}>
          <Checkbox label={sel.size ? s.bulk.selected(sel.size) : s.bulk.selectAll} checked={sel.size > 0 && sel.size === data.items.length}
            onChange={() => setSel(sel.size === data.items.length ? new Set() : new Set(data.items.map((i) => i.id)))} />
          {sel.size > 0 && (
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button size="sm" variant="primary" loading={busy === "publish"} onClick={() => bulk("publish")}>{s.bulk.publish}</Button>
              <Button size="sm" variant="outline" loading={busy === "unpublish"} onClick={() => bulk("unpublish")}>{s.bulk.unpublish}</Button>
              <Button size="sm" variant="outline" loading={busy === "rebuild"} onClick={() => bulk("rebuild")}>{s.bulk.rebuild}</Button>
              <Button size="sm" variant="ghost" className="text-danger" loading={busy === "delete"} onClick={() => bulk("delete")}>{s.bulk.del}</Button>
            </div>
          )}
        </div>
      )}

      {!data ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        : data.items.length === 0 ? (
          <EmptyState icon={<LeafIcon />} tone="accent" title={status ? s.emptyFilter : s.empty}
            action={!status && <ButtonLink to={`/${lang}/admin/add`} variant="primary" icon={<Plus />}>{s.nav.add}</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            {data.items.map((r) => (
              <li key={r.id} className={cn("flex gap-3 p-3 sm:items-center sm:gap-4 sm:p-4", sel.has(r.id) && "bg-accent-soft/50")}>
                <input type="checkbox" aria-label={r.title || r.url || r.id} checked={sel.has(r.id)} onChange={() => toggle(r.id)}
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)] sm:mt-0" />
                <Link to={`/${lang}/admin/r/${r.id}`} className="flex min-w-0 flex-1 gap-3 sm:items-center sm:gap-4">
                  <Thumb src={r.thumbnailUrl} type={r.sourceType} label={r.title} host={hostOf(r.url)} className="w-20 shrink-0 rounded-lg sm:w-28" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={statusTone(r.status)}>{s.status[r.status]}</Pill>
                      <span className="min-w-0 truncate font-medium">{r.title || r.url}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stepper steps={r.steps} compact />
                      <span className="text-xs text-muted">{hostOf(r.url) || "upload"} · {s.time(r.updatedAt)}</span>
                    </div>
                    {r.attention && r.status !== "published" ? <Attention reason={r.attention} />
                      : r.lastEvent && <p className={cn("line-clamp-1 text-xs", r.lastEvent.status === "error" ? "text-danger" : "text-muted")}>{r.lastEvent.message}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
