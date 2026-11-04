import shutil
import subprocess
from pathlib import Path

import pytest

from app import jobs
from app.config import Settings
from app.jobs import Job, run_job
from app.transcribe import make_transcriber


class Resp:
    def __init__(self, code=200):
        self.status_code, self.text = code, ""


@pytest.fixture
def tone(tmp_path: Path) -> Path:
    if not shutil.which("ffmpeg"):
        pytest.skip("ffmpeg not installed")
    f = tmp_path / "tone.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:a", "aac", str(f)], check=True)
    return f


def test_upload_job_end_to_end_with_fake_backend(tmp_path, tone, monkeypatch):
    s = Settings(token="t", backend="fake", workdir=str(tmp_path / "work"))
    monkeypatch.setattr(jobs, "fetch_upload", lambda url, token, dst: (dst.parent.mkdir(parents=True, exist_ok=True), shutil.copy(tone, dst))[1] and dst)
    sent = []
    body = run_job(Job("r_1", "upload", "https://cb/x", mediaUrl="https://w/src/r_1", langHint="ru"), s, make_transcriber(s),
                   post=lambda url, **kw: sent.append((url, kw)) or Resp())
    assert body["ok"] is True and body["lang"] == "ru" and body["durationSec"] == 3
    assert "test transcript" in body["transcript"]
    assert sent[0][0] == "https://cb/x" and sent[0][1]["headers"]["authorization"] == "Bearer t"
    assert not (tmp_path / "work" / "r_1").exists()  # cleaned up


def test_disabled_platform_reports_clear_error(tmp_path):
    s = Settings(token="t", backend="fake", workdir=str(tmp_path), ytdlp_sources=["youtube"])
    sent = []
    body = run_job(Job("r_2", "instagram", "https://cb/x", sourceUrl="https://www.instagram.com/reel/ABC/"), s, make_transcriber(s),
                   post=lambda url, **kw: sent.append(kw["json"]) or Resp())
    assert body["ok"] is False and "instagram is disabled" in body["error"]
    assert sent == [body]


def test_links_are_not_transcribed(tmp_path):
    s = Settings(token="t", backend="fake", workdir=str(tmp_path))
    body = run_job(Job("r_3", "link", "https://cb/x", sourceUrl="https://example.com"), s, make_transcriber(s), post=lambda *a, **k: Resp())
    assert body["ok"] is False


def test_callback_retries_on_5xx(tmp_path, monkeypatch):
    monkeypatch.setattr(jobs.time, "sleep", lambda *_: None)
    calls = []
    s = Settings(token="t", backend="fake", workdir=str(tmp_path))
    run_job(Job("r_4", "link", "https://cb/x", sourceUrl="https://e.com"), s, make_transcriber(s),
            post=lambda *a, **k: calls.append(1) or Resp(503 if len(calls) < 3 else 200))
    assert len(calls) == 3
