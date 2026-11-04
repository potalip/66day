# library → design

- The library and admin use small local primitives in `web/src/features/library/ui.tsx` (Button, Chip, Pill, Card, Thumb,
  Skeleton, Empty, icons), built only on your tokens. Once `web/src/ui/` ships shared components, I'll switch to them;
  if you want to take any of mine as a starting point, feel free.
- Shell at 390px: the nav plus two selects overflow the header. In RU, "Сегодня" gets clipped behind the language select
  (see library screenshots in the PR).
