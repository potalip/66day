from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

OK = {"resourceId": "r_abc", "sourceType": "youtube", "sourceUrl": "https://youtu.be/x", "callbackUrl": "https://app.example/api/pipeline/media-worker/callback"}


def client(**kw) -> TestClient:
    s = Settings(token=kw.pop("token", "secret"), backend="fake", concurrency=0, **kw)
    return TestClient(create_app(s))


def test_health():
    with client() as c:
        r = c.get("/healthz")
        assert r.status_code == 200 and r.json()["backend"] == "fake"


def test_auth_required():
    with client() as c:
        assert c.post("/v1/transcribe", json=OK).status_code == 401
        assert c.post("/v1/transcribe", json=OK, headers={"authorization": "Bearer nope"}).status_code == 401
    with client(token="") as c:
        assert c.post("/v1/transcribe", json=OK, headers={"authorization": "Bearer "}).status_code == 503


def test_accepts_and_queues():
    with client() as c:
        r = c.post("/v1/transcribe", json=OK, headers={"authorization": "Bearer secret"})
        assert r.status_code == 202 and r.json()["accepted"] is True
        assert c.app.state.queue.qsize() == 1


def test_validation_and_callback_allowlist():
    h = {"authorization": "Bearer secret"}
    with client() as c:
        assert c.post("/v1/transcribe", json={**OK, "resourceId": "../etc"}, headers=h).status_code == 422
        assert c.post("/v1/transcribe", json={**OK, "sourceUrl": None}, headers=h).status_code == 400
    with client(callback_prefixes=["https://flowleaf66.app/"]) as c:
        assert c.post("/v1/transcribe", json=OK, headers=h).status_code == 400
