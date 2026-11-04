"""Audio: ElevenLabs (voiceover, SFX, music) with a synthesized fallback, mixing, ducking, mastering.

Adapted from the reference engine. Key lookup: env ELEVENLABS_API_KEY, else render-server/.env (gitignored).
Every ElevenLabs call is cached in $FLR_CACHE_DIR/eleven/<sha1>.mp3 so re-renders never re-bill.
Without a key: synthesized music bed + SFX, no voice (captions carry the message).
"""
from __future__ import annotations
import hashlib, json, os, subprocess, tempfile
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
CACHE = Path(os.environ.get("FLR_CACHE_DIR", ROOT / "data" / "cache")) / "eleven"
DEFAULT_VOICE_ID = "nPczCjzI2devNBz1zQrb"   # ElevenLabs premade "Brian"; override with ELEVEN_VOICE_ID
LUFS = -14
API = "https://api.elevenlabs.io"

# --------------------------------------------------------------------------- key / http
def api_key():
    k = os.environ.get("ELEVENLABS_API_KEY")
    if k: return k.strip()
    env = ROOT / ".env"
    if env.exists():
        for ln in env.read_text().splitlines():
            if ln.strip().startswith("ELEVENLABS_API_KEY"):
                return ln.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def have_eleven(): return bool(api_key())

def _post(path, payload, params=None, kind="mp3"):
    import requests
    CACHE.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha1(json.dumps([path, payload, params], sort_keys=True).encode()).hexdigest()[:20]
    out = CACHE / f"{h}.{kind}"
    if out.exists() and out.stat().st_size > 1000: return out
    r = requests.post(API + path, params=params or {}, json=payload, timeout=180,
                      headers={"xi-api-key": api_key(), "Content-Type": "application/json"})
    if r.status_code != 200:
        raise RuntimeError(f"ElevenLabs {path} -> {r.status_code}: {r.text[:300]}")
    out.write_bytes(r.content); return out

def _decode(path) -> np.ndarray:
    """Any audio file -> mono float32 @ SR."""
    p = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1",
                        "-ar", str(SR), "-"], capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()

def voice_id():
    return os.environ.get("ELEVEN_VOICE_ID", DEFAULT_VOICE_ID)

def tts_model():
    return os.environ.get("ELEVEN_TTS_MODEL", "eleven_multilingual_v2")

# --------------------------------------------------------------------------- ElevenLabs calls
def eleven_tts(text, voice=None, stability=0.45, style=0.35, speed=1.0) -> np.ndarray:
    payload = {"text": text, "model_id": tts_model(),
               "voice_settings": {"stability": stability, "similarity_boost": 0.8, "style": style,
                                  "use_speaker_boost": True, "speed": speed}}
    return _decode(_post(f"/v1/text-to-speech/{voice or voice_id()}", payload,
                         {"output_format": "mp3_44100_128"}))

def eleven_sfx(prompt, dur=None, influence=0.5) -> np.ndarray:
    payload = {"text": prompt, "prompt_influence": influence}
    if dur: payload["duration_seconds"] = max(0.5, min(22.0, float(dur)))
    return _decode(_post("/v1/sound-generation", payload))

def eleven_music(prompt, seconds) -> np.ndarray:
    payload = {"prompt": prompt, "music_length_ms": int(max(10, seconds) * 1000)}
    return _decode(_post("/v1/music", payload))

# --------------------------------------------------------------------------- synth fallback
def _t(d): return np.arange(int(d * SR)) / SR
def _env(n, a=0.005, r=0.2, curve=3.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    rel = np.clip(1 - (t - a) / max(r, 1e-4), 0, 1) ** curve
    return att * np.where(t < a, 1, rel)
def _noise(d, seed=0): return np.random.default_rng(seed).standard_normal(int(d * SR)).astype(np.float32)
def _bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def _lp(x, hz, order=2):
    sos = signal.butter(order, hz, "lowpass", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def _hp(x, hz, order=2):
    sos = signal.butter(order, hz, "highpass", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def _norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1; return (x / m * peak).astype(np.float32)

def _sweep_filter(x, f0, f1, q=2.0, blocks=64):
    out = np.zeros_like(x); n = len(x); step = n // blocks + 1
    for b in range(blocks):
        s = b * step; e = min(n, s + step)
        if s >= n: break
        fc = f0 * (f1 / f0) ** (b / blocks)
        lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2.1)
        sos = signal.butter(2, [max(30, lo), hi], "bandpass", fs=SR, output="sos")
        out[s:e] = signal.sosfilt(sos, x[max(0, s - 2048):e])[-(e - s):]
    return out

def s_whoosh(d=0.55, up=True, seed=1):
    x = _noise(d, seed)
    x = _sweep_filter(x, 300 if up else 4000, 4000 if up else 300)
    t = _t(d); env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    return _norm(x * env, .8)

def s_impact(d=1.2, seed=2):
    t = _t(d)
    f = 70 * np.exp(-t * 3) + 32
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    click = _hp(_noise(d, seed), 2000) * np.exp(-t * 60) * .6
    body = _lp(_noise(d, seed + 1), 400) * np.exp(-t * 9) * .9
    return _norm(np.tanh((sub * 1.4 + click + body) * 1.6), .95)

def s_riser(d=1.5, seed=3):
    t = _t(d); u = t / d
    x = _sweep_filter(_noise(d, seed), 200, 9000) * u ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * u ** 2) / SR) * u ** 3 * .3
    return _norm(x + tone, .7)

def s_pop(d=0.18, f=900):
    t = _t(d); return _norm(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t * 40))) / SR) * _env(len(t), .002, d), .6)

def s_tick(d=0.04): return _norm(_hp(_noise(d, 9), 3000) * _env(int(d * SR), .001, d, 4), .45)

def s_ding(d=1.4, f=1318.5):
    t = _t(d); x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2 + k * 2)) / k for k in (1, 2.76, 5.4))
    return _norm(x * _env(len(t), .002, d, 1.5), .5)




def s_type(d=0.9, seed=21, rate=14):
    """Keyboard typing burst (for code scenes)."""
    n = int(d * SR); out = np.zeros(n, np.float32); r = np.random.default_rng(seed)
    t = 0.0
    while t < d - .05:
        x = s_tick(.03) * r.uniform(.4, 1.0)
        p = int(t * SR); out[p:p + len(x)] += x[: n - p]
        t += r.uniform(.6, 1.4) / rate
    return _norm(_bp(out, 1500, 9000), .5)

def s_stamp(d=0.6): return _norm(s_impact(d, 11)[: int(d * SR)] * .6 + _lp(_noise(d, 12), 1200) * np.exp(-_t(d) * 25), .9)


def s_cash(d=0.9): return _norm(s_ding(d, 2093) + s_ding(d, 2637) * .7, .6)

def s_glitch(d=0.3, seed=14):
    x = _noise(d, seed); x = np.sign(x) * (np.abs(x) > 1.2); return _norm(_bp(x, 400, 5000) * _env(len(x), .002, d, 1), .5)

SYNTH = {"whoosh": s_whoosh, "whoosh_down": lambda **k: s_whoosh(up=False, **k), "impact": s_impact,
         "riser": s_riser, "pop": s_pop, "tick": s_tick, "ding": s_ding, "stamp": s_stamp,
         "cash": s_cash, "glitch": s_glitch, "type": s_type}

# Default ElevenLabs prompts for each cue name (used when a key is present and the cue gives no prompt)
ELEVEN_PROMPTS = {
    "whoosh": ("fast clean cinematic whoosh transition, airy", .6),
    "whoosh_down": ("deep downward cinematic swoosh", .6),
    "impact": ("heavy cinematic trailer impact boom with sub bass hit", 1.5),
    "riser": ("short tension riser building up, cinematic", 1.5),
    "pop": ("short soft UI pop click", .5),
    "tick": ("single crisp mechanical tick", .5),
    "ding": ("bright positive notification chime", 1.2),
    "stamp": ("heavy rubber stamp slam on a desk", .7),
    "cash": ("cash register cha-ching", 1.0),
    "glitch": ("short digital glitch stutter", .5),
    "type": ("fast mechanical keyboard typing, short burst", 1.0),
}

def sfx(name, dur=None, prompt=None, use_eleven=None):
    use = have_eleven() if use_eleven is None else use_eleven
    if use:
        p, d = ELEVEN_PROMPTS.get(name, (name, dur or 1.0))
        try: return eleven_sfx(prompt or p, dur or d)
        except Exception as e: print(f"  [sfx] ElevenLabs failed for {name}: {e} -> synth")
    fn = SYNTH[name]
    return fn(d=dur) if dur else fn()

# --------------------------------------------------------------------------- synth music bed
MOODS = {  # bpm, root Hz, chord progression (semitones from root), brightness
    "tense":   (96, 55.0, [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], 900),
    "uplift":  (112, 65.4, [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], 2200),
    "drive":   (122, 61.7, [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], 1800),
    "calm":    (88, 73.4, [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [2, 5, 9, 12]], 1500),
    "focus":   (78, 69.3, [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], 1100),
}

def synth_music(dur, mood="drive", seed=0):
    bpm, root, prog_, bright = MOODS[mood]
    beat = 60 / bpm; n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    bar = beat * 4
    # pad + bass
    for i in range(int(dur / bar) + 1):
        chord = prog_[i % len(prog_)]
        s, e = int(i * bar * SR), min(n, int((i + 1) * bar * SR))
        if s >= n: break
        tt = t[s:e] - i * bar
        pad = np.zeros(e - s)
        for semi in chord:
            f = root * 4 * 2 ** (semi / 12)
            for det in (-0.12, 0.12):
                pad += signal.sawtooth(2 * np.pi * f * (1 + det / 100) * tt) * .05
        fade = np.minimum(1, np.minimum(tt / .3, (bar - tt) / .3))
        out[s:e] += _lp(pad, bright) * fade
        bf = root * 2 ** (chord[0] / 12)
        for b8 in range(8):
            bs = s + int(b8 * beat / 2 * SR); be = min(e, bs + int(beat / 2 * SR * .9))
            if bs >= e: break
            bt = np.arange(be - bs) / SR
            out[bs:be] += (np.tanh(np.sin(2 * np.pi * bf * bt) * 2) * .22 * np.exp(-bt * 3))
    # drums
    k_len = int(.35 * SR); kt = np.arange(k_len) / SR
    kick = np.sin(2 * np.pi * np.cumsum(50 + 120 * np.exp(-kt * 35)) / SR) * np.exp(-kt * 9) * .8
    h_len = int(.05 * SR); hat = _hp(_noise(.05, seed), 7000) * _env(h_len, .001, .05, 4) * .18
    for b in range(int(dur / beat) + 1):
        p = int(b * beat * SR)
        if p + k_len < n: out[p:p + k_len] += kick
        hp_ = int((b + .5) * beat * SR)
        if hp_ + h_len < n: out[hp_:hp_ + h_len] += hat
    out = np.tanh(out * 1.2)
    fade_n = int(min(1.5, dur / 4) * SR)
    out[-fade_n:] *= np.linspace(1, 0, fade_n)
    return _norm(out, .8)

MUSIC_PROMPTS = {
    "calm": "calm minimal ambient electronic bed, soft pads, gentle pulse, no vocals",
    "uplift": "uplifting bright modern pop instrumental, claps, positive, no vocals",
    "drive": "driving energetic electronic beat for a short social video, punchy drums, no vocals",
    "focus": "lo-fi focus beat, warm keys, mellow drums, study vibe, no vocals",
}

def music(dur, mood="drive", prompt=None):
    prompt = prompt or MUSIC_PROMPTS.get(mood)
    if have_eleven() and prompt and os.environ.get("ELEVEN_MUSIC", "1") != "0":
        try:
            x = eleven_music(prompt, dur + 1)
            return fit(x, dur, fade=1.2)
        except Exception as e:
            print(f"  [music] ElevenLabs failed: {e} -> synth")
    return synth_music(dur, mood)

# --------------------------------------------------------------------------- voiceover
def voiceover(text, max_dur=None, voice=None):
    """Returns mono float32 VO or None when no key (captions still carry the message)."""
    if not have_eleven(): return None
    x = eleven_tts(text, voice=voice or None)
    x = _trim_silence(x)
    if max_dur and len(x) / SR > max_dur:
        x = _speed(x, len(x) / SR / max_dur)
    return x

def _trim_silence(x, thr=0.01):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(0, idx[0] - 600): idx[-1] + 2400] if len(idx) else x

def _speed(x, factor):
    """Tempo change without pitch shift (ffmpeg atempo)."""
    factor = min(factor, 1.35)
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / "a.wav", Path(d) / "b.wav"
        write_wav(a, x)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", a, "-filter:a", f"atempo={factor:.4f}", b], check=True)
        return _decode(b)

# --------------------------------------------------------------------------- voices
# Premade ElevenLabs voices that read both English and Russian well with eleven_multilingual_v2.
CURATED_VOICES = [
    {"id": "nPczCjzI2devNBz1zQrb", "name": "Brian", "gender": "male", "style": "deep, confident narrator"},
    {"id": "onwK4e9ZLuTAKqWW03F9", "name": "Daniel", "gender": "male", "style": "calm, clear explainer"},
    {"id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "gender": "male", "style": "energetic, punchy"},
    {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "gender": "female", "style": "warm, friendly"},
    {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "gender": "female", "style": "soft, upbeat"},
    {"id": "XB0fDUnXU5powFXDhCwa", "name": "Charlotte", "gender": "female", "style": "bright, lively"},
]
_VOICES_CACHE: dict = {}

def list_voices():
    """Voices for the Studio picker: the account's own voices (incl. clones) when a key is set, merged over the
    curated premade list. Cached for an hour."""
    import time as _time
    if not have_eleven(): return []
    hit = _VOICES_CACHE.get("v")
    if hit and _time.time() - hit[0] < 3600: return hit[1]
    voices = {v["id"]: dict(v, preview_url=None) for v in CURATED_VOICES}
    try:
        import requests
        r = requests.get(API + "/v1/voices", headers={"xi-api-key": api_key()}, timeout=15)
        if r.ok:
            for v in r.json().get("voices", []):
                lab = v.get("labels") or {}
                voices[v["voice_id"]] = {"id": v["voice_id"], "name": v.get("name", "?"), "gender": lab.get("gender", ""),
                                         "style": ", ".join(x for x in (lab.get("description"), lab.get("accent"), lab.get("use_case")) if x),
                                         "preview_url": v.get("preview_url")}
    except Exception as e:  # noqa: BLE001
        print(f"  [voices] list failed: {e}")
    out = sorted(voices.values(), key=lambda v: (v["id"] not in {c["id"] for c in CURATED_VOICES}, v["name"]))
    _VOICES_CACHE["v"] = (_time.time(), out)
    return out

# --------------------------------------------------------------------------- mixing
def fit(x, dur, fade=0.0):
    n = int(dur * SR)
    y = np.zeros(n, np.float32); y[: min(n, len(x))] = x[:n]
    if fade:
        f = int(fade * SR); y[n - f:] *= np.linspace(1, 0, f)
    return y

def place(track, x, t, gain=1.0):
    s = int(t * SR)
    if s >= len(track): return
    e = min(len(track), s + len(x)); track[s:e] += x[: e - s] * gain

def db(v): return 10 ** (v / 20)

def build_mix(spec, dur, outdir: Path):
    """spec: dict with keys
        vo:    [(t_start, t_end, "line"), ...]
        sfx:   [(t, name, {"gain": dB, "dur": s, "prompt": "..."}), ...]
        music: {"mood": "drive", "prompt": "...", "gain": dB}
    Writes stems + mix.wav into outdir. Returns (mix_path, used_eleven: bool)."""
    outdir.mkdir(parents=True, exist_ok=True)
    n = int(dur * SR)
    vo_t, sfx_t, mus_t = np.zeros(n, np.float32), np.zeros(n, np.float32), np.zeros(n, np.float32)
    used = have_eleven()
    for cue in spec.get("vo", []):
        a, b, line = cue[:3]
        x = voiceover(line, max_dur=b - a, voice=spec.get("voice"))
        if x is not None: place(vo_t, x, a, db(-1))
    for cue in spec.get("sfx", []):
        t, name, o = cue[0], cue[1], (cue[2] if len(cue) > 2 else {})
        x = sfx(name, o.get("dur"), o.get("prompt"))
        place(sfx_t, x, t, db(o.get("gain", -6)))
    clip_t = np.zeros(n, np.float32)
    for t0, path, src_start, seg, gain in spec.get("clips", []):
        try:
            p = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{src_start:.3f}", "-t", f"{seg:.3f}", "-i", str(path),
                                "-vn", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
            x = np.frombuffer(p.stdout, np.float32).copy()
            if len(x):
                f = min(len(x), int(.05 * SR)); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
                place(clip_t, x, t0, db(gain))
        except subprocess.CalledProcessError:
            pass  # clip without an audio stream
    vo_t = vo_t + clip_t
    m = spec.get("music", {"mood": "drive"})
    if m:
        mus_t = fit(music(dur, m.get("mood", "drive"), m.get("prompt")), dur, fade=1.0) * db(m.get("gain", -8))
    # duck music + sfx-bed under VO
    if np.any(vo_t):
        env = np.abs(vo_t)
        env = signal.sosfilt(signal.butter(1, 4, "lowpass", fs=SR, output="sos"), env)
        env = np.clip(env / (np.max(env) * .25 + 1e-9), 0, 1)
        mus_t *= (1 - .65 * env)
    mix = vo_t + sfx_t + mus_t
    for name, x in (("vo", vo_t), ("sfx", sfx_t), ("music", mus_t), ("mix_raw", mix)):
        write_wav(outdir / f"{name}.wav", x)
    return outdir / "mix_raw.wav", used

def write_wav(path, x):
    from scipy.io import wavfile
    wavfile.write(str(path), SR, np.clip(x, -1, 1).astype(np.float32))
