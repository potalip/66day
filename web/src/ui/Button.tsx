import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "gold" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 " +
  "active:translate-y-px [&_svg]:size-[1.1em] [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg shadow-soft hover:bg-accent-hover",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  outline: "border border-line-strong bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
  soft: "bg-accent-soft text-accent-ink hover:brightness-[0.97] dark:hover:brightness-110",
  gold: "bg-gold-soft text-gold-ink border border-gold-bright/40 hover:brightness-[0.98] dark:hover:brightness-110",
  danger: "bg-danger text-white hover:brightness-95 dark:text-bg",
  link: "text-accent-ink underline-offset-4 hover:underline px-0! h-auto!",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-[var(--radius-sm)] px-3 text-sm",
  md: "h-10 rounded-[var(--radius-sm)] px-4 text-[0.9375rem]",
  lg: "h-12 rounded-[12px] px-6 text-base",
  icon: "size-10 rounded-[var(--radius-sm)]",
  "icon-sm": "size-8 rounded-lg",
};

export function buttonClass(opts: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", block, className } = opts;
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; loading?: boolean; icon?: ReactNode; iconRight?: ReactNode };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Common;

/**
 * <Button variant="primary|secondary|outline|ghost|soft|gold|danger|link" size="sm|md|lg|icon|icon-sm">
 * `loading` shows a spinner and disables the button. `icon` / `iconRight` take lucide icons.
 * For icon-only buttons pass size="icon" and an aria-label.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, loading, icon, iconRight, className, children, disabled, type = "button", ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })} {...rest}>
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export type ButtonLinkProps = LinkProps & Common;

/** A react-router Link that looks like a Button. */
export function ButtonLink({ variant, size, block, icon, iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {icon}{children as ReactNode}{iconRight}
    </Link>
  );
}
