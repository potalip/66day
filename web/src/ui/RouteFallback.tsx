import { useStrings } from "@web/i18n";
import { Skeleton, SkeletonCard } from "./Skeleton";
import { uiStrings } from "./strings";

/** Page-shaped placeholder shown by the Shell while a lazily loaded route chunk downloads. */
export function RouteFallback() {
  const s = useStrings(uiStrings);
  return (
    <div role="status" aria-live="polite" className="animate-fade-in [animation-delay:150ms]">
      <span className="sr-only">{s.loading}</span>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-8 w-2/3 max-w-sm" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-10 grid gap-4 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
    </div>
  );
}
