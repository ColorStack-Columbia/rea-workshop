'use strict';
// Test harness for the final challenge. You should NOT need to edit this file.
//
//   node test.js            run all 1000 cases
//   node test.js --all      show every failing case, not just the first one
//   node test.js ../../answer-key/solution/spawn.js   test a different file
//
// How it works: spawn-cases.json holds 1000 boards. For each board, the ORIGINAL game was run
// with a seeded random number generator, and the tile it spawned was recorded.
// This harness feeds the same board and the same seeded random numbers to YOUR spawnTile()
// and checks that you get exactly the same answer.

const fs = require('fs');
const path = require('path');

const showAll = process.argv.includes('--all');
const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const spawnPath = path.resolve(__dirname, fileArg || 'spawn.js');
const { spawnTile } = require(spawnPath);
const { cases } = JSON.parse(fs.readFileSync(path.join(__dirname, 'spawn-cases.json'), 'utf8'));

// mulberry32: a tiny, well-known seeded random number generator.
// Same seed in => same sequence of numbers out, every time.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toGrid(board) {
  const grid = [];
  for (let x = 0; x < 4; x++) {
    grid.push([]);
    for (let y = 0; y < 4; y++) grid[x].push(board[x * 4 + y] === '1');
  }
  return grid;
}

function draw(board, tile, mark) {
  const rows = [];
  for (let y = 0; y < 4; y++) {
    let row = '      ';
    for (let x = 0; x < 4; x++) {
      if (tile && tile.x === x && tile.y === y) row += ` ${mark}`;
      else row += board[x * 4 + y] === '1' ? ' #' : ' .';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

const fmt = (t) => (t ? `{x: ${t.x}, y: ${t.y}, value: ${t.value}}` : 'null');
let passed = 0;
let shown = 0;
const failures = { value: 0, position: 0, nullness: 0, crash: 0, calls: 0 };

for (const c of cases) {
  const rng = mulberry32(c.seed);
  let calls = 0;
  const random = () => { calls++; return rng(); };
  const grid = toGrid(c.board);
  let got;
  try {
    got = spawnTile(grid, random);
  } catch (e) {
    failures.crash++;
    if (shown++ < 1 || showAll) console.log(`Case seed=${c.seed}: your spawnTile() threw an error:\n  ${e.stack.split('\n').slice(0, 3).join('\n  ')}\n`);
    continue;
  }
  if (got && typeof got === 'object') got = { x: got.x, y: got.y, value: got.value };
  const exp = c.expected;
  const same = JSON.stringify(got ?? null) === JSON.stringify(exp);
  if (same) { passed++; continue; }

  const expectedCalls = exp ? 2 : 0;
  let why;
  if (!exp || !got) { failures.nullness++; why = exp ? 'You returned null, but the board has empty cells.' : 'The board is FULL, so the game spawns nothing. Return null.'; }
  else if (got.value !== exp.value) { failures.value++; why = 'Wrong VALUE. Check the 2-vs-4 rule, and which random number you use for it.'; }
  else { failures.position++; why = 'Right value, wrong POSITION. Check the order you list empty cells in (which loop is outside?) and how you turn the random number into an index.'; }
  if (calls !== expectedCalls) failures.calls++;

  if (shown++ < 1 || showAll) {
    console.log(`Case seed=${c.seed} FAILED`);
    console.log('  board (# = occupied, . = empty, x goes left->right, y goes top->bottom)');
    console.log('  expected:');
    console.log(draw(c.board, exp, exp ? String(exp.value)[0] : ''));
    console.log(`  expected ${fmt(exp)}   you returned ${fmt(got)}`);
    console.log(`  hint: ${why}`);
    if (calls !== expectedCalls) console.log(`  hint: you called random() ${calls} time(s); the original calls it ${expectedCalls} time(s) for this board.`);
    console.log('');
  }
}

const total = cases.length;
console.log(`${passed} / ${total} cases match the original game.`);
if (passed === total) {
  console.log('PASS: your spawnTile() reproduces 2048 exactly. Nice reverse engineering!');
  process.exit(0);
}
console.log(`Failures by type: wrong value ${failures.value}, wrong position ${failures.position}, null/not-null ${failures.nullness}, crashed ${failures.crash}.`);
if (!showAll) console.log('Run "node test.js --all" to see every failing case.');
process.exit(1);
