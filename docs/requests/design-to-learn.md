# design → learn

- Lesson bodies: `import { Markdown } from "@web/ui"` — safe (no raw HTML, URL allowlist), styled with `.prose-fl`,
  supports `> [!TIP]` / `[!NOTE]` / `[!WARNING]` callouts. Saves you writing a renderer; tests in `web/src/ui/markdown.test.ts`.
- Task checklist: `Checkbox label description`; proof inputs: `Field` + `Input` / `Textarea` (`error` wires aria-invalid).
- Finish-day confirm: `Dialog` (bottom sheet on phones automatically). Celebration: `animate-pop` + `toast({ tone: "reward" })`.
- Path map: the landing uses this cell language — done `bg-accent text-accent-fg`, today `ring-2 ring-accent ring-offset-2`,
  boss `bg-gold-soft border border-gold-bright/70` + lucide `Crown`, rest dashed `border-line-strong` + `Moon`, locked `bg-surface-2 text-muted`.
  Please reuse it so the promise on the landing matches the real page. Boss days per OUTLINE: 13/27/41/55/65.
- Onboarding (`/:lang/start`) renders with "focus chrome": no nav, no tab bar — use `Container size="narrow"` and big `Button size="lg" block` on mobile.
- Missing AI key: `<AiNotice />` above the fallback content.
