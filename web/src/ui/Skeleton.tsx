import type { CSSProperties } from "react";
import { cn } from "./cn";

/** Shimmering placeholder. Size it with classes: <Skeleton className="h-5 w-40" />. Static under reduced motion. */
export function Skeleton({ className, style, circle }: { className?: string; style?: CSSProperties; circle?: boolean }) {
  return <div aria-hidden className={cn("skeleton", circle ? "rounded-full" : "rounded-md", className)} style={style} />;
}

/** A few lines of text placeholder. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")} />)}
    </div>
  );
}

/** Card-shaped placeholder for lists of cards. Wrap a group in role="status" + sr-only "Loading…" text. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius)] border border-line bg-surface p-5", className)} aria-hidden>
      <div className="flex items-center gap-3"><Skeleton circle className="size-9" /><Skeleton className="h-4 w-1/3" /></div>
      <SkeletonText className="mt-4" />
    </div>
  );
}
