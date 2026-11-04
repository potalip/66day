---
day: 46
track: apps
phase: 3
title: "Talk to it: a voice assistant for one job"
summary: "Build a voice assistant for one narrow job, measure every millisecond of delay, and learn where voice beats a screen."
estMinutes: 135
resources:
  - "https://platform.openai.com/docs/guides/text-to-speech"
  - "https://github.com/SYSTRAN/faster-whisper"
  - "https://elevenlabs.io/docs"
  - "https://ai.google.dev/gemini-api/docs"
tasks:
  - id: d46-apps-t1
    type: read
    title: "Compare realtime voice designs: pipeline vs speech-to-speech"
    xp: 10
    proof: none
  - id: d46-apps-t2
    type: build
    title: "Build a voice assistant for one narrow job and record a short demo"
    xp: 60
    proof: file
  - id: d46-apps-t3
    type: build
    title: "Measure latency per stage and write down what made it faster"
    xp: 20
    proof: text
  - id: d46-apps-t4
    type: reflect
    title: "Write where voice beats a screen for your users"
    xp: 15
    proof: text
---

Typing is great until your hands are full, your eyes are busy, or the thing you need to practise is *speaking*.
Today you build a small voice assistant that does **one narrow job** well — and you learn the one number that
decides whether voice feels natural or broken: latency.

## Two ways to build voice

**The pipeline: speech → text → LLM → speech.**

1. **STT** (speech-to-text) turns the user's audio into text: Whisper / faster-whisper locally, or a hosted API.
2. **An LLM** (Claude or any model) writes the reply as text.
3. **TTS** (text-to-speech) turns the reply into audio: OpenAI TTS, ElevenLabs, or others.

Pros: you can swap any part, use any model, keep a text transcript for logs and evals, and it's usually cheaper.
Cons: three hops add up, and interrupting the assistant mid-sentence takes extra work.

**Speech-to-speech realtime APIs** (for example OpenAI's Realtime API or Gemini's Live API): one model hears audio
and speaks audio over a WebSocket or WebRTC connection. Pros: low delay, natural interruptions, it hears tone.
Cons: fewer model choices, less control, harder to test, often pricier per minute. Check each provider's current docs —
this area moves monthly.

**The latency budget.** In human conversation the gap between turns is a fraction of a second. Under about one
second feels responsive; over two feels like a bad phone line. In a pipeline the gap is the sum of: noticing you
stopped talking + STT + the LLM's **time to first token** + TTS's **time to first audio**. Rule one of voice:
**stream everything** and start speaking the first sentence while the rest is still being written.

## Step by step

### 1. Pick one narrow job (10 min)

"A voice assistant" is not a job. These are:

- **Interview practice** for one role: it asks a support-agent interview question, listens, gives one piece of
  feedback, asks the next.
- **Language tutor** for one situation: ordering at a café in Spanish, correcting one mistake per turn.
- **Hands-busy helper** for your main app: "read me today's three tasks", "mark the second one done".

Write the job in one sentence and a 4-line system prompt. Keep replies short — two sentences is a good ceiling.
Long answers are slow answers.

### 2. Build the pipeline (60 min)

Start with **push-to-talk** (hold a button to speak). It sidesteps silence detection, which is the hardest part.

```text
Goal: a voice page /voice in my app for one job: <your one-sentence job>.
Flow: hold-to-talk button records the mic with MediaRecorder (pick a supported type with MediaRecorder.isTypeSupported: webm/opus in Chrome, mp4/AAC in iPhone Safari) -> POST to /api/voice -> server: STT (<provider or faster-whisper>) -> LLM with this system prompt: <paste> and the last 6 turns -> TTS (<provider>) -> stream audio back and play it immediately.
Requirements:
- Stream the LLM reply; split it into sentences and send the FIRST sentence to TTS as soon as it's complete.
- Show the transcript of both sides on screen.
- Record timestamps for each stage (request received, STT done, first LLM token, first TTS audio byte, playback started on the client) and show them in a small debug panel.
- All API keys stay on the server. If a key is missing, show "Voice AI not configured" and play a recorded sample conversation so the page is still demoable.
- Works on a phone (HTTPS is required for the microphone).
Done when: I can hold the button, ask something, and hear a reply, with stage timings visible.
```

Test it on your phone, then record a 30–60 second screen recording **with sound** of a real exchange. That's your proof.

> **If you're stuck:** no microphone on the phone? You're on `http://` — the browser only allows the mic on HTTPS
> or localhost. iPhone Safari won't play the reply? Audio playback must start from a user gesture; let the agent
> "unlock" an audio element on the first button press. Garbled transcripts or a 400 from STT usually mean the wrong audio
> format — iPhones record mp4, not webm. Ask the agent to log the file type the STT API received.

### 3. Measure and speed it up (30 min)

Run the same short question 5 times and write down the median per stage, like this:

| stage | before | after |
|---|---|---|
| upload + STT | 900 ms | 600 ms |
| LLM first token | 1100 ms | 450 ms |
| TTS first audio | 700 ms | 350 ms |
| **total, release → sound** | **2.7 s** | **1.4 s** |

Then try the usual wins, one at a time, re-measuring after each:

- Use a faster, cheaper model tier for the conversation.
- Cap the reply length (system prompt + `max_tokens`).
- Stream TTS sentence by sentence instead of waiting for the full reply.
- Pick API regions close to your server, and your server close to your users.

```text
Here are my latency numbers per stage: <paste>. Suggest the 3 changes most likely to cut total time, apply them one at a time, and re-run my 5-question benchmark after each. Report a before/after table.
```

Paste your table and one sentence about which change helped most.

## Reflect: where voice beats a screen

Voice wins when hands or eyes are busy (cooking, driving, a nurse with gloves on), when the skill *is* speaking,
or when typing is hard (accessibility, low literacy, older users). It loses in open offices, for anything you need
to scan or compare, and for private details. In 4–6 sentences: is there a moment in **your** users' day where voice
is clearly better? If not — that's a valid, useful answer too.

> **Ethics:** use the provider's stock voices. Cloning anyone's voice, including a friend's, needs their explicit
> consent, and the assistant should never pretend to be a human.

## You're done when…

- [ ] You can explain pipeline vs speech-to-speech and what goes into the latency budget.
- [ ] Your voice assistant does one narrow job on a phone; you uploaded a short recording with sound.
- [ ] You pasted a before/after latency table and named what made it faster.
- [ ] You wrote where voice beats a screen for your users (or why it doesn't).

**Tomorrow:** your AI features talk, chart and answer. But do they answer *well*? Time to prove it with numbers.
