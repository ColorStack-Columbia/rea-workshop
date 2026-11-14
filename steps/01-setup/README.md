# Step 01: Setup (10 min)

## The idea

Your **AI agent** (an AI assistant that can run commands and use tools) doesn't know about
REA until you connect them. REA plugs in through **MCP (Model Context Protocol)**, a
standard way to give an agent extra tools. Once connected, the agent can call REA's tools
like `analyze_javascript_application` by itself.

You'll do three things:
1. Check that your computer has what the workshop needs.
2. Connect REA to your agent (only if it isn't already).
3. Ask your agent to prove it can see REA.

## 1. Run the environment check

From the repo folder:

```bash
node scripts/check-env.mjs --agent claude_code
```

Replace `claude_code` with your agent: `codex`, `cursor`, `gemini_cli`, `windsurf`,
`opencode`, `copilot_cli`, `vscode`, `claude_desktop`.

The script **never installs anything**. Each line says `OK`, `NOTE` (fine, just FYI) or
`FIX`. Every `FIX` line comes with the command to run.

## 2. Connect REA to your agent (skip if the check said "REA registered … OK")

First, **preview** what REA's setup would change. This is safe: `--dry-run` means
"show me, don't do it".

```bash
npx -y rea-agents@6.9.0 setup --client claude_code --dry-run
```

Read the output. It lists the config file it will edit (for Claude Code, `~/.claude.json`)
and the backup it will make. If that looks fine, apply it:

```bash
npx -y rea-agents@6.9.0 setup --client claude_code --yes
```

Then **fully quit and restart your agent**. A running agent only loads its tools at startup.

> `npx` downloads REA into npm's cache and runs it. Nothing gets installed globally.
> Don't add `--install-hopper`: Hopper is a tool for native apps, and we don't need it.

## 3. Prompt: confirm your agent can see REA

Start your agent **inside this repo folder** and paste:

```text
I'm doing a reverse-engineering workshop in this repository.
Please list the REA MCP tools you can see (tool names containing "rea").
Just list the names. Don't run any of them yet.
Then tell me whether "analyze_javascript_application" is among them.
Do not open the answer-key branch or any folder named answer-key.
```

## What you should see

A long list (REA has 200+ tools) that includes `analyze_javascript_application`.
In Claude Code the full name looks like `mcp__rea__analyze_javascript_application`.

## Also: play the game

Open `targets/2048/index.html` in a web browser. On macOS you can run
`open targets/2048/index.html`. Use the arrow keys to slide tiles. Two equal tiles merge
into one. Play for a minute. While you play, keep these questions in mind:
- Where do new tiles show up? Is it always a 2?
- How much does the score go up when tiles merge?
- What happens if you refresh the page? Is the "BEST" score still there?

## Hints

<details><summary>The agent says it has no REA tools</summary>

1. Did you restart the agent *after* running setup? Quit it fully, then start it again.
2. Run `node scripts/check-env.mjs --agent <your agent>` again. Does it say "registered OK"?
3. Still stuck? Run `rea doctor --client <your agent>` (or `npx -y rea-agents@6.9.0 doctor --client <your agent>`)
   and show the output to a facilitator. Also see [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md).
4. You can still do the whole workshop without MCP: every step has a **No MCP?** section that
   uses the `rea` command line instead.
</details>

<details><summary>The check says "missing_analysis_engine" for Hopper / Ghidra / IDA / JADX</summary>

Ignore those. They're engines for analyzing compiled native apps and Android apps.
JavaScript analysis doesn't need any of them.
</details>

## Check yourself

- What does `--dry-run` do, and why is it a good habit to run it before `--yes`?
- In one sentence: what is MCP?
