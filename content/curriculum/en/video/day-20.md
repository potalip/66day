---
day: 20
track: video
phase: 2
title: "Sound: music, effects and the mix"
summary: "Put licensed music and three sound effects under a video, duck and normalize to −14 LUFS, then cut on the beat."
estMinutes: 90
resources:
  - "https://pixabay.com/music/"
  - "https://freesound.org/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d20-video-t1
    type: read
    title: "Learn loudness, ducking and music licensing"
    xp: 10
    proof: none
  - id: d20-video-t2
    type: build
    title: "Mix music and 3 sound effects under a previous video, normalized"
    xp: 50
    proof: file
  - id: d20-video-t3
    type: build
    title: "Detect beats with a script and cut on them"
    xp: 30
    proof: text
  - id: d20-video-t4
    type: quiz
    title: "Explain why −14 LUFS"
    xp: 15
    proof: none
---

Mute any video you love and it loses half its power. Sound is where amateur videos give themselves away: music that
drowns the voice, effects that make you jump, a track that's twice as loud as the video before it. The fixes are
three numbers and two ffmpeg filters. Today you learn them once and reuse them for every video after.

## Three ideas

**Loudness (LUFS).** Peak level tells you the loudest single moment. **LUFS** (Loudness Units relative to Full Scale)
measures how loud the whole thing *feels* to a human, averaged over time. YouTube and most streaming services turn
playback down to roughly **−14 LUFS**: upload something louder and it's simply turned down (you only lose dynamics);
upload something much quieter and it stays quieter than everything around it. Short-video apps don't publish exact
targets, so −14 LUFS integrated with a true peak below −1 dBTP is a safe default everywhere.

**Ducking.** When someone speaks or an effect hits, the music dips, then comes back. In ffmpeg that's
`sidechaincompress`: the music is compressed whenever the *key* signal (voice or effects) is loud. Set it up today
with effects; on day 22 the key becomes your voiceover.

**Licensing.** "Free to download" is not "free to use".
- **Pixabay Music** — under the Pixabay Content License: commercial use allowed, no attribution required. Some
  tracks are registered with YouTube's Content ID, so you may still see a claim; keep the download page link as
  proof.
- **Freesound** — every sound has its own licence: **CC0** (do anything), **CC BY** (credit the author),
  **CC BY-NC** (non-commercial only — not for client work). It's on each sound's page. Read it every time.

Keep `assets/CREDITS.md`: file name, source URL, author, licence. Future-you, a client and a platform reviewer will
all ask for it.

## Step 1 — music + 3 effects, mixed properly

Pick one previous video — the day 17 quote or a day 19 tip works well. Download one music track from Pixabay Music
and three short effects from Freesound (a whoosh, a pop, a click). Put them in `assets/music/` and `assets/sfx/` and
fill in `CREDITS.md`.

```text
Goal: a reusable mixing script that puts music and sound effects under an existing video.
Context: folder day20/. Video: <path to your previous mp4>. Music: assets/music/<file>. Effects: assets/sfx/*. ffmpeg is installed.
Constraints:
- day20/mix.py takes --video, --music, and a list of effects with times, e.g. --sfx whoosh.wav@0.5 pop.wav@2.0.
- Build one ffmpeg filter_complex: music at volume 0.6, trimmed to the video length with a 1 s fade-out; each effect delayed with adelay; effects mixed with amix normalize=0; music ducked under the effects with sidechaincompress (threshold 0.05, ratio 8, attack 5, release 250); if the video already has audio (voice), duck under that too and keep it in the mix; then loudnorm I=-14 TP=-1.5 LRA=11.
- Copy the video stream, encode audio AAC 192k 48 kHz. Print the full ffmpeg command before running it.
Done when: day20/mixed.mp4 plays with ducked music and three audible effects, and measures -14 LUFS +/- 1.
```

Measure it — this is your loudness meter from now on:

```bash
ffmpeg -hide_banner -i day20/mixed.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary"
```

Look for `I: -14.x LUFS` and a true `Peak` below −1 dBFS. Watch it with headphones *and* on your phone speaker —
cheap speakers reveal music that's too loud. Upload `mixed.mp4`.

> **If you're stuck:** silence after mixing usually means the streams have different sample rates or a filter label
> is misspelled; ask the agent to add `aresample=48000` to every input and to print the filter graph. An effect you
> can't hear? Its delay is in **milliseconds**, and adelay needs one value per channel: `adelay=500|500`.

> **Tip:** the agent's graph should look roughly like
> `[2:a]adelay=500|500[s1] … amix=…:normalize=0[sfx]; [sfx]asplit[mix][key]; [music][key]sidechaincompress[duck]`.
> If it does something completely different, ask it to explain why before you accept it.

## Step 2 — find the beats, cut on them

```text
Goal: detect beats in my music track and cut a montage on them.
Context: music in assets/music/<file>. Clips: my renders from days 15-19 (list the mp4 files you find).
Constraints:
- day20/beats.py uses librosa (install it) to load the track, run beat_track, convert beat frames to seconds, print the tempo and the first 16 beat times, and save day20/beats.json.
- day20/beatcut.py takes the beats and builds a 15-second montage: a new clip on every 2nd beat, each segment scaled/padded to 1080x1920, re-encoded H.264, joined, with the music under it at -14 LUFS.
Done when: the montage cuts land on the beat when I watch it, and beats.json exists.
```

Paste the tempo and the first 16 timestamps as proof. Watch the montage: cuts on the beat feel "right" even to people
who couldn't tell you why. If they feel a hair late, shift every cut 2 frames earlier — the eye expects the cut just
before the sound.

## Quiz

1. You upload a video mastered at −8 LUFS to YouTube. What happens?
2. You upload one at −24 LUFS. What happens?
3. What's the difference between peak level and LUFS?
4. A great whoosh on Freesound is CC BY-NC. Can you use it in a paid promo for a café?

> **Answers:**
>
> 1. It's turned down to around −14 LUFS. It won't sound louder than others — just more squashed.
> 2. It stays quiet: platforms turn loud videos down but generally don't turn quiet ones up. Viewers reach for the
>    volume or scroll away.
> 3. Peak is the single loudest instant; LUFS is perceived loudness over the whole piece.
> 4. No — NC means non-commercial. Find a CC0 or CC BY alternative (and credit the author for CC BY).

## You're done when…

- [ ] `CREDITS.md` lists every audio file with source and licence.
- [ ] `mixed.mp4` is uploaded: ducked music, 3 effects, −14 LUFS ±1, peak below −1.
- [ ] Beat timestamps are pasted, and your montage cuts on the beat.
- [ ] Quiz done.

**Tomorrow:** rest. Then your videos learn to talk.
