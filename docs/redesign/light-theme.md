# Light theme redesign — Chrome-style neutrals (BUJO-197)

The previous light theme was Catppuccin **Latte**: warm, low-contrast pastels
(`#eff1f5` lilac-gray base, `#8839ef` violet, muted `#4c4f69` ink). It read
washed-out and dated. This redesign replaces it with a clean, modern,
Chrome / Material-style neutral palette while leaving the dark themes (Mocha,
Neon) untouched.

## How theming works here

- Themes are CSS-custom-property palettes, not Tailwind `dark:` variants.
- The active theme is set via `<html data-theme="…">` from `src/store.tsx`
  (`mocha` = dark default, `latte` = light, `neon`, and `system` which follows
  `prefers-color-scheme`).
- `src/index.css` defines the Mocha palette as `--color-*` tokens in `@theme`,
  with `:root[data-theme='latte']` / `[data-theme='neon']` overriding those same
  tokens. shadcn semantic aliases (`--background`, `--card`, `--border`,
  `--primary`, …) map onto the `--color-*` tokens, and Tailwind utilities
  (`bg-base`, `text-subtext0`, `border-surface2`, `bg-primary`, …) resolve to
  them. **Recoloring the `latte` token block re-skins every view** — no view
  `.tsx` edits required.

## New light palette (old → new)

Surface scale (low → high elevation):

| Token        | Role                         | Old (Latte) | New (Chrome) |
|--------------|------------------------------|-------------|--------------|
| `base`       | app background               | `#eff1f5`   | `#f8f9fa`    |
| `mantle`     | elevated card / popover      | `#e6e9ef`   | `#ffffff`    |
| `crust`      | recessed wells / deepest fill| `#dce0e8`   | `#f1f3f4`    |

Neutral fills → dividers:

| Token      | Role                                   | Old       | New       |
|------------|----------------------------------------|-----------|-----------|
| `surface0` | subtle fill (muted/secondary, input bg)| `#ccd0da` | `#f1f3f4` |
| `surface1` | hover fill / accent bg                  | `#bcc0cc` | `#e8eaed` |
| `surface2` | dividers, control outlines              | `#acb0be` | `#dadce0` |

Text / overlay scale:

| Token      | Role                       | Old       | New       |
|------------|----------------------------|-----------|-----------|
| `text`     | primary ink                | `#4c4f69` | `#202124` |
| `subtext1` | strong secondary text      | `#5c5f77` | `#3c4043` |
| `subtext0` | muted text                 | `#6c6f85` | `#5f6368` |
| `overlay0` | muted text / faint lines   | `#9ca0b0` | `#5f6368` |
| `overlay1` | faint UI                   | `#8c8fa1` | `#80868b` |
| `overlay2` | faint icons / placeholders | `#7c7f93` | `#9aa0a6` |

Accents (tuned for AA contrast on white):

| Token       | Role          | Old       | New       |
|-------------|---------------|-----------|-----------|
| `mauve`     | primary accent| `#8839ef` | `#6c4cf0` |
| `blue`      | links / info  | `#1e66f5` | `#1a73e8` (Google blue) |
| `green`     | success       | `#40a02b` | `#1e8e3e` |
| `red`       | destructive   | `#d20f39` | `#d93025` |
| `peach`     | warning       | `#fe640b` | `#e8710a` |
| `yellow`    | warning-alt   | `#df8e1d` | `#f29900` |
| `teal`/`pink`/`sapphire`/`sky`/`maroon`/`lavender` | misc chart/accent | Latte values | retuned for white |

New helper token: `--border-hairline: #e0e0e0`, also wired to the shadcn
`--border` and `--input` aliases so borders are a crisp 1px hairline distinct
from surface fills.

## Elevation overrides (light-mode only)

The dark theme's `.card-3d` / `.book` / `.press-3d` use heavy black drop-shadows
that look wrong on white. Under `[data-theme='latte']` these are overridden with:

- `.card-3d`: drop the dark gradient, add a 1px hairline border + a faint
  diffuse shadow (`rgba(60,64,67,0.08)` ≈ Material elevation 1); slightly
  stronger on `:hover`.
- `.press-3d`: soft single-layer shadow instead of the dark "lip".
- `.book`: hairline edges + a soft, light cover shadow; stacked page edges
  redrawn in white/hairline.
- `.aurora`: hero mesh dialed down to ~5–7% accent tint + 2% grain so it stays
  whisper-faint on white instead of muddy.

## Design rationale

- **Chrome / Material neutrals**: `#ffffff` / `#f8f9fa` / `#f1f3f4` surfaces match
  Google Chrome and Material's grey-50/100 — instantly reads as a modern,
  trustworthy light app rather than a pastel notebook.
- **Crisp hairlines**: a dedicated `#e0e0e0` border, separate from the fill
  scale, keeps card edges visible on white (the old fills were too close to the
  surfaces to define edges).
- **High-contrast ink**: `#202124` primary / `#5f6368` muted are Google's ink
  pair — clearly above AA on white, fixing the old washed-out `#4c4f69` text.
- **Calm accent**: a slightly desaturated violet primary plus Google blue for
  links stays legible on white without the neon pop of the old Latte violet.
- **Soft, not heavy, elevation**: cards separate via a hairline + faint diffuse
  shadow, not a dark drop-shadow — clean and flat-modern.

## Scope / files touched

- `src/index.css` — redefined `:root[data-theme='latte']` token block and added
  light-mode `.card-3d` / `.press-3d` / `.book` / `.aurora` elevation overrides.
- No view `.tsx` files changed. `src/store.tsx` / `src/App.tsx` untouched.

## Follow-ups

- View scan found only two hardcoded colors, both fine in light mode:
  `src/components/ui/button.tsx` (`text-white` on the colored destructive
  button) and `src/components/ui/dialog.tsx` (`bg-black/50` modal scrim — a
  standard light-mode overlay). No action needed.
- Chart series colors come from the retuned accent tokens; if any specific chart
  looks low-contrast on white, fine-tune the relevant `--color-*` accent here
  rather than in the chart component.
