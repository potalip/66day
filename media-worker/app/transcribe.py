from __future__ import annotations

from pathlib import Path
from typing import Protocol

import httpx

from .config import Settings


class Transcriber(Protocol):
    def __call__(self, part: Path, lang_hint: str | None) -> tuple[list[str], str | None]:
        """Return (segments, detected_language)."""


def make_transcriber(s: Settings) -> Transcriber:
    if s.backend == "fake":
        return _fake
    if s.backend == "faster-whisper":
        return _FasterWhisper(s.whisper_model)
    if s.backend == "openai":
        if not s.openai_key:
            raise RuntimeError("TRANSCRIBE_BACKEND=openai needs OPENAI_API_KEY")
        return _OpenAI(s.openai_key, s.openai_model)
    raise RuntimeError(f"unknown TRANSCRIBE_BACKEND {s.backend!r}")


def _fake(part: Path, lang_hint: str | None) -> tuple[list[str], str | None]:
    """Deterministic output for tests and demos — no network, no model."""
    name = part.name
    return ([f"This is a test transcript for {name}.", "It shows the whole pipeline working end to end.",
             "Replace TRANSCRIBE_BACKEND=fake with openai or faster-whisper for real speech."], lang_hint or "en")


class _OpenAI:
    """OpenAI audio transcription over plain HTTP (no SDK)."""

    def __init__(self, key: str, model: str):
        self.key, self.model = key, model

    def __call__(self, part: Path, lang_hint: str | None) -> tuple[list[str], str | None]:
        data = {"model": self.model, "response_format": "verbose_json" if self.model == "whisper-1" else "json"}
        if lang_hint in ("ru", "en"):
            data["language"] = lang_hint
        with part.open("rb") as f:
            r = httpx.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"authorization": f"Bearer {self.key}"},
                data=data, files={"file": (part.name, f, "audio/mpeg")}, timeout=600,
            )
        r.raise_for_status()
        body = r.json()
        segs = [s.get("text", "") for s in body.get("segments") or []] or [body.get("text", "")]
        return segs, body.get("language")


class _FasterWhisper:
    def __init__(self, model: str):
        from faster_whisper import WhisperModel  # optional dependency (requirements-local.txt)

        self.model = WhisperModel(model, device="auto", compute_type="int8")

    def __call__(self, part: Path, lang_hint: str | None) -> tuple[list[str], str | None]:
        segments, info = self.model.transcribe(str(part), language=lang_hint if lang_hint in ("ru", "en") else None, vad_filter=True)
        return [s.text for s in segments], getattr(info, "language", None)
