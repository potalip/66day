---
day: 22
track: video
phase: 2
title: "Voiceover with TTS"
summary: "Write a 45-second script that sounds good out loud, turn it into a voiceover with TTS, and lay it under your visuals."
estMinutes: 90
badges: [voice-on]
resources:
  - "https://platform.openai.com/docs/guides/text-to-speech"
  - "https://elevenlabs.io/docs"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d22-video-t1
    type: read
    title: "Learn to write for the ear and compare TTS options"
    xp: 10
    proof: none
  - id: d22-video-t2
    type: build
    title: "Write a 45-second script for the ear"
    xp: 40
    proof: text
  - id: d22-video-t3
    type: build
    title: "Lay a TTS voiceover under your visuals"
    xp: 50
    proof: file
  - id: d22-video-t4
    type: reflect
    title: "Find where the voice still sounds synthetic"
    xp: 15
    proof: text
---

Text on screen asks people to read. A voice lets them *listen* — while cooking, commuting, half-looking. Modern
text-to-speech is good enough that most viewers won't stop to think about it, as long as the script was written to be
heard. That last part is on you, not the model.

## Writing for the ear

Reading and listening are different skills. A sentence that works on a page can collapse when spoken. Rules:

- **One idea per sentence.** Aim for under 15 words. Listeners can't scroll back.
- **Say numbers the way people say them.** "About two thirds", not "64.7%". "Nineteen sixty-nine", not "1969" if the
  model might read it as "one thousand nine hundred…".
- **No brackets, no "see above", no lists of five.** Three items, maximum, and say "three" first.
- **Repeat the key noun.** On paper "it" is fine; in audio, after two sentences nobody knows what "it" is.
- **Contractions and plain words.** "It's", "you'll", "use" — not "utilise".
- **Put the surprise at the end of the sentence.** "Airplane windows are round — because square ones once tore
  planes apart."

Budget: people speak about 150 words a minute, so **45 seconds ≈ 110 words**. Read it aloud with a stopwatch.

### TTS options (check current docs — this field moves monthly)

- **OpenAI TTS** — simple API, several built-in voices, and newer models accept an `instructions` field for tone
  ("calm, curious, slightly amused"). Cheap and fast.
- **ElevenLabs** — the most natural voices, a big voice library, fine control over stability and style. Paid tiers for
  commercial use; read the plan's licence terms.
- **Offline fallback** — macOS `say`, Windows' built-in voices, or `espeak-ng` on Linux. Robotic, but free and good
  enough to build your pipeline before you spend a cent.

> **Safety:** keys go in `.env`, never in code or chat. Set a monthly spend limit on the provider dashboard. And never
> clone someone's voice — including a friend's "for fun" — without their explicit, recorded consent.

## Step 1 — the script

Pick a topic you could explain to a friend in a minute: "why airplane windows are round", "how noise-cancelling
headphones work", "why your phone gets slow when the battery is cold". Draft it with your agent or an LLM, then rewrite
it yourself — out loud.

```text
Goal: a 45-second voiceover script written for the ear.
Context: topic "<your topic>". Audience: curious adults scrolling on their phones. Tone: friendly, precise, a bit witty.
Constraints:
- 100-115 words. Every sentence under 15 words. No brackets, no lists longer than three, numbers written as words.
- Line 1 is a hook that creates a question in the first 2 seconds. The last line pays it off.
- One idea per line, each on its own line, so I can time visuals to lines.
- Then list 3 sentences you think a listener could misunderstand, and rewrite them.
Done when: the script reads aloud in 40-48 seconds.
```

Read it aloud twice with a timer, fix every place you stumbled, and save it as `day22/script.txt`. Paste it as proof.

## Step 2 — voice it and put it under pictures

```text
Goal: generate a TTS voiceover and build a video around its timing.
Context: day22/script.txt. API keys in .env (OPENAI_API_KEY and/or ELEVENLABS_API_KEY). My Remotion project is in
remotion/, my mixing script is day20/mix.py.
Constraints:
- day22/tts.py --provider openai|elevenlabs|say: reads the script, writes day22/voice.mp3.
  Cache by a hash of (text + voice + provider) so re-running never pays twice. If the key is missing, print a
  clear message and fall back to the offline voice — never crash.
- Print the voice duration with ffprobe.
- Make a Remotion composition "Voiced" (1080x1920, 30 fps) whose duration comes from the audio length
  (calculateMetadata), with one visual beat per script line: big keyword text for each line, timed proportionally
  to the line's word count. Include the voice with <Audio>.
- After rendering, run day20/mix.py to add music ducked under the voice and normalize to -14 LUFS.
Done when: day22/voiced.mp4 has voice, ducked music, visuals that change roughly with each line.
```

Check it:

```bash
ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=noprint_wrappers=1 day22/voiced.mp4
ffmpeg -hide_banner -i day22/voiced.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated"
```

You want h264 + aac, 40–48 s, about −14 LUFS. Upload `voiced.mp4`.

> **If you're stuck:** visuals drifting away from the voice usually means the line timing is a guess. That's fine
> for today — on day 23 you'll get exact word timestamps from Whisper. A provider error 401 is a key problem, 429 is a
> rate or quota problem; your agent should print the provider's message, not just the status code.

> **Tip:** generate the same line with two voices and pick by ear, on your phone speaker. Laptop speakers flatter
> everything.

## Step 3 — listen like a critic

Listen once with eyes closed. Note the exact moments where the voice sounds synthetic: odd stress on a word, a
rushed comma, a flat question, a mispronounced name. For each, write what you'll try (a comma, a rephrase, spelling
a name phonetically, a different voice). Paste the list.

## You're done when…

- [ ] Your script is 100–115 words and reads aloud in 40–48 seconds; pasted.
- [ ] `voiced.mp4` with TTS, ducked music and line-timed visuals at −14 LUFS is uploaded.
- [ ] You listed at least three "still synthetic" moments with a fix for each.

**Tomorrow:** captions that people actually read — word by word, in sync.
