"""Where finished renders live: local disk (dev) or any S3-compatible bucket (AWS S3, Cloudflare R2, MinIO)."""
from __future__ import annotations

import hashlib
import hmac
import os
import time
from pathlib import Path

CONTENT_TYPES = {".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json"}


def _secret() -> bytes:
    return (os.environ.get("FLR_URL_SECRET") or os.environ.get("RENDER_SERVER_TOKEN") or "dev-insecure").encode()


def sign(job_id: str, name: str, exp: int) -> str:
    return hmac.new(_secret(), f"{job_id}/{name}:{exp}".encode(), hashlib.sha256).hexdigest()[:32]


def verify(job_id: str, name: str, exp: int, sig: str) -> bool:
    return exp >= time.time() and hmac.compare_digest(sign(job_id, name, exp), sig or "")


class LocalStorage:
    kind = "local"

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def publish(self, job_id: str, files: dict[str, Path], ttl=7 * 86400) -> dict[str, str]:
        exp = int(time.time() + ttl)
        return {k: f"{self.base_url}/v1/files/{job_id}/{p.name}?exp={exp}&sig={sign(job_id, p.name, exp)}"
                for k, p in files.items()}


class S3Storage:
    kind = "s3"

    def __init__(self):
        import boto3
        self.bucket = os.environ["S3_BUCKET"]
        self.prefix = os.environ.get("S3_PREFIX", "flowleaf-renders").strip("/")
        self.public = os.environ.get("S3_PUBLIC_BASE_URL", "").rstrip("/")
        self.client = boto3.client("s3", endpoint_url=os.environ.get("S3_ENDPOINT_URL") or None,
                                   region_name=os.environ.get("S3_REGION") or os.environ.get("AWS_REGION") or "auto")

    def publish(self, job_id: str, files: dict[str, Path], ttl=7 * 86400) -> dict[str, str]:
        out = {}
        for k, p in files.items():
            key = f"{self.prefix}/{job_id}/{p.name}"
            self.client.upload_file(str(p), self.bucket, key, ExtraArgs={
                "ContentType": CONTENT_TYPES.get(p.suffix, "application/octet-stream"),
                "CacheControl": "public, max-age=31536000, immutable"})
            out[k] = f"{self.public}/{key}" if self.public else self.client.generate_presigned_url(
                "get_object", Params={"Bucket": self.bucket, "Key": key}, ExpiresIn=min(ttl, 7 * 86400))
        return out


def make_storage(base_url: str):
    if os.environ.get("S3_BUCKET"):
        return S3Storage()
    return LocalStorage(base_url)
