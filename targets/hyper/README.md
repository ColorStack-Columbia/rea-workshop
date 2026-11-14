# Hyper 3.4.1 (optional, used only in step 07)

Hyper isn't stored in this repo. You analyze a copy installed on your own computer.
REA only *reads* the app; it doesn't change or run it.

**Version matters:** the demo was written for **3.4.1**, the current stable release.
Hyper's GitHub `main` branch is a newer canary (4.0.0-canary), so its line numbers won't match.

## Get it

- **macOS:** `brew install --cask hyper`, or download 3.4.1 from https://hyper.is
  Then the archive is at `/Applications/Hyper.app/Contents/Resources/app.asar`
- **Windows / Linux:** install 3.4.1 from https://hyper.is and find `resources/app.asar`
  inside the install folder.

Check the version: Hyper menu → About Hyper, or on macOS:
`defaults read /Applications/Hyper.app/Contents/Info CFBundleShortVersionString`

## License

MIT, Copyright (c) 2018 Vercel, Inc. Full text in [LICENSE](LICENSE).
