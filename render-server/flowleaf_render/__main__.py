"""`python -m flowleaf_render` — start the API server (container entrypoint). Reads PORT (default 8080)."""
import os

import uvicorn

if __name__ == "__main__":
    uvicorn.run("flowleaf_render.server:app", host=os.environ.get("HOST", "0.0.0.0"), port=int(os.environ.get("PORT", "8080")),
                workers=1, proxy_headers=True, forwarded_allow_ips="*")
