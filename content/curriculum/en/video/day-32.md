---
day: 32
track: video
phase: 2
title: "Your brand kit, written as code"
summary: "Put colours, fonts, logo and motion into one config, build a title, lower third and end card — then re-skin a video by editing only the config."
estMinutes: 90
resources:
  - "https://www.remotion.dev/docs/"
  - "https://fonts.google.com/"
  - "https://pycairo.readthedocs.io/"
tasks:
  - id: d32-video-t1
    type: read
    title: "Learn why consistency is a system, not taste"
    xp: 10
    proof: none
  - id: d32-video-t2
    type: build
    title: "Build a brand config plus title, lower third and end card; render a sample sheet"
    xp: 50
    proof: file
  - id: d32-video-t3
    type: build
    title: "Re-skin an old video by changing only the config"
    xp: 30
    proof: file
  - id: d32-video-t4
    type: quiz
    title: "Quiz: config or component?"
    xp: 15
    proof: none
---

Look at your last five videos side by side. Odds are each one has a slightly different green, a different font size for
titles, a different way of fading in. Viewers can't name it, but they feel it: "amateur". Big channels don't fix this
with better taste. They fix it with a **system**: decisions made once, written down, reused everywhere. You're about to
write yours as code, which matters a lot tomorrow, when a pipeline starts producing videos without you watching.

## Config vs components

Split your visual identity into two layers:

- **Config** (`brand.json`): the *decisions*. Colours, fonts, logo file, spacing, corner radius, motion presets
  ("enter = spring, 12 frames"; "hold a title 2 s"), audio sting. Changing a value here changes every video.
- **Components**: the *shapes* that read the config. `Title`, `LowerThird` (the name bar in the lower part of the frame),
  `EndCard`. They never contain a hex colour or a font name — only `brand.colors.accent`, `brand.fonts.display`.

If you find `#22C55E` inside a component, that's a bug. The test is simple: can a new brand be applied without opening a
single component file?

A good starter config:

```json
{
  "name": "Signal & Noise",
  "colors": { "bg": "#0E1116", "fg": "#F3F1EC", "accent": "#3DDC97", "muted": "#8B93A1" },
  "fonts": {
    "display": { "family": "Space Grotesk", "weight": 700 },
    "body": { "family": "Inter", "weight": 400 }
  },
  "logo": "brand/logo.svg",
  "layout": { "safe_margin": 0.06, "radius": 18, "type_scale": [28, 40, 64, 96] },
  "motion": {
    "enter": { "kind": "spring", "damping": 200, "frames": 14 },
    "exit": { "kind": "ease", "curve": "easeInCubic", "frames": 10 },
    "title_hold_s": 2.0
  },
  "audio": { "sting": "brand/sting.wav", "sting_gain_db": -10 }
}
```

Fonts: use ones whose licence allows video and commercial use — Google Fonts are under open licences, which is why
they're the default here. Check contrast: `fg` on `bg` should be easy to read on a phone in sunlight.

## Step by step

### 1. Build the kit

Use whatever you rendered your day-27 explainer with. Remotion is the smoothest fit (components are literally React
components), but the same structure works in Python with pycairo.

```text
Goal: a brand kit in my video project: brand/brand.json + three reusable components + a sample sheet.
Context: my video workspace (Remotion project | Python + pycairo renderer). Paste of my brand.json below.
Build:
- A typed loader for brand.json (zod or TypeScript type in Remotion; dataclass in Python) that fails loudly on a missing key.
- Title(text, subtitle?), LowerThird(name, role), EndCard(headline, cta, logo) — all colours, fonts, sizes,
  radii and motion read from the brand config, nothing hard-coded. Motion uses motion.enter / motion.exit presets.
- Fonts loaded properly (Remotion: @remotion/google-fonts or local files with staticFile; Python: local .ttf files).
- Respect layout.safe_margin for every element.
- A SampleSheet composition that shows all three components mid-animation on one 1920x1080 frame, labelled.
Constraints: no hex colours or font names outside brand.json. Add a grep check script that fails if any are found.
Done when: one command renders out/sample-sheet.png and the grep check passes.
```

For Remotion, the still render looks like this:

```bash
npx remotion still SampleSheet out/sample-sheet.png --frame=20
```

Look at the sample sheet at 100% and at phone size. Is the lower third readable? Does the title breathe? Fix by
changing config values, not component code. Upload the sample sheet.

> **If you're stuck:** if fonts fall back to a default sans, the font hadn't loaded before the frame was captured. In
> Remotion, ask the agent to use the font package's `loadFont()` (which waits for the font) instead of a CSS `@import`.
> In Python, point to the `.ttf` file path directly.

### 2. Re-skin an old video

Pick your day-27 explainer or yesterday's edit. First, let the agent swap its hard-coded titles and colours for your new
components (a one-time refactor). Then create a second config, `brand/brand-alt.json`: a completely different palette,
another font pair, a snappier `enter` preset. Render the same video with it:

```text
Add a --brand flag (or BRAND env var) to my render command so I can render any composition with brand/brand.json or
brand/brand-alt.json. Then render my explainer with brand-alt.json to out/explainer-alt.mp4. Do not change any component.
```

Run `git diff --stat` before rendering: only the JSON file should be new. Upload `explainer-alt.mp4`.

> **Tip:** a second config is also your first product. "Here's your explainer in your brand colours" is something
> small businesses happily pay for. You'll see that on day 39.

## Quiz

Config or component?

1. The exact green of the play button.
2. How the name bar is laid out: name above, role below, logo on the left.
3. How long a title stays on screen.
4. The spring used when anything enters.

<details><summary>Answers</summary>

1. Config (`colors.accent`).
2. Component — layout is the shape; it reads sizes and colours from the config.
3. Config (`motion.title_hold_s`).
4. Config (`motion.enter`); the component just applies the preset.

</details>

## You're done when…

- [ ] You can explain why hard-coded colours inside a component are a bug.
- [ ] `brand.json` plus Title, LowerThird and EndCard exist, and the sample sheet is uploaded.
- [ ] An old video re-rendered with a second config — and no component changed — is uploaded.
- [ ] Quiz done.

Tomorrow: the big one. Storyboard, voice, visuals, captions, music and render, all from one command.
