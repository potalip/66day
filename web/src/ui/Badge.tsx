import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type Tone = "neutral" | "accent" | "gold" | "danger" | "info" | "outline";
const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent-ink",
  gold: "bg-gold-soft text-gold-ink",
  danger: "bg-danger-soft text-danger-ink",
  info: "bg-info-soft text-info",
  outline: "border border-line text-muted",
};

/** Small static label: status, level, track, "+20 XP". Use tone="gold" only for rewards. */
export function Badge({ tone = "neutral", icon, size = "md", className, children, ...rest }:
  HTMLAttributes<HTMLSpanElement> & { tone?: Tone; icon?: ReactNode; size?: "sm" | "md" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium [&_svg]:size-[1.05em]",
      size === "sm" ? "h-5 px-2 text-[0.6875rem]" : "h-6 px-2.5 text-xs",
      tones[tone], className,
    )} {...rest}>{icon}{children}</span>
  );
}

/** Toggleable filter chip (aria-pressed). Use in horizontal filter rows. */
export function Chip({ selected, icon, count, className, children, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; icon?: ReactNode; count?: number }) {
  return (
    <button type="button" aria-pressed={!!selected} className={cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 [&_svg]:size-4",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      selected ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
      className,
    )} {...rest}>
      {icon}{children}
      {count != null && <span className={cn("tabular text-xs", selected ? "opacity-70" : "text-muted")}>{count}</span>}
    </button>
  );
}
