"""HTTP API. Run: uvicorn flowleaf_render.server:app --host 0.0.0.0 --port 8080   (contract: render-server/API.md)"""
from __future__ import annotations

import hmac
import io
import json
import logging
import os
import threading
import time
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, Response

from . import __version__, audio
from . import core as C
from .engine import build_scenes, size_for
from .jobs import JobStore
from .schema import StoryboardError, validate
from .storage import make_storage, verify
from .styles import STYLES
from .templates import TEMPLATES, catalog

log = logging.getLogger("flowleaf_render")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

DATA = Path(os.environ.get("FLR_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", f"http://localhost:{os.environ.get('PORT', '8080')}")
TOKEN = os.environ.get("RENDER_SERVER_TOKEN", "")
ALLOW_NO_AUTH = os.environ.get("FLR_ALLOW_NO_AUTH") == "1"

@asynccontextmanager
async def lifespan(_app):
    store.start(int(os.environ.get("FLR_CONCURRENCY", "1")))
    yield


app = FastAPI(title="FlowLeaf render server", version=__version__, lifespan=lifespan)


def auth(authorization: str = Header(default="")):
    if not TOKEN:
        if ALLOW_NO_AUTH: return
        raise HTTPException(503, "RENDER_SERVER_TOKEN is not set on the server (or set FLR_ALLOW_NO_AUTH=1 for local dev)")
    got = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(got, TOKEN): raise HTTPException(401, "bad token")


def _post_callback(job: dict):
    url = job.get("callback_url")
    if not url: return
    payload = json.dumps({"event": f"job.{job['status']}", "job": store.public(job)}).encode()
    headers = {"content-type": "application/json",
               "authorization": f"Bearer {job.get('callback_token') or TOKEN}", "user-agent": "flowleaf-render"}

    def send():
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=15) as r:
                    if r.status < 300: return
            except Exception as e:  # noqa: BLE001
                log.warning("callback %s failed (%s), attempt %d", url, e, attempt + 1)
            time.sleep(2 ** attempt)
    threading.Thread(target=send, daemon=True).start()


store = JobStore(DATA, make_storage(PUBLIC_BASE_URL), notify=_post_callback, log=log.info)


@app.exception_handler(StoryboardError)
def _sb_error(_req: Request, e: StoryboardError):
    return JSONResponse({"error": "invalid_storyboard", "message": str(e), "errors": e.errors}, 422)


@app.get("/health")
def health():
    return {"ok": True, "version": __version__, "templates": list(TEMPLATES), "elevenlabs": audio.have_eleven(),
            "storage": store.storage.kind, "jobs": store.stats(), "auth": bool(TOKEN)}


@app.get("/v1/templates")
def templates():
    return catalog()


@app.post("/v1/validate", dependencies=[Depends(auth)])
def validate_sb(storyboard: dict = Body(...)):
    sb, errs = validate(storyboard, TEMPLATES, strict=False)
    return {"ok": not [e for e in errs if not e.get("soft")], "storyboard": sb, "errors": errs}


@app.post("/v1/jobs", status_code=202, dependencies=[Depends(auth)])
def create_job(body: dict = Body(...)):
    sb = body.get("storyboard")
    if not isinstance(sb, dict): raise HTTPException(400, "body.storyboard is required")
    q = body.get("quality", "final")
    if q not in ("final", "draft"): raise HTTPException(400, "quality must be final or draft")
    job = store.create(sb, q, body.get("callback_url"), body.get("callback_token"), body.get("external_id"),
                       body.get("metadata"))
    return store.public(job)


@app.get("/v1/jobs/{jid}", dependencies=[Depends(auth)])
def get_job(jid: str, storyboard: bool = False):
    job = store.get(jid)
    if not job: raise HTTPException(404, "no such job")
    return store.public(store.refresh_urls(job), include_storyboard=storyboard)


@app.delete("/v1/jobs/{jid}", dependencies=[Depends(auth)])
def cancel_job(jid: str):
    if not store.get(jid): raise HTTPException(404, "no such job")
    return {"canceled": store.cancel(jid)}


@app.get("/v1/files/{jid}/{name}")
def files(jid: str, name: str, exp: int = 0, sig: str = ""):
    if not verify(jid, name, exp, sig): raise HTTPException(403, "link expired or invalid")
    p = store.file_path(jid, name)
    if not p: raise HTTPException(404, "not found")
    return FileResponse(p, headers={"cache-control": "private, max-age=3600"})


@app.post("/v1/preview", dependencies=[Depends(auth)])
def preview(body: dict = Body(...)):
    """One PNG frame (draft size) of scene `scene` at time `t` (seconds into that scene; default 80%)."""
    sb, _ = validate(body.get("storyboard") or {}, TEMPLATES, strict=True)
    from .assets import resolve
    sb = resolve(sb, TEMPLATES, log.info)
    k = max(0, min(len(sb["scenes"]) - 1, int(body.get("scene", 0))))
    name, dur, draw = build_scenes(sb)[k]
    t = float(body.get("t", dur * .8))
    W, H = size_for(sb["format"], "draft")
    buf = io.BytesIO()
    import cairo
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    draw(C.Frame(ctx, W, H, min(max(0, t), dur), dur, int(t * C.FPS), sb["format"], STYLES[sb["style"]], sb["lang"]))
    surf.write_to_png(buf)
    return Response(buf.getvalue(), media_type="image/png")
