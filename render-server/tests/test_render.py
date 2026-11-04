import json
import time

from fastapi.testclient import TestClient

from flowleaf_render import engine
from flowleaf_render.schema import deep
from flowleaf_render.templates import TEMPLATES


def tiny(tid="kinetic-quote"):
    sb = deep(TEMPLATES[tid].examples["en"])
    sb["scenes"] = sb["scenes"][:2]
    for s in sb["scenes"]: s["duration"] = 2.0
    sb["format"] = "1x1"
    return sb


def test_every_template_draws_a_frame_in_every_format(tmp_path):
    for tid, T in TEMPLATES.items():
        for fmt in ("9x16", "1x1", "16x9"):
            sb = deep(T.examples["ru"]); sb["format"] = fmt
            sheet = engine.stills(sb, tmp_path / f"{tid}_{fmt}", per_scene=(.6,), quality="draft")
            assert sheet.exists()


def test_render_smoke(tmp_path):
    meta = engine.render(tiny(), tmp_path, quality="draft", workers=1)
    assert abs(meta["duration"] - 4.0) < .01
    for k in ("video", "thumbnail", "contact"):
        assert (tmp_path / meta[k].split("/")[-1]).stat().st_size > 1000
    assert meta["width"] == 540 and meta["height"] == 540


def test_api_job_lifecycle(tmp_path, monkeypatch):
    monkeypatch.setenv("FLR_DATA_DIR", str(tmp_path))
    import importlib
    import flowleaf_render.server as server
    server = importlib.reload(server)
    H = {"authorization": "Bearer test-token"}
    with TestClient(server.app) as c:
        assert c.get("/health").json()["ok"]
        assert len(c.get("/v1/templates").json()["templates"]) >= 6
        assert c.post("/v1/jobs", json={"storyboard": tiny()}).status_code == 401
        r = c.post("/v1/jobs", json={"storyboard": {"template": "nope"}}, headers=H)
        assert r.status_code == 422 and r.json()["error"] == "invalid_storyboard"
        r = c.post("/v1/preview", json={"storyboard": tiny(), "scene": 1}, headers=H)
        assert r.status_code == 200 and r.headers["content-type"] == "image/png"
        job = c.post("/v1/jobs", json={"storyboard": tiny(), "quality": "draft"}, headers=H).json()
        for _ in range(120):
            job = c.get(f"/v1/jobs/{job['id']}", headers=H).json()
            if job["status"] in ("done", "failed"): break
            time.sleep(.5)
        assert job["status"] == "done", job
        url = job["outputs"]["video_url"].split("8080", 1)[-1]
        v = c.get(url)
        assert v.status_code == 200 and len(v.content) > 1000
        assert c.get(url + "0").status_code == 403


def test_janitor_removes_old_jobs(tmp_path):
    from flowleaf_render.jobs import JobStore
    from flowleaf_render.storage import LocalStorage
    st = JobStore(tmp_path, LocalStorage("http://x"), log=lambda *_: None)
    job = st.create(tiny(), "draft")
    job.update(status="done", finished_at=time.time() - 10 * 86400); st._save(job)
    (st.dir / job["id"] / "render").mkdir(parents=True)
    assert st.cleanup(7) == 1
    assert not (st.dir / job["id"]).exists() and st.get(job["id"]) is None
