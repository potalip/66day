---
day: 45
track: video
phase: 3
title: "One video, two languages: AI dubbing done right"
summary: "Dub one of your videos into a second language with adapted script, retimed voice and fresh captions."
estMinutes: 120
resources:
  - "https://github.com/openai/whisper"
  - "https://elevenlabs.io/docs"
  - "https://platform.openai.com/docs/guides/text-to-speech"
  - "https://github.com/snakers4/silero-models"
tasks:
  - id: d45-video-t1
    type: read
    title: "Learn why you adapt instead of translate, and the rules of voice consent"
    xp: 10
    proof: none
  - id: d45-video-t2
    type: build
    title: "Dub one video into the other language, with new captions"
    xp: 70
    proof: file
  - id: d45-video-t3
    type: reflect
    title: "Write down what literal translation broke"
    xp: 15
    proof: text
  - id: d45-video-t4
    type: quiz
    title: "Check your instincts on timing and lip-sync"
    xp: 15
    proof: none
---

The same explainer in two languages reaches two audiences for maybe 10% more work. That's why creators and companies
pay for dubbing. You have an unfair advantage: your videos come out of a pipeline, so the voice, music and captions are
already separate tracks. Swapping the language is a new stage, not a rescue mission.

Which language? The program pairs English with Russian. If you don't speak Russian, pick any second language where you
can get a native speaker to listen for two minutes: Spanish, Portuguese, Hindi, German. Their ear is your test suite.

## Adapt, don't translate

A literal translation fails in three ways:

- **Length.** German and Russian versions often run 10–25% longer than English. Your scene is 6 seconds; the
  translated line takes 7.5. Something has to give.
- **Idioms and jokes.** "Piece of cake" translated word by word is a cake. Adaptation finds the local equivalent or
  drops the joke for a clearer line.
- **Examples.** A pricing example in dollars, a reference to Product Hunt, a measurement in feet: the adapted version
  swaps them for what that audience knows.

So the LLM prompt is not "translate" but "rewrite for native speakers, within this time budget". The budget is a
number: speaking rate (roughly 13–16 characters per second for most languages at a calm pace; measure your TTS voice)
times segment duration.

## Voice consent and lip-sync, honestly

- **Voice cloning only with consent.** Your own voice: fine. Anyone else's: written permission, saying what it's used
  for. Most TTS providers require you to confirm consent, and some verify it. Never clone a celebrity or a client's
  voice "just to test".
- **Lip-sync is the hard limit.** Motion graphics and voiceover-over-B-roll dub perfectly. A talking head will look
  off when lips don't match. Lip-sync models exist but often look uncanny; for faces, prefer cutting away to visuals
  during dubbed lines, or keep the original with subtitles.

## Step by step

### 1. Pick the video and prepare the stems

Take a 45–90 s video from your pipeline. You need the storyboard JSON (or a Whisper transcript with segment
timestamps), the music track, and the original VO duration per scene.

### 2. Build the dubbing stage

```text
Goal: a dub stage in my pipeline: input video project + target language, output a dubbed mp4 with captions.
Context: my pipeline keeps storyboard JSON, VO, music and captions separately (see README).
Steps:
1. For each scene, take its original line and duration. Ask the LLM (smart tier) to ADAPT, not translate:
   native phrasing, local examples, same meaning, and at most duration * chars_per_second characters.
   Return JSON {scene, text, chars, notes} where notes lists what was changed and why.
2. TTS each line in the target language (provider set in config; my own voice or a stock voice only).
3. Measure each clip with ffprobe. If it's up to 12% too long, speed it up with ffmpeg atempo.
   If longer, send it back to the LLM to shorten, max 2 retries. If shorter, pad with silence.
4. Mix: new VO + original music with the same ducking as before. New captions from the adapted text and the
   real TTS timings. Render through the normal render stage.
5. Save a report: per scene original vs adapted text, durations, tempo factor used.
Constraints: never exceed atempo 1.15; voice cloning disabled unless config says consent=true.
Done when: out/dub-<lang>.mp4 plays in sync, captions match the speech, the report is in out/.
```

> **If you're stuck:** a line keeps coming back too long? Give the model the exact character budget *and* the count
> of its last attempt. "Your version is 118 characters; the limit is 92" fixes it far more often than "shorter please".

> **Tip:** YouTube supports multiple audio tracks on one video for many channels. Check whether yours has it: one
> upload with two languages keeps all views and comments in one place.

Have a native speaker watch it once. Fix the line they wince at. Upload the mp4.

### 3. Reflect

Open the report and pick two or three scenes where literal translation would have broken something: an idiom, a length
overflow, an example that means nothing in that culture. Write what you (or the model) changed and why.

## Quiz

1. Your dubbed line is 30% longer than the slot. Is `atempo=1.3` a good fix?
2. Which dubs cleanly: an animated explainer, a podcast clip with two faces on camera, or a screen tutorial?
3. A client asks you to clone their CEO's voice from a keynote recording "to save time". What do you need first?
4. Why generate new captions from the adapted text instead of translating the old SRT?

<details><summary>Answers</summary>

1. No. Above about 1.15 speech sounds rushed and robotic. Shorten the text instead.
2. The explainer and the screen tutorial. The podcast needs lip-sync or cutaways; that's where dubbing shows.
3. Written consent from the CEO for that use, plus checking the TTS provider's consent rules. The client's word alone
   is not consent.
4. Captions must match what is actually said. The adapted line differs from a translation, and timings come from the
   new audio.

</details>

## You're done when…

- [ ] You can explain adapt vs translate and when cloning a voice is allowed.
- [ ] A dubbed mp4 with new captions is uploaded and a native speaker has heard it.
- [ ] Your note on what literal translation broke is written.
- [ ] Quiz done.

Tomorrow: you'll turn one long video into three shorts with a script and a rubric.
