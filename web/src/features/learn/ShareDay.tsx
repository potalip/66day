// OWNER: learn. "Share Day N" — design's ShareDialog filled with this student's data. Loaded lazily (React.lazy) so the
// card renderer never weighs on Today; game state is fetched only when the dialog is opened.
import { ShareDialog, type ShareCardData } from "@web/ui/ShareCard";
import { useGameMe } from "@web/features/game/api";
import type { Lang } from "@shared/types";

export default function ShareDay({ open, onClose, lang, day, title }: { open: boolean; onClose: () => void; lang: Lang; day: number; title: string }) {
  const me = useGameMe(open);
  const g = me.data;
  const data: ShareCardData = {
    kind: "day", lang, day, title,
    track: g?.track ?? null,
    streak: g?.streak.current,
    xp: g?.xp,
    name: g?.name ?? null,
  };
  return <ShareDialog open={open} onClose={onClose} data={data} />;
}
