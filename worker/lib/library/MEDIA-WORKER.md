# Media worker contract (library pipeline ⇄ external transcription service)

The Worker can't download YouTube/Instagram media or run Whisper. A separate service does that: **[`media-worker/`](../../../media-worker/README.md)**
(Python/FastAPI, Dockerfile, deploy notes for AWS App Runner/ECS).
The seam is already wired: if `MEDIA_WORKER_URL` is set, the pipeline calls it whenever a transcript is missing.
Everything below is plain HTTPS + JSON, and both sides authenticate with one shared bearer token, `MEDIA_WORKER_TOKEN`.

## Config (Worker secrets / vars)
| name | meaning |
|---|---|
| `MEDIA_WORKER_URL` | base URL of the service, e.g. `https://media.flowleaf66.app` (empty = feature off) |
| `MEDIA_WORKER_TOKEN` | shared secret, sent as `Authorization: Bearer <token>` in **both** directions |
| `PUBLIC_BASE_URL` | public origin of this Worker, used to build `callbackUrl` / `mediaUrl` |

## 1. Worker → media worker: request a transcript
`POST {MEDIA_WORKER_URL}/v1/transcribe`
```json
{
  "resourceId": "r_k3j9x2ab",
  "sourceType": "youtube | instagram | link | upload",
  "sourceUrl": "https://www.youtube.com/watch?v=…",       // null for uploads
  "mediaUrl": "https://…/api/pipeline/media-worker/source/r_k3j9x2ab", // only for uploads (needs the bearer token)
  "langHint": "en | ru | other",
  "callbackUrl": "https://…/api/pipeline/media-worker/callback"
}
```
Respond `202` quickly and do the work asynchronously. Any non-2xx is logged in the resource's pipeline log, and the founder
can still paste a transcript by hand.

## 2. Media worker → Worker: download an uploaded file
`GET {PUBLIC_BASE_URL}/api/pipeline/media-worker/source/:resourceId` with the bearer token. It streams the original file
from R2 (`lib/uploads/<id>/source`).

## 3. Media worker → Worker: deliver the result
`POST {callbackUrl}` with the bearer token:
```json
{ "resourceId": "r_k3j9x2ab", "ok": true, "transcript": "plain text…", "lang": "en", "durationSec": 1680 }
```
or, on failure, `{ "resourceId": "…", "ok": false, "error": "yt-dlp: video unavailable" }`.

On success, the Worker saves the transcript (source `media_worker`), fills in the duration if it was unknown, and queues
`resource.build_lesson` for every audience language. A failure is logged, and the resource stays in "needs transcript".
The callback is idempotent: send it again to replace the transcript.

## Implementation
See `media-worker/`: an upload is fetched via the source URL; YouTube goes through yt-dlp, audio only (only for platforms in
`YTDLP_SOURCES`); ffmpeg converts to 16 kHz mono mp3 in 20-min parts; transcription uses the OpenAI API, faster-whisper or the
`fake` backend; segments are joined into paragraphs; then the callback, with retries.
Instagram is off by default (login wall + terms). The founder uploads the reel file instead, which takes the upload path.
