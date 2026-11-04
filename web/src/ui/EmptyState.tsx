import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Friendly empty / error / "not configured" state. Always say what happened and what to do next.
 * <EmptyState icon={<BookOpen />} title="Nothing here yet" description="…" action={<Button>…</Button>} />
 */
export function EmptyState({ icon, title, description, action, tone = "neutral", compact, className }: {
  icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode;
  tone?: "neutral" | "accent" | "gold" | "danger"; compact?: boolean; className?: string;
}) {
  const ring = {
    neutral: "bg-surface-2 text-muted", accent: "bg-accent-soft text-accent-ink",
    gold: "bg-gold-soft text-gold-ink", danger: "bg-danger-soft text-danger-ink",
  }[tone];
  return (
    <div className={cn("flex flex-col items-center rounded-[var(--radius)] border border-dashed border-line-strong text-center",
      compact ? "px-5 py-8" : "px-6 py-14", className)}>
      {icon && <div className={cn("mb-4 grid size-12 place-items-center rounded-2xl [&_svg]:size-6", ring)} aria-hidden>{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-[44ch] text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
