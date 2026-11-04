import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("RENDER_SERVER_TOKEN", "test-token")
os.environ.pop("ELEVENLABS_API_KEY", None)
