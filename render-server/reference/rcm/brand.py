"""RoofCraft brand kit — single source of truth for every video."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
FONTS = BRAND / "fonts"
PHOTOS = BRAND / "photos"
LOGO_WHITE = BRAND / "logo" / "logo_white.png"   # for dark backgrounds
LOGO_COLOR = BRAND / "logo" / "roofcraft-2026.png"  # for light backgrounds

# ---- colors (hex) ----
NAVY_0 = "#00000C"    # base background
NAVY_1 = "#0A1030"    # radial lift
NAVY_2 = "#141C48"    # cards / panels
BLUE = "#0046FD"      # brand accent (logo blue) = the RoofCraft "solution"
BLUE_LT = "#4C7DFF"
WHITE = "#FFFFFF"
GREY = "#9AA3C0"      # secondary text on navy
AMBER = "#FFB020"     # "problem" accent — use sparingly
RED = "#FF4B4B"       # danger (storm, leak) — very sparingly
GREEN = "#2BD47D"     # checkmarks / savings

# ---- facts (all from roofcraftcompany.com — don't invent new claims) ----
PHONE = "(408) 904-8900"
SITE = "roofcraftcompany.com"
TAGLINE = ("Your Roof.", "Done Once.", "Done Right.")
TAGLINE_SHORT = "Done Once. Done Right."
FACTS = {
    "warranty": "25-Year Workmanship Warranty on roof replacements",
    "emergency": "48hr Emergency",
    "estimates": "Free Estimates",
    "trust": "Licensed, Insured & BBB Accredited",
    "license": "CA License #1157563",
    "area": "Based in Sunnyvale, serving 60+ Bay Area cities",
    "regions": ["Peninsula", "South Bay", "East Bay", "Tri-Valley", "San Francisco"],
    "services": ["Roof Repair", "Roof Replacement", "Roof Inspections",
                 "Roof Maintenance", "Gutter Systems", "Commercial Roofing"],
    "roof_types": ["Asphalt Shingles", "Clay & Concrete Tile", "Metal Roofing", "Flat Roof Systems"],
    "process": "Detailed written estimates. Photo documentation before, during, and after. No surprises.",
    "quote": "Instant estimate range in seconds, or a free in-person inspection with an honest, written bid.",
    "financing": "Financing available",  # site has a Financing page; no terms published — never state rates/$0 down
}

# ---- photo sets ----
def photos(project: str, kind: str = ""):
    return sorted(PHOTOS.glob(f"{project}__{kind}*.jpg"))

PROJECTS = {
    "victorian_sf": "blue-victorian-gray-shingle-sf",          # before/after, 16:9
    "cedar_to_slate": "estate-cedar-shake-to-synthetic-slate",  # before/after (low-res after)
    "tile_stone": "gray-tile-stone-home-three-car",             # after only
    "metal_seam": "light-metal-standing-seam",                  # after only, 6 drone angles
    "metal_solar": "standing-seam-metal-solar",                 # during
    "shake_to_asphalt": "wood-shake-to-asphalt-peninsula",      # before/during/after — best full story
}
HERO = PHOTOS / "hero-1920.jpg"

# ---- formats ----
FORMATS = {"9x16": (1080, 1920), "16x9": (1920, 1080), "1x1": (1080, 1080), "4x5": (1080, 1350)}
FPS = 30

# Safe area for 9:16 social (Reels/TikTok/Shorts UI overlaps)
SAFE_9x16 = dict(left=90, right=90, top=220, bottom=380)

# ---- audio ----
# Default ElevenLabs voice: "Brian" premade (deep, confident US narrator). Override with ELEVEN_VOICE_ID.
DEFAULT_VOICE_ID = "nPczCjzI2devNBz1zQrb"
DEFAULT_VOICE_NAME = "Brian"
LUFS = -14
