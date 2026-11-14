# Reverse Engineering with an AI Agent: a hands-on workshop

You'll take a real game whose code has been deliberately scrambled, use an AI agent with
**REA** (a reverse-engineering toolkit) to figure out how it works, and then prove you
understood it by rewriting one piece and passing a 1,000-case test.

- **Who it's for:** first-year CS students. You need to read basic JavaScript (`if`, `for`,
  functions, objects). You don't need any security or reverse-engineering background.
- **Time:** about 60 minutes (steps 01-06). Each step takes under 10 minutes. Step 07 is an
  optional demo.
- **What you need:** a laptop, Node.js, git, a browser, and an AI coding agent that can use
  MCP tools (Claude Code, Codex, Cursor, …). Step 01 walks you through it.

> **New words** are in **bold** the first time they appear and defined right there.
> They're all collected in [GLOSSARY.md](GLOSSARY.md).

## What is reverse engineering?

**Reverse engineering (RE)** means figuring out how something works when you only have the
finished product, not the original design. For software, that usually means you have the
program but not its readable source code.

Today's program is the game **2048** (MIT-licensed; you're allowed to study it). We took
its readable source code and ran it through a **minifier**, a tool that shrinks code by
deleting spaces and comments, and **mangling** it, which renames variables and methods to
meaningless letters like `t`, `M` or `_`. Real websites ship code like this all the time.
Your job is to read the meaning back out of it.

**REA** does the heavy lifting. It reads code without running it (**static analysis**)
and reports the facts it finds, each with an exact **location** in the file. REA tells you
*where* things are, not *what they mean*. Connecting the facts into an explanation is the
part you and your agent do.

## Setup checklist (do this before the workshop)

- [ ] **Clone the repo:** `git clone <this repo's URL> rea-workshop && cd rea-workshop`
- [ ] **Run the environment check:**
  ```bash
  node scripts/check-env.mjs --agent claude_code
  ```
  Use your agent's name instead of `claude_code` if you use a different one. The script
  lists the valid names. It never installs anything: when something is missing, it prints
  the exact command for you to run. Run it again until it says **All required checks passed**.
- [ ] **Connect REA to your agent**, if the check said it isn't connected. See
  [steps/01-setup](steps/01-setup/README.md).
- [ ] **Open the game once** in a browser (`targets/2048/index.html`) and play a few moves.
  You can't reverse-engineer a game you've never played.

## The steps

| Step | What you do | Time |
|---|---|---|
| [01-setup](steps/01-setup/README.md) | Connect REA to your agent and confirm it works | 10 min |
| [02-first-analysis](steps/02-first-analysis/README.md) | Run REA on the game and learn to read its output | 10 min |
| [03-tile-spawn](steps/03-tile-spawn/README.md) | Where does a new tile appear, and is it a 2 or a 4? | 10 min |
| [04-win-and-game-over](steps/04-win-and-game-over/README.md) | What makes you win, and what ends the game? | 10 min |
| [05-score-and-best-score](steps/05-score-and-best-score/README.md) | How does the score go up, and where is the best score saved? | 10 min |
| [06-rebuild-the-spawn](steps/06-rebuild-the-spawn/README.md) | **Final challenge:** rewrite the spawn logic and pass 1,000 tests | 10 min |
| [07-optional-hyper-demo](steps/07-optional-hyper-demo/README.md) | Optional: a real desktop app (Hyper terminal), plus where static analysis falls short | 10 min |

Each step folder has the same parts:
1. **The idea:** the concept, in plain language.
2. **Prompt:** a block you copy and paste into your agent.
3. **What you should see:** so you know whether it worked.
4. **Hints:** hidden until you click them.
5. **Check yourself:** a question to confirm you got it.

## Two helper scripts

REA reports locations like `game.min.js 1:8131-1:8230`, meaning line 1, columns 8131 to
8230. The whole game is one very long line, so you need help reading a location:

```bash
# print the code at a location, nicely indented
node scripts/show-code.mjs targets/2048/game.min.js 1:8131-1:8230 --pretty

# search a saved REA analysis for a word or number, and get the show-code command for each hit
node scripts/rea-find.mjs work/2048-analysis.json 0.9
```

Your agent can run these too. The prompts tell it to.

## Rules of the game

1. **Every answer needs evidence.** That means a location REA reported plus the code at
   that location. Your agent may already "know" 2048 from its training data. An answer
   without a location doesn't count, because the point is to practice the method.
2. **Don't peek at the answers.** They live on a separate git branch called
   `answer-key`. Don't check it out until your facilitator says so, and don't let your
   agent read it either. The prompts tell it not to.
3. **Only analyze what's in `targets/`.** Everything there is MIT-licensed open source
   (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)). Pointing RE tools at software
   you don't have permission to study can break license terms or laws.

## When something goes wrong

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md). It was written from problems we actually hit
while testing this workshop.

## For facilitators

Answer keys, the script that builds the scrambled game, and a timing plan are on the
`answer-key` branch: `git checkout answer-key`, then open `answer-key/FACILITATOR.md`.
