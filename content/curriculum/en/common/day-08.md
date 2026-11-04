---
day: 8
track: common
phase: 1
title: "APIs: how programs talk to each other"
summary: "Your promise page starts showing live data from a real API, and you finally see what happens on the wire."
estMinutes: 90
resources:
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"
  - "https://www.json.org/json-en.html"
  - "https://open-meteo.com/en/docs"
tasks:
  - id: d08-t1
    type: read
    title: "Learn the shape of a request, a response and JSON"
    xp: 10
    proof: none
  - id: d08-t2
    type: build
    title: "Call a public API with curl and paste the JSON you got back"
    xp: 30
    proof: text
  - id: d08-t3
    type: build
    title: "Put live weather on your promise page and push it"
    xp: 50
    proof: link
  - id: d08-t4
    type: quiz
    title: "Read a real API response without guessing"
    xp: 15
    proof: none
---

Your promise page is live, but it's frozen: it says the same thing at 3 a.m. and at noon. Today it starts talking to
the outside world. Almost everything you'll build from here on — AI tools, bots, video pipelines — is just your code
politely asking another program for something. That conversation is called an API call, and after today it won't be magic.

## Requests, responses, JSON

An **API** (application programming interface) is a door one program leaves open for other programs. On the web, you
knock on that door with an **HTTP request**:

- a **method** — `GET` (give me something) or `POST` (here's something, do work with it);
- a **URL** — the address, often with parameters after `?`, joined by `&`: `?latitude=38.72&longitude=-9.14`;
- **headers** — little labels like "I accept JSON" or "here's my key";
- sometimes a **body** — the data you send with a `POST`.

The server answers with a **response**: a **status code** (`200` OK, `404` not found, `401` you're not allowed,
`429` slow down, `500` the server broke), headers, and a body. These days the body is usually **JSON** — plain text
that looks like nested lists and labels:

```json
{ "city": "Lisbon", "current": { "temperature_2m": 17.4 } }
```

Think of a café: the menu is the API docs, your order is the request, the tray is the response, and JSON is the way
the tray is arranged so you always know where the fork is. To get the temperature out of that tray in JavaScript you
walk the labels: `data.current.temperature_2m`.

Today we use **Open-Meteo**: free, no sign-up, no key. Perfect for a first knock.

## Step by step

### 1. Knock with curl (30 min)

`curl` is a terminal tool that sends a request and prints the response. On Windows, type `curl.exe` instead of
`curl` in every command today: in the older Windows PowerShell, plain `curl` is a different command in disguise. First, find your city's coordinates (swap
`Lisbon` for yours):

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=Lisbon&count=1"
```

Copy the `latitude` and `longitude` from the answer. Now ask for the current weather:

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=38.72&longitude=-9.14&current=temperature_2m,wind_speed_10m&timezone=auto"
```

It comes back as one long line. Make it readable with the Python you installed on day 3:

```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=38.72&longitude=-9.14&current=temperature_2m,wind_speed_10m&timezone=auto" | python3 -m json.tool
```

Want to see the status code and headers too? Add `-i` (and drop the pipe). Look for `HTTP/2 200` and
`content-type: application/json`.

> **If you're stuck:** the quotes around the URL matter. Without them your shell treats `&` as "run this in the
> background" and chops the URL. On Windows use `python` instead of `python3`.

**Proof:** paste the pretty-printed JSON for your city.

### 2. Put live data on your page (50 min)

Open your promise-page repo in the agent and give it this:

```text
Goal: show live weather for my city on my 66-day promise page.

Context: this is a static site on GitHub Pages (plain HTML/CSS/JS, no build step).
Use the Open-Meteo forecast API, no key needed:
https://api.open-meteo.com/v1/forecast?latitude=<LAT>&longitude=<LON>&current=temperature_2m,wind_speed_10m&timezone=auto
My coordinates: <LAT>, <LON>. City name to display: <CITY>.

Constraints:
- Use fetch() in a small separate file weather.js; no libraries.
- Show one friendly line, e.g. "Lisbon right now: 17°C, wind 11 km/h — good weather for building."
- While loading, show "Checking the sky…". If the request fails, show a calm fallback line, never a broken page.
- Match the existing styles; it must look fine on a phone.
- Explain in 5 bullet points what the code does, in plain words.

Done when: I open index.html locally and see the live line; then commit with a clear message and push.
```

Read the agent's five bullets. Find the line where it walks the JSON (something like `data.current.temperature_2m`)
— that's the exact path you saw in curl. Open the page locally, then open DevTools → **Network** tab, reload, and
click the `forecast` request: you'll see the same JSON your terminal showed. Same conversation, different client.

Test the failure path once: in DevTools, set Network to **Offline** and reload. Your fallback line should appear.

> **Tip:** Not into weather? Swap in another key-free API with the same prompt: a random fact, today's sunrise time
> (Open-Meteo has `daily=sunrise`), or a placeholder JSON from jsonplaceholder.typicode.com for practice.

Push, wait a minute for GitHub Pages to rebuild, and open your live URL on your phone.

**Proof:** the live link.

> **If you're stuck:** if the browser console says something about **CORS**, the API refused to be called from a web
> page. Open-Meteo allows it, so check the URL for typos first. Then paste the exact console error to the agent.

## Quiz

Here's a response from the forecast API:

```json
{
  "latitude": 38.72,
  "longitude": -9.14,
  "timezone": "Europe/Lisbon",
  "current_units": { "temperature_2m": "°C", "wind_speed_10m": "km/h" },
  "current": { "time": "2026-11-04T10:00", "temperature_2m": 17.4, "wind_speed_10m": 11.2 }
}
```

1. What's the wind speed, and in what units?
2. Write the JavaScript path that gets the temperature if the whole response is in `data`.
3. Your page suddenly shows the fallback, and the Network tab says `429`. What happened, and what do you do?
4. You removed `&timezone=auto` from the URL and the time looks an hour or two off. Why?

> **Answers:**
>
> 1. 11.2 km/h — the number lives in `current`, the unit in `current_units`.
> 2. `data.current.temperature_2m`
> 3. Too many requests: you (or a loop in your code) hit the API too often. Wait, and make sure you fetch once per page
>    load, not in a loop.
> 4. Without it the API answers in GMT/UTC. `timezone=auto` converts the times to your location's local time.

## You're done when…

- [ ] You can name the four parts of a request and three status codes.
- [ ] You pasted pretty-printed JSON from your own curl call.
- [ ] Your live page shows real data, with a loading line and a fallback — link pasted.
- [ ] You answered the quiz before peeking.

**Tomorrow:** the same knock, but the door is an AI model — and this one needs a key.
