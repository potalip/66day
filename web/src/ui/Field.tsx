import { cloneElement, forwardRef, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

const control =
  "w-full rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3.5 text-[0.9375rem] text-fg " +
  "placeholder:text-muted/80 transition-[border-color,box-shadow] duration-150 " +
  "hover:border-muted/50 focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-11", className)} {...rest} />;
  });

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined}
      className={cn(control, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...rest} />;
  });

/** Native select, styled. Keeps native keyboard + mobile pickers. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...rest }, ref) {
    return (
      <div className={cn("relative", className)}>
        <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-11 appearance-none pr-10")} {...rest}>{children}</select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    );
  });

/**
 * Label + control + hint/error, wired with ids for a11y.
 * <Field label="Link to your app" hint="Any public URL" error={err}><Input /></Field>
 */
export function Field({ label, hint, error, optional, children, className }: {
  label: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: string; children: ReactElement; className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id, "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error,
      })
    : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}{optional && <span className="ml-1.5 font-normal text-muted">({optional})</span>}
      </label>
      {child}
      {hint && !error && <p id={hintId} className="text-xs text-muted">{hint}</p>}
      {error && <p id={errId} className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/** Checkbox with label. Big hit area, works for task checklists. */
export function Checkbox({ label, description, className, ...rest }:
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3", rest.disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input type="checkbox" className="peer size-5 cursor-[inherit] appearance-none rounded-md border border-line-strong bg-surface transition-colors checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" {...rest} />
        <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute size-3.5 text-accent-fg opacity-0 peer-checked:opacity-100">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[0.9375rem] leading-snug">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** On/off switch (role="switch"). */
export function Switch({ checked, onChange, label, disabled, className }: {
  checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean; className?: string;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3", disabled && "cursor-not-allowed opacity-60", className)}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          checked ? "bg-accent" : "bg-surface-3")}>
        <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-soft transition-transform duration-200",
          checked && "translate-x-4")} />
      </button>
      <span className="text-[0.9375rem]">{label}</span>
    </label>
  );
}
