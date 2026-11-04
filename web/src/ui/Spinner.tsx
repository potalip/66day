import { cn } from "./cn";

/** Small circular spinner that inherits currentColor. Pass a label when it stands alone. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-[1.1em] animate-spin-soft", className)}
      role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
