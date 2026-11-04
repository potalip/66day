"""Visual styles (palettes). Templates pick 2-3 of these. Video colours are data, not UI tokens."""
from .core import Palette

GH_DARK = ("#FF7B72", "#A5D6FF", "#79C0FF", "#7D8590", "#D2A8FF")
GH_LIGHT = ("#CF222E", "#0A3069", "#0550AE", "#6E7781", "#8250DF")

STYLES: dict[str, Palette] = {
    # Calm, editorial: the FlowLeaf web app's light tokens (web/src/styles.css · SHARE_PALETTE), so videos match the app.
    "paper": Palette("paper", bg="#FAFAF7", bg2="#FFFFFF", surface="#FFFFFF", fg="#15171A", muted="#5D636B",
                     accent="#187A4E", accent2="#B8892B", on_accent="#FFFFFF", line="#E4E4DC",
                     dark=False, grain=.10, vignette=0, code_bg="#FFFFFF", syntax=GH_LIGHT),
    # FlowLeaf dark mode: same tokens as the web app (web/src/styles.css), leaf green and gold.
    "night": Palette("night", bg="#0E1012", bg2="#14221B", surface="#15181B", fg="#ECEEEF", muted="#9BA2AA",
                     accent="#43C38A", accent2="#E3B95E", on_accent="#04140C", line="#262B30",
                     dark=True, grain=.22, vignette=.35, code_bg="#101316", syntax=GH_DARK),
    # Bold: deep forest green with lime — punchy for shorts.
    "forest": Palette("forest", bg="#0D3A2B", bg2="#18573F", surface="#124633", fg="#F6F2E7", muted="#A8C7B7",
                      accent="#C6F16A", accent2="#FFD27A", on_accent="#0D3A2B", line="#2B6A54",
                      dark=True, grain=.18, vignette=.3, code_bg="#0A2E22", syntax=GH_DARK),
    # Warm, friendly, high-energy light style.
    "sunrise": Palette("sunrise", bg="#FFF1E3", bg2="#FFE0BF", surface="#FFFFFF", fg="#2A1912", muted="#7A5D4F",
                       accent="#E2552B", accent2="#1F8A5B", on_accent="#FFFFFF", line="#F0D3BA",
                       dark=False, grain=.10, vignette=0, code_bg="#FFFFFF", syntax=GH_LIGHT),
    # Code: editor-dark.
    "terminal": Palette("terminal", bg="#0A0D10", bg2="#121A20", surface="#11161B", fg="#E6EDF3", muted="#8B949E",
                        accent="#3FBF85", accent2="#E0B55A", on_accent="#06120C", line="#262D34",
                        dark=True, grain=.15, vignette=.3, code_bg="#0D1216", syntax=GH_DARK),
    # Ink: high-contrast black & white with one green — editorial quotes.
    "ink": Palette("ink", bg="#FFFFFF", bg2="#F4F4F1", surface="#FFFFFF", fg="#0B0B0C", muted="#5C5F66",
                   accent="#0B0B0C", accent2="#1F8A5B", on_accent="#FFFFFF", line="#DCDCD6",
                   dark=False, grain=.06, vignette=0, code_bg="#FFFFFF", syntax=GH_LIGHT),
}

STYLE_NAMES = {
    "paper": {"en": "Paper", "ru": "Бумага"},
    "night": {"en": "Night", "ru": "Ночь"},
    "forest": {"en": "Forest", "ru": "Лес"},
    "sunrise": {"en": "Sunrise", "ru": "Рассвет"},
    "terminal": {"en": "Terminal", "ru": "Терминал"},
    "ink": {"en": "Ink", "ru": "Тушь"},
}
