# Step 03: Where do new tiles come from? (10 min)

## The question

> When a new tile spawns, how does the code pick its **position** and its **value**
> (2 or 4)? With what probability?

## The idea: follow a clue to the function that contains it

The usual RE move is: **find something that can't be disguised, then look at what's around it.**

Randomness in JavaScript almost always means a call to `Math.random()`. That's a **call
site** (a place where a function is called), and REA records every one with its location.
Since `Math` is built into JavaScript, the mangler couldn't rename it.

REA also tells you which **function** each node sits inside. Read that whole function and
you usually have your answer.

## Prompt

```text
Question: in the minified 2048 game (targets/2048/game.min.js), when a new tile spawns,
how does the code choose its position and its value (2 vs 4), and with what probability?

Method:
1. Use REA's results for targets/2048. If you no longer have them, call the REA MCP tool
   analyze_javascript_application on the absolute path of targets/2048 again, or use
   work/2048-analysis.json if it exists.
2. Find every place that reads Math.random (try: node scripts/rea-find.mjs work/2048-analysis.json random).
3. For each one, print the function that contains it with:
   node scripts/show-code.mjs targets/2048/game.min.js <range> --pretty
4. Follow any helper function those functions call (for example the one that picks a cell).
   Mangled method names are short, so look them up by exact name:
   node scripts/rea-find.mjs work/2048-analysis.json --name <method name>
5. Explain the answer in plain language for a first-year CS student.

For every claim, cite: the REA node kind, the location (line:col range), and the code you printed.
Give a confidence level (high / medium / low).
Rules: do not open the answer-key branch or any answer-key folder, do not look up the 2048
source online, and do not answer from memory.
```

## No MCP? Do it with the command line

```bash
node scripts/rea-find.mjs work/2048-analysis.json random
node scripts/show-code.mjs targets/2048/game.min.js <the "inside function" range it printed> --pretty
```

## What you should see

- REA finds **two** reads of `Math.random`, in two different small functions.
- One function decides the **value**. Look for the literal `0.9` and the numbers `2` and `4`.
- The other picks **which empty cell**. It builds a list of empty cells and indexes into it.
- The names are mangled (e.g. `this.grid.Z()`), so you'll have to work out what `Z` does
  from its body. That's normal RE work.

## Hints

<details><summary>Hint 1: reading `a < b ? x : y`</summary>

`cond ? x : y` means "if `cond` then `x` else `y`". `Math.random()` gives a number from 0
(inclusive) up to 1 (exclusive). How often is that number less than 0.9?
</details>

<details><summary>Hint 2: what's `this.grid.Z()`?</summary>

It's a method call on the grid. Ask REA where a property named exactly `Z` is assigned:
`node scripts/rea-find.mjs work/2048-analysis.json --name Z`. It prints the function that gets
assigned to `Z`, plus the show-code command to read it. That function calls `this.tt()`;
follow it the same way with `--name tt`. Use `--name` for mangled names: a plain search for
`Z` also matches every word containing a "z", like `size`.
</details>

<details><summary>Hint 3: a detail you'll need in step 06</summary>

Write down **the order things happen**. Is the 2-or-4 decided before or after the cell is
picked? And when the game lists the empty cells, which loop is on the outside, `x` or `y`?
</details>

## Check yourself

- What fraction of new tiles are 4s?
- Is every empty cell equally likely to get the new tile? Why?
- What happens if the board is completely full?
