import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  /** "default": surface + 1px line. "muted": surface-2 well. "accent"/"gold": soft tinted highlight. */
  tone?: "default" | "muted" | "accent" | "gold";
  padding?: "none" | "sm" | "md" | "lg";
  /** Adds hover lift — use when the whole card is a link/button. */
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
};

const tones = {
  default: "bg-surface border-line",
  muted: "bg-surface-2 border-transparent",
  accent: "bg-accent-soft border-accent/20",
  gold: "bg-gold-soft border-gold-bright/30",
};
const pads = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

/** Rounded card with a 1px border — the basic container of the app. */
export function Card({ tone = "default", padding = "md", interactive, as = "div", className, ...rest }: CardProps) {
  const As = as as "div";
  return (
    <As className={cn(
      "rounded-[var(--radius)] border", tones[tone], pads[padding],
      interactive && "transition-[box-shadow,border-color,transform] duration-200 hover:border-line-strong hover:shadow-card focus-within:border-line-strong",
      className,
    )} {...rest} />
  );
}

export function CardHeader({ title, description, action, icon, className }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start gap-3", className)}>
      {icon && <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink [&_svg]:size-[18px]">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold leading-snug", className)} {...rest} />;
}
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted", className)} {...rest} />;
}
