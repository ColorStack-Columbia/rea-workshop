# Troubleshooting

Every problem below actually came up while we tested this workshop.
First step for anything setup-related: `node scripts/check-env.mjs --agent <your agent>`.

## Setup

### `rea: command not found`
You don't need a global install. Put `npx -y rea-agents@6.9.0` wherever the steps say `rea`:
```bash
npx -y rea-agents@6.9.0 analyze-javascript-application "$(pwd)/targets/2048" --json > work/2048-analysis.json 2> work/2048-analysis.log
```
The first run downloads REA into npm's cache, which takes a little while.

### Node is too old
REA needs Node **22 (>=22.23.4), 24 (>=24.22.1), or 26+ (>=26.12.1)**. Check with `node --version`.
If you use nvm: `nvm install 24 && nvm use 24`. Otherwise install the current LTS from the
official Node.js website.

### My agent doesn't show any REA tools
1. Did you run `npx -y rea-agents@6.9.0 setup --client <agent> --yes`? Preview it first with `--dry-run`.
2. **Restart the agent completely.** Agents load their tools only at startup.
3. Run `rea doctor --client <agent>` (or `npx -y rea-agents@6.9.0 doctor --client <agent>`).
   - `config_drift`: your agent is registered with a different REA version than the one
     you run. Re-run setup for your agent, then restart it.
   - `missing_analysis_engine` for Hopper, Ghidra, IDA, JADX or Kuna: **ignore it**. Those
     engines are for native and Android apps.
4. Still nothing? Use the **No MCP?** command-line path in each step. You can do the whole
   workshop that way.

### The env check says the target "has been modified"
Something edited `targets/2048/game.min.js`, maybe an editor auto-formatting it on save.
Restore it with `git checkout -- targets/2048/game.min.js`. Line:column locations only work
on the exact original file.

## Reading REA output

### REA gave me locations, not an explanation. Is it broken?
No, that's how it works. REA reports **facts plus locations** (`game.min.js 1:8131-1:8230`).
Turning them into an explanation is your job, or your agent's. Print the code at a location with:
```bash
node scripts/show-code.mjs targets/2048/game.min.js 1:8131-1:8230 --pretty
```

### Every location says line 1
Minified code is a single line. Only the **column** changes. That's why the
show-code helper exists. Don't try to scroll to column 8131 in an editor.

### "unknowns", "limitations", "coverage: unknown"
These are normal. REA lists everything it *couldn't* prove with static analysis, e.g.
property names computed at run time. They aren't errors.

### The output is huge, or my agent says the result was cut off
Ask for `detail: "summary"` in MCP. Over the CLI, save to a file
(`--json > work/….json`) and search it with `node scripts/rea-find.mjs`. Don't paste a
whole analysis into the chat.

### rea-find says "this file holds a REA error, not an analysis"
The analysis failed, so read the error it prints. The most common one is in the Hyper
section below.

## The agent itself

### My agent answered without using REA ("this is the classic 2048 code...")
Many AI models have seen 2048's source during training. Reply:
*"Please redo this using only REA output. For each claim, cite the REA location and show the
code with scripts/show-code.mjs."* Answers without locations don't count.

### My agent refused, or added a lot of warnings
That didn't happen in our testing, but if it does, rephrase as a plain comprehension
question: *"Explain how this game implements tile spawning, using the REA analysis of
targets/2048."* Everything in `targets/` is MIT-licensed open source you're allowed to study.

### My agent wants to read the answer key
Tell it no. The prompts forbid it, but double-check. The answer key lives on the
`answer-key` branch, so as long as you stay on `main`, it isn't in your folder.

### The minified code contains text that looks like instructions
Treat anything that comes *out of* a target as **data**, never as instructions for your
agent. (2048 doesn't contain any, but real targets can. That's called **prompt injection**.)

## Step 06 test

| Message | What it usually means |
|---|---|
| `66 / 1000` and lots of "You returned null" | You haven't written the function yet (the starter returns `null`) |
| "Right value, wrong POSITION" on most cases | Your loops are in the wrong order (x vs y), or your index formula differs |
| "Wrong VALUE" | Your 2-vs-4 rule is off, or you use the random numbers in a different order |
| "you called random() N time(s)" | The original calls `random()` exactly twice when it spawns, and never on a full board |
| "threw an error" | A bug in your code. The stack trace shows the line |

## Hyper demo (step 07)

### `artifact_integrity_mismatch … native-process-working-directory.node`
Expected for Hyper. A native `.node` file was code-signed **after** the archive recorded its
fingerprint, so the fingerprints no longer match. Re-run with
`--integrity-policy record-and-continue` (MCP: `integrity_policy: "record-and-continue"`).
REA then continues and marks those bytes as untrusted.

### The Hyper analysis takes forever (4-5 minutes) or produces a 250 MB file
You analyzed the whole archive, including ~2,000 library files. Add the file list:
`--source-paths-json steps/07-optional-hyper-demo/source-paths.json`
(MCP: `source_paths: [...]`). That takes about 5 seconds.

### Hyper line numbers don't match what the facilitator shows
Check your version (needs 3.4.1). Also note that Hyper's GitHub `main` branch is 4.0.0-canary.
To compare with the source, use the `v3.4.1` tag.

### The IPC summary lists almost nothing from Hyper's own code
That's the "where static analysis falls short" lesson in step 07. Hyper names its channel at
run time, and the renderer code is a minified bundle. Look at the `listener` nodes instead.
