from __future__ import annotations

import re
from collections.abc import Iterable

_SENT_END = re.compile(r"[.!?…]['\")»]*$")


def paragraphs(segments: Iterable[str], target_chars: int = 700) -> str:
    """Join transcript segments into readable paragraphs (break after a sentence end once ~target_chars is reached)."""
    out: list[str] = []
    cur: list[str] = []
    size = 0
    prev = None
    for raw in segments:
        seg = re.sub(r"\s+", " ", raw).strip()
        if not seg or seg == prev:  # drop empty + immediate repeats (common in auto captions)
            continue
        prev = seg
        cur.append(seg)
        size += len(seg) + 1
        if size >= target_chars and _SENT_END.search(seg):
            out.append(" ".join(cur))
            cur, size = [], 0
    if cur:
        out.append(" ".join(cur))
    return "\n\n".join(out)
