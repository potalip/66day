---
day: 26
track: video
phase: 2
title: "Data videos: charts that move without lying"
summary: "Turn a real public dataset into an animated chart video — honest axes, a visible source, and a story in 30 seconds."
estMinutes: 90
resources:
  - "https://ourworldindata.org/"
  - "https://docs.python.org/3/tutorial/"
  - "https://www.remotion.dev/docs/"
tasks:
  - id: d26-video-t1
    type: read
    title: "Learn how charts can move without lying"
    xp: 10
    proof: none
  - id: d26-video-t2
    type: build
    title: "Animate a chart from a real dataset"
    xp: 60
    proof: file
  - id: d26-video-t3
    type: reflect
    title: "Explain how your chart could mislead and how you prevented it"
    xp: 15
    proof: text
  - id: d26-video-t4
    type: quiz
    title: "Spot the misleading chart"
    xp: 15
    proof: none
---

A number in a sentence is forgettable. A line that climbs while a year counter ticks by is not — that's why
data videos get shared, quoted and screenshotted. It's also why they're dangerous: an animated chart persuades faster
than a reader can check it. Today you make one that's both gripping and honest, so you'd be happy if a statistician
paused on any frame.

## Moving without lying

The usual tricks, and how you'll avoid each:

- **Truncated axis.** A bar chart whose y-axis starts at 95 makes 96 look twice as big as 95. **Bars always start
  at zero.** Lines may zoom in, but label the axis clearly.
- **Cherry-picked range.** Starting the chart in the one bad year makes any trend look dramatic. Use the full
  available range, or say on screen why you chose yours.
- **Absolute vs per person.** Comparing a country of 1.4 billion to one of 5 million in totals says mostly "big
  country is big". Use per-person (per capita) values when sizes differ.
- **Animated time that cheats.** Easing is great for titles — but if the time axis eases, some years fly by and
  others crawl, and the viewer feels a trend that isn't there. **Time moves linearly.** Ease the labels and camera
  only.
- **Missing source.** Put the source and the units on screen for the whole video, not just in the description.

Good data sources: **Our World in Data** (every chart has a Download tab with CSV, and a clear licence — CC BY, so
credit them), national statistics offices, the World Bank, and **Open-Meteo** for historical weather of any city.

## Step 1 — pick a dataset and a question

Don't start with "a chart about energy". Start with a question a viewer would care about: *"How fast did solar go
from nothing to normal?"* Then find the data. Example: on Our World in Data, open the chart "Share of electricity
from solar", pick 4–5 countries, Download → CSV. Save it as `day26/data/source.csv` and note the URL and licence in
`day26/data/SOURCE.md`.

Open the CSV and look at it before anything is drawn: columns, units, first and last year, gaps. Ask your agent:

```text
Read day26/data/source.csv and tell me: the columns, the units, the year range, which countries/series it has, and any missing years. Don't write any chart code yet.
```

## Step 2 — animate it

```text
Goal: a 30-second animated chart video from a real CSV.
Context: day26/data/source.csv (source and licence in SOURCE.md). Python with pandas and matplotlib (install if missing), ffmpeg installed. Folder day26/.
Constraints:
- Question on screen as the title: "<your question>". Source and units visible in a footer the whole time.
- Line chart: x = year, y = value; each series in its own colour with a label at the line's tip that follows it. Lines draw in over time with a big year counter. TIME MOVES LINEARLY: same number of frames per year.
- Axis ranges fixed for the whole video (computed from the full data), so the scale never jumps. If I switch to bars, the y-axis starts at 0.
- 1920x1080, 30 fps: 2 s title, ~24 s of animation, 4 s hold on the final frame with one sentence of takeaway.
- Render frames with matplotlib (Agg) and pipe them to ffmpeg, H.264 yuv420p. Large readable fonts (min 28 px).
Done when: day26/chart.mp4 is ~30 s and a paused frame at any point is a correct, labelled chart.
```

Check it, then pause on three random frames and read the values off the axis — do they match the CSV?

```bash
ffprobe -v error -show_entries stream=width,height,r_frame_rate -show_entries format=duration -of default=noprint_wrappers=1 day26/chart.mp4
ffmpeg -ss 15 -i day26/chart.mp4 -frames:v 1 day26/check-15s.png
```

Upload `chart.mp4` and paste the source URL with it. If you have time, run it through your day 23 and day 20 scripts
for a short voiceover line, captions and music — it's one command each now.

> **If you're stuck:** labels overlapping at the line tips is the classic problem. Ask the agent to nudge labels
> apart vertically with a minimum gap, keeping each label's colour. Jerky animation usually means the data is yearly
> and you're showing it frame by frame: interpolate *values* between years linearly so lines draw smoothly.

> **Tip:** Remotion works too — draw the chart as SVG in React, with the CSV as props. Handy if you want the chart to
> share your brand with the rest of your videos.

## Step 3 — the honesty check

Write 3–4 sentences: how could your chart have misled (range, axis, per-person, missing data), and what exactly did
you do to prevent it? If you found a gap or a surprise in the data, say how you showed it.

## Quiz

What's misleading here?

1. Two bars: 98 and 101. The y-axis starts at 97, so one bar is four times taller.
2. A "crime is soaring" chart that starts in the lowest year of the decade.
3. Total CO₂ emissions comparing China and Denmark to argue who's "more responsible" per person.
4. A line chart where the years 2000–2015 pass in 3 seconds and 2016–2020 take 10.

> **Answers:**
>
> 1. Truncated axis on bars — a 3% difference looks like 300%.
> 2. Cherry-picked starting point — the trend may vanish over a longer range.
> 3. Totals instead of per-person values for a per-person claim.
> 4. Uneven time — slowing down near the end exaggerates the recent change.

## You're done when…

- [ ] `chart.mp4` (~30 s) from a real dataset, with source and units on screen, is uploaded with its source URL.
- [ ] You checked three paused frames against the CSV.
- [ ] Your honesty check is pasted.
- [ ] Quiz done.

**Tomorrow:** boss day. Everything you've learned in two weeks goes into one 60-second explainer.
