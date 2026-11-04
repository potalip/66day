---
day: 23
track: video
phase: 2
title: "Captions people actually read"
summary: "Transcribe your voiceover with word timestamps, export SRT, and burn in captions that light up word by word."
estMinutes: 90
resources:
  - "https://github.com/SYSTRAN/faster-whisper"
  - "https://github.com/openai/whisper"
  - "https://trac.ffmpeg.org/wiki"
tasks:
  - id: d23-video-t1
    type: read
    title: "Learn transcription, timestamps and caption styles"
    xp: 10
    proof: none
  - id: d23-video-t2
    type: build
    title: "Turn your voiceover into an SRT with word timestamps"
    xp: 40
    proof: text
  - id: d23-video-t3
    type: build
    title: "Burn in animated word-highlight captions"
    xp: 50
    proof: file
  - id: d23-video-t4
    type: quiz
    title: "Check your caption readability rules"
    xp: 15
    proof: none
---

A large share of people watch short videos with the sound off — on the bus, in bed, in a meeting they're pretending
to attend. Without captions your beautiful voiceover is silence. With *good* captions, the words become part of the
design: the current word lights up and the eye follows the voice. Today you build that, entirely in code.

## Three pieces

**Transcription with timestamps.** **Whisper** is an open-source speech-recognition model; **faster-whisper** is a
reimplementation that runs several times faster on an ordinary CPU. Ask it for `word_timestamps=True` and you get
every word with a start and end time — exactly the data yesterday's line-timing was guessing.

**Two caption formats.**
- **SRT** — the universal plain-text format: number, `00:00:01,200 --> 00:00:02,900`, text. You upload it to
  YouTube as closed captions (people can turn it off; search engines read it).
- **ASS** (Advanced SubStation Alpha) — SRT's stylish cousin: fonts, colours, outlines, position and per-word colour
  changes. ffmpeg burns it into the picture with the `ass` filter (via the libass library, included in most builds).

**Styles.** For shorts the winning pattern is **chunked word-highlight**: 2–4 words on screen, the current word in the
accent colour, a thick outline for contrast. For long horizontal videos, classic two-line subtitles at the bottom.

Whisper will mishear some things — names, jargon, your brand. Since you *have* the script, you can keep Whisper's
timings and take the words from your script. Best of both.

## Step 1 — words with timestamps, then SRT

```bash
pip install faster-whisper
```

The first run downloads the model (a few hundred megabytes for `small`). Then:

```text
Goal: transcribe my voiceover with word-level timestamps and export captions.
Context: audio day22/voice.mp3, the original script day22/script.txt. faster-whisper is installed. Folder day23/.
Constraints:
- day23/transcribe.py: WhisperModel("small", device="cpu", compute_type="int8"), language="en",
  word_timestamps=True. Save every word as day23/words.json: [{"word", "start", "end"}].
- Align recognized words to the script words with difflib.SequenceMatcher: where they differ, keep Whisper's timing
  but use the script's spelling. Print the words that were corrected.
- Export day23/captions.srt: cues of at most 4 words / 32 characters, break at punctuation when possible,
  each cue on screen at least 0.8 s, no gaps under 0.1 s between cues.
Done when: words.json and captions.srt exist, and the SRT timings match what I hear.
```

```bash
python day23/transcribe.py
head -n 15 day23/captions.srt
```

Paste the first five cues as proof. Play the voice and read along: does each cue appear as the words are spoken?

> **If you're stuck:** gibberish usually means the wrong language was forced or the file is very quiet — check
> `language` and listen to the audio. Slow on an old laptop? Try `"base"` first; it's less accurate but quick.

## Step 2 — word-highlight captions, burned in

```text
Goal: burn animated word-highlight captions into my voiced video.
Context: day23/words.json, video day22/voiced.mp4 (1080x1920). Font file in assets/fonts/.
Constraints:
- day23/make_ass.py writes day23/captions.ass with PlayResX 1080 / PlayResY 1920.
- Group words into chunks of 2-4 (same rules as the SRT). For every word, one Dialogue event from its start to the
  next word's start, showing the whole chunk with the current word in my accent colour ({\c&HBBGGRR&}) and
  slightly bigger ({\fscx110\fscy110}); other words white.
- Style: my font, size ~72, bold, white, black outline 6, no shadow, centered, MarginV so the text sits around
  60-65% of the frame height (above the platform buttons).
- Each chunk pops in: {\fad(60,0)} on its first word.
- Burn in: ffmpeg -i day22/voiced.mp4 -vf "ass=day23/captions.ass:fontsdir=assets/fonts" -c:a copy
  -c:v libx264 -crf 18 -pix_fmt yuv420p day23/captioned.mp4
Done when: captioned.mp4 plays with the current word lit up exactly as it's spoken.
```

Remember ASS colours are written **blue-green-red**: gold `#FFD700` becomes `&H00D7FF&`. Check the result:

```bash
ffprobe -v error -show_entries stream=codec_type,width,height -show_entries format=duration -of default=noprint_wrappers=1 day23/captioned.mp4
```

Then watch it **muted** on your phone. That's the real test. Upload `captioned.mp4`.

> **Tip:** if the highlight feels late, shift every event 0.05 s earlier. Readers like to see a word a moment before
> they hear it.

## Quiz

1. How many words per caption chunk work best on a vertical short?
2. Why shouldn't vertical captions sit in the bottom fifth of the frame?
3. You burned captions in. Should you still upload an SRT to YouTube? Why?
4. Roughly how fast can most adults comfortably read captions?

<details><summary>Answers</summary>

1. 2–4 words (one short line). More and people read instead of watching.
2. The platform's caption bar, username and buttons cover that area.
3. Yes — uploaded captions are searchable, can be turned off, and can be auto-translated; burned-in ones help the
   muted scrollers. Do both.
4. Around 15–20 characters per second. Faster than that and they fall behind the voice.

</details>

## You're done when…

- [ ] `words.json` and `captions.srt` exist; five cues are pasted.
- [ ] `captioned.mp4` with word-by-word highlight is uploaded, and it works muted.
- [ ] Quiz done.

**Tomorrow:** you have every ingredient for a vertical short. Now learn its grammar.
