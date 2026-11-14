# Step 04: Winning and losing (10 min)

## The question

> What condition triggers a **win**, and what triggers **game over**?

## The idea: start from what the player sees, then work backwards

The messages `"You win!"` and `"Game over!"` are **literals** (text written directly in the
code), so they survive mangling. The function that shows them has to be told *which* message
to show. Follow that backwards: who calls it, and with what flag? Where does the flag get
set? This is called **working backwards from an observable effect**, and it's one of the
most useful RE habits.

Property names are mangled too, so "won" might be stored as something like `this._`.
You'll recognize it by **what it does**, not by its name.

## Prompt

```text
Question: in the minified 2048 game (targets/2048/game.min.js), what condition makes the
player WIN, and what condition makes the game OVER?

Method:
1. Use REA's results for targets/2048 (MCP analyze_javascript_application on its absolute
   path, or work/2048-analysis.json).
2. Start from the literals "You win!" and "Game over!" and the literal 2048
   (node scripts/rea-find.mjs work/2048-analysis.json "You win" ; ... 2048 --kind literal).
   Print the containing functions with node scripts/show-code.mjs ... --pretty.
3. Work backwards: which mangled property means "won"? Which means "over"? Where is each one
   set to true, and under what condition? Is there a function that checks
   "is the game finished"?
4. For game over, follow any helper the code calls to decide whether moves are still possible.
5. Explain in plain language for a first-year CS student. Translate each mangled name you
   relied on (e.g. "_ seems to mean won, because ...").

For every claim, cite the REA node / location and the code you printed. Give a confidence level.
Rules: do not open the answer-key branch or any answer-key folder, do not look up the 2048
source online, and do not answer from memory.
```

## No MCP? Do it with the command line

```bash
node scripts/rea-find.mjs work/2048-analysis.json "You win"
node scripts/rea-find.mjs work/2048-analysis.json 2048 --kind literal
node scripts/show-code.mjs targets/2048/game.min.js <range> --pretty
```

## What you should see

- `2048` appears **twice** as a literal. One is in the code that draws tiles (it picks a
  special style for big tiles), which isn't the win rule. The other is in the code that
  **merges** two tiles. Telling a red herring from the real thing is part of RE.
- A small function returns something like `this.$ || this._ && !this.q`. That's
  "is the game finished?"
- Game over is decided **right after a move**, using a helper that checks for empty cells
  *or* neighbouring tiles with equal values.

## Hints

<details><summary>Hint 1: how do I know which letter means "won"?</summary>

Find the function that shows `"You win!"`. It takes a parameter and shows "You win!" when
it's true. That function is assigned to a property named `message`. To find who *calls* it, search
for reads of that name: `node scripts/rea-find.mjs work/2048-analysis.json message --kind expression`.
Look at the function those reads are inside, and see which property it passes.
</details>

<details><summary>Hint 2: can you keep playing after winning?</summary>

Look at the "is the game finished?" function. There's a third property involved, and the
game's "Keep going" button sets it.
</details>

<details><summary>Hint 3: when exactly is game over checked?</summary>

Look at the end of the big function that handles a move. Something only happens
`if` the board actually changed. The merge code you found is a small callback; rea-find's
`which is inside:` line gives you the ranges of the bigger functions around it.
</details>

## Check yourself

- Do you win by *having* a 2048 tile, or by *creating* one through a merge?
- Can the game be over while there are still empty cells? Why or why not?
