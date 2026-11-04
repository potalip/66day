// OWNER: library agent. Small local primitives (until web/src/ui ships shared ones). Tokens only, no hex.
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { SourceType } from "./types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({ variant = "secondary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface text-fg hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
        variant === "danger" && "border border-line bg-surface text-danger hover:bg-surface-2",
        className,
      )}
    />
  );
}

export function Chip({ active, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...p}
      className={cx(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent",
        active ? "border-accent bg-accent-soft text-fg" : "border-line bg-surface text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "gold" | "danger"; className?: string }) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      tone === "neutral" && "bg-surface-2 text-muted",
      tone === "accent" && "bg-accent-soft text-accent",
      tone === "gold" && "bg-gold-soft text-gold",
      tone === "danger" && "bg-surface-2 text-danger",
      className,
    )}>{children}</span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  // A caller-supplied background/border colour replaces the default (Tailwind can't resolve two bg-* by order).
  const hasBg = /(^|\s)bg-/.test(className ?? ""), hasBorder = /(^|\s)border-(?!line)[a-z]/.test(className ?? "");
  return <div className={cx("rounded-[var(--radius)] border", !hasBorder && "border-line", !hasBg && "bg-surface", className)}>{children}</div>;
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cx("inline-block size-4 animate-spin rounded-full border-2 border-line border-t-accent", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-lg bg-surface-2", className)} />;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <Card className="px-6 py-14 text-center">
      <LeafIcon className="mx-auto size-8 text-accent" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {body && <p className="mx-auto mt-1 max-w-md text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

const ICON = "fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]";
export const LeafIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 14 10" /></svg>
);
export const PlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5 3.5-5 3.5z" /></svg>
);
export const DocIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></svg>
);
export const ReelIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><path d="M16.5 7.5h.01" /></svg>
);
export const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const ArrowIcon = ({ className, dir = "right" }: { className?: string; dir?: "left" | "right" | "up-right" }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden>
    {dir === "left" ? <path d="M19 12H5m6-6-6 6 6 6" /> : dir === "up-right" ? <path d="M7 17 17 7M8 7h9v9" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
  </svg>
);
export const CheckIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><path d="m5 12.5 4.5 4.5L19 7" /></svg>
);
export const ClockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cx(ICON, className)} aria-hidden><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);

export const TypeIcon = ({ type, className }: { type: SourceType; className?: string }) =>
  type === "link" ? <DocIcon className={className} /> : type === "instagram" ? <ReelIcon className={className} /> : <PlayIcon className={className} />;

export function hostOf(url: string | null | undefined) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

/** Thumbnail with a calm typographic fallback when there is no image (or it fails to load). */
export function Thumb({ src, type, label, host, className }: { src: string | null; type: SourceType; label: string; host?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cx("relative aspect-video overflow-hidden bg-surface-2", className)}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <div className="relative flex size-full items-center justify-center bg-accent-soft" role="img" aria-label={label}>
          <svg aria-hidden className="absolute inset-0 size-full text-accent/10" preserveAspectRatio="none" viewBox="0 0 160 90"><path d="M0 70 C40 40 80 95 160 50 L160 90 L0 90Z" fill="currentColor" /></svg>
          <TypeIcon type={type} className="relative size-9 text-accent" />
          {host && <span className="absolute bottom-2 left-3 text-xs font-medium text-accent/80">{host}</span>}
        </div>
      )}
      {(type === "youtube" || type === "upload") && src && !failed && (
        <span className="absolute inset-0 grid place-items-center bg-fg/0 transition-colors group-hover:bg-fg/10">
          <span className="grid size-11 place-items-center rounded-full bg-bg/85 text-fg shadow-sm backdrop-blur"><PlayIcon className="size-6" /></span>
        </span>
      )}
    </div>
  );
}
