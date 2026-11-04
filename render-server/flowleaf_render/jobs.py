"""In-process job queue with on-disk persistence (DATA/jobs/<id>/job.json). One render at a time by default
(each render already uses every core); FLR_CONCURRENCY raises it on big boxes."""
from __future__ import annotations

import json
import os
import queue
import shutil
import threading
import time
import traceback
import uuid
from pathlib import Path

from . import engine
from .schema import validate
from .templates import TEMPLATES

TERMINAL = ("done", "failed", "canceled")


class JobStore:
    def __init__(self, data_dir: Path, storage, notify=None, log=print):
        self.dir = Path(data_dir) / "jobs"; self.dir.mkdir(parents=True, exist_ok=True)
        self.storage = storage
        self.notify = notify or (lambda job: None)
        self.log = log
        self.lock = threading.Lock()
        self.jobs: dict[str, dict] = {}
        self.q: queue.Queue[str] = queue.Queue()
        self._load()

    # ------------------------------------------------------------------ persistence
    def _path(self, jid): return self.dir / jid / "job.json"

    def _save(self, job):
        p = self._path(job["id"]); p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".tmp"); tmp.write_text(json.dumps(job, ensure_ascii=False)); os.replace(tmp, p)

    def _load(self):
        for p in sorted(self.dir.glob("*/job.json")):
            try: job = json.loads(p.read_text())
            except Exception: continue  # noqa: BLE001
            self.jobs[job["id"]] = job
            if job["status"] not in TERMINAL:      # server restarted mid-render: run it again
                job.update(status="queued", progress=0.0, stage="queued")
                self._save(job); self.q.put(job["id"])

    # ------------------------------------------------------------------ api
    def create(self, storyboard: dict, quality="final", callback_url=None, callback_token=None, external_id=None,
               metadata=None) -> dict:
        sb, warnings = validate(storyboard, TEMPLATES, strict=True)      # raises StoryboardError
        jid = "job_" + uuid.uuid4().hex[:20]
        job = {"id": jid, "status": "queued", "progress": 0.0, "stage": "queued", "quality": quality,
               "created_at": time.time(), "started_at": None, "finished_at": None, "error": None,
               "external_id": external_id, "metadata": metadata or {}, "storyboard": sb, "warnings": warnings,
               "callback_url": callback_url, "callback_token": callback_token, "result": None, "outputs": None}
        with self.lock:
            self.jobs[jid] = job; self._save(job)
        self.q.put(jid)
        return job

    def get(self, jid): return self.jobs.get(jid)

    def cancel(self, jid):
        job = self.jobs.get(jid)
        if job and job["status"] == "queued":
            self._update(job, status="canceled", finished_at=time.time()); return True
        return False

    def public(self, job: dict, include_storyboard=False) -> dict:
        hide = {"callback_token", "storyboard"} - ({"storyboard"} if include_storyboard else set())
        out = {k: v for k, v in job.items() if k not in hide}
        out["queue_position"] = self.position(job["id"])
        return out

    def position(self, jid):
        pending = sorted((j for j in self.jobs.values() if j["status"] == "queued"), key=lambda j: j["created_at"])
        for k, j in enumerate(pending):
            if j["id"] == jid: return k + 1
        return 0

    def stats(self):
        st = {}
        for j in self.jobs.values(): st[j["status"]] = st.get(j["status"], 0) + 1
        return st

    # ------------------------------------------------------------------ worker
    def _update(self, job, **kw):
        notify = "status" in kw and kw["status"] != job.get("status")
        with self.lock:
            job.update(kw); self._save(job)
        if notify: self.notify(job)

    def start(self, n=1):
        for k in range(n):
            threading.Thread(target=self._loop, name=f"render-{k}", daemon=True).start()
        threading.Thread(target=self._janitor, name="janitor", daemon=True).start()

    def cleanup(self, days: float):
        """Delete finished jobs (and their files) older than `days`. Returns how many were removed."""
        cutoff = time.time() - days * 86400
        old = [j for j in list(self.jobs.values()) if j["status"] in TERMINAL and (j.get("finished_at") or j["created_at"]) < cutoff]
        for j in old:
            shutil.rmtree(self.dir / j["id"], ignore_errors=True)
            with self.lock: self.jobs.pop(j["id"], None)
        return len(old)

    def _janitor(self):
        days = float(os.environ.get("FLR_RETENTION_DAYS", "7"))
        while True:
            try:
                n = self.cleanup(days)
                if n: self.log(f"janitor: removed {n} old job(s)")
            except Exception as e:  # noqa: BLE001
                self.log(f"janitor failed: {e}")
            time.sleep(3600)

    def _loop(self):
        while True:
            jid = self.q.get()
            job = self.jobs.get(jid)
            if not job or job["status"] != "queued": continue
            try:
                self.run(job)
            except Exception as e:  # noqa: BLE001
                self.log(traceback.format_exc())
                self._update(job, status="failed", error=str(e)[:500], finished_at=time.time())

    def run(self, job):
        self._update(job, status="rendering", stage="starting", started_at=time.time(), progress=0.01)
        outdir = self.dir / job["id"] / "render"
        last = [0.0]

        def prog(u, stage):
            if u - last[0] >= .03 or stage != job["stage"]:
                last[0] = u; self._update(job, progress=round(u * .95, 3), stage=stage)
        meta = engine.render(job["storyboard"], outdir, quality=job["quality"], progress=prog, log=self.log)
        self._update(job, status="uploading", stage="uploading", progress=.96)
        files = {"video_url": Path(meta["video"]), "thumbnail_url": Path(meta["thumbnail"]),
                 "contact_url": Path(meta["contact"])}
        outputs = self.storage.publish(job["id"], files)
        shutil.rmtree(outdir / "scenes", ignore_errors=True)
        shutil.rmtree(outdir / "audio", ignore_errors=True)
        result = {k: meta[k] for k in ("duration", "width", "height", "fps", "format", "quality", "voiceover",
                                       "scenes", "render_seconds")}
        self._update(job, status="done", stage="done", progress=1.0, finished_at=time.time(), result=result,
                     outputs=outputs)

    def file_path(self, jid, name):
        p = (self.dir / jid / "render" / name).resolve()
        if self.dir.resolve() not in p.parents or not p.is_file(): return None
        return p

    def refresh_urls(self, job):
        """Local storage URLs are signed and expire: re-sign on read so the Worker always gets a working link."""
        if job["status"] == "done" and self.storage.kind == "local":
            job["outputs"] = self.storage.publish(job["id"], {
                "video_url": Path("video.mp4"), "thumbnail_url": Path("thumbnail.jpg"), "contact_url": Path("contact.png")})
        return job
