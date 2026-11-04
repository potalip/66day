// OWNER: learn. Thin adapter over the design kit (@web/ui) + lucide icons, so learn screens share one look.
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, Clock, Copy, Crown, ExternalLink, FileText, Hammer,
  Info, Leaf, LifeBuoy, Lightbulb, Link2, Lock, Map as MapIcon, Moon, PenLine, PlayCircle, Rocket, Share2, Sparkles, Upload, X,
  type LucideProps,
} from "lucide-react";
import { Button, Card, EmptyState, Skeleton, SkeletonText } from "@web/ui";

export { cn as cx } from "@web/ui";

type IconProps = LucideProps & { size?: number };
const wrap = (C: React.ComponentType<LucideProps>) => function LearnIcon({ size = 18, ...p }: IconProps) {
  return <C size={size} aria-hidden {...p} />;
};

/** One icon set (lucide) for the whole learn area. */
export const Icon = {
  check: wrap(Check), lock: wrap(Lock), crown: wrap(Crown), moon: wrap(Moon), clock: wrap(Clock),
  arrowRight: wrap(ArrowRight), arrowLeft: wrap(ArrowLeft), copy: wrap(Copy), link: wrap(Link2), file: wrap(FileText),
  sparkle: wrap(Sparkles), leaf: wrap(Leaf), play: wrap(PlayCircle), book: wrap(BookOpen), hammer: wrap(Hammer),
  rocket: wrap(Rocket), pen: wrap(PenLine), help: wrap(CircleHelp), share: wrap(Share2), upload: wrap(Upload),
  info: wrap(Info), alert: wrap(AlertTriangle), x: wrap(X), external: wrap(ExternalLink), map: wrap(MapIcon),
  tip: wrap(Lightbulb), stuck: wrap(LifeBuoy),
};

export const taskTypeIcon = {
  watch: Icon.play, read: Icon.book, build: Icon.hammer, ship: Icon.rocket, reflect: Icon.pen, quiz: Icon.help, share: Icon.share,
} as const;

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-3/4 max-w-xl" />
      <SkeletonText lines={4} className="max-w-2xl" />
      <div className="grid grid-cols-1 gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
    </div>
  );
}

export function ErrorState({ title, body, retry, onRetry }: { title: string; body: string; retry: string; onRetry: () => void }) {
  return (
    <Card className="mx-auto max-w-lg" padding="none">
      <EmptyState tone="danger" icon={<AlertTriangle />} title={title} description={body} className="border-0"
        action={<Button variant="outline" onClick={onRetry}>{retry}</Button>} />
    </Card>
  );
}

/** Day hero + lesson lines + task card, matching DayView's grid so the swap doesn't shift layout. */
export function DaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-12" aria-hidden>
      <div className="min-w-0">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-9 w-4/5 max-w-[24ch]" /><Skeleton className="mt-2 h-9 w-3/5 max-w-[18ch]" />
        <Skeleton className="mt-4 h-5 w-full max-w-[60ch]" /><Skeleton className="mt-2 h-5 w-2/3 max-w-[40ch]" />
        <Skeleton className="mt-5 h-4 w-40" />
        <SkeletonText lines={6} className="mt-10 max-w-[68ch]" />
      </div>
      <div className="hidden lg:block"><Skeleton className="h-96 w-full rounded-[var(--radius)]" /></div>
    </div>
  );
}
