# Desktop (Tauri v2) — BUJO-195

bujo ships as a Vite PWA. `src-tauri/` wraps that same web build in a native
[Tauri v2](https://tauri.app) shell so it runs as a desktop app — no separate
codebase, no app-source changes. The webview loads the existing Vite output and
persists data exactly as the browser does today.

## What's in `src-tauri/`

| File | Purpose |
|------|---------|
| `Cargo.toml` | Rust crate `bujo` (tauri 2, tauri-build, serde, tauri-plugin-opener). |
| `tauri.conf.json` | v2 config — `productName: bujo`, `identifier: app.bujo.journal`, `frontendDist: ../dist`, `devUrl: http://localhost:5173`, before-dev/build hooks, 1000×700 window, bundle targets `all`. |
| `src/main.rs` + `src/lib.rs` | Standard v2 boilerplate; `lib::run()` builds + runs the app. No custom commands yet. |
| `build.rs` | Runs `tauri_build::build()`. |
| `capabilities/default.json` | Permission set for the `main` window (`core:default`, `opener:default`). |
| `icons/` | Platform icons — **generated, not committed** (see below). |

## Prerequisites

- **Rust toolchain** (already installed here: `cargo 1.95`, `rustc 1.95`).
- **Tauri system deps** (Linux): webkit2gtk, libsoup, etc. See
  <https://tauri.app/start/prerequisites/>. On Rocky/Fedora roughly:
  `webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel`.
- **Tauri CLI** — added to `devDependencies` as `@tauri-apps/cli@^2`.
  Install with `npm install` (not run during scaffold; offline).
  Or run ad-hoc with `npx @tauri-apps/cli@^2 <cmd>`.

## Generate icons (required for `tauri build`)

A release build fails without platform icons. Generate them once:

```bash
npx @tauri-apps/cli icon public/icon.svg
# writes 32x32.png, 128x128.png, 128x128@2x.png, icon.icns, icon.ico into src-tauri/icons/
```

## Run

```bash
npm run tauri:dev     # tauri dev — starts `npm run dev` (Vite :5173) then opens the native window with HMR
npm run tauri:build   # tauri build — runs `npm run build`, then bundles a native installer from ../dist
```

`tauri dev` works without icons (default icon); `tauri build` needs them.

## Storage-adapter plan (future native persistence)

**Today:** the app persists entirely in the webview via browser storage
(localStorage / IndexedDB), plus the existing optional cloud sync. The Tauri shell
adds nothing here — it's the same web persistence running inside a native window.
This means the desktop build is feature-complete on day one with zero app-code changes.

**Future:** swap browser storage for native storage behind a storage interface,
without touching UI/state code:

1. Define a `StorageAdapter` interface in the web app (read/write/list/delete) — the
   web build keeps its current localStorage/IndexedDB implementation as the default.
2. In Rust (`src-tauri/src/lib.rs`), expose Tauri commands backed by **SQLite**
   (e.g. `tauri-plugin-sql` or a `rusqlite` store) and a **git-sync** command
   (commit/push the journal dir for versioned, portable backups).
3. Wire commands via `.invoke_handler(tauri::generate_handler![...])` and add the
   matching permissions to `capabilities/default.json`.
4. On the web side, detect Tauri (`window.__TAURI__`) and select the native adapter
   that calls those commands via `@tauri-apps/api`'s `invoke`; otherwise fall back
   to the browser adapter. The rest of the app is unaware which backend is active.

This keeps web and desktop on one codebase while giving desktop users a real local
database + git-versioned history.

## Current limitations

- **Icons must be generated** (`npx @tauri-apps/cli icon ...`) before `tauri build`.
- **Rust toolchain + Tauri system libraries required** to build (not needed by the
  pure web/PWA path).
- **No native commands yet** — persistence is still browser storage inside the
  webview; SQLite/git-sync is the planned next step above.
- `src-tauri/target/` and `gen/` are gitignored (build artifacts).
