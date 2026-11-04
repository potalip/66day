// OWNER: library agent. The student's saved list ("add to today").
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import type { ResourceCard } from "./types";
import { ResourceCardView } from "./ResourceCardView";
import { ArrowIcon, Button, Empty, Skeleton } from "./ui";

type Item = ResourceCard & { forDate: string | null; doneAt: number | null };

export default function MyList() {
  const s = useStrings(strings);
  const lang = useLang();
  const [data, setData] = useState<{ today: string; items: Item[] } | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api<{ today: string; items: Item[] }>(`/library/me?lang=${lang}`).then(setData).catch(() => setErr(true)); }, [lang]);
  const todayItems = data?.items.filter((i) => i.forDate === data.today && !i.doneAt) ?? [];
  const rest = data?.items.filter((i) => !todayItems.includes(i)) ?? [];
  return (
    <div className="space-y-8">
      <Link to={`/${lang}/library`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowIcon dir="left" className="size-4" />{s.back}</Link>
      <h1 className="text-3xl font-semibold tracking-tight">{s.myList}</h1>
      {err ? <Empty title={s.error} /> : !data ? <Skeleton className="h-40 w-full" /> : data.items.length === 0 ? (
        <Empty title={s.myList} body={s.myListEmpty} action={<Link to={`/${lang}/library`}><Button variant="primary">{s.title}</Button></Link>} />
      ) : (
        <>
          {todayItems.length > 0 && (
            <section><h2 className="mb-3 text-lg font-semibold">{s.addedToday}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{todayItems.map((r) => <ResourceCardView key={r.id} r={r} />)}</div></section>
          )}
          {rest.length > 0 && (
            <section><h2 className="mb-3 text-lg font-semibold">{s.allResources}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map((r) => (
                <div key={r.id} className={r.doneAt ? "opacity-70" : ""}><ResourceCardView r={r} compact /></div>
              ))}</div></section>
          )}
        </>
      )}
    </div>
  );
}
