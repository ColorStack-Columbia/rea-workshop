# Glossary

Terms are listed in the order you'll meet them.

**Reverse engineering (RE).** Working out how something works from the finished product,
without its original design documents. In software: understanding a program without its
readable source code.

**Source code.** The human-written version of a program, with real names and comments.

**Minifier / minification.** A tool that makes code smaller by removing spaces, line breaks
and comments. Websites do this so pages load faster. The result usually fits on one huge line.

**Mangling.** Renaming variables, functions and properties to short meaningless names
(`score` becomes `M`). Minifiers do this to save bytes. As a side effect, it makes code
much harder for humans to read.

**Target.** The program you're analyzing. Today: `targets/2048/game.min.js`.

**Static analysis.** Studying a program by reading its code *without running it*. REA's
JavaScript analysis is static: it parses the code but never executes it.

**Dynamic analysis.** Studying a program *while it runs*, e.g. watching what it does
in a debugger. We don't do this today.

**AI agent.** An AI assistant that can take actions, such as running commands, reading
files and calling tools, not just chat. Claude Code, Codex and Cursor are examples.

**MCP (Model Context Protocol).** A standard way to plug tools into an AI agent. REA comes
as an MCP **server**: once it's connected, your agent can call REA's tools directly.

**REA.** The reverse-engineering toolkit we use. It runs as a command-line program (`rea`)
and as an MCP server. Its tool names start with `rea` (for example, in Claude Code they look
like `mcp__rea__analyze_javascript_application`).

**CLI (command-line interface).** A program you run by typing a command in a terminal,
like `rea analyze-javascript-application …`.

**Evidence.** REA's word for one recorded result: what it analyzed, what it found, and
how sure it is. Each one has an ID like `ev_461a0f…` that you can cite.

**Parse / parser / AST.** To *parse* code is to turn text into a tree that describes its
structure. That tree is the **AST (abstract syntax tree)**. Every `if`, function call and
number becomes a node in the tree.

**Graph / node / relation.** REA stores what it finds as a **graph**: **nodes** (things,
like a function or the number `0.9`) connected by **relations** (facts, like "this
function reads `Math.random`").

**Literal.** A value written directly in the code: `0.9`, `2048`, `"You win!"`. Mangling
can't rename literals, so they're great clues.

**Call site.** A place in the code where a function is called, e.g. `Math.random()`.

**Property.** A named slot on an object, like `this.score`. With property mangling turned
on, property names become letters too (`this.M`).

**Source range / location.** Where something is in a file, written `LINE:COLUMN-LINE:COLUMN`.
REA counts lines from 1 and columns from 0. `1:8131-1:8230` is line 1, columns 8131 to 8230.

**Prototype method.** In older JavaScript, `Thing.prototype.move = function () {…}`
attaches a method `move` to every `Thing` object. 2048 is written this way.

**Seed / seeded random number generator (PRNG).** A *pseudo-random number generator*
produces numbers that look random, but come from a formula. Start it with the same
**seed** and you get the same sequence every time. That makes randomness testable.

**Reconstruction.** Rewriting a piece of a program from your understanding of it, then
checking that it behaves exactly the same as the original.

**Electron.** A framework for building desktop apps with web technology (HTML/JS).
VS Code, Slack and the Hyper terminal are Electron apps.

**Main process / renderer process.** An Electron app has one **main process** (Node.js,
which can touch files and start programs) and one or more **renderer processes** (the web
pages you see in its windows).

**IPC (inter-process communication).** How separate processes send each other messages.
In Electron, the renderer and main process talk over named **channels**.

**ASAR.** Electron's archive format, a bit like a `.zip` without compression. An app's
code usually ships inside `app.asar`.

**Integrity hash.** A fingerprint (e.g. SHA-256) of a file's exact bytes. If the file
changes, the fingerprint changes. Electron archives record these so tampering can be detected.

**Native addon / `.node` file.** Compiled machine code (usually C/C++) that a Node.js
app loads, like `node-pty`, which Hyper uses to start your shell.

**Source map (`.map` file).** A file that maps minified code back to the original source.
If an app ships these, reverse engineering gets much easier.

**Prompt injection.** Text hidden inside a target (a string in the code, a web page)
that tries to give your AI agent instructions. Treat everything that comes *out of* a
target as data, never as commands. REA marks such content as untrusted.
