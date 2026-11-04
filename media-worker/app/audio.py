from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

# 16 kHz mono 32 kbit/s MP3 ≈ 14 MB per hour — small enough for the transcription API's 25 MB limit per request.
SEGMENT_SECONDS = 20 * 60


def probe_duration(path: Path) -> float | None:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
            capture_output=True, text=True, timeout=60, check=True,
        )
        return float(json.loads(r.stdout)["format"]["duration"])
    except Exception:
        return None


def to_speech_mp3(src: Path, dst_dir: Path) -> list[Path]:
    """Convert any audio/video to 16 kHz mono mp3, split into ≤20 min parts. Returns the part paths in order."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(src) or 0
    parts = max(1, math.ceil(duration / SEGMENT_SECONDS)) if duration else 1
    out: list[Path] = []
    for i in range(parts):
        dst = dst_dir / f"part{i:03d}.mp3"
        cmd = ["ffmpeg", "-nostdin", "-y", "-v", "error"]
        if parts > 1:
            cmd += ["-ss", str(i * SEGMENT_SECONDS), "-t", str(SEGMENT_SECONDS)]
        cmd += ["-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "32k", str(dst)]
        subprocess.run(cmd, check=True, timeout=60 * 30)
        if dst.exists() and dst.stat().st_size > 0:
            out.append(dst)
    if not out:
        raise RuntimeError("ffmpeg produced no audio (is there an audio track?)")
    return out
