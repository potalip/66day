# FlowLeaf media worker — download + transcribe + callback.
# Build:  docker build -t flowleaf-media-worker media-worker
# Local Whisper instead of the API: docker build --build-arg REQS=requirements-local.txt -t flowleaf-media-worker:local media-worker
FROM python:3.12-slim

ARG REQS=requirements.txt
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 WORKDIR=/tmp/media-worker

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 worker

WORKDIR /srv
COPY requirements*.txt ./
RUN pip install -r ${REQS}
COPY app ./app

USER worker
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/healthz').status==200 else 1)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"]
