# Step 07 (optional demo): a real desktop app (10 min)

This step is a **demo**, usually run by the facilitator on the projector. It shows what
changes when the target is a full desktop app instead of one small file.

**Target:** [Hyper](https://github.com/vercel/hyper), a terminal app (MIT license, see
[`targets/hyper/LICENSE`](../../targets/hyper/LICENSE)), **version 3.4.1**. Hyper is built
with **Electron**, a framework for desktop apps made from web technology. An Electron app
has a **main process** (Node.js: can start programs and read files) and **renderer
processes** (the web pages in its windows). Its code ships in an **ASAR** archive called
`app.asar`, a bit like a `.zip`.

See [`targets/hyper/README.md`](../../targets/hyper/README.md) for how to get Hyper 3.4.1.
The repo doesn't include it.

## Two things you need to know first

### 1. The "integrity mismatch" error is expected

The first time you analyze Hyper, REA stops with:

```text
artifact_integrity_mismatch: Declared ASAR integrity for unpacked entry
node_modules/native-process-working-directory/build/Release/native-process-working-directory.node
contradicts its companion file ...
```

**What it means:** `app.asar` records an **integrity hash** (a fingerprint of the file's
exact bytes) for every file. A few files are **native addons** (`.node` files of compiled
C/C++), which are stored *next to* the archive instead of inside it. After the archive was
built, Hyper's release process **code-signed** that native file for macOS, which changed its
bytes, so the fingerprint no longer matches. Nobody tampered with anything. It's a normal side
effect of how apps get packaged.

REA stops anyway, because it can't tell "signed after packaging" from "modified by
someone". It's being careful on purpose. You tell it to continue and to **mark those
bytes as untrusted**:

- MCP: `integrity_policy: "record-and-continue"`
- CLI: `--integrity-policy record-and-continue`

### 2. Analyze only the app's own files, or wait 5 minutes

Hyper's archive has about 2,200 files, most of them third-party libraries in `node_modules`.
Analyzing everything took **4 min 36 s** and produced a **246 MB** result in our test run.
If you list just the files you care about (`source_paths`), it takes **about 5 seconds**.

## Prompt

```text
We are doing a static-analysis demo on the Hyper terminal app, version 3.4.1 (MIT licensed).
Target: /Applications/Hyper.app/Contents/Resources/app.asar
(if the facilitator gave a different path to an app.asar, use that).

1. Call the REA MCP tool analyze_javascript_application with:
   - input_path: the app.asar path
   - integrity_policy: "record-and-continue"
     (explain to me in two sentences why REA needs this for this app)
   - detail: "summary"
   - source_paths: ["package.json","index.js","session.js","rpc.js","config.js","plugins.js",
     "ui/window.js","config/paths.js","config/import.js","config/init.js","plugins/install.js",
     "commands.js"]
   Tell me how long it took and how many files were parsed.
2. Question A: How does the main process create a terminal session, and what actually starts
   the shell? Hints: REA records a call that loads the native module "node-pty", and event
   listeners in ui/window.js such as rpc.on('new').
3. Question B: How is the config file located, loaded, and hot-reloaded (reloaded
   automatically when you save it)? Hint: REA records a "change" listener in config.js.
To read code at a REA location inside the archive, run:
   node scripts/show-code.mjs "<app.asar path>::<file inside, e.g. session.js>" <line:col-line:col>
Cite REA locations for every claim, explain for a first-year CS student, and do not
answer from memory or from the Hyper source on GitHub.
```

## No MCP? Command line

```bash
rea analyze-javascript-application /Applications/Hyper.app/Contents/Resources/app.asar \
  --integrity-policy record-and-continue \
  --source-paths-json steps/07-optional-hyper-demo/source-paths.json \
  --json > work/hyper-analysis.json
node scripts/rea-find.mjs work/hyper-analysis.json node-pty
node scripts/rea-find.mjs work/hyper-analysis.json change --kind listener
```

## What you should see

- ~5 seconds, 12 files parsed (out of ~2,200 in the archive).
- Hyper's code is **not** minified. It's compiler output with comments, and the archive even
  ships **source maps** (`.map` files that map shipped code back to the original source). Real
  apps often make reverse engineering easier than you'd expect.

## Discussion: where static analysis falls short

Ask: *"Which channels does the window (renderer) use to talk to the main process?"*

Electron processes talk through **IPC (inter-process communication)**: named message
channels. REA has an IPC summary, but in our test run it **missed most of Hyper's real
channels**:
- Hyper creates **one channel per window, named with a random ID** made at run time
  (`ipcMain.on(uid, …)`). A static tool can only see "some variable", not the name.
  Dozens of different messages (`new`, `resize`, `session data` …) travel *inside* that one
  channel, as fields of the message.
- The renderer code is a single minified **bundle** (`renderer/bundle.js`). REA didn't
  attribute any of its IPC calls to it.
- Messages sent with `webContents.send('config change')` weren't counted as channels.

REA **did** record the message names as ordinary event listeners (`rpc.on('new')` …). So
the facts are there, just not where the IPC summary would lead you.

**Lesson:** a tool's summary is a starting point, not a final answer. Names built at run
time are where static analysis is weakest. That's when you'd switch to **dynamic analysis**,
watching the app while it runs.
