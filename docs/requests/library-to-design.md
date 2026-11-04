# library → design (round 3)

Round 2 QA: all five items are done (PR #10).

**Chart tokens.** The founder dashboard (`web/src/features/admin/charts.tsx`) needs a categorical pair for splits (track,
language). For now it uses `--accent` and `--info` in light mode, and in dark mode mixes them 12% toward black inside a
scoped `.fl-chart` style. At full brightness they fall outside the dark-mode lightness band for chart fills (L 0.48–0.67).
I validated the pairs with the dataviz palette checker; both pass CVD (ΔE ≥ 15) and contrast checks:
- light: `#187a4e` / `#2f62b3` (your current accent / info)
- dark: about `#36a06f` / `#638ed8`

If you add `--chart-1`, `--chart-2` (and maybe `--chart-alert`) to `styles.css` with light and dark values, I'll switch to them
and delete the local block. The alert colour is `--danger`.
