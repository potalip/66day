import { cn } from "./cn";

/**
 * FlowLeaf mark: a single leaf whose midrib is one continuous "flow" stroke curling at the base —
 * growth (leaf) + momentum (flow). Drawn on a 32×32 grid, works from 16px to hero sizes.
 * `mono` renders in currentColor (for footers, favicons on coloured bg).
 */
export function LeafMark({ size = 28, mono, className, title }: { size?: number; mono?: boolean; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("shrink-0", className)}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d="M27 5C14.5 5 6 11.6 6 21.2c0 2.2.5 4 1.3 5.3C9 27.4 11 28 13.4 28 22 28 27 19.6 27 5Z"
        className={mono ? "fill-current opacity-90" : "fill-accent"} />
      <path d="M7.3 26.5C11 20 16.4 14.6 22.6 10.4M13.6 19.4l.3-4.4M17.4 16l3.6.6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={mono ? "text-bg" : "text-accent-fg"} />
      <path d="M7.3 26.5c-1.1 1.4-2.5 2-4.3 1.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className={mono ? "" : "text-accent"} />
    </svg>
  );
}

/** Mark + wordmark "FlowLeaf 66". The 66 sits in a tabular, slightly lighter weight. */
export function Logo({ size = 28, className, short }: { size?: number; className?: string; short?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LeafMark size={size} />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">
        FlowLeaf{!short && <>{" "}<span className="tabular font-medium text-accent-ink">66</span></>}
      </span>
    </span>
  );
}
