"""Fetch remote images referenced by a storyboard (screenshots etc.) into a local cache, safely.

Guards against SSRF: only http(s), public IPs only (no loopback/private/link-local such as the AWS metadata endpoint)
unless FLR_ALLOW_PRIVATE_FETCH=1 (local dev, where the Worker runs on localhost). Max 12 MB, must decode as an image.
"""
from __future__ import annotations

import hashlib
import ipaddress
import os
import socket
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(os.environ.get("FLR_CACHE_DIR", ROOT / "data" / "cache")) / "images"
MAX_BYTES = 12 * 1024 * 1024


def _public_host(host: str) -> bool:
    if os.environ.get("FLR_ALLOW_PRIVATE_FETCH") == "1": return True
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            return False
    return True


def fetch_image(url: str, log=print) -> str | None:
    """-> local PNG path or None (caller draws a placeholder)."""
    import requests
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:24] + ".png")
    if out.exists(): return str(out)
    u = urlparse(url)
    if u.scheme not in ("http", "https") or not u.hostname or not _public_host(u.hostname):
        log(f"  [assets] refused {url[:80]}"); return None
    try:
        with requests.get(url, timeout=20, stream=True, allow_redirects=False,
                          headers={"user-agent": "flowleaf-render"}) as r:
            if r.status_code != 200: log(f"  [assets] {r.status_code} for {url[:80]}"); return None
            buf = bytearray()
            for chunk in r.iter_content(65536):
                buf += chunk
                if len(buf) > MAX_BYTES: log("  [assets] too big"); return None
        from io import BytesIO
        im = Image.open(BytesIO(bytes(buf)))
        im.thumbnail((2400, 2400))
        im.convert("RGBA").save(out)
        return str(out)
    except Exception as e:  # noqa: BLE001
        log(f"  [assets] failed {url[:80]}: {e}"); return None


MAX_VIDEO = int(os.environ.get("FLR_MAX_VIDEO_MB", "200")) * 1024 * 1024


def fetch_video(url: str, log=print) -> str | None:
    """-> local path of a probed video file or None."""
    import json as _json
    import subprocess
    import requests
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / (hashlib.sha1(url.encode()).hexdigest()[:24] + ".video")
    if out.exists(): return str(out)
    u = urlparse(url)
    if u.scheme not in ("http", "https") or not u.hostname or not _public_host(u.hostname):
        log(f"  [assets] refused {url[:80]}"); return None
    tmp = out.with_suffix(".part")
    try:
        with requests.get(url, timeout=60, stream=True, allow_redirects=False, headers={"user-agent": "flowleaf-render"}) as r:
            if r.status_code != 200: log(f"  [assets] {r.status_code} for {url[:80]}"); return None
            n = 0
            with open(tmp, "wb") as fh:
                for chunk in r.iter_content(1 << 20):
                    n += len(chunk)
                    if n > MAX_VIDEO: log("  [assets] video too big"); return None
                    fh.write(chunk)
        pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                             "-of", "json", str(tmp)], capture_output=True, text=True, timeout=30)
        if not _json.loads(pr.stdout or "{}").get("streams"): log("  [assets] not a video"); return None
        os.replace(tmp, out)
        return str(out)
    except Exception as e:  # noqa: BLE001
        log(f"  [assets] video failed {url[:80]}: {e}"); return None
    finally:
        tmp.unlink(missing_ok=True)


def collect_urls(sb: dict, templates, kind="image") -> list[str]:
    T = templates[sb["template"]]
    urls = [sb["fields"].get(f.key) for f in T.fields if f.type == kind]
    for sc in sb["scenes"]:
        K = T.kind(sc["kind"])
        urls += [sc["fields"].get(f.key) for f in K.fields if f.type == kind]
    return [u for u in dict.fromkeys(urls) if u]


def resolve(sb: dict, templates, log=print) -> dict:
    """Adds sb['_assets'] = {url: local_path|None} for every image and video field."""
    sb["_assets"] = {u: fetch_image(u, log) for u in collect_urls(sb, templates, "image")}
    sb["_assets"].update({u: fetch_video(u, log) for u in collect_urls(sb, templates, "video")})
    return sb
