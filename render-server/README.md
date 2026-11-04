# FlowLeaf render server

Python service that turns a **storyboard JSON** into a finished video: pycairo draws every frame, ffmpeg encodes,
scenes render in parallel, audio is mixed and loudness-normalised (-14 LUFS), and every render ships with a
thumbnail and a contact sheet for QA. It is the engine behind the web **Studio** (`/:lang/studio`).

Seeded from the reference engine in `reference/` (architecture only — no client branding).

```
flowleaf_render/
  core.py        drawing toolkit: easing, shapes, Pillow text → cairo, fit/wrap, captions, wipe transition, ffmpeg pipe
  styles.py      palettes (paper, night, forest, sunrise, terminal, ink)
  schema.py      Field / SceneKind / Template declarations + storyboard validation
  common.py      shared intro/outro scenes, backdrops
  icons.py       small stroke icon set
  templates/     one module per video type (registry in templates/__init__.py)
  engine.py      storyboard → scenes → mp4 + thumbnail + contact sheet
  audio.py       ElevenLabs TTS / SFX / music with synth fallback, mixing, ducking
  jobs.py        job queue (persisted to disk, resumes after restart)
  storage.py     local signed links or S3-compatible upload (AWS S3, Cloudflare R2, MinIO)
  server.py      FastAPI app — contract in API.md
  cli.py         render / stills / catalog / previews from the shell
```

## Templates (7 types × 2–4 styles × 3 formats)

| id | what | scene kinds | styles |
|---|---|---|---|
| `kinetic-quote` | kinetic typography hooks, statements, quotes | hook, statement, quote, outro | night, paper, forest, ink |
| `explainer` | step-by-step how-to with icons + progress | intro, step, outro | paper, sunrise, night |
| `listicle` | top-N countdown with big ranks | intro, item, outro | forest, sunrise, night |
| `numbers` | counters, bar charts, A-vs-B | intro, stat, bars, compare, outro | night, paper, forest |
| `code-walkthrough` | code typing with syntax colours + terminal | intro, code, terminal, outro | terminal, paper, night |
| `before-after` | swipe reveal, side-by-side, features | intro, swipe, compare, feature, outro | paper, night, sunrise |
| `day-recap` | 66-day progress card, XP, streak, tomorrow | recap, next, outro | paper, night, forest |

Formats: `9x16` (1080×1920, text kept inside a Reels/TikTok/Shorts safe area), `1x1` (1080²), `16x9` (1920×1080).
Every template has a full example storyboard in English and Russian (separately written, not translated).
Small samples: `samples/*.jpg` (contact sheets of every template, both languages).

### Adding a template
1. Create `flowleaf_render/templates/<name>.py` exporting `TEMPLATE = Template(...)` with fields, scene kinds
   (each with a `draw(f, scene, bc)`), styles and `examples={"en":…, "ru":…}`.
2. Add it to `MODULES` in `templates/__init__.py`.
3. `python -m flowleaf_render.cli stills <id> --fmt 9x16|1x1|16x9 --lang en|ru` and **look at the sheet**.
4. `python -m flowleaf_render.cli catalog --out ../worker/lib/studio/catalog.generated.json` so the Studio sees it.
5. `pytest` (checks examples validate and every format draws).

Draw rules: sizes are in design units (`* f.s`); lay out inside `f.safe()`; always `fit()`/`wrap()` user text
into a box (never assume length); ease every motion; colours only from the palette `f.P`.

## Run locally

```bash
sudo apt-get install -y ffmpeg libcairo2-dev pkg-config     # (already present in the dev container)
pip install --break-system-packages -r render-server/requirements.txt
cd render-server

python -m flowleaf_render.cli render explainer --fmt 9x16 --lang ru     # → data/out/renders/…/video.mp4 + contact.png
python -m flowleaf_render.cli stills listicle --fmt 16x9 --draft        # layout check, no encoding
python -m flowleaf_render.cli samples                                    # stills for every template/format/lang

RENDER_SERVER_TOKEN=dev-render uvicorn flowleaf_render.server:app --port 8080
pytest -q tests
```

Then in the web app's `.dev.vars`: `RENDER_SERVER_URL=http://localhost:8080` and `RENDER_SERVER_TOKEN=dev-render`.

Speed (4 vCPU): a 23 s 1080×1920 video renders in ~30 s; `draft` quality in ~8 s.

## Environment

| var | default | meaning |
|---|---|---|
| `RENDER_SERVER_TOKEN` | — | **required** bearer token (shared with the Worker). Without it the API returns 503 unless `FLR_ALLOW_NO_AUTH=1` |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | public URL of this server (used in signed local file links) |
| `FLR_DATA_DIR` | `./data` | jobs, renders, ElevenLabs cache |
| `FLR_CONCURRENCY` | `1` | renders at once (each render already uses all cores) |
| `FLR_WORKERS` | cpu count | processes per render |
| `ELEVENLABS_API_KEY` | — | enables voiceover (+ AI SFX/music). Without it: synth music + SFX, captions carry the words |
| `ELEVEN_VOICE_ID`, `ELEVEN_TTS_MODEL` | Brian, `eleven_multilingual_v2` | voice; the multilingual model speaks Russian |
| `ELEVEN_MUSIC` | `1` | set `0` to keep synth music even with a key |
| `S3_BUCKET` | — | enables S3-compatible upload of outputs |
| `S3_ENDPOINT_URL` | AWS | e.g. `https://<account>.r2.cloudflarestorage.com` for R2 |
| `S3_REGION`, `S3_PREFIX`, `S3_PUBLIC_BASE_URL` | | region; key prefix (`flowleaf-renders`); public base (else presigned URLs) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | | standard boto3 credentials (or an IAM task role on AWS) |

## Deploy on AWS

The image is self-contained: `docker build -t flowleaf-render render-server/`.

**Option A — ECS Fargate (recommended to start).**
1. Push the image to ECR (`aws ecr create-repository --repository-name flowleaf-render`, `docker push …`).
2. Task definition: 4 vCPU / 8 GB (rendering is CPU-bound; memory use is modest), port 8080, env vars above,
   `RENDER_SERVER_TOKEN` + `ELEVENLABS_API_KEY` from Secrets Manager, an IAM task role with
   `s3:PutObject`/`s3:GetObject` on the bucket, `S3_BUCKET` set (Fargate disk is ephemeral — outputs must go to S3).
3. Service with 1 task behind an ALB (HTTPS listener with an ACM certificate, health check `/health`,
   idle timeout ≥ 60 s). Point `RENDER_SERVER_URL` in the Worker at the ALB hostname.
4. Scale: jobs queue in-process, so run **one task per service** and raise `FLR_CONCURRENCY`/CPU, or put several
   services behind separate URLs. (A shared SQS queue is the next step if you need horizontal scale.)

**Option B — single EC2 box (cheapest for bursts of renders).** `c7i.xlarge`/`c7a.xlarge`, Docker,
`docker run -d --restart=always -p 8080:8080 -v /srv/flr:/data --env-file /srv/flr.env flowleaf-render`, Caddy or
nginx in front for TLS. Local storage works here (persistent EBS); set `PUBLIC_BASE_URL=https://render.example.com`.

S3 bucket: block public access and use presigned URLs (default), or serve through CloudFront and set
`S3_PUBLIC_BASE_URL`. Cloudflare R2 works too (`S3_ENDPOINT_URL`, region `auto`) — then the bucket can even be
the same R2 bucket the Worker uses.

Cost guide: a 30 s full-HD render ≈ 40 CPU-seconds → on Fargate (≈ $0.04/vCPU-h) well under a cent per video.
