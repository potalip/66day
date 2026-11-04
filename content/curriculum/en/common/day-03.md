---
day: 3
track: common
phase: 1
title: "Terminal without fear"
summary: "Learn the dozen commands that matter, install Node, Python and ffmpeg, and get your first tool that tidies Downloads."
estMinutes: 90
resources:
  - "https://missing.csail.mit.edu/"
  - "https://nodejs.org/en/learn"
  - "https://docs.python.org/3/tutorial/"
  - "https://ffmpeg.org/documentation.html"
tasks:
  - id: d03-t1
    type: read
    title: "Learn the dozen terminal commands you'll actually use"
    xp: 10
    proof: none
  - id: d03-t2
    type: build
    title: "Install Node.js, Python and ffmpeg"
    xp: 30
    proof: text
  - id: d03-t3
    type: build
    title: "Have the agent build a Downloads-tidying tool with a dry run"
    xp: 40
    proof: file
  - id: d03-t4
    type: quiz
    title: "Guess what each command does"
    xp: 15
    proof: none
---

Your agent lives in the terminal, so you'll spend a lot of time there. The good news: you only need about a dozen
commands, and the agent types most of them. Today you learn to read what it's doing, set up the three tools every
later day depends on, and get your first useful program.

## The dozen commands

The terminal always "stands" in one folder, like a file explorer window without the pictures.

| Command | What it does |
|---|---|
| `pwd` | Where am I? Prints the current folder |
| `ls` | What's here? Lists files (`ls -la` shows hidden ones) |
| `cd folder` / `cd ..` / `cd ~` | Go into a folder / up one level / home |
| `mkdir name` | Make a new folder |
| `cp a b` / `mv a b` | Copy / move or rename a file |
| `rm file` | Delete a file. **No trash can.** Double-check before Enter |
| `cat file` | Print a file's contents |
| `clear` | Wipe the screen (not your files) |
| **Tab** | Autocomplete a file or folder name — saves typos |
| **↑** | Repeat the previous command |
| **Ctrl+C** | Stop whatever is running |

All of these work in Windows PowerShell too. Spend five minutes in your home folder: `cd ~`, `ls`,
`cd 66-day-promise`, `cat index.html`, `cd ..`. That's the whole trick.

## Step 1 — Install Node.js, Python and ffmpeg (25 min)

**Node.js** runs JavaScript outside the browser (web apps, bots). **Python** is the other big language (scripts,
data, video). **ffmpeg** is the Swiss army knife for video and audio. Pick your system:

```bash
# macOS (Homebrew from day 2)
brew install node python ffmpeg
```

```powershell
# Windows — run each line, then close and reopen the terminal
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.13
winget install Gyan.FFmpeg
```

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv ffmpeg
# Node from apt is often old: use the "nvm" command from nodejs.org/en/download, then
nvm install --lts
```

Version numbers move fast. On Windows, `winget search Python.Python` lists the current 3.x releases; take the newest.
Then check all three:

```bash
node --version
python3 --version      # on Windows: python --version
ffmpeg -version        # one dash; the first line is enough
```

> **If you're stuck:** "not recognized" or "command not found" right after an install? Open a new terminal window —
> the old one doesn't know about the new programs yet. On Windows, if `python` opens the Microsoft Store, turn off
> the Python entries under Settings → Apps → Advanced app settings → App execution aliases, then reopen the terminal.
> Anything else: paste the exact error to your agent.

**Proof:** paste the three version lines.

## Step 2 — Your first CLI tool (30 min)

A **CLI tool** is a program you run by typing its name. Ours sorts a messy Downloads folder by file type. Because
moving files is risky, it starts with a **dry run**: it only *prints* what it would do. Make a new folder:

```bash
cd ~
mkdir tidy
cd tidy
claude
```

```text
Goal: a small Python command-line tool, tidy.py, that sorts the files in a folder into
subfolders by type: Images, Documents, Videos, Audio, Archives, Other.

Context: I'm a beginner. Python 3 is installed. Check which operating system I'm on and
tell me the exact command to run the tool here.

Constraints:
- Standard library only, one file.
- Usage: python tidy.py <folder> (expand ~ in the path). The default is a DRY RUN that prints a table of
  "file -> destination" plus a count per category, and moves nothing.
- Files are moved only when I add --apply.
- Only top-level files; never touch subfolders, never delete, never overwrite
  (add " (2)" to the name if it exists).
- First create a test folder called sample with 12 fake empty files of mixed types,
  and demonstrate the tool on it.

Done when: you've shown me the dry run on sample, then --apply on sample, and explained
the code in five short bullet points.
```

Watch the test run. When it looks right, try a dry run on your real Downloads (use `python` on Windows):

```bash
python3 tidy.py ~/Downloads
```

Read the plan. Happy? Add `--apply`. Not sure? Don't. A dry run you never apply is still a win.

> **Tip:** "dry run first" is a habit for life. Every time an agent's script moves, deletes or sends something,
> ask for a dry-run mode.

**Proof:** a screenshot of the dry-run output.

## Quiz

What does each command do?

1. `cd ..`
2. `mkdir photos` then `cd photos`
3. `rm -r old-project`
4. `python3 tidy.py ~/Downloads --apply`

<details><summary>Answers</summary>

1. Moves you up one folder.
2. Creates a folder called `photos` and steps into it.
3. Deletes the folder `old-project` and everything inside it, permanently. Pause before typing this one.
4. Runs your tool on Downloads for real, moving the files.

</details>

## You're done when…

- [ ] You can move around folders with `cd`, `ls` and `pwd` without looking at the table.
- [ ] You pasted the Node, Python and ffmpeg version lines.
- [ ] You uploaded a screenshot of your tool's dry run.
- [ ] You answered the quiz.

**Tomorrow:** you learn to write prompts that get the right result on the first try.
