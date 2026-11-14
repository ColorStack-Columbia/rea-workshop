# Step 06: Final challenge, rebuild the spawn (10 min)

## The challenge

Write a normal, readable function `spawnTile(grid, random)` in [`spawn.js`](spawn.js) that
does **exactly** what the game does when it adds a new tile. Then prove it:

```bash
cd steps/06-rebuild-the-spawn
node test.js
```

You pass when it prints `1000 / 1000 cases match the original game.`

## The idea: reconstruction proves understanding

Explaining code is good. Rebuilding it so that it behaves *identically* is better, because
it can't be faked. This is called **reconstruction**.

But how do you test something random? With a **seeded random number generator**. It
produces numbers that look random, but the same **seed** (starting number) always gives the
same sequence. We ran the *original* game 1,000 times on different boards, each with its
own seed, and recorded which tile it spawned (`spawn-cases.json`). The test feeds your
function the same boards and the same random numbers. If you understood the logic
perfectly, including the **order** in which random numbers are used, you get identical
answers.

`spawnTile` gets:
- `grid`: a 4x4 array; `grid[x][y]` is `true` if that cell is occupied (`x` = column, `y` = row)
- `random`: use this instead of `Math.random()`

and returns `{x, y, value}`, or `null` if the board is full.

## Prompt (optional: you can also just write it yourself)

If you want your agent's help, make it **teach** rather than solve:

```text
I'm doing the final challenge in steps/06-rebuild-the-spawn. I must write spawnTile() in
spawn.js so that node test.js passes 1000/1000.
Don't write the solution for me. Instead:
1. Using the REA locations we found earlier (re-run analyze_javascript_application on the
   absolute path of targets/2048 if needed), show me the minified functions involved in
   spawning a tile with node scripts/show-code.mjs ... --pretty, including the helpers that
   list empty cells and loop over the grid.
2. Ask me questions that lead me to each detail I need (order of loops, how the index is
   computed, how 2 vs 4 is chosen, which random number is used first).
3. After I write my attempt, run node test.js, and if it fails, explain what the failure
   message means without giving me the code.
Do not open the answer-key branch or any answer-key folder.
```

## What you should see

The starter `spawn.js` always returns `null`, so the first run shows
`66 / 1000 cases match` (the 66 full-board cases happen to be right). Each failure prints a
little picture of the board and a hint about *what kind* of mistake it is: wrong value,
wrong position, or wrong number of `random()` calls.

## Hints

<details><summary>Hint 1: the empty-cell list</summary>

In the minified code, the method that lists empty cells (`tt`) calls another method (`it`) that
loops over the grid with two nested `for` loops. Find both with
`node scripts/rea-find.mjs work/2048-analysis.json --name tt` (and then `--name it`). Which variable does the *outer* loop count? Your
list must be in the same order, or "pick item number k" picks a different cell.
</details>

<details><summary>Hint 2: "Right value, wrong position" on almost every case</summary>

Your loop order is probably flipped (x and y), or your index formula differs. The game uses
`Math.floor(random() * numberOfEmptyCells)`.
</details>

<details><summary>Hint 3: "Wrong value" on lots of cases</summary>

Check which random number you use for the value. The game calls `random()` for the 2-or-4
decision **before** it picks the cell.
</details>

## Check yourself

- Why does the order of the two `random()` calls matter for the test, but not for a player?
- If you used `Math.random()` instead of `random`, what would the test show? Try it!
