import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, Sparkles, X } from "lucide-react";
import { cn } from "./cn";
import { useStrings } from "@web/i18n";
import { uiStrings } from "./strings";

export type ToastTone = "neutral" | "success" | "error" | "reward";
export type ToastInput = { title: ReactNode; description?: ReactNode; tone?: ToastTone; duration?: number; action?: { label: string; onClick: () => void } };
type ToastItem = ToastInput & { id: number };

const Ctx = createContext<{ toast: (t: ToastInput) => number; dismiss: (id: number) => void } | null>(null);

const icons = {
  neutral: <Info aria-hidden className="size-[18px] text-muted" />,
  success: <CheckCircle2 aria-hidden className="size-[18px] text-accent" />,
  error: <AlertTriangle aria-hidden className="size-[18px] text-danger" />,
  reward: <Sparkles aria-hidden className="size-[18px] text-gold-bright" />,
};

/**
 * Wrap the app once (Shell does this). Then: const { toast } = useToast(); toast({ title: "Saved", tone: "success" }).
 * tone="reward" is the gold variant for XP / badges. Errors stay until dismissed unless duration is given.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: ToastInput) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-3), { ...t, id }]);
    return id;
  }, []);
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6">
        {items.map((t) => <ToastView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </Ctx.Provider>
  );
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = useStrings(uiStrings);
  const tone = item.tone ?? "neutral";
  const duration = item.duration ?? (tone === "error" ? 0 : 4500);
  useEffect(() => {
    if (!duration) return;
    const h = setTimeout(onDismiss, duration);
    return () => clearTimeout(h);
  }, [duration, onDismiss]);
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn(
      "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius)] border bg-surface p-3.5 pr-2 shadow-float",
      tone === "reward" ? "border-gold-bright/50" : "border-line",
    )}>
      <div className="mt-0.5">{icons[tone]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
        {item.action && (
          <button type="button" onClick={() => { item.action!.onClick(); onDismiss(); }}
            className="mt-1.5 text-sm font-medium text-accent-ink hover:underline">{item.action.label}</button>
        )}
      </div>
      <button type="button" onClick={onDismiss} aria-label={s.dismiss}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"><X className="size-4" aria-hidden /></button>
    </div>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) {
    // Outside the provider (e.g. tests): degrade to console so nothing crashes.
    return { toast: (t: ToastInput) => { console.info("[toast]", t.title); return 0; }, dismiss: () => {} };
  }
  return c;
}
