# App icons

Tauri needs platform icon files (referenced by `bundle.icon` in `tauri.conf.json`):

```
icons/
  32x32.png
  128x128.png
  128x128@2x.png
  icon.icns   # macOS
  icon.ico    # Windows
```

These are **not committed** — generate them from the app's source icon with the
Tauri CLI. From the repo root:

```bash
npx @tauri-apps/cli icon public/icon.svg
# or, if you have a high-res PNG (1024x1024 recommended):
npx @tauri-apps/cli icon path/to/source.png
```

This writes the full icon set into `src-tauri/icons/`. Until you run it, a release
`tauri build` will fail on missing icons — `tauri dev` may still work but the window
will use a default icon.

Source candidates already in the repo: `public/icon.svg`, `public/favicon.svg`.
