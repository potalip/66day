---
day: 5
track: common
phase: 1
title: "Read the code your agent wrote"
summary: "Open the hood of your page: see HTML, CSS and JS, play in DevTools, and make your first change by hand."
estMinutes: 75
resources:
  - "https://developer.mozilla.org/en-US/docs/Learn"
tasks:
  - id: d05-t1
    type: read
    title: "Learn the three layers of a web page: HTML, CSS, JS"
    xp: 10
    proof: none
  - id: d05-t2
    type: build
    title: "Change three things live in DevTools"
    xp: 30
    proof: file
  - id: d05-t3
    type: build
    title: "Make one change by hand and one with the agent, then push"
    xp: 40
    proof: link
  - id: d05-t4
    type: quiz
    title: "Find the line that does the job"
    xp: 15
    proof: none
---

You don't need to write code to direct an agent, but you do need to *read* it — enough to know where things live
and to spot when something's off. Today your promise page stops being a black box.

## Three layers in ten minutes

Every web page is three kinds of text working together. Think of a person:

- **HTML** is the skeleton: what's on the page. Headings, paragraphs, buttons, written as tags like
  `<h1>My promise</h1>`.
- **CSS** is the clothes: how it looks. Colors, sizes, spacing, layout, written as rules like
  `h1 { font-size: 3rem; }`.
- **JavaScript** is the muscles: what moves. Your day counter, buttons that do something, written as instructions
  like `counter.textContent = "Day " + n;`.

In your `index.html`, CSS sits inside `<style>…</style>` near the top, HTML in the `<body>`, and JS inside
`<script>…</script>` near the bottom. Open the file with `cat index.html` or, better, in a code editor. VS Code is
free on every system (`brew install --cask visual-studio-code` or `winget install Microsoft.VisualStudioCode`), but
any text editor works.

Then ask your agent for a guided tour:

```text
Explain index.html to me section by section, like I'm a beginner. For each section give
the line numbers, what it does in one sentence, and one thing I could safely change there.
Don't edit anything.
```

## Step 1 — Play in DevTools (20 min)

Every browser has built-in **DevTools**: a panel that shows the live page's code and lets you change it on the spot.
Open your live GitHub Pages link in Chrome, Edge or Firefox and press **F12** (or **Cmd+Option+I** on a Mac).

1. Click the arrow icon at the top-left of the panel, then click your headline. The **Elements** panel jumps to its
   HTML.
2. Double-click the headline text in the panel and type something new. Press Enter. The page changes.
3. In the **Styles** pane on the right, find a color (a little square next to a value), click it and pick a
   different one.
4. Pick any element, right-click it in the Elements panel and choose **Delete element**. Gone.

Now refresh. Everything's back. DevTools changes live only in your browser and only until you reload — a perfect
sandbox for trying ideas before asking anyone to build them.

**Proof:** a screenshot of your page with your three changes and DevTools open.

## Step 2 — One change by hand, one by the agent (25 min)

**By hand.** Open `index.html` in your editor. Use Ctrl+F (Cmd+F) to find your "why" paragraph and rewrite one
sentence. Or find your accent color (it looks like `#2f7d4f`) and change it to one you picked in DevTools. Save,
refresh the local page, check it.

> **If you're stuck:** the page broke after your edit? You probably deleted a `<`, `>` or a closing tag like `</p>`.
> Undo with Ctrl+Z (Cmd+Z) in the editor and try again, or ask the agent: "I edited line 42 and the page broke, what
> did I do?".

**By the agent:**

```text
Goal: add a small footer that says "Day 5: I read my own code." in a muted color.

Constraints: footer only, keep everything else as it is. After the change, tell me exactly which lines you added so I can find them in my editor.

Done when: both my manual change and your footer are committed together with the message
"day 5: hand edit + footer" and pushed. Print the GitHub link to the commit.
```

Find the agent's lines in your editor. Reading what it did is the whole point.

**Proof:** the commit link.

## Quiz

```html
<style>
  :root { --accent: #2f7d4f; }
  .grid { display: grid; grid-template-columns: repeat(11, 1fr); gap: 6px; }
  .cell.done { background: var(--accent); }
</style>
<h1 id="promise">66 days. One hour a day.</h1>
<div class="grid" id="grid"></div>
<script>
  const start = new Date("2026-11-04");
  const n = Math.floor((Date.now() - start) / 86400000) + 1;
  document.getElementById("promise").textContent += " Day " + n;
</script>
```

1. Which line would you edit to change the green everywhere?
2. Which line decides how many squares sit in one row?
3. Which line works out what day it is?
4. Is the headline text HTML, CSS or JS? And the words " Day 7" after it?

> **Answers:**
>
> 1. `:root { --accent: #2f7d4f; }` — a CSS variable; every place that uses `var(--accent)` follows it.
> 2. `grid-template-columns: repeat(11, 1fr)` — 11 columns, so 6 rows for 66 squares.
> 3. `const n = Math.floor(...) + 1;` — milliseconds since the start, divided by the milliseconds in a day.
> 4. The headline is HTML; " Day 7" is added by JavaScript when the page loads.

## You're done when…

- [ ] You can point at the HTML, CSS and JS parts of your own page.
- [ ] You uploaded a DevTools screenshot with three live changes.
- [ ] You pasted the commit link with your hand edit and the agent's footer.
- [ ] You answered the quiz.

**Tomorrow:** git becomes your time machine — so you can let the agent try wild things without fear.
