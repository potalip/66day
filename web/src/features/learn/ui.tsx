// OWNER: learn. Small local building blocks (tokens only). Swap for web/src/ui components once design ships them.
import type { ButtonHTMLAttributes, ReactNode, Ref, SVGProps } from "react";
import { Link, type LinkProps } from "react-router";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------- icons (lucide-style strokes, inline so there's no dep) ----------
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function Svg({ size = 18, children, ...p }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      {children}
    </svg>
  );
}
export const Icon = {
  check: (p: IconProps) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>,
  lock: (p: IconProps) => <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>,
  crown: (p: IconProps) => <Svg {...p}><path d="m2 7 5 4 5-7 5 7 5-4-2 12H4Z" /></Svg>,
  moon: (p: IconProps) => <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>,
  clock: (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  arrowRight: (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  arrowLeft: (p: IconProps) => <Svg {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>,
  copy: (p: IconProps) => <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>,
  link: (p: IconProps) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Svg>,
  file: (p: IconProps) => <Svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></Svg>,
  text: (p: IconProps) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h10" /></Svg>,
  sparkle: (p: IconProps) => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Svg>,
  leaf: (p: IconProps) => <Svg {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.1-6" /></Svg>,
  play: (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" /></Svg>,
  book: (p: IconProps) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></Svg>,
  hammer: (p: IconProps) => <Svg {...p}><path d="m15 12-8.4 8.4a2 2 0 0 1-2.8-2.8L12.2 9" /><path d="m17.6 14.6 4-4-6.2-6.2-1.4 1.4" /><path d="m11 7 6 6" /></Svg>,
  rocket: (p: IconProps) => <Svg {...p}><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1Z" /><path d="M12 15 9 12a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z" /><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" /></Svg>,
  pen: (p: IconProps) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>,
  help: (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></Svg>,
  share: (p: IconProps) => <Svg {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></Svg>,
  upload: (p: IconProps) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Svg>,
  info: (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Svg>,
  alert: (p: IconProps) => <Svg {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Svg>,
  x: (p: IconProps) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>,
  external: (p: IconProps) => <Svg {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Svg>,
  map: (p: IconProps) => <Svg {...p}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></Svg>,
};

export const taskTypeIcon = {
  watch: Icon.play, read: Icon.book, build: Icon.hammer, ship: Icon.rocket, reflect: Icon.pen, quiz: Icon.help, share: Icon.share,
} as const;

// ---------- buttons ----------
type Variant = "primary" | "secondary" | "ghost" | "gold";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-sm",
  secondary: "border border-line bg-surface text-fg hover:bg-surface-2",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  gold: "bg-gold text-bg hover:brightness-110",
};
const sizes = { sm: "h-8 px-3 text-sm gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-base gap-2" };
export const btn = (v: Variant = "primary", s: keyof typeof sizes = "md") =>
  cx(
    "inline-flex select-none items-center justify-center rounded-xl font-medium transition-[filter,background-color,color,transform] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
    variants[v], sizes[s],
  );

export function Button({ variant = "primary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; ref?: Ref<HTMLButtonElement> }) {
  return <button type="button" {...p} className={cx(btn(variant, size), className)} />;
}
export function ButtonLink({ variant = "primary", size = "md", className, ...p }: LinkProps & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link {...p} className={cx(btn(variant, size), className)} />;
}

// ---------- surfaces ----------
export function Card({ className, children, as: As = "div", ...p }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "aside" } & Record<string, unknown>) {
  return <As {...p} className={cx("rounded-[var(--radius)] border border-line bg-surface", className)}>{children}</As>;
}

export function Chip({ tone = "neutral", className, children }: { tone?: "neutral" | "accent" | "gold" | "danger"; className?: string; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent",
    gold: "bg-gold-soft text-gold",
    danger: "bg-surface-2 text-danger",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>{children}</span>;
}

export function ProgressBar({ value, label, className }: { value: number; label?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 6, children, label }: { value: number; size?: number; stroke?: number; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset 900ms ease-out" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none", className)} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-3/4 max-w-xl" />
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
    </div>
  );
}

export function ErrorState({ title, body, retry, onRetry }: { title: string; body: string; retry: string; onRetry: () => void }) {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center" role="alert">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-surface-2 text-danger"><Icon.alert /></div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-muted">{body}</p>
      <Button className="mt-5" variant="secondary" onClick={onRetry}>{retry}</Button>
    </Card>
  );
}
