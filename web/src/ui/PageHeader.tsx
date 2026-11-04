import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Top of every app page: optional eyebrow (small label), title, description and actions.
 * <PageHeader eyebrow="Day 12 · Build" title="Ship your first bot" description="…" actions={<Button>…</Button>} />
 */
export function PageHeader({ eyebrow, title, description, actions, back, className }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: ReactNode; className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 max-w-[70ch]">
        {back && <div className="mb-3">{back}</div>}
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-accent-ink">{eyebrow}</p>}
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.125rem]">{title}</h1>
        {description && <p className="mt-2 text-base text-muted sm:text-[1.0625rem]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Section title inside a page. */
export function SectionTitle({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
