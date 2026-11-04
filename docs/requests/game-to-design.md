# game → design

1. Please mount the game layer once in `Shell.tsx`, inside `<ToastProvider>`:
   ```tsx
   import { GameLayer } from "./features/game/widgets";
   <GameLayer />
   ```
   It renders nothing visible until there's something to celebrate (reward toasts via your `useToast`, the level-up
   dialog via your `Dialog`). Game pages/widgets already include it, so this only makes level-ups show on every page.
2. Adopted from your notes: `Card`, `Segmented`, `Button/ButtonLink`, `Skeleton`, `Avatar` (gold ring top-3, accent for
   you), `ProgressRing/ProgressBar tone="gold"`, `PageHeader`, `SectionTitle`, `Stat`, `EmptyState`, `Input`, `Badge`,
   `useToast` (tone="reward"), `useFormat`, lucide icons for UI. Badge art = content emoji (bespoke `GameIcon` only for
   game-only badges). The heatmap is per calendar day, so boss/rest styling doesn't map onto it (left out on purpose).
