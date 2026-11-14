#!/usr/bin/env node
// One-command environment check for the workshop.
//
//   node scripts/check-env.mjs                 # basic checks
//   node scripts/check-env.mjs --agent claude_code   # also ask REA whether your agent is connected
//
// This script NEVER installs or changes anything. When something is missing it prints
// the exact command for YOU to run.

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REA_TESTED_VERSION = '6.9.0';
const TARGET_SHA256 = '6fc5b9e5d22586c011566da4f866650ee524bb666e9029a3d2e6607ab6b26fc8';
const HYPER_PATH = '/Applications/Hyper.app/Contents/Resources/app.asar';
const AGENTS = ['claude_code', 'claude_desktop', 'codex', 'cursor', 'gemini_cli', 'windsurf', 'opencode', 'copilot_cli', 'vscode'];

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const agentIdx = argv.indexOf('--agent');
const agent = agentIdx >= 0 ? argv[agentIdx + 1] : null;

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const OK = paint('32', 'OK  ');
const BAD = paint('31', 'FIX ');
const WARN = paint('33', 'NOTE');
let problems = 0;

function report(ok, label, detail, fix) {
  console.log(`${ok === true ? OK : ok === 'warn' ? WARN : BAD} ${label}${detail ? `: ${detail}` : ''}`);
  if (ok !== true && fix) for (const line of [].concat(fix)) console.log(`       ${line}`);
  if (ok === false) problems++;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', timeout: 60000 });
  return { ok: r.status === 0, stdout: (r.stdout || '').trim(), out: `${r.stdout || ''}${r.stderr || ''}`.trim(), error: r.error };
}

function cmpVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

console.log('REA workshop environment check (nothing will be installed or changed)\n');

// 1. Node.js -------------------------------------------------------------------
{
  const v = process.versions.node;
  const major = Number(v.split('.')[0]);
  const min = { 22: '22.23.4', 24: '24.22.1' }[major] || (major >= 26 ? '26.12.1' : null);
  const ok = min !== null && cmpVersion(v, min) >= 0 && (major === 22 || major === 24 || major >= 26);
  report(ok, 'Node.js', `v${v}`, [
    'REA needs Node 22 (>=22.23.4), 24 (>=24.22.1) or 26+ (>=26.12.1).',
    'Install a current LTS from the official Node.js website, or with a version manager, e.g.:',
    '  nvm install 24 && nvm use 24',
  ]);
}

// 2. git -----------------------------------------------------------------------
{
  const r = run('git', ['--version']);
  report(r.ok, 'git', r.ok ? r.out.replace('git version ', '') : 'not found', 'Install git (macOS: xcode-select --install).');
}

// 3. REA command line ----------------------------------------------------------
let reaCmd = null;
{
  const r = run('rea', ['--version']);
  if (r.ok) {
    reaCmd = 'rea';
    const v = r.out.split('\n')[0].trim();
    report(true, 'REA command line (rea)', v);
    if (v !== REA_TESTED_VERSION) {
      report('warn', 'REA version', `${v} (workshop was tested with ${REA_TESTED_VERSION})`, 'It will probably work. If something looks different from the step READMEs, that is why.');
    }
  } else {
    const n = run('npx', ['--no-install', 'rea-agents', '--version']);
    if (n.ok) {
      reaCmd = 'npx rea-agents';
      report(true, 'REA command line (via npx)', n.out.split('\n')[0]);
    } else {
      report(false, 'REA command line', 'not found', [
        'You can use REA without installing it globally. Run it through npx (downloads into npm\'s cache):',
        `  npx -y rea-agents@${REA_TESTED_VERSION} --help`,
        `Then use "npx -y rea-agents@${REA_TESTED_VERSION}" wherever the steps say "rea".`,
      ]);
    }
  }
}

// 4. Workshop files ------------------------------------------------------------
{
  const target = path.join(repo, 'targets/2048/game.min.js');
  if (!fs.existsSync(target)) {
    report(false, 'Workshop target', 'targets/2048/game.min.js is missing', 'Re-clone the repo.');
  } else {
    const sha = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    report(sha === TARGET_SHA256, 'Workshop target (targets/2048/game.min.js)', sha === TARGET_SHA256 ? 'unchanged' : 'has been modified',
      'Restore it with: git checkout -- targets/2048/game.min.js');
  }
  for (const f of ['scripts/show-code.mjs', 'scripts/rea-find.mjs', 'steps/06-rebuild-the-spawn/test.js', 'steps/06-rebuild-the-spawn/spawn-cases.json']) {
    if (!fs.existsSync(path.join(repo, f))) report(false, f, 'missing', 'Re-clone the repo.');
  }
  fs.mkdirSync(path.join(repo, 'work'), { recursive: true });
}

// 5. Can REA actually analyze something? (fast: ~2 seconds) ----------------------
if (reaCmd) {
  const [cmd, ...pre] = reaCmd.split(' ');
  const t0 = Date.now();
  const r = run(cmd, [...pre, 'analyze-javascript-application', path.join(repo, 'targets/2048'), '--detail', 'summary',
    '--evidence_output', path.join(repo, 'work', `.check-${Date.now()}.json`), '--json']);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  let parsed = false;
  try { parsed = !!JSON.parse(r.stdout); } catch { /* ignore */ }
  report(r.ok && parsed, 'REA test analysis of targets/2048', r.ok ? `worked in ${secs}s` : 'failed',
    ['Copy the error above into the TROUBLESHOOTING.md search, or ask a facilitator.', r.out.split('\n').slice(-3).join('\n       ')]);
  for (const f of fs.readdirSync(path.join(repo, 'work'))) if (f.startsWith('.check-')) fs.rmSync(path.join(repo, 'work', f), { force: true });
}

// 6. Is REA connected to your AI agent? ------------------------------------------
if (agent) {
  if (!AGENTS.includes(agent)) {
    report(false, 'Agent name', `"${agent}" is not one of: ${AGENTS.join(', ')}`);
  } else if (!reaCmd) {
    report(false, `REA connection to ${agent}`, 'cannot check without the REA command line (see above)');
  } else {
    const [cmd, ...pre] = reaCmd.split(' ');
    const r = run(cmd, [...pre, 'doctor', '--client', agent, '--json']);
    let doc = null;
    try { doc = JSON.parse(r.stdout); } catch { /* ignore */ }
    const reg = doc?.scope_checks?.find((c) => c.name === `registration:${agent}`);
    if (reg?.ok) {
      report(true, `REA registered with ${agent}`, reg.detail || 'yes');
    } else if (reg?.classification === 'config_drift') {
      report('warn', `REA registered with ${agent}`, 'yes, but for a different REA version than your command line', [
        'This usually still works. To line them up, preview and then apply:',
        `  npx -y rea-agents@${REA_TESTED_VERSION} setup --client ${agent} --dry-run`,
        `  npx -y rea-agents@${REA_TESTED_VERSION} setup --client ${agent} --yes   (then restart your agent)`,
        reg.remediation ? `REA says: ${reg.remediation}` : '',
      ].filter(Boolean));
    } else {
      report(false, `REA registered with ${agent}`, reg ? reg.classification : 'could not tell', [
        'Preview what setup would change (safe, changes nothing):',
        `  npx -y rea-agents@${REA_TESTED_VERSION} setup --client ${agent} --dry-run`,
        'If the preview looks right, apply it and then RESTART your agent:',
        `  npx -y rea-agents@${REA_TESTED_VERSION} setup --client ${agent} --yes`,
        reg?.remediation ? `REA says: ${reg.remediation}` : '',
      ].filter(Boolean));
    }
    console.log(`       (REA may also list "missing_analysis_engine" items like Hopper or Ghidra. Those are for native apps; you do NOT need them today.)`);
  }
} else {
  report('warn', 'Agent connection not checked', 'add --agent <name> to check, e.g.', `node scripts/check-env.mjs --agent claude_code   (names: ${AGENTS.join(', ')})`);
}

// 7. Optional: Hyper for the step-07 demo ----------------------------------------
{
  if (process.platform === 'darwin' && fs.existsSync(HYPER_PATH)) {
    const plist = run('defaults', ['read', '/Applications/Hyper.app/Contents/Info', 'CFBundleShortVersionString']);
    const v = plist.ok ? plist.out : 'unknown version';
    report(v === '3.4.1' ? true : 'warn', 'Hyper (optional, step 07 only)', v, v === '3.4.1' ? null : 'The demo was written for 3.4.1. Other versions work, but line numbers will differ.');
  } else {
    report('warn', 'Hyper (optional, step 07 only)', 'not found', 'Skip this unless your facilitator runs step 07 with you. See targets/hyper/README.md.');
  }
}

console.log('');
if (problems === 0) {
  console.log(paint('32', 'All required checks passed. Go to steps/01-setup/README.md'));
} else {
  console.log(paint('31', `${problems} thing(s) to fix. Run the FIX commands above, then run this check again.`));
  process.exit(1);
}
