// OWNER: library agent. Thin adapter over the shared kit (@web/ui) + lucide icons, plus library-only pieces (Thumb).
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  Button as KitButton, Card as KitCard, Badge, Chip as KitChip, EmptyState, Spinner as KitSpinner, Skeleton as KitSkeleton, cn,
} from "@web/ui";
import {
  Leaf, PlayCircle, FileText, Clapperboard, Search, ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock, Film,
} from "lucide-react";
import type { SourceType } from "./types";

export const cx = cn;

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
const VARIANT = { primary: "primary", secondary: "outline", ghost: "ghost", danger: "outline", soft: "soft" } as const;

export function Button({ variant = "secondary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; loading?: boolean }) {
  return <KitButton variant={VARIANT[variant]} size={size} className={cn(variant === "danger" && "text-danger", className)} {...p} />;
}

export function Chip({ active, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; count?: number }) {
  return <KitChip selected={active} {...p} />;
}

export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "gold" | "danger" | "info"; className?: string }) {
  return <Badge tone={tone} size="sm" className={className}>{children}</Badge>;
}

export function Card({ children, className, tone }: { children: ReactNode; className?: string; tone?: "default" | "muted" | "accent" | "gold" }) {
  return <KitCard padding="none" tone={tone} className={className}>{children}</KitCard>;
}

export const Spinner = ({ className }: { className?: string }) => <KitSpinner className={className} />;
export const Skeleton = ({ className }: { className?: string }) => <KitSkeleton className={className} />;

export function Empty({ title, body, action, tone }: { title: string; body?: string; action?: ReactNode; tone?: "neutral" | "accent" | "danger" }) {
  return <EmptyState icon={<Leaf />} tone={tone ?? "accent"} title={title} description={body} action={action} />;
}

type IconProps = { className?: string };
export const LeafIcon = ({ className }: IconProps) => <Leaf aria-hidden className={className} />;
export const PlayIcon = ({ className }: IconProps) => <PlayCircle aria-hidden className={className} />;
export const DocIcon = ({ className }: IconProps) => <FileText aria-hidden className={className} />;
export const ReelIcon = ({ className }: IconProps) => <Clapperboard aria-hidden className={className} />;
export const FilmIcon = ({ className }: IconProps) => <Film aria-hidden className={className} />;
export const SearchIcon = ({ className }: IconProps) => <Search aria-hidden className={className} />;
export const CheckIcon = ({ className }: IconProps) => <Check aria-hidden className={className} />;
export const ClockIcon = ({ className }: IconProps) => <Clock aria-hidden className={className} />;
export const ArrowIcon = ({ className, dir = "right" }: IconProps & { dir?: "left" | "right" | "up-right" }) =>
  dir === "left" ? <ArrowLeft aria-hidden className={className} /> : dir === "up-right" ? <ArrowUpRight aria-hidden className={className} /> : <ArrowRight aria-hidden className={className} />;

export const TypeIcon = ({ type, className }: { type: SourceType; className?: string }) =>
  type === "link" ? <DocIcon className={className} /> : type === "instagram" ? <ReelIcon className={className} /> : type === "upload" ? <FilmIcon className={className} /> : <PlayIcon className={className} />;

export function hostOf(url: string | null | undefined) {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

/** Thumbnail with a calm icon + host fallback when there is no image (or it fails to load). */
export function Thumb({ src, type, label, host, className }: { src: string | null; type: SourceType; label: string; host?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-surface-2", className)}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <div className="relative flex size-full items-center justify-center bg-accent-soft" role="img" aria-label={label}>
          <svg aria-hidden className="absolute inset-0 size-full text-accent/10" preserveAspectRatio="none" viewBox="0 0 160 90"><path d="M0 70 C40 40 80 95 160 50 L160 90 L0 90Z" fill="currentColor" /></svg>
          <TypeIcon type={type} className="relative size-9 text-accent-ink" />
          {host && <span className="absolute bottom-2 left-3 text-xs font-medium text-accent-ink/80">{host}</span>}
        </div>
      )}
      {(type === "youtube" || type === "upload") && src && !failed && (
        <span className="absolute inset-0 grid place-items-center bg-fg/0 transition-colors group-hover:bg-fg/10">
          <span className="grid size-11 place-items-center rounded-full bg-bg/85 text-fg shadow-sm backdrop-blur"><PlayCircle className="size-6" /></span>
        </span>
      )}
    </div>
  );
}
