// OWNER: library agent. Founder admin, guarded by ADMIN_TOKEN (stored server-side as an httpOnly cookie).
import { useCallback, useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import { AiNotice, Badge, Button, Card, Input, PageHeader, Spinner } from "@web/ui";
import Board from "./Board";
import AddResources from "./AddResources";
import Review from "./Review";
import Guide from "./Guide";
import Dashboard from "./Dashboard";

export interface Session { configured: boolean; authed: boolean; ai: boolean }

export default function Admin() {
  const s = useStrings(strings);
  const lang = useLang();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<{ ai: boolean; model: string; mediaWorker: boolean } | null>(null);
  const load = useCallback(() => api<Session>("/admin/session").then(setSession).catch(() => setSession({ configured: false, authed: false, ai: false })), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (session?.authed) api<typeof status>("/pipeline/status").then(setStatus).catch(() => {}); }, [session?.authed]);

  if (!session) return <div className="grid place-items-center py-24 text-muted"><Spinner className="size-6" /></div>;
  if (!session.authed) return <Gate session={session} onDone={load} />;

  const tab = "relative -mb-px inline-flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 border-transparent px-1 text-sm font-medium text-muted hover:text-fg aria-[current=page]:border-accent aria-[current=page]:text-fg";
  return (
    <div>
      <PageHeader
        eyebrow="FlowLeaf 66 · admin"
        title={s.title}
        description={s.subtitle}
        actions={<>
          {status && <Badge tone={status.ai ? "accent" : "gold"}>{status.ai ? s.ai.on(status.model) : s.ai.off}</Badge>}
          <Button size="sm" variant="ghost" onClick={async () => { await api("/admin/logout", { method: "POST" }); load(); }}>{s.gate.logout}</Button>
        </>}
        className="mb-6 sm:mb-6"
      />
      {status && !status.ai && <AiNotice title={s.ai.off} className="mb-6">{s.ai.offBody}</AiNotice>}
      <nav className="no-scrollbar mb-6 flex gap-6 overflow-x-auto border-b border-line">
        <NavLink end to={`/${lang}/admin`} className={tab}>{s.nav.board}</NavLink>
        <NavLink to={`/${lang}/admin/add`} className={tab}>{s.nav.add}</NavLink>
        <NavLink to={`/${lang}/admin/stats`} className={tab}>{s.nav.stats}</NavLink>
        <NavLink to={`/${lang}/admin/guide`} className={tab}>{s.nav.guide}</NavLink>
      </nav>
      <Routes>
        <Route index element={<Board />} />
        <Route path="add" element={<AddResources />} />
        <Route path="stats" element={<Dashboard />} />
        <Route path="guide" element={<Guide />} />
        <Route path="r/:id" element={<Review />} />
      </Routes>
    </div>
  );
}

function Gate({ session, onDone }: { session: Session; onDone: () => void }) {
  const s = useStrings(strings);
  const [token, setToken] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-sm py-12">
      <Card>
        <h1 className="text-xl font-semibold">{s.gate.title}</h1>
        {!session.configured ? <p className="mt-2 text-sm leading-relaxed text-muted">{s.gate.notConfigured}</p> : (
          <form className="mt-4 space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true); setErr(false);
            try { await api("/admin/login", { method: "POST", json: { token } }); onDone(); } catch { setErr(true); } finally { setBusy(false); }
          }}>
            <p className="text-sm text-muted">{s.gate.body}</p>
            <label className="block">
              <span className="text-sm font-medium">{s.gate.label}</span>
              <Input type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} autoFocus className="mt-1.5" invalid={err} />
            </label>
            {err && <p role="alert" className="text-sm text-danger">{s.gate.wrong}</p>}
            <Button type="submit" variant="primary" block loading={busy} disabled={!token}>{s.gate.submit}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
