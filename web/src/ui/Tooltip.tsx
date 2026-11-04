import { cloneElement, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Hover/focus tooltip for short hints. The trigger gets aria-describedby. Esc hides it.
 * Don't put essential info only in a tooltip (touch users rarely see it).
 */
export function Tooltip({ content, children, side = "top", align = "center", className }: {
  content: ReactNode; children: ReactElement<Record<string, unknown>>; side?: "top" | "bottom"; align?: "start" | "center" | "end"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), 250); };
  const hide = () => { clearTimeout(t.current); setOpen(false); };
  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={() => setOpen(true)} onBlur={hide}
      onKeyDown={(e) => { if (e.key === "Escape") hide(); }}>
      {cloneElement(children, { "aria-describedby": id })}
      <span role="tooltip" id={id} className={cn(
        "pointer-events-none absolute z-50 w-max max-w-[240px] rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium leading-snug text-bg shadow-card ",
        side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "center" ? "left-1/2 -translate-x-1/2" : align === "start" ? "left-0" : "right-0",
        open ? "animate-fade-in" : "hidden", // hidden content still feeds aria-describedby
        className,
      )}>{content}</span>
    </span>
  );
}
