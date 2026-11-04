/** Studio UI helpers: thin adapters over the shared design system (`@web/ui`) plus a few Studio-only pieces. */
import type { ReactNode } from "react";
import { Badge, Button as UIButton, type ButtonProps, Card as UICard, Input, ProgressBar as UIProgressBar, Segmented as UISegmented, Select, Switch, Textarea } from "@web/ui";

export function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

// Shared design-system components, adapted to the small API the Studio uses.
export { Spinner } from "@web/ui";

/** Kit button; Studio's default is the quiet "secondary" variant. */
export function Button({ variant = "secondary", ...rest }: ButtonProps) {
  return <UIButton variant={variant} {...rest} />;
}

export function Card({ className, children, as = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" }) {
  return <UICard as={as} padding="none" className={className}>{children}</UICard>;
}

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "gold" | "danger"; className?: string }) {
  return <Badge tone={tone} className={className}>{children}</Badge>;
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

export function TextInput(p: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; invalid?: boolean; className?: string; mono?: boolean; "aria-label"?: string }) {
  return <Input id={p.id} aria-label={p["aria-label"]} value={p.value} maxLength={p.maxLength} placeholder={p.placeholder} invalid={p.invalid}
    onChange={(e) => p.onChange(e.target.value)} className={cx(p.mono && "font-mono text-sm", p.className)} />;
}

export function TextArea(p: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; rows?: number; invalid?: boolean; mono?: boolean; className?: string; "aria-label"?: string }) {
  return <Textarea id={p.id} aria-label={p["aria-label"]} value={p.value} maxLength={p.maxLength} rows={p.rows ?? 3} placeholder={p.placeholder}
    invalid={p.invalid} spellCheck={!p.mono} onChange={(e) => p.onChange(e.target.value)}
    className={cx("min-h-0", p.mono && "font-mono text-[13px] leading-6", p.className)} />;
}

export function SelectInput(p: { id?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string; inline?: boolean; "aria-label"?: string }) {
  return (
    <Select id={p.id} aria-label={p["aria-label"]} value={p.value} onChange={(e) => p.onChange(e.target.value)} className={cx(p.inline && "inline-block min-w-44", p.className)}>
      {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return <Switch checked={checked} onChange={onChange} className="items-start" label={<span><span className="font-medium">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>} />;
}

/** Segmented control (radio group). */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return <UISegmented value={value} onChange={onChange} options={options} label={label} className="flex-wrap" />;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return <UIProgressBar value={Math.round(value * 100)} label={label ?? ""} />;
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
