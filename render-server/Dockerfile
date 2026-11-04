# FlowLeaf render server: Python + cairo + ffmpeg. ~600 MB image.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg libcairo2 libcairo2-dev pkg-config gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && apt-get purge -y gcc libcairo2-dev pkg-config && apt-get autoremove -y

COPY fonts ./fonts
COPY flowleaf_render ./flowleaf_render

ENV FLR_DATA_DIR=/data PORT=8080 PYTHONUNBUFFERED=1
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8080/health')"
CMD ["sh", "-c", "uvicorn flowleaf_render.server:app --host 0.0.0.0 --port ${PORT} --workers 1"]
