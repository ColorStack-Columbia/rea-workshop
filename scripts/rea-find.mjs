#!/usr/bin/env node
// Search a saved REA analysis (JSON) for things you care about, and print WHERE they are.
//
// REA's output is big. This script finds the pieces that match a word or number and prints:
//   - what kind of thing it is (a literal value, a call, a property, an event listener ...)
//   - where it is (file + line:col range)
//   - the range of the function that contains it
//   - a ready-to-run show-code command so you can read the actual code
//
// Usage:
//   node scripts/rea-find.mjs <analysis.json> <search text> [--kind KIND] [--file NAME] [--limit N]
//   node scripts/rea-find.mjs <analysis.json> --literals          # list every literal value REA saw
//   node scripts/rea-find.mjs <analysis.json> --kinds             # count nodes by kind
//   node scripts/rea-find.mjs <analysis.json> --name Z            # exact name (mangled names are short, so use this)
//
// Examples:
//   node scripts/rea-find.mjs work/2048-analysis.json 0.9
//   node scripts/rea-find.mjs work/2048-analysis.json random --kind call-site
//
// Make the analysis file first with:
//   rea analyze-javascript-application "$(pwd)/targets/2048" --json > work/2048-analysis.json 2> work/2048-analysis.log

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opts = { kind: null, file: null, limit: 25 };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--kind') opts.kind = argv[++i];
  else if (a === '--file') opts.file = argv[++i];
  else if (a === '--limit') opts.limit = Number(argv[++i]) || 25;
  else if (a === '--literals') opts.literals = true;
  else if (a === '--kinds') opts.kinds = true;
  else if (a === '--name') opts.name = argv[++i];
  else positional.push(a);
}
const [jsonPath, query] = positional;
if (!jsonPath || (!query && !opts.name && !opts.literals && !opts.kinds)) {
  console.error('usage: node scripts/rea-find.mjs <analysis.json> <search text> [--kind KIND] [--file NAME] [--limit N]');
  console.error('       node scripts/rea-find.mjs <analysis.json> --name EXACT_NAME     # exact, case-sensitive name (e.g. a mangled method like Z)');
  console.error('       node scripts/rea-find.mjs <analysis.json> --literals | --kinds');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error(`error: could not read ${jsonPath} as JSON (${e.message}).`);
  console.error('Did the analysis finish? Open the file and check it starts with "{".');
  process.exit(1);
}
if (data && data.code && data.message && !data.normalized_result) {
  console.error(`error: this file holds a REA error, not an analysis:\n  ${data.code}: ${data.message}`);
  console.error('See TROUBLESHOOTING.md.');
  process.exit(1);
}

// Find every semantic graph in the file (works for --json output and for evidence bundles).
const graphs = [];
const inputRoots = [];
(function walk(v, depth) {
  if (!v || typeof v !== 'object' || depth > 8) return;
  if (v.semantic_graph && Array.isArray(v.semantic_graph.nodes)) {
    graphs.push(v.semantic_graph);
    if (v.input_path) inputRoots.push(v.input_path);
  }
  for (const k of Object.keys(v)) if (k !== 'semantic_graph') walk(v[k], depth + 1);
})(data, 0);
if (graphs.length === 0) {
  console.error('error: no semantic graph found in this file. Was it made with analyze-javascript-application --json?');
  process.exit(1);
}

const nodes = graphs.flatMap((g) => g.nodes);
const relations = graphs.flatMap((g) => g.relations || []);
const writesTo = new Map();
for (const r of relations) {
  if (r.relation !== 'writes-property') continue;
  if (!writesTo.has(r.target_node_id)) writesTo.set(r.target_node_id, []);
  writesTo.get(r.target_node_id).push(r);
}
const functions = nodes.filter((n) => n.kind === 'function');
const byId = new Map(nodes.map((n) => [n.node_id, n]));
const root = inputRoots[0] || '<app>';
const fmtRange = (r) => (r && r.start && r.end ? `${r.start.line}:${r.start.column}-${r.end.line}:${r.end.column}` : '?');
const rangeOf = (n) => n?.identity?.source_range || n?.evidence?.location?.value || null;
const fileOf = (n) => n?.identity?.module_path || n?.evidence?.location?.value?.source || '?';
const valueOf = (n) => (n.properties && 'value' in n.properties ? n.properties.value : undefined);
const showCmd = (n) => {
  const r = rangeOf(n);
  if (!r) return '';
  const rel = path.relative(process.cwd(), root);
  const base = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : root;
  const file = root.endsWith('.asar') ? `${base}::${fileOf(n)}` : path.join(base, fileOf(n));
  // --pretty only helps minified (single-line) code; multi-line ranges are already readable.
  return `node scripts/show-code.mjs "${file}" ${fmtRange(r)}${r.start.line === r.end.line ? ' --pretty' : ''}`;
};

if (opts.kinds) {
  const counts = {};
  for (const n of nodes) counts[n.kind] = (counts[n.kind] || 0) + 1;
  console.log('Node kinds REA recorded (kind: count)');
  for (const [k, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${c}`);
  process.exit(0);
}

if (opts.literals) {
  const seen = new Map();
  for (const n of nodes) {
    if (n.kind !== 'literal') continue;
    const v = valueOf(n);
    const key = JSON.stringify(v);
    if (!seen.has(key)) seen.set(key, n);
  }
  console.log(`${seen.size} distinct literal values (first place each one appears):`);
  for (const [k, n] of seen) console.log(`  ${k.padEnd(32)} ${fileOf(n)} ${fmtRange(rangeOf(n))}`);
  process.exit(0);
}

const q = String(query ?? '').toLowerCase();
const hits = nodes.filter((n) => {
  if (opts.kind && n.kind !== opts.kind) return false;
  if (opts.file && !fileOf(n).includes(opts.file)) return false;
  if (opts.name) return n.label === opts.name || n.properties?.name === opts.name;
  const hay = `${n.label ?? ''} ${JSON.stringify(n.properties ?? {})}`.toLowerCase();
  return hay.includes(q);
});

// Most useful first: things with a location, and the app's own code before node_modules.
const score = (n) => (rangeOf(n)?.start ? 0 : 2) + (fileOf(n).includes('node_modules') ? 1 : 0);
hits.sort((a, b) => score(a) - score(b));

// Collapse duplicates that point at the same place.
const unique = [];
const seen = new Set();
for (const n of hits) {
  const key = `${n.kind}|${n.label}|${fileOf(n)}|${fmtRange(rangeOf(n))}`;
  if (!seen.has(key)) { seen.add(key); unique.push(n); }
}

console.log(`${unique.length} match(es) for "${opts.name ?? query}"${opts.kind ? ` (kind=${opts.kind})` : ''}. Showing up to ${opts.limit}.\n`);
for (const n of unique.slice(0, opts.limit)) {
  const v = valueOf(n);
  const fn = n.function_node_id ? byId.get(n.function_node_id) : null;
  console.log(`• ${n.kind}  "${n.label}"${v !== undefined ? `  value=${JSON.stringify(v)}` : ''}`);
  if (n.kind === 'property-slot') {
    // A property has no single location. Show where it is ASSIGNED, and the function assigned to it (if any).
    const path_ = (n.properties?.property_path || []).join('.');
    console.log(`    property path:    ${path_ || n.label}`);
    const writes = writesTo.get(n.node_id) || [];
    if (writes.length === 0) console.log('    assigned at:      (REA recorded no assignment)');
    for (const w of writes.slice(0, 5)) {
      const loc = w.evidence?.location?.value;
      console.log(`    assigned at:      ${fileOf(n)} ${fmtRange(loc)}`);
      const fnAssigned = loc && functions.find((f) => {
        const r = rangeOf(f);
        return r && r.start.line === loc.end.line && r.start.column > loc.end.column && r.start.column <= loc.end.column + 2;
      });
      if (fnAssigned) console.log(`    its value is a function at ${fmtRange(rangeOf(fnAssigned))}\n    read it:          ${showCmd(fnAssigned)}`);
    }
    console.log('');
    continue;
  }
  console.log(`    where:            ${fileOf(n)} ${fmtRange(rangeOf(n))}`);
  if (fn) console.log(`    inside function:  ${fmtRange(rangeOf(fn))}   (node ${fn.node_id.slice(0, 22)}…)`);
  if (fn) {
    // REA doesn't record which function is nested in which, so work it out from the ranges.
    const fr = rangeOf(fn);
    const key = (r) => r.start.line * 1e7 + r.start.column;
    const endKey = (r) => r.end.line * 1e7 + r.end.column;
    const outer = functions
      .filter((f) => f !== fn && fileOf(f) === fileOf(fn) && rangeOf(f) && key(rangeOf(f)) <= key(fr) && endKey(rangeOf(f)) >= endKey(fr))
      .sort((a, b) => (endKey(rangeOf(a)) - key(rangeOf(a))) - (endKey(rangeOf(b)) - key(rangeOf(b))))
      .slice(0, 2);
    if (outer.length) console.log(`    which is inside:  ${outer.map((f) => fmtRange(rangeOf(f))).join('  then  ')}   (bigger = outer)`);
  }
  const evt = n.properties?.event_name;
  if (evt) console.log(`    event name:       ${evt}`);
  if (fn) console.log(`    read it:          ${showCmd(fn)}`);
  else if (rangeOf(n)) console.log(`    read it:          ${showCmd(n)}`);
  console.log('');
}
if (unique.length > opts.limit) console.log(`... ${unique.length - opts.limit} more. Narrow it with --kind or --file, or raise --limit.`);
