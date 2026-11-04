"""Visual styles (palettes). Templates pick 2-3 of these. Video colours are data, not UI tokens."""
from .core import Palette

GH_DARK = ("#FF7B72", "#A5D6FF", "#79C0FF", "#7D8590", "#D2A8FF")
GH_LIGHT = ("#CF222E", "#0A3069", "#0550AE", "#6E7781", "#8250DF")

STYLES: dict[str, Palette] = {
    # Calm, editorial, matches the FlowLeaf web app in light mode.
    "paper": Palette("paper", bg="#F5F3EC", bg2="#FFFFFF", surface="#FFFFFF", fg="#16181D", muted="#5E646C",
                     accent="#1F8A5B", accent2="#B8892B", on_accent="#FFFFFF", line="#E1DED4",
                     dark=False, grain=.10, vignette=0, code_bg="#FFFFFF", syntax=GH_LIGHT),
    # FlowLeaf dark mode: charcoal, leaf green and gold.
    "night": Palette("night", bg="#0C0F11", bg2="#16231D", surface="#161A1D", fg="#F1F2EE", muted="#9AA1A9",
                     accent="#3FBF85", accent2="#E0B55A", on_accent="#06120C", line="#2A3034",
                     dark=True, grain=.22, vignette=.35, code_bg="#0F1417", syntax=GH_DARK),
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
