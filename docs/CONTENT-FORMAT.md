# Curriculum content format (contract between `curriculum` and `learn`)

```
content/curriculum/
  ru/program.json            # Program (shared/types.ts) — phases, title, tagline
  en/program.json
  ru/common/day-01.md        # days shared by both tracks
  ru/apps/day-15.md          # track-specific days
  ru/video/day-15.md
  en/...                     # same day/track/task-id skeleton as ru
content/badges.json          # [{ id, icon (emoji or lucide name), title: {ru,en}, description: {ru,en}, rule: "text" }]
```

Rules
- For every day 1..66 and every lang: either `common/day-NN.md` exists, or **both** `apps/day-NN.md` and `video/day-NN.md` exist.
- Task `id`s and `xp` values are identical between `ru` and `en` for the same day/track (progress is language-independent).
  Titles, body, examples and resources may differ — they are adaptations, not translations.
- `resources:` entries are URLs for now (the library may later replace them with resource ids `lib:<id>`).

Each day file = YAML frontmatter + markdown body:

```markdown
---
day: 7
track: common            # common | apps | video
phase: 1
title: "Rest, reflect, recharge"
summary: "One sentence shown on the path map."
estMinutes: 30
rest: true               # optional
boss: false              # optional — milestone project day
badges: [week-1]         # optional, ids from content/badges.json, awarded on day completion
resources:
  - https://www.youtube.com/watch?v=...
tasks:
  - id: d07-t1           # d<NN>-[apps-|video-]t<N>
    type: reflect        # watch | read | build | ship | reflect | quiz | share
    title: "Write 5 sentences: what surprised you this week?"
    xp: 20
    proof: text          # none | link | text | file
---

## Lesson body in markdown
Short paragraphs, headings, lists, code blocks, callouts as blockquotes `> **Tip:** ...`.
```

The `learn` agent's `scripts/build-content.mjs` parses these into `shared/curriculum.generated.json`
(validated against `shared/types.ts`) and fails loudly on any rule violation. Until the curriculum branch lands,
`learn` uses its own small fixture in `content/fixtures/` (owned by learn).
