from __future__ import annotations

import asyncio
import hmac
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .config import Settings, settings
from .jobs import Job, run_job
from .transcribe import make_transcriber

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


class TranscribeRequest(BaseModel):
    resourceId: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    sourceType: str = Field(pattern=r"^(youtube|instagram|link|upload)$")
    callbackUrl: str = Field(min_length=8, max_length=2000)
    sourceUrl: str | None = Field(default=None, max_length=2000)
    mediaUrl: str | None = Field(default=None, max_length=2000)
    langHint: str | None = Field(default=None, max_length=8)


def create_app(s: Settings | None = None) -> FastAPI:
    s = s or settings()
    queue: asyncio.Queue[Job] = asyncio.Queue(maxsize=200)
    state: dict = {"transcriber": None, "active": 0, "done": 0, "failed": 0}

    async def worker() -> None:
        while True:
            job = await queue.get()
            state["active"] += 1
            try:
                if state["transcriber"] is None:
                    state["transcriber"] = make_transcriber(s)
                body = await asyncio.to_thread(run_job, job, s, state["transcriber"])
                state["done" if body.get("ok") else "failed"] += 1
            except Exception:  # make_transcriber misconfig etc. — keep the loop alive
                logging.getLogger("media-worker").exception("worker crashed on %s", job.resourceId)
                state["failed"] += 1
            finally:
                state["active"] -= 1
                queue.task_done()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        # CONCURRENCY=0 pauses processing (jobs still queue) — handy for maintenance and tests.
        tasks = [asyncio.create_task(worker()) for _ in range(max(0, s.concurrency))]
        yield
        for t in tasks:
            t.cancel()

    app = FastAPI(title="FlowLeaf media worker", version="1.0.0", lifespan=lifespan)
    app.state.queue = queue

    def auth(header: str | None) -> None:
        if not s.token:
            raise HTTPException(503, "MEDIA_WORKER_TOKEN is not configured")
        if not header or not hmac.compare_digest(header, f"Bearer {s.token}"):
            raise HTTPException(401, "unauthorized")

    @app.get("/healthz")
    def healthz() -> dict:
        return {"ok": True, "backend": s.backend, "queued": queue.qsize(), "active": state["active"], "done": state["done"], "failed": state["failed"]}

    @app.post("/v1/transcribe", status_code=202)
    async def transcribe(req: TranscribeRequest, authorization: str | None = Header(default=None)) -> dict:
        auth(authorization)
        if s.callback_prefixes and not any(req.callbackUrl.lower().startswith(p) for p in s.callback_prefixes):
            raise HTTPException(400, "callbackUrl not allowed")
        if not req.sourceUrl and not req.mediaUrl:
            raise HTTPException(400, "sourceUrl or mediaUrl required")
        try:
            queue.put_nowait(Job(**req.model_dump()))
        except asyncio.QueueFull:
            raise HTTPException(429, "queue full, retry later")
        return {"accepted": True, "resourceId": req.resourceId, "position": queue.qsize()}

    return app


app = create_app()
