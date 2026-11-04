// OWNER: library agent. Founder admin, guarded by ADMIN_TOKEN (stored server-side as an httpOnly cookie).
import { useCallback, useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router";
import { useLang, useStrings } from "@web/i18n";
import { api } from "@web/api";
import { strings } from "./strings";
import { Button, Card, Spinner, cx } from "../library/ui";
import Board from "./Board";
import AddResources from "./AddResources";
import Review from "./Review";

export interface Session { configured: boolean; authed: boolean; ai: boolean }

export default function Admin() {
  const s = useStrings(strings);
  const lang = useLang();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<{ ai: boolean; model: string; mediaWorker: boolean } | null>(null);
  const load = useCallback(() => api<Session>("/admin/session").then(setSession).catch(() => setSession({ configured: false, authed: false, ai: false })), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (session?.authed) api<typeof status>("/pipeline/status").then(setStatus).catch(() => {}); }, [session?.authed]);

  if (!session) return <div className="grid place-items-center py-24"><Spinner className="size-6" /></div>;
  if (!session.authed) return <Gate session={session} onDone={load} />;

  const tab = "rounded-lg px-3 py-1.5 text-sm text-muted hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg";
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h1>
          <p className="mt-1 max-w-2xl text-muted">{s.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.ai ? "bg-accent-soft text-accent" : "bg-gold-soft text-gold")}>
              <span className={cx("size-1.5 rounded-full", status.ai ? "bg-accent" : "bg-gold")} />{status.ai ? s.ai.on(status.model) : s.ai.off}
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={async () => { await api("/admin/logout", { method: "POST" }); load(); }}>{s.gate.logout}</Button>
        </div>
      </header>
      {status && !status.ai && <Card className="border-gold/40 bg-gold-soft p-4 text-sm leading-relaxed">{s.ai.offBody}</Card>}
      <nav className="flex gap-1 border-b border-line pb-2">
        <NavLink end to={`/${lang}/admin`} className={tab}>{s.nav.board}</NavLink>
        <NavLink to={`/${lang}/admin/add`} className={tab}>{s.nav.add}</NavLink>
      </nav>
      <Routes>
        <Route index element={<Board />} />
        <Route path="add" element={<AddResources />} />
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
      <Card className="p-6">
        <h1 className="text-xl font-semibold">{s.gate.title}</h1>
        {!session.configured ? <p className="mt-2 text-sm leading-relaxed text-muted">{s.gate.notConfigured}</p> : (
          <form className="mt-4 space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true); setErr(false);
            try { await api("/admin/login", { method: "POST", json: { token } }); onDone(); } catch { setErr(true); } finally { setBusy(false); }
          }}>
            <p className="text-sm text-muted">{s.gate.body}</p>
            <label className="block">
              <span className="text-sm font-medium">{s.gate.label}</span>
              <input type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} autoFocus
                className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent" aria-invalid={err} />
            </label>
            {err && <p role="alert" className="text-sm text-danger">{s.gate.wrong}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={!token || busy}>{busy ? <Spinner /> : s.gate.submit}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
