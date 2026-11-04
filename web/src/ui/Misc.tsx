import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** Big number + label, for dashboards and profile ("12 days", "1 240 XP"). tone="gold" for reward numbers. */
export function Stat({ value, label, icon, tone = "default", hint, className }: {
  value: ReactNode; label: ReactNode; icon?: ReactNode; tone?: "default" | "accent" | "gold"; hint?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5 text-sm text-muted [&_svg]:size-4">
        {icon && <span className={cn(tone === "gold" && "text-gold-bright", tone === "accent" && "text-accent")}>{icon}</span>}
        {label}
      </div>
      <div className={cn("tabular mt-1 text-2xl font-semibold tracking-tight",
        tone === "gold" && "text-gold", tone === "accent" && "text-accent-ink")}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-surface px-1.5 font-mono text-[0.6875rem] text-muted shadow-soft", className)} {...rest} />;
}

export function Divider({ label, className }: { label?: ReactNode; className?: string }) {
  if (!label) return <hr className={cn("border-0 border-t border-line", className)} />;
  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted", className)} role="separator">
      <span className="h-px flex-1 bg-line" />{label}<span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Centered page width. "prose" ≈ 70ch for reading pages, "wide" for dashboards/grids. */
export function Container({ size = "wide", className, ...rest }: HTMLAttributes<HTMLDivElement> & { size?: "prose" | "narrow" | "wide" }) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6",
    size === "prose" ? "max-w-[44rem]" : size === "narrow" ? "max-w-3xl" : "max-w-6xl", className)} {...rest} />;
}

/** Visually hidden but readable by screen readers. */
export function VisuallyHidden({ children }: { children: ReactNode }) { return <span className="sr-only">{children}</span>; }
