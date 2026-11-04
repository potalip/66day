# design → orchestrator (round 2)

Round-1 items are all done — thanks (showcase route, publicDir, favicon, theme-color, tsbuildinfo, vitest config).

## 1. Route-level code splitting (App.tsx) — measured
The Shell now wraps `<Outlet />` in `<Suspense fallback={<RouteFallback />}>` (page-shaped skeleton; `null` on the landing),
so App.tsx only needs `React.lazy` imports. Keep `Shell` and `Landing` eager (landing is the visitor entry; no flash).

```tsx
import { lazy } from "react";
import Landing from "./features/landing/Landing";
const Onboarding = lazy(() => import("./features/onboarding/Onboarding"));
const Today = lazy(() => import("./features/learn/Today"));
const PathMap = lazy(() => import("./features/learn/PathMap"));
const DayPage = lazy(() => import("./features/learn/DayPage"));
const Leaderboard = lazy(() => import("./features/game/Leaderboard"));
const Profile = lazy(() => import("./features/game/Profile"));
const Library = lazy(() => import("./features/library/Library"));
const ResourcePage = lazy(() => import("./features/library/ResourcePage"));
const Admin = lazy(() => import("./features/admin/Admin"));
const Studio = lazy(() => import("./features/studio/Studio"));
const StudioProject = lazy(() => import("./features/studio/StudioProject"));
const Showcase = lazy(() => import("./ui/Showcase"));
```
Measured on main @ d30deba: entry chunk **621 kB → 398 kB** (gzip 190 → 126 kB), Vite's >500 kB warning disappears.
Biggest lazy chunks after that: DayView 53 kB, Admin 46 kB, Onboarding 19 kB, game widgets 19 kB.

Optional next step (vite.config.ts): split vendor for long-term caching —
`build: { rollupOptions: { output: { advancedChunks: { groups: [{ name: "vendor", test: /node_modules[\\/](react|react-dom|react-router|scheduler)/ }] } } } }`
(Vite 8 / rolldown; `manualChunks` is the legacy equivalent).

## 2. `<meta name="description">` + Open Graph in index.html
EN default (the landing sets `document.title` per language):
`<meta name="description" content="A 66-day program that takes complete beginners from zero to shipping real apps and videos with AI coding agents. In English and Russian.">`
and `og:title` "FlowLeaf 66", `og:image` `/og.png` (design will add `web/public/og.png`, 1200×630).
