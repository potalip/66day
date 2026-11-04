# FlowLeaf render server — Python + cairo + ffmpeg.
# Build:  docker build -t flowleaf-render render-server/
# Run:    docker run -p 8080:8080 -e RENDER_SERVER_TOKEN=... -v flr-data:/data flowleaf-render
# BASE_IMAGE can point at a registry mirror (e.g. public.ecr.aws/docker/library/python:3.12-slim) if Docker Hub is rate-limited.
ARG BASE_IMAGE=python:3.12-slim

# ---------- build stage: compile wheels (pycairo needs cairo headers + a compiler) ----------
FROM ${BASE_IMAGE} AS build
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends gcc pkg-config libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /wheels
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---------- runtime stage: only shared libraries + ffmpeg ----------
FROM ${BASE_IMAGE}
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libcairo2 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 render \
    && mkdir -p /data && chown render:render /data
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*.whl && rm -rf /wheels

WORKDIR /app
COPY fonts ./fonts
COPY flowleaf_render ./flowleaf_render

ENV FLR_DATA_DIR=/data PORT=8080 PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
USER 10001
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD ["python", "-c", "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:%s/health' % os.environ.get('PORT','8080'), timeout=4)"]
ENTRYPOINT ["python", "-m", "flowleaf_render"]
