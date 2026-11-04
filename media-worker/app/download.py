from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

import httpx

from .config import Settings

MAX_BYTES = 2 * 1024**3  # 2 GB hard stop for uploaded files


class NotDownloadable(Exception):
    """The source can't (or mustn't) be downloaded — reported back to the pipeline as a clear error."""


def platform_of(url: str) -> str:
    host = (urlparse(url).hostname or "").lower().removeprefix("www.").removeprefix("m.")
    if host in ("youtube.com", "youtu.be", "youtube-nocookie.com", "music.youtube.com"):
        return "youtube"
    if host in ("instagram.com", "instagr.am"):
        return "instagram"
    return host


def fetch_upload(media_url: str, token: str, dst: Path) -> Path:
    """Stream an uploaded file from the Worker (GET /api/pipeline/media-worker/source/:id, bearer auth)."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    size = 0
    with httpx.stream("GET", media_url, headers={"authorization": f"Bearer {token}"}, timeout=120, follow_redirects=True) as r:
        if r.status_code != 200:
            raise NotDownloadable(f"source download HTTP {r.status_code}")
        with dst.open("wb") as f:
            for chunk in r.iter_bytes(1 << 20):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise NotDownloadable("file larger than 2 GB")
                f.write(chunk)
    return dst


def fetch_with_ytdlp(url: str, s: Settings, dst_dir: Path) -> tuple[Path, float | None, str | None]:
    """Audio-only download with yt-dlp. Only for platforms listed in YTDLP_SOURCES. Returns (file, duration, title)."""
    plat = platform_of(url)
    if plat not in s.ytdlp_sources:
        raise NotDownloadable(f"downloading from {plat} is disabled (YTDLP_SOURCES={','.join(s.ytdlp_sources)})")
    import yt_dlp  # imported lazily: heavy, and unit tests don't need it

    dst_dir.mkdir(parents=True, exist_ok=True)
    opts: dict = {
        "format": "bestaudio/best",
        "outtmpl": str(dst_dir / "source.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "match_filter": yt_dlp.utils.match_filter_func(f"duration < {s.max_minutes * 60}"),
    }
    if s.ytdlp_cookies:
        opts["cookiefile"] = s.ytdlp_cookies
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception as e:  # yt-dlp raises many types; surface the message
        raise NotDownloadable(f"yt-dlp: {str(e).splitlines()[0][:300]}") from e
    if not info:
        raise NotDownloadable("yt-dlp: nothing downloaded (too long or unavailable)")
    files = sorted(dst_dir.glob("source.*"))
    if not files:
        raise NotDownloadable("yt-dlp: no file written (video longer than MAX_MEDIA_MINUTES?)")
    return files[0], info.get("duration"), info.get("title")
