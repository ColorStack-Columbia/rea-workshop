'use strict';

// ============================================================================
//  YOUR JOB: rewrite 2048's "spawn a new tile" logic as a normal function.
//
//  Use what you learned in steps 03-05 (and the REA locations you found).
//  Only edit the body of spawnTile(). Then run:   node test.js
// ============================================================================

/**
 * Decide where the next tile appears and what number it shows.
 *
 * @param {boolean[][]} grid  A 4x4 board. grid[x][y] is true when that cell already has a tile.
 *                            x is the column (0 = left), y is the row (0 = top).
 * @param {() => number} random  Use this INSTEAD of Math.random(). It returns a number
 *                               in [0, 1), just like Math.random(), but it is "seeded",
 *                               so the test can replay the exact same numbers.
 * @returns {{x: number, y: number, value: number} | null}
 *          The new tile's column, row and value, or null if the board is full.
 */
function spawnTile(grid, random) {
  // TODO: replace this placeholder with the real logic.
  //
  // Questions to answer from the minified code before you start typing:
  //   1. What happens when there are no empty cells?
  //   2. In which ORDER does the game list the empty cells? (Which loop is on the outside?)
  //   3. How does it turn one random number into an index into that list?
  //   4. How does it decide between a 2 and a 4?
  //   5. Which random number is used first: the one for the value or the one for the position?
  //      (This matters! The test replays the same random numbers in the same order.)
  return null;
}

module.exports = { spawnTile };
