# FlowLeaf media worker

A small Python service. It does the one job a Cloudflare Worker can't: **download a video or audio file, transcribe it, and
send the transcript back** to the library pipeline. Once it's connected, "needs transcript" mostly goes away. Uploaded raw
videos and (where allowed) YouTube videos without reachable captions get transcripts automatically, and the RU and EN
lessons build right after.

```
Worker (library pipeline)                       media worker (this)
  ingest: no captions / upload ── POST /v1/transcribe ──▶ queue (202)
                                                         ├─ download: uploaded file (GET …/media-worker/source/:id)
                                                         │            or yt-dlp audio-only (YTDLP_SOURCES only)
                                                         ├─ ffmpeg → 16 kHz mono mp3, 20-min parts
                                                         ├─ transcribe: OpenAI API | faster-whisper | fake
  callback → save transcript ◀── POST callbackUrl ───────┘  paragraphs + language + duration
  → build RU + EN lessons
```

The HTTP contract is in [`worker/lib/library/MEDIA-WORKER.md`](../worker/lib/library/MEDIA-WORKER.md). Both directions use
the same `Authorization: Bearer $MEDIA_WORKER_TOKEN`.

## Configuration (environment)
| var | default | |
|---|---|---|
| `MEDIA_WORKER_TOKEN` | — | **required**; the same value as the Worker secret `MEDIA_WORKER_TOKEN` |
| `TRANSCRIBE_BACKEND` | `openai` | `openai` (Whisper API), `faster-whisper` (local model), `fake` (tests and demos) |
| `OPENAI_API_KEY` | — | for `openai` |
| `OPENAI_TRANSCRIBE_MODEL` | `whisper-1` | e.g. `gpt-4o-transcribe` |
| `WHISPER_MODEL` | `small` | for `faster-whisper`: `small` for CPU, `large-v3` on a GPU |
| `YTDLP_SOURCES` | `youtube` | platforms yt-dlp may download from (comma list). Instagram is **off** by default: it needs a logged-in cookie file and its terms forbid scraping, so the founder uploads reels instead |
| `YTDLP_COOKIES_FILE` | — | path to a Netscape cookies file, if you enable a platform that needs login. Keep it in a secret store, never in git |
| `MAX_MEDIA_MINUTES` | `180` | longer media is refused with a clear error |
| `CONCURRENCY` | `2` | parallel jobs; `0` pauses processing while still accepting jobs |
| `ALLOWED_CALLBACK_PREFIXES` | — | e.g. `https://flowleaf66.app/`; rejects other callback URLs (recommended in production) |

On the **Worker** side, set the secrets `MEDIA_WORKER_URL` (this service's base URL) and `MEDIA_WORKER_TOKEN`, and the var
`PUBLIC_BASE_URL` (the app's public origin, used to build the callback and source URLs).

## Run locally
```bash
cd media-worker
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -q                                   # 11 tests (uses ffmpeg)
MEDIA_WORKER_TOKEN=devtoken TRANSCRIBE_BACKEND=fake .venv/bin/uvicorn app.main:app --port 8790
```
Then add to the app's `.dev.vars`:
```
MEDIA_WORKER_URL=http://127.0.0.1:8790
MEDIA_WORKER_TOKEN=devtoken
PUBLIC_BASE_URL=http://localhost:5173
```
Restart `npm run dev`, go to Admin → Add resources → "Upload a video or a transcript", and upload a video **without** a
transcript. The batch tracker moves through Transcript ✓ by itself. With `fake`, the transcript is a fixed sentence; switch
to `openai` with a key for real speech.

## Deploy on AWS (recommended: App Runner)
1. `docker build -t flowleaf-media-worker media-worker`, then push to ECR.
2. App Runner service from the image, port 8080, 1 vCPU / 2 GB. Put the env vars above in App Runner (secrets via Secrets
   Manager), and set the health check path to `/healthz`.
3. Copy the service URL into the Worker: `wrangler secret put MEDIA_WORKER_URL`, `wrangler secret put MEDIA_WORKER_TOKEN`,
   and set `PUBLIC_BASE_URL` in `wrangler.jsonc` vars.

For local Whisper (`faster-whisper`), use ECS on Fargate with 4 vCPU / 8 GB (or a GPU EC2 instance for `large-v3`), built
with `--build-arg REQS=requirements-local.txt`. Cost guide: the OpenAI API is about $0.006 per audio minute, so a 30-minute
video costs about $0.18.

## Behaviour and limits
- Jobs are queued in memory. If the container restarts mid-job, that job is lost, and the founder can re-trigger it from the
  review screen ("Re-fetch metadata"). That's fine at founder scale; move to SQS if volume grows.
- Every job ends with a callback, `ok: true` with a transcript or `ok: false` with a readable `error`. The pipeline log shows
  it, so nothing hangs silently.
- Temporary files are deleted after each job.
- Article links (`sourceType: link`) are never sent here; the Worker reads the page text itself.
