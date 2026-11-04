// OWNER: game agent. Game placements of design's ShareCard (one recognisable card — never restyled here).
import { lazy, Suspense } from "react";
import type { ShareCardData } from "@web/ui/ShareCard";

// Lazy: keeps the card renderer (and its export code) out of the main chunk until someone shares.
const ShareDialogLazy = lazy(() => import("@web/ui/ShareCard").then((m) => ({ default: m.ShareDialog })));

export function GameShareDialog({ open, onClose, data }: { open: boolean; onClose: () => void; data: ShareCardData | null }) {
  if (!open || !data) return null;
  return (
    <Suspense fallback={null}>
      <ShareDialogLazy open={open} onClose={onClose} data={data} />
    </Suspense>
  );
}

/** Streak card data from what the game already knows. Returns null when there's nothing worth sharing (< 3 days). */
export function streakShareData(x: {
  lang: "en" | "ru"; streak: number; xp: number; name: string | null; track: "apps" | "video" | null; completedDays: number[];
}): ShareCardData | null {
  if (x.streak < 3) return null;
  const last = x.completedDays.length ? x.completedDays[x.completedDays.length - 1] : Math.min(66, x.streak);
  return { kind: "streak", lang: x.lang, day: Math.max(1, last), streak: x.streak, xp: x.xp, name: x.name, track: x.track, completed: x.completedDays };
}

export const SHARE_MILESTONES = new Set([7, 14, 30, 66]);
