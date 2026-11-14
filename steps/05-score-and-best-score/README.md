# Step 05: Score and best score (10 min)

## The questions

> 1. How is the **score** updated when two tiles merge?
> 2. Where is the **best score** stored, so it's still there after you refresh?

## The idea: follow the data

This time you follow a **value** through the program instead of a function call. Two clues
survive mangling:
- **The page.** The score is shown inside an HTML element with class `score-container`
  (look at `targets/2048/index.html`). The code has to look that element up by name.
- **The browser's storage.** Saving data across page refreshes usually means
  `localStorage`, which is built into the browser, so its name can't be mangled.

Following where a value is written and read is called **data-flow analysis**. REA records
many of these reads and writes as relations in its graph.

## Prompt

```text
Questions about the minified 2048 game (targets/2048/game.min.js):
(a) How is the score updated when two tiles merge?
(b) Where is the best score stored, and when is it updated?

Method:
1. Use REA's results for targets/2048 (MCP analyze_javascript_application on its absolute
   path, or work/2048-analysis.json).
2. For (a): find where the score is displayed (hint: search for "score-addition" or
   "textContent", and check index.html for the score element's class). Figure out which
   mangled property holds the score, then find where it is increased during a merge.
3. For (b): search for localStorage
   (node scripts/rea-find.mjs work/2048-analysis.json localStorage) and print the
   surrounding functions with node scripts/show-code.mjs ... --pretty.
   Find the storage key name, what happens if localStorage is not available, and which code
   decides to save a new best score.
4. Explain in plain language for a first-year CS student, and translate each mangled name
   you relied on.

For every claim, cite the REA node / location and the code you printed. Give a confidence level.
Rules: do not open the answer-key branch or any answer-key folder, do not look up the 2048
source online, and do not answer from memory.
```

## No MCP? Do it with the command line

```bash
node scripts/rea-find.mjs work/2048-analysis.json localStorage
node scripts/rea-find.mjs work/2048-analysis.json textContent --limit 40
node scripts/show-code.mjs targets/2048/game.min.js <range> --pretty
```

## What you should see

- A constructor that sets two keys, one of them a readable string, and picks either
  `window.localStorage` or a fallback object.
- A test that tries to write and remove a dummy key. That's how the game checks whether
  `localStorage` works (it can fail in private browsing, for example).
- A line like `i.M += f.value` inside the merge code, where `f` is the newly merged tile.

## Hints

<details><summary>Hint 1: which letter is the score?</summary>

The function that writes into the score element does `this.M = t, this.v.textContent = this.M`.
The constructor stores `document.querySelector(".score-container")` in `this.v`. So in the
display code, `M` is the score shown on screen. Does the game manager use the same letter?
</details>

<details><summary>Hint 2: how much does a merge add?</summary>

When two `4` tiles merge, the new tile's value is `2 * 4 = 8`. What gets added to the score:
8, or 4?
</details>

<details><summary>Hint 3: when is the best score saved?</summary>

Look for a comparison like `this.I.dt() < this.M`. One side reads the stored best score,
the other is the current score.
</details>

## Check yourself

- You merge two 16s. How many points do you get?
- Where would the best score go if `localStorage` didn't work, and would it survive a refresh?
- Try it in the browser: open DevTools → Application → Local Storage. What keys do you see?
