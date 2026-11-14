#!/usr/bin/env node
// Print the code at a location that REA reported.
//
// REA tells you WHERE something is (a "source range"), not what it means.
// This script turns a location into readable code so you (or your agent) can read it.
//
// Locations use REA's format: LINE:COLUMN. Lines start at 1, columns start at 0.
//
// Usage:
//   node scripts/show-code.mjs <file> <startLine:startCol>-<endLine:endCol> [--pretty] [--context N]
//   node scripts/show-code.mjs <file> <line>                         # a whole line (long lines are cut)
//
// Examples:
//   node scripts/show-code.mjs targets/2048/game.min.js 1:8000-1:8200 --pretty
//   node scripts/show-code.mjs targets/2048/game.min.js 1:8000-1:8200 --context 80
//
// Files inside an Electron .asar archive: use  <archive.asar>::<path inside>
//   node scripts/show-code.mjs /Applications/Hyper.app/Contents/Resources/app.asar::session.js 130:0-140:0
//
// --pretty    re-indent minified code (adds line breaks after { ; and before }), easier to read
// --context N also show N extra characters before and after the range (marked with >>> and <<<)

import fs from 'node:fs';

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error('usage: node scripts/show-code.mjs <file> <line:col>-<line:col> [--pretty] [--context N]');
  console.error('       node scripts/show-code.mjs <file> <line>');
  process.exit(2);
}

// --- read a plain file, or a file packed inside an .asar archive -------------
function readAsarEntry(archive, entry) {
  const fd = fs.openSync(archive, 'r');
  const head = Buffer.alloc(16);
  fs.readSync(fd, head, 0, 16, 0);
  const headerSize = head.readUInt32LE(4);
  const jsonSize = head.readUInt32LE(12);
  const json = Buffer.alloc(jsonSize);
  fs.readSync(fd, json, 0, jsonSize, 16);
  let node = JSON.parse(json.toString('utf8'));
  for (const part of entry.split(/[\\/]/).filter(Boolean)) {
    node = node.files?.[part];
    if (!node) throw new Error(`"${entry}" is not inside ${archive}`);
  }
  if (node.files) throw new Error(`"${entry}" is a folder, not a file`);
  if (node.unpacked) {
    return fs.readFileSync(`${archive}.unpacked/${entry}`, 'utf8');
  }
  const buf = Buffer.alloc(node.size);
  fs.readSync(fd, buf, 0, node.size, 8 + headerSize + Number(node.offset));
  fs.closeSync(fd);
  return buf.toString('utf8');
}

function readSource(spec) {
  const i = spec.indexOf('::');
  if (i > 0) return readAsarEntry(spec.slice(0, i), spec.slice(i + 2));
  if (!fs.existsSync(spec)) throw new Error(`file not found: ${spec}`);
  return fs.readFileSync(spec, 'utf8');
}

// --- turn line:col into a character offset -----------------------------------
function offsetOf(lines, line, col) {
  if (line < 1 || line > lines.length) throw new Error(`line ${line} is outside the file (it has ${lines.length} lines)`);
  let off = 0;
  for (let i = 0; i < line - 1; i++) off += lines[i].length + 1;
  return off + Math.min(col, lines[line - 1].length);
}

// --- tiny pretty printer for minified code (good enough for reading) -----------
function pretty(code) {
  let out = '';
  let indent = 0;
  let paren = 0;
  let quote = null;
  const nl = () => { out = out.replace(/[ \t]+$/, ''); out += '\n' + '  '.repeat(Math.max(indent, 0)); };
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      out += ch;
      if (ch === '\\') { out += code[++i] ?? ''; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; out += ch; continue; }
    if (ch === '(' || ch === '[') paren++;
    if (ch === ')' || ch === ']') paren--;
    if (ch === '{') { out += ' {'; indent++; nl(); continue; }
    if (ch === '}') { indent--; nl(); out += '}'; if (code[i + 1] && !',;)'.includes(code[i + 1])) nl(); continue; }
    if (ch === ';' && paren <= 0) { out += ';'; nl(); continue; }
    if (ch === ',' && paren <= 0 && indent > 0) { out += ','; nl(); continue; }
    out += ch;
  }
  return out.replace(/\n\s*\n/g, '\n').trim();
}

// --- main ---------------------------------------------------------------------
const argv = process.argv.slice(2);
let isPretty = false;
let context = 0;
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--pretty') isPretty = true;
  else if (argv[i] === '--context') context = Number(argv[++i]) || 0;
  else if (argv[i] === '--help' || argv[i] === '-h') usage();
  else positional.push(argv[i]);
}
const [file, range] = positional;
if (!file || !range) usage();

let text;
try { text = readSource(file); } catch (e) { usage(e.message); }
const lines = text.split('\n');

if (/^\d+$/.test(range)) {
  const n = Number(range);
  if (n < 1 || n > lines.length) usage(`line ${n} is outside the file (it has ${lines.length} lines)`);
  const line = lines[n - 1];
  console.log(line.length > 2000 ? `${line.slice(0, 2000)} ... [line is ${line.length} characters; use a line:col range]` : line);
  process.exit(0);
}

const m = range.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
if (!m) usage(`could not read the range "${range}". Write it like 1:9686-1:9823`);
const [sl, sc, el, ec] = m.slice(1).map(Number);
let start, end;
try { start = offsetOf(lines, sl, sc); end = offsetOf(lines, el, ec); } catch (e) { usage(e.message); }
if (end < start) usage('the end of the range comes before the start');

const body = text.slice(start, end);
console.log(`--- ${file}  ${range}  (${end - start} characters) ---`);
if (context > 0) {
  const before = text.slice(Math.max(0, start - context), start);
  const after = text.slice(end, end + context);
  console.log(`${before}>>>${body}<<<${after}`);
} else {
  console.log(isPretty ? pretty(body) : body);
}
