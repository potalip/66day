import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export type TabItem<V extends string = string> = { value: V; label: ReactNode; icon?: ReactNode; count?: number; disabled?: boolean };

/**
 * Accessible tabs (WAI-ARIA tablist, roving tabindex, ←/→/Home/End).
 * variant "underline" for page sections, "pill" for compact segmented switches.
 * Pass `children` as a render function to get panels wired with aria ids, or use just the list + your own content.
 */
export function Tabs<V extends string>({ items, value, defaultValue, onChange, variant = "underline", label, className, children, block }: {
  items: TabItem<V>[]; value?: V; defaultValue?: V; onChange?: (v: V) => void; variant?: "underline" | "pill";
  label: string; className?: string; block?: boolean; children?: (active: V) => ReactNode;
}) {
  const [inner, setInner] = useState<V>(defaultValue ?? items[0]?.value);
  const active = value ?? inner;
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const select = (v: V) => { if (value === undefined) setInner(v); onChange?.(v); };
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: KeyboardEvent, i: number) => {
    const pos = enabled.indexOf(i);
    let next: number | undefined;
    if (e.key === "ArrowRight") next = enabled[(pos + 1) % enabled.length];
    else if (e.key === "ArrowLeft") next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    select(items[next].value);
  };
  const list = (
    <div role="tablist" aria-label={label} className={cn(
      "no-scrollbar flex overflow-x-auto",
      variant === "underline" ? "gap-5 border-b border-line" : "w-fit max-w-full gap-1 rounded-[12px] bg-surface-2 p-1",
      block && variant === "pill" && "w-full", className,
    )}>
      {items.map((it, i) => {
        const on = it.value === active;
        return (
          <button key={it.value} ref={(el) => { refs.current[i] = el; }} role="tab" type="button"
            id={`${id}-t-${it.value}`} aria-selected={on} aria-controls={children ? `${id}-p-${it.value}` : undefined}
            tabIndex={on ? 0 : -1} disabled={it.disabled} onClick={() => select(it.value)} onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-150 disabled:opacity-40 [&_svg]:size-4",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              variant === "underline"
                ? cn("-mb-px h-11 border-b-2", on ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg")
                : cn("h-8 rounded-[9px] px-3", block && "flex-1", on ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"),
            )}>
            {it.icon}{it.label}
            {it.count != null && <span className="tabular text-xs text-muted">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
  if (!children) return list;
  return (
    <div>
      {list}
      <div role="tabpanel" id={`${id}-p-${active}`} aria-labelledby={`${id}-t-${active}`} tabIndex={0} className="pt-5 focus-visible:outline-none">
        {children(active)}
      </div>
    </div>
  );
}

/** Segmented control: same keyboard model as Tabs, but semantically a radio group (for settings/filters). */
export function Segmented<V extends string>({ options, value, onChange, label, size = "md", className }: {
  options: { value: V; label: ReactNode; icon?: ReactNode; title?: string }[]; value: V; onChange: (v: V) => void;
  label: string; size?: "sm" | "md"; className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    refs.current[n]?.focus();
    onChange(options[n].value);
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex gap-0.5 rounded-[11px] border border-line bg-surface-2 p-0.5", className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button key={o.value} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on}
            title={o.title} aria-label={o.label ? undefined : o.title} tabIndex={on ? 0 : -1} onClick={() => onChange(o.value)} onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[9px] font-medium transition-colors duration-150 [&_svg]:size-4",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              size === "sm" ? "h-7 min-w-7 px-2 text-xs" : "h-8 min-w-8 px-2.5 text-sm",
              on ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg",
            )}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}
