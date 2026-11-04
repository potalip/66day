# Share card — how learn & game use it (design, round 3)

Posting progress in public is core to the program. `@web/ui/ShareCard` ships a shareable card + a drop-in dialog.
Formats: **1080×1350** (4:5 — Instagram/Telegram/VK/LinkedIn feeds) and **1200×630** (X, link previews). Light/dark.
Everything is client-side (SVG → canvas → PNG), works offline, no new deps. Fonts are embedded only on export.

```tsx
import { Button } from "@web/ui";
import { ShareDialog, type ShareCardData } from "@web/ui/ShareCard"; // direct import on purpose: keeps it out of the main chunk
import { Share2 } from "lucide-react";

const [open, setOpen] = useState(false);
const data: ShareCardData = {
  kind: "day",                 // or "streak"
  lang,                        // "en" | "ru" — copy on the card is native per language
  day: 12,                     // the day just completed (1–66)
  title: day.title,            // the native day title from content (wraps to 2 lines, ellipsis after)
  track: user.track,           // "apps" | "video" | null
  streak: game.streak.current, // shows "11 day streak" / "11 дней подряд"
  xp: game.xp.total,           // optional; set xpLabel to change "XP"
  name: user.name,             // optional; shown in the footer
  completed: doneDays,         // optional number[]; defaults to 1..day
};
<Button variant="soft" icon={<Share2 />} onClick={() => setOpen(true)}>{s.share}</Button>
<ShareDialog open={open} onClose={() => setOpen(false)} data={data} />
```
The dialog: preview, format + theme switch, **Share** (OS share sheet with the PNG + ready text on phones), **Download PNG**
(+ copies the post text), **Copy text**. Toasts on success/failure. Lower-level helpers if you need a custom flow:
`<ShareCard data format theme />` (inline preview), `renderShareCardPng(data, format, theme) → Blob`,
`shareOrDownload(...)`, `shareText(data)` (native post text with #FlowLeaf66).

## learn — where
1. **Day completion moment** (Today / DayView, after the last task): primary "Share Day N" next to "Next day", `kind: "day"`.
   This is the highest-value placement — the moment is fresh.
2. Day page of a completed day: a quiet `variant="ghost"` "Share" in the header actions.
3. Boss days (13/27/41/55/65): open the dialog automatically once after completion (they're portfolio moments), still dismissible.
Button copy: EN "Share Day 12" · RU «Поделиться днём 12».

## game — where
1. Profile: "Share streak" next to the streak stat, `kind: "streak"` (only when streak ≥ 3 — a 1-day streak card is sad).
2. Streak milestone awards (7 / 14 / 30 / 66): add an action to the reward toast —
   `toast({ tone: "reward", title, action: { label: s.share, onClick: () => setShareOpen(true) } })`.
Button copy: EN "Share streak" · RU «Поделиться серией».

Please don't restyle the card per feature — one recognisable card is the point.
