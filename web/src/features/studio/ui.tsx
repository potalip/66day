/**
 * Small local UI primitives for the Studio, built only on the shared design tokens. When the design system's
 * `@web/ui` lands on main these can be swapped for its Button/Card/Field one by one.
 */
import { type ButtonHTMLAttributes, type ReactNode, useId } from "react";

export function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({ variant = "secondary", size = "md", loading, className, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const v = {
    primary: "bg-accent text-accent-fg hover:brightness-110 shadow-sm",
    secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
    ghost: "text-muted hover:text-fg hover:bg-surface-2",
    danger: "border border-line bg-surface text-danger hover:bg-surface-2",
  }[variant];
  const s = { sm: "h-8 px-3 text-sm gap-1.5", md: "h-10 px-4 text-[0.9375rem] gap-2", lg: "h-12 px-6 text-base gap-2" }[size];
  return (
    <button type="button" {...rest} disabled={rest.disabled || loading}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-[10px] font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none",
        v, s, className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function Card({ className, children, as: As = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" }) {
  return <As className={cx("rounded-[var(--radius)] border border-line bg-surface", className)}>{children}</As>;
}

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "gold" | "danger"; className?: string }) {
  const t = {
    neutral: "bg-surface-2 text-muted", accent: "bg-accent-soft text-accent", gold: "bg-gold-soft text-gold", danger: "bg-surface-2 text-danger",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", t, className)}>{children}</span>;
}

export function Label({ htmlFor, children, hint, right }: { htmlFor?: string; children: ReactNode; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">{children}</label>
        {right && <span className="text-xs text-muted tabular-nums">{right}</span>}
      </div>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[0.9375rem] text-fg placeholder:text-muted/70 " +
  "focus:outline-2 focus:outline-offset-0 focus:outline-accent aria-[invalid=true]:border-danger";

export function TextInput(p: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; invalid?: boolean; className?: string; mono?: boolean; "aria-label"?: string }) {
  return <input id={p.id} aria-label={p["aria-label"]} value={p.value} maxLength={p.maxLength} placeholder={p.placeholder} aria-invalid={p.invalid || undefined}
    onChange={(e) => p.onChange(e.target.value)} className={cx(inputCls, "h-10", p.mono && "font-mono text-sm", p.className)} />;
}

export function TextArea(p: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; rows?: number; invalid?: boolean; mono?: boolean; className?: string; "aria-label"?: string }) {
  return <textarea id={p.id} aria-label={p["aria-label"]} value={p.value} maxLength={p.maxLength} rows={p.rows ?? 3} placeholder={p.placeholder}
    aria-invalid={p.invalid || undefined} spellCheck={!p.mono}
    onChange={(e) => p.onChange(e.target.value)} className={cx(inputCls, "resize-y leading-relaxed", p.mono && "font-mono text-[13px] leading-6", p.className)} />;
}

export function SelectInput(p: { id?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string; inline?: boolean; "aria-label"?: string }) {
  return (
    <select id={p.id} aria-label={p["aria-label"]} value={p.value} onChange={(e) => p.onChange(e.target.value)}
      className={cx(p.inline ? inputCls.replace("w-full ", "w-auto ") : inputCls, "h-10 pr-8", p.className)}>
      {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cx("relative mt-0.5 h-6 w-10 shrink-0 rounded-full border border-line transition focus-visible:outline-2 focus-visible:outline-accent",
          checked ? "bg-accent" : "bg-surface-2")}>
        <span className={cx("absolute top-0.5 size-[18px] rounded-full bg-surface shadow transition-all", checked ? "left-[19px]" : "left-0.5")} />
      </button>
      <label htmlFor={id} className="text-sm"><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</label>
    </div>
  );
}

/** Segmented control (radio group). */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-[12px] border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx("rounded-[9px] px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent",
            value === o.value ? "bg-surface text-fg shadow-sm font-medium" : "text-muted hover:text-fg")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  );
}

export function Notice({ tone = "neutral", title, children, action }: { tone?: "neutral" | "warn" | "danger"; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const bar = { neutral: "bg-accent", warn: "bg-gold", danger: "bg-danger" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className="relative flex flex-wrap items-start gap-3 overflow-hidden rounded-[12px] border border-line bg-surface p-4 pl-5">
      <span aria-hidden className={cx("absolute inset-y-0 left-0 w-1", bar)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
}

/** Aspect-ratio frame icon for a format. */
export function FormatIcon({ format, className }: { format: string; className?: string }) {
  const [w, h] = format === "9x16" ? [9, 16] : format === "16x9" ? [16, 9] : [12, 12];
  return (
    <svg viewBox="0 0 18 18" className={cx("size-4", className)} aria-hidden>
      <rect x={(18 - w) / 2} y={(18 - h) / 2} width={w} height={h} rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Icon({ name, className }: { name: "play" | "pause" | "restart" | "up" | "down" | "copy" | "trash" | "plus" | "sparkle" | "download" | "back" | "film"; className?: string }) {
  const d: Record<string, ReactNode> = {
    play: <path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" />,
    pause: <><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>,
    restart: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
    up: <path d="M6 15l6-6 6 6" />, down: <path d="M6 9l6 6 6-6" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
    download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
    back: <path d="M15 6l-6 6 6 6" />,
    film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx("size-4", className)} aria-hidden>{d[name]}</svg>;
}
