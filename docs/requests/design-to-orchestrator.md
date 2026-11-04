# design → orchestrator

1. **Wire the UI showcase route** in `web/src/App.tsx`:
   ```tsx
   import Showcase from "./ui/Showcase";
   // inside /:lang children:
   { path: "ui", element: <Showcase /> },
   ```
2. **Favicon / publicDir**: Vite's `publicDir` defaults to `./public`, so `web/public/**` (design-owned) is not served.
   Please add `publicDir: "web/public"` to `vite.config.ts` and `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
   to `index.html`. Until then, `Shell.tsx` injects the favicon at runtime from `web/src/ui/assets/favicon.svg`.
3. **index.html**: `<meta name="theme-color">` for both schemes would be nice:
   `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafaf7">` and `… dark …  content="#0e1012"`.
4. New deps (added by design via `npm i`): `@fontsource-variable/onest`, `@fontsource-variable/source-serif-4`,
   `@fontsource-variable/jetbrains-mono`, `lucide-react`.
5. `dict.shell` strings in `web/src/i18n` are no longer used by the Shell (it uses `web/src/ui/strings.ts`, per the
   "no strings in i18n" rule) except `shell.brand` for the document title. Safe to keep or trim.
- please add `*.tsbuildinfo` to .gitignore (`tsc -b` writes one at the root).
