import type { ReactNode } from "react";
import { cn } from "./cn";

type ProgressTone = "accent" | "gold" | "fg";
const fills: Record<ProgressTone, string> = { accent: "bg-accent", gold: "bg-gold-bright", fg: "bg-fg" };
const strokes: Record<ProgressTone, string> = { accent: "stroke-accent", gold: "stroke-gold-bright", fg: "stroke-fg" };
const clamp = (v: number, max: number) => Math.max(0, Math.min(1, max > 0 ? v / max : 0));

/** Linear progress. value/max (default max 100). Pass `label` for screen readers (and optionally showValue). */
export function ProgressBar({ value, max = 100, tone = "accent", size = "md", label, showValue, className }: {
  value: number; max?: number; tone?: ProgressTone; size?: "sm" | "md" | "lg"; label: string; showValue?: boolean | ReactNode; className?: string;
}) {
  const pct = clamp(value, max) * 100;
  const h = { sm: "h-1.5", md: "h-2", lg: "h-3" }[size];
  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted">{label}</span>
          <span className="tabular font-medium">{showValue === true ? `${Math.round(pct)}%` : showValue}</span>
        </div>
      )}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
        className={cn("w-full overflow-hidden rounded-full bg-surface-3", h)}>
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fills[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Circular progress. Children render in the centre (e.g. "12/66" or an icon). */
export function ProgressRing({ value, max = 100, size = 64, stroke = 6, tone = "accent", label, children, className }: {
  value: number; max?: number; size?: number; stroke?: number; tone?: ProgressTone; label: string; children?: ReactNode; className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp(value, max);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
      className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} className={cn("transition-[stroke-dashoffset] duration-700 ease-out", strokes[tone])} />
      </svg>
      {children != null && <div className="absolute inset-0 grid place-items-center text-center text-sm font-semibold tabular">{children}</div>}
    </div>
  );
}
