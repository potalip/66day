from __future__ import annotations

import os
from dataclasses import dataclass, field


def _list(name: str, default: str) -> list[str]:
    return [x.strip().lower() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    """All configuration comes from the environment (see README)."""

    token: str = field(default_factory=lambda: os.getenv("MEDIA_WORKER_TOKEN", ""))
    backend: str = field(default_factory=lambda: os.getenv("TRANSCRIBE_BACKEND", "openai"))  # openai | faster-whisper | fake
    openai_key: str = field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    openai_model: str = field(default_factory=lambda: os.getenv("OPENAI_TRANSCRIBE_MODEL", "whisper-1"))
    whisper_model: str = field(default_factory=lambda: os.getenv("WHISPER_MODEL", "small"))
    # Sources yt-dlp may download from. Only list platforms whose terms you are comfortable with.
    ytdlp_sources: list[str] = field(default_factory=lambda: _list("YTDLP_SOURCES", "youtube"))
    ytdlp_cookies: str = field(default_factory=lambda: os.getenv("YTDLP_COOKIES_FILE", ""))
    max_minutes: int = field(default_factory=lambda: int(os.getenv("MAX_MEDIA_MINUTES", "180")))
    concurrency: int = field(default_factory=lambda: int(os.getenv("CONCURRENCY", "2")))
    # Callback URLs must start with one of these (guards against being used as an open relay). Empty = allow any.
    callback_prefixes: list[str] = field(default_factory=lambda: _list("ALLOWED_CALLBACK_PREFIXES", ""))
    workdir: str = field(default_factory=lambda: os.getenv("WORKDIR", "/tmp/media-worker"))


def settings() -> Settings:
    return Settings()
