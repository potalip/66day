# design → studio (QA on main @ b916d0d)

I tested the whole flow with the real render server (`uvicorn … --port 8080`, token `dev-render`). The steps:
gallery → "Use this type" → create dialog → project → edit → **Quick draft render**. The render went queued → drawing →
thumbnails → playable MP4 in **17 s**, with no console errors. I checked EN/RU × light/dark × 390/1280, ran axe-core and
did a scroll check. It looks premium: real template previews, honest "AI not configured" / "render server not connected"
notices, and kit components throughout. Fix list, most important first:

## P1
1. **The finished video can't be seen on desktop.** The right column (live preview + render panel) is `sticky` and taller
   than the viewport. At 1280×800 the `<video>` stays below the fold while you scroll the whole page. Measured: its top
   sits at y=909 for every scroll position until the very end of the page (y=4783).
   Fix, either way:
   - make only the **Live preview** card sticky and let the Render panel scroll normally underneath, or
   - give the sticky column `lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`.
   Better still: when a render is ready, show the video **at the top** of the right column, with a
   `Segmented` toggle "Video · Live preview" / «Видео · Превью».
   Also scroll it into view and announce it (`toast({ tone: "success", title: "Your video is ready" })`) when the render
   finishes. Right now nothing tells you it's done if the panel is off-screen.
2. **Project page has no `<h1>`** (axe `page-has-heading-one`, all 4 theme × language configs). Render the project title as `<h1>` (or use `PageHeader`).
3. **Project title is the brief cut mid-word:** "A 30-second explainer for beginners: how to deploy your first page to
   GitHub **Pag**". Derive the title from the first sentence or clause and cut at a word boundary with "…", ≤ 60 chars. Even
   better, use the storyboard's intro title ("Ship your first app with an AI agent") when the brief is long. Keep the
   title inline-editable.

## P2
4. **Eight solid-green "Use this type" buttons** on the gallery screen break the "one primary action per view" rule and
   make the page shout. Make each card one big link or button (the whole card is the hit area, as it already is for the
   preview), and turn the visible label into `variant="soft"` or `outline` ("Use this type" / «Выбрать»).
5. **Preview button's accessible name** is the concatenated preview text: "4 STEPS ShipyourfirstappwithanAIagent No…"
   (the spans have no spaces). Give the preview a proper `aria-label`, e.g. "Play preview: Ship your first app with an AI
   agent", and mark the drawn text `aria-hidden`.
6. **Mobile (390px): the live preview fills the whole first screen** (about 530 px) before any control. Cap it at
   `max-h-[55svh]` on small screens (keep the aspect ratio, centre it). You could also start the page with the scenes
   editor and keep a small sticky "▶ Preview" button that opens the preview in a `Sheet` from `@web/ui`.
7. **Quiz card preview in the gallery is cropped** top and bottom (the question and the explanation line are cut). Use the
   template's poster frame with the content inside the safe area, or `object-position: center` with a taller crop.

## P3: copy
8. RU «Рендерить видео» (button + panel title) is a calque. Use «Отрендерить видео» for the button and «Рендер» or «Готовое
   видео» for the panel title. «Сейчас видео не отрендерить.» is OK.
9. EN status line "Your video is ready · draft" is good. Make sure the "Full quality" render is offered right there:
   "Looks good? Render in full quality" / «Всё нравится? Отрендерь в полном качестве».
10. Studio notices ("AI not configured", "Render server not connected") duplicate `AiNotice` from `@web/ui`. Prefer the kit
    component so they look the same as in learn and library (same gold tone, same icon).

## Share
11. A finished render is the most shareable moment in the product. Next to "Download MP4", add **Share**. Use
    `navigator.share({ files: [mp4] })` when `canShare` allows it, otherwise copy the public link you already generate.
    Use `ShareDialog` from `@web/ui/ShareCard` for the "Day N done" image if the video was a day-recap.
