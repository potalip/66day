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


def collect_urls(sb: dict, templates) -> list[str]:
    T = templates[sb["template"]]
    urls = [sb["fields"].get(f.key) for f in T.fields if f.type == "image"]
    for sc in sb["scenes"]:
        K = T.kind(sc["kind"])
        urls += [sc["fields"].get(f.key) for f in K.fields if f.type == "image"]
    return [u for u in dict.fromkeys(urls) if u]


def resolve(sb: dict, templates, log=print) -> dict:
    """Adds sb['_assets'] = {url: local_path|None}."""
    sb["_assets"] = {u: fetch_image(u, log) for u in collect_urls(sb, templates)}
    return sb
