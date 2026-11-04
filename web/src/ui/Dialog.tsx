import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { useStrings } from "@web/i18n";
import { uiStrings } from "./strings";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row, rendered at the bottom (right-aligned on desktop, stacked full-width on mobile). */
  footer?: ReactNode;
  /** "center" dialog, "bottom" sheet (mobile-friendly) or "right" side panel. "auto": bottom sheet <640px, center above. */
  side?: "center" | "bottom" | "right" | "auto";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Hide the visible title (still announced to screen readers). */
  hideTitle?: boolean;
};

/**
 * Modal built on native <dialog>: focus trap, Esc to close, inert background and top-layer for free.
 * Clicking the backdrop closes it. Focus returns to the opener on close.
 */
export function Dialog({ open, onClose, title, description, children, footer, side = "auto", size = "md", className, hideTitle }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const s = useStrings(uiStrings);
  const resolved = side === "auto"
    ? (typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches ? "bottom" : "center")
    : side;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && d.open) d.close();
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const widths = { sm: "sm:w-[400px]", md: "sm:w-[520px]", lg: "sm:w-[720px]" };
  return (
    <dialog ref={ref} aria-labelledby={`${id}-t`} aria-describedby={description ? `${id}-d` : undefined}
      onClose={() => { document.documentElement.style.overflow = ""; if (open) onClose(); }}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className={cn("fl-dialog", resolved === "bottom" && "fl-sheet-bottom", resolved === "right" && "fl-sheet-right")}>
      <div className={cn(
        "fl-dialog-panel flex flex-col border border-line bg-surface text-fg shadow-float",
        resolved === "center" && cn("max-h-[85dvh] w-[calc(100vw-32px)] rounded-[var(--radius-lg)]", widths[size]),
        resolved === "bottom" && "max-h-[90dvh] w-full rounded-t-[var(--radius-lg)] border-b-0 pb-safe",
        resolved === "right" && "h-full w-[min(440px,100vw)] rounded-l-[var(--radius-lg)] border-r-0",
        className,
      )}>
        {resolved === "bottom" && <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong" />}
        <div className="flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className={cn("min-w-0 flex-1", hideTitle && "sr-only")}>
            <h2 id={`${id}-t`} className="text-lg font-semibold leading-snug">{title}</h2>
            {description && <p id={`${id}-d`} className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={s.close}
            className="-mr-2 -mt-1 ml-auto grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring">
            <X className="size-[18px]" aria-hidden />
          </button>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>
        )}
      </div>
    </dialog>
  );
}

/** Convenience alias: a bottom sheet on all sizes (or pass side="right"). */
export function Sheet(props: Omit<DialogProps, "side"> & { side?: "bottom" | "right" }) {
  return <Dialog {...props} side={props.side ?? "bottom"} />;
}
