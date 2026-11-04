# FlowLeaf render server — API contract (v1)

Base URL: `RENDER_SERVER_URL` (e.g. `https://render.flowleaf66.com`). All `/v1/*` endpoints except
`/v1/templates` and `/v1/files/*` need `Authorization: Bearer <RENDER_SERVER_TOKEN>`.

## Storyboard

The one JSON shape that the Studio, Claude and the renderer share. Field definitions per template come from
`GET /v1/templates` (also committed to `worker/lib/studio/catalog.generated.json`).

```json
{
  "template": "explainer",            // id from /v1/templates
  "style": "paper",                   // one of template.styles[].id
  "format": "9x16",                   // 9x16 | 1x1 | 16x9  (1080x1920 | 1080x1080 | 1920x1080, 30 fps)
  "lang": "en",                       // en | ru (used for number formats, labels like "STEP 1 OF 4")
  "title": "Ship your first app",
  "fields": { "handle": "@me" },      // template-level fields (template.fields)
  "scenes": [
    { "kind": "intro", "duration": 3.2,
      "voiceover": "Spoken line; also burned in as captions",
      "fields": { "kicker": "4 steps", "title": "Ship your first app", "subtitle": "" } }
  ],
  "music": "calm",                    // calm | uplift | drive | focus | none
  "voiceover": true,                  // ElevenLabs TTS when the server has a key, otherwise captions only
  "captions": true,
  "transition": "wipe"                // wipe | fade | cut
}
```

Validation is forgiving where it can be: over-long text is truncated, unknown styles/options fall back to defaults,
durations are clamped to the scene kind's `[min, max]` — these come back as *soft* errors. Missing required
fields, unknown templates/scene kinds and too few scenes are *hard* errors (HTTP 422).

Field types: `text`, `textarea`, `list` (array of strings), `code` (multi-line, `maxLines`), `number` (`min`/`max`),
`select` (`options[].value`), `lines` (`"2, 4-6"`).

## Endpoints

### `GET /health`
`{ ok, version, templates: [ids], elevenlabs: bool, storage: "local"|"s3", jobs: {status: count}, auth: bool }`

### `GET /v1/templates`
`{ version: 1, templates: [ { id, name{en,ru}, description{en,ru}, category, styles[{id,name,palette}], formats,
fields[], sceneKinds[{kind,label,fields[],duration{default,min,max},hint}], minScenes, maxScenes,
defaults{style,music,transition}, aiNotes, examples{en,ru} } ] }`

### `POST /v1/validate`
Body: a storyboard. → `{ ok, storyboard (normalised), errors: [{path, code, message, soft?}] }`

### `POST /v1/jobs` → `202`
```json
{ "storyboard": { ... },
  "quality": "final",                         // final (full HD, crf 20) | draft (half size, fast)
  "callback_url": "https://app/api/studio/render-callback",   // optional
  "callback_token": "...",                    // optional; sent as Bearer on the callback (default: server token)
  "external_id": "studio project id",         // optional, echoed back
  "metadata": { } }                           // optional, echoed back
```
→ the job object (below). 422 `{error: "invalid_storyboard", message, errors}` on hard validation errors.

### `GET /v1/jobs/:id` (`?storyboard=1` to include the normalised storyboard)
```json
{ "id": "job_…", "status": "queued|rendering|uploading|done|failed|canceled",
  "progress": 0.42, "stage": "voiceover|scenes|assemble|audio|thumbnails|uploading|done",
  "queue_position": 0, "created_at": 1730000000.0, "started_at": …, "finished_at": …,
  "error": null, "external_id": "…", "metadata": {}, "warnings": [],
  "result": { "duration": 23.4, "width": 1080, "height": 1920, "fps": 30, "format": "9x16", "quality": "final",
              "voiceover": false, "render_seconds": 27.4, "scenes": [{"kind": "intro", "start": 0, "duration": 3.2}] },
  "outputs": { "video_url": "…/video.mp4", "thumbnail_url": "…/thumbnail.jpg", "contact_url": "…/contact.png" } }
```
Output URLs: with S3 configured, public (`S3_PUBLIC_BASE_URL`) or presigned (7 days); otherwise signed local links
`/v1/files/:id/:name?exp&sig` (7 days, re-signed on every `GET /v1/jobs/:id`). Consumers should copy the files
they keep (the Worker copies video + thumbnail into R2).

### `DELETE /v1/jobs/:id` → `{ canceled: bool }` (only queued jobs)

### `POST /v1/preview` → `image/png`
Body `{ storyboard, scene: 0, t: 1.5 }` — one draft-size frame of a scene at `t` seconds (default 80% in).

### Callback
On every status change the server POSTs to `callback_url`:
`{ "event": "job.rendering" | "job.done" | "job.failed" | …, "job": { …job object… } }`
with `Authorization: Bearer <callback_token or RENDER_SERVER_TOKEN>`. Retries 4× with backoff. Callbacks are a
hint — the Worker also polls `GET /v1/jobs/:id`, so a missed callback never loses a render.
