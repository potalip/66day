from __future__ import annotations

import logging
import shutil
import time
from dataclasses import dataclass
from pathlib import Path

import httpx

from .audio import probe_duration, to_speech_mp3
from .config import Settings
from .download import NotDownloadable, fetch_upload, fetch_with_ytdlp
from .text import paragraphs
from .transcribe import Transcriber

log = logging.getLogger("media-worker")


@dataclass
class Job:
    resourceId: str
    sourceType: str
    callbackUrl: str
    sourceUrl: str | None = None
    mediaUrl: str | None = None
    langHint: str | None = None


def run_job(job: Job, s: Settings, transcribe: Transcriber, post=httpx.post) -> dict:
    """Download → normalise audio → transcribe → callback. Always calls back (ok or error). Returns the callback body."""
    work = Path(s.workdir) / job.resourceId
    started = time.monotonic()
    try:
        if job.mediaUrl:
            src = fetch_upload(job.mediaUrl, s.token, work / "upload.bin")
            duration = probe_duration(src)
        elif job.sourceUrl and job.sourceType in ("youtube", "instagram"):
            src, duration, _title = fetch_with_ytdlp(job.sourceUrl, s, work)
        else:
            raise NotDownloadable(f"nothing to transcribe for a {job.sourceType!r} resource")
        if duration and duration > s.max_minutes * 60:
            raise NotDownloadable(f"media is {round(duration / 60)} min; limit is {s.max_minutes} (MAX_MEDIA_MINUTES)")
        parts = to_speech_mp3(src, work / "parts")
        segments: list[str] = []
        lang: str | None = None
        for part in parts:
            segs, detected = transcribe(part, job.langHint if job.langHint in ("ru", "en") else None)
            segments += segs
            lang = lang or detected
        text = paragraphs(segments)
        if len(text) < 40:
            raise NotDownloadable("transcription came back empty (no speech?)")
        body = {"resourceId": job.resourceId, "ok": True, "transcript": text, "lang": _short(lang), "durationSec": round(duration) if duration else None}
        log.info("job %s ok: %d chars in %.1fs", job.resourceId, len(text), time.monotonic() - started)
    except NotDownloadable as e:
        body = {"resourceId": job.resourceId, "ok": False, "error": str(e)}
        log.warning("job %s not downloadable: %s", job.resourceId, e)
    except Exception as e:  # never leave the pipeline hanging
        body = {"resourceId": job.resourceId, "ok": False, "error": f"{type(e).__name__}: {str(e)[:300]}"}
        log.exception("job %s failed", job.resourceId)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    _callback(job.callbackUrl, s.token, body, post)
    return body


def _short(lang: str | None) -> str | None:
    if not lang:
        return None
    lang = lang.lower()
    return {"russian": "ru", "english": "en"}.get(lang, lang[:2])


def _callback(url: str, token: str, body: dict, post) -> None:
    for attempt in range(4):
        try:
            r = post(url, json=body, headers={"authorization": f"Bearer {token}"}, timeout=30)
            if r.status_code < 500:
                if r.status_code >= 400:
                    log.error("callback rejected %s: %s", r.status_code, r.text[:200])
                return
        except httpx.HTTPError as e:
            log.warning("callback attempt %d failed: %s", attempt + 1, e)
        time.sleep(2 ** attempt)
    log.error("callback gave up for %s", body.get("resourceId"))
