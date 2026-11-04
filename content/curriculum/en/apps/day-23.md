---
day: 23
track: apps
phase: 2
title: "Eyes and ears: images and voice"
summary: "Let your app understand a photo or a voice note (or draw a picture), know what each call costs, and cap it."
estMinutes: 90
resources:
  - "https://docs.anthropic.com/en/api/getting-started"
  - "https://platform.openai.com/docs"
  - "https://ai.google.dev/gemini-api/docs"
  - "https://github.com/openai/whisper"
tasks:
  - id: d23-apps-t1
    type: read
    title: "Get the one-page map of multimodal APIs"
    xp: 10
    proof: none
  - id: d23-apps-t2
    type: build
    title: "Add photo-to-fields, voice-to-text or text-to-image to your app; upload a screenshot"
    xp: 50
    proof: file
  - id: d23-apps-t3
    type: build
    title: "Work out the cost per call and set a hard limit; paste your numbers"
    xp: 30
    proof: text
  - id: d23-apps-t4
    type: quiz
    title: "Match each input to the right API"
    xp: 15
    proof: none
---

People don't only type. They screenshot a job ad on Instagram, snap a crumpled receipt, ramble a voice memo while
walking. Today your app accepts one of those — and because images and audio cost more than text, you'll know the
price of every call and put a hard ceiling on it before anyone else can run up your bill.

## Multimodal APIs in one page

**Multimodal** means a model works with more than text. Three families of jobs:

| Input → output | What it's called | Typical tools (check current docs) |
|---|---|---|
| Image → text/fields | Vision | Claude, GPT and Gemini all accept images in the same chat request |
| Audio → text | Speech-to-text (STT), transcription | OpenAI transcription models, Whisper via Groq (fast), Gemini audio, or run open-source Whisper / faster-whisper yourself |
| Text → image | Image generation | OpenAI image models, Gemini image models, many models via Replicate or fal |

The nice trick for your app: **vision and STT plug straight into day 18.** A photo of a job posting or a voice memo
becomes text (or goes straight to a vision model with your schema), then the same extraction, the same validation, the
same "AI filled — please check" form. One pipeline, three ways in.

How they're priced (always read the current pricing page):

- **Images in** are converted to tokens — bigger images, more tokens. Resizing to ~1,500 px on the long side before
  upload usually keeps quality and cuts cost.
- **Audio in** is usually priced **per minute** of audio.
- **Images out** are priced **per image**, varying with size and quality.

## Step by step

### 1. Add one way in (45 min)

Pick the one that fits your spec best:

- **Photo → fields:** screenshot of a job ad, receipt for the flat-share board, a plant's yellow leaves.
- **Voice → text:** "add a job: junior designer at Canva, closes Friday" while walking.
- **Text → image:** a cover for a book-club entry, an illustration for a recipe. (Fun, but least useful for most specs.)

```text
Goal: add <photo-to-fields | voice-to-text> to the "add item" flow, feeding the existing extraction from day 18.

Constraints:
- Photo: file input with accept="image/*" (opens the camera on phones). Resize in the browser to max 1500px,
  JPEG, before upload. Max 5 MB after resize.
- Voice: a hold-to-record or tap-to-start/stop button using MediaRecorder; show a timer; max 60 seconds.
  Handle Safari's different audio format. Ask for microphone permission only when the button is pressed.
- Server endpoint POST /api/extract-media: send the photo to a vision model with our Zod schema, OR transcribe
  the audio (use <provider>) and pass the text to the existing extraction. Return the same { ok, fields } shape.
- Never store the uploaded file for now; process and discard.
- Clear errors: file too big, recording too short, permission denied, AI not configured.

Explain the plan first: which provider and model, the request format, and the files you'll touch. Wait for my OK.
When done: test with one real sample file via curl and show the response, then tell me how to test on my phone.
```

Test it on your phone against the live app (deploy first). Screenshot the form filled from a photo or voice note and
upload it.

> **If you're stuck:** microphone doesn't work on the phone? Browsers only allow it on `https://` pages (or
> `localhost`), so test against the deployed URL. Transcription returns gibberish? Check that the file type you send
> matches what the API expects — ask the agent to log the MIME type and size of each upload.

### 2. Cost per call and a hard limit (25 min)

Ask the agent to make the cost visible, then do the maths yourself:

```text
Goal: measure and cap the cost of /api/extract-media.
- Log, per call: input tokens or audio seconds, output tokens, and estimated cost from a prices config I fill in.
- Add a per-user daily limit (default 20 media calls/day, stored in the database; until we have logins,
  key it by a random anonymous id cookie) and a global daily limit (default 200) that returns a friendly
  "daily limit reached, try again tomorrow" message.
Explain your plan first and wait for my OK. At the end, run 3 calls, show the logged numbers,
and show me the limit kicking in (temporarily set it to 2).
```

Then set a **spend limit** on the provider dashboard too — your code's limit protects against bugs, the provider limit
protects against everything else. Paste your numbers, for example: "Photo of a job ad: ~1,600 input tokens, 250 output,
≈ $0.002 per call. Limits: 20/user/day, 200/day total, $10/month provider cap."

> **Safety:** photos and voice notes can contain other people's faces, voices and personal data. Don't keep them,
> say so in the UI, and never send someone else's recording through your app without their consent.

## Quiz

Which API (vision, speech-to-text, image generation, or plain text) fits each case?

1. A user sends a 40-second voice memo listing groceries.
2. A user uploads a photo of a handwritten shopping list.
3. You want a unique cover picture for each saved recipe.
4. A user pastes a 300-word email.

<details><summary>Answers</summary>

1. Speech-to-text, then your normal text extraction.
2. Vision — send the image with your schema directly; no separate OCR step needed.
3. Image generation — priced per image, so cache the result and generate once per recipe.
4. Plain text. Don't pay for multimodal when you already have text.

</details>

## You're done when…

- [ ] You can explain the three multimodal job types and how each is priced.
- [ ] Photo, voice or image generation works in your live app — you uploaded a screenshot.
- [ ] You know the cost per call and have a code limit plus a provider spend limit — you pasted the numbers.
- [ ] You answered the quiz.

**Tomorrow:** logins — so your data is finally *yours*.
