# Step 02: Your first analysis (10 min)

## The idea

Open `targets/2048/game.min.js` in an editor. It's one line about 10,000 characters long,
and it looks like this:

```js
function t(){this.events={},window.navigator.msPointerEnabled?(this.t="MSPointerDown",…
```

That's **minified** code (spaces and comments removed) with **mangled** names (variables
and methods renamed to letters). Reading it top to bottom would take forever.

REA does **static analysis**: it **parses** the code (turns the text into a tree that
describes its structure) without running it. Then it records what it finds as a
**graph**, made of **nodes** connected by **relations**. Some node kinds you'll see:

| Node kind | What it is | Example |
|---|---|---|
| `function` | a function definition | `function(){…}` |
| `literal` | a value written directly in the code; mangling can't rename these, so they're your best clues | `0.9`, `"You win!"` |
| `call-site` | a place where a function is called | `Math.random()` |
| `property-slot` | a property on an object | `this.M` |
| `listener` / `event` | something waiting for an event, and the event itself | `on("move", …)` |

Every node comes with a **source range**: `LINE:COLUMN-LINE:COLUMN`, lines counted from 1,
columns from 0. That's REA's answer to "where?". The "what does it mean?" part is up to you.

## Prompt

```text
We are reverse engineering a minified JavaScript game in this repo.
Target: the folder targets/2048 (use its absolute path). Only analyze that folder.

1. Call the REA MCP tool analyze_javascript_application on that folder with detail "summary".
   Tell me: how many JavaScript files were parsed, whether coverage was complete,
   and the evidence_id / parent_evidence_id it returned.
2. Also save the full analysis to a file so we can search it later. Run in the terminal:
   rea analyze-javascript-application "<absolute path to targets/2048>" --json > work/2048-analysis.json 2> work/2048-analysis.log
   (if "rea" is not found, use: npx -y rea-agents@6.9.0 instead of "rea")
3. Run: node scripts/rea-find.mjs work/2048-analysis.json --kinds
   and:  node scripts/rea-find.mjs work/2048-analysis.json --literals
   Explain what each node kind means in one line each, for a first-year CS student.
4. From the literal values, pick the 5 that look like the best clues about how the game works,
   and say why.

Rules: do not open the answer-key branch or any answer-key folder, do not look up the 2048
source code online, and do not answer from memory. Base everything on REA output.
```

## No MCP? Do it with the command line

```bash
rea analyze-javascript-application "$(pwd)/targets/2048" --json > work/2048-analysis.json 2> work/2048-analysis.log
node scripts/rea-find.mjs work/2048-analysis.json --kinds
node scripts/rea-find.mjs work/2048-analysis.json --literals
```

(Windows PowerShell: use `"$PWD/targets/2048"`. If `rea` isn't found, use `npx -y rea-agents@6.9.0`.)

## What you should see

- The analysis finishes in **about 2 seconds**: 1 JavaScript file parsed, 0 parse failures.
  (`work/2048-analysis.log` fills with `rea_progress` lines. Those are just progress messages. If the analysis fails, the error ends up in the `.json` file.)
- Node kinds: roughly 1,700 `expression`, 200 `property-slot`, 200 `call-site`, 96 `function`, 83 `literal` …
- About 27 distinct literals, including `0.9`, `2`, `4`, `2048`, `"You win!"`, `"Game over!"`, `"game-won"`.
- A long list of **limitations** and **unknowns**. That's normal: REA is telling you
  honestly what static analysis can't prove (for example, that a piece of code actually runs).

## Hints

<details><summary>What does "semantic coverage: unknown" or "960 unknowns" mean? Is something broken?</summary>

No. REA records every place where it couldn't be sure (e.g. `obj[someVariable]`, where
the property name is only known at run time). Being upfront about what it doesn't know is
a feature. You'll still find everything you need.
</details>

<details><summary>Which literals are the best clues?</summary>

Numbers that look like game rules (`0.9`, `2048`, `4`) and strings a player would see
(`"You win!"`, `"Game over!"`). Mangling renames code, but it can't rename text the
player sees or numbers the rules depend on.
</details>

## Check yourself

- Why are literals still readable when everything else got mangled?
- What does the location `1:8181-1:8183` mean?
- Try it: `node scripts/show-code.mjs targets/2048/game.min.js 1:8181-1:8183 --context 60`
