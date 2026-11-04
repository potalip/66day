# Reference: the RoofCraft motion engine (read-only seed)

Copied from the founder's earlier project. It renders branded motion-graphics videos frame-by-frame with
pycairo → ffmpeg, with ElevenLabs voiceover/SFX/music (synth fallback) and auto-captions.
`rcm/brand.py` and `storm_spot.py` are RoofCraft-specific (a client) — **do not reuse their brand, facts or copy**.
Use the *architecture* (scene list + easing toolkit + parallel scene render + audio mix + contact-sheet QA)
as the seed for the FlowLeaf render server in `../`.
