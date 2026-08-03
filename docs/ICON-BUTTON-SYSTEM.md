# Icon and button system — spec + Stage 0 audit

**Status:** Stage 0 complete, awaiting go-ahead before Stage 1 (install).
**Scope:** visual and interaction only. No data models, storage, routing or
business logic changes. Every feature must work identically at the end.

## Decisions (settled, not up for relitigation)

1. **Icons: Phosphor** (`@phosphor-icons/react`). Active state is a **weight
   change** (`regular` → `duotone`), never a colour change.
2. **The one loud button per screen is tonal** — accent wash background, accent
   text, no border. There is no solid-fill accent button anywhere in this app.
3. **Buttons and controls are shadcn/ui**, with variants rewritten to this spec.

1 and 2 exist together because the app has accent inflation: purple appears on
the primary button, the active nav item, active icons and status pills at the
same time. Duotone icons and tonal buttons express emphasis without another
saturated purple surface, so the accent stops competing with itself.

## Verification rule — all five themes, every stage

**Every stage is verified in all five themes: mocha, latte, neon, vscode,
dawn.** Not mocha plus a spot check. A screenshot set is not complete until all
five are in it, and a stage is not done until all five pass.

This is not ceremony. Three of the five themes redefine the accent
(`--color-mauve` is `#cba6f7` in mocha, `#6c4cf0` in latte, `#c77dff` in neon,
`#c586c0` in vscode, `#b45309` — an amber — in dawn), two invert the surface
polarity, and dawn deliberately renders **two** text tiers where the others
render three. A wash that reads correctly on near-black can vanish on cream, and
an icon weight that reads as "active" on a dark surface can read as "disabled"
on a light one. Anything checked in mocha alone is unchecked.

Per stage, the five-theme check means:

| Stage | What gets checked in all five |
|---|---|
| 1 | Every shadcn surface flips with the theme; `--accent-wash` is visible against `--ink-1`; `--fg-3` clears 4.5:1 |
| 2 | Sidebar with one item active — duotone reads as active, regular as rest |
| 3 | All four button variants at rest / hover / active / disabled |
| 4 | The kitchen sink at font-scale min, default and max |
| 5 | Each cluster, per view |
| 6 | Focus rings visible on every stop |

## Stage 0 audit — what the codebase actually is

Several of the spec's assumptions are already satisfied, and two are inverted.
Read this before Stage 1.

### 1 · Routes — 24, not "roughly 25"

`VIEWS` in `src/App.tsx` maps 24 ids. 21 appear in the sidebar (2 of those are
settings-gated: `cycle`, `nofap`); `gym` is an alias that renders
`FitnessHub` on its strength tab; `account`, `help` and `kitchen-sink` are
reachable but not nav rows. 26 files in `src/views/`.

| Group | Views |
|---|---|
| Journal | today, plan |
| Fitness | fitness (FitnessHub), gym (alias), pullups, homeworkout |
| Sports | pickleball, coaching |
| Habits | trackers, challenges, focus |
| Wellbeing | mindset, cycle*, nofap* |
| Library | collections, reading, monthly, goals |
| Review | insights, stats |
| System | help, settings, account |
| Dev | kitchen-sink |

\* settings-gated.

### 2 · Existing button-like components

| Component | File | Disposition |
|---|---|---|
| `Button` (shadcn, cva) | `components/ui/button.tsx` | Keep the file, rewrite variants |
| `Pill` | `components/ui.tsx` | Keep — just consolidated to one implementation (tone × size) |
| `Segmented` | `components/ui.tsx` | Rebuild on shadcn `ToggleGroup` |
| `Stepper` | `components/fields/Stepper.tsx` | Rebuild on `ToggleGroup` / paired icon buttons |
| `EmojiScale` | `components/fields/EmojiScale.tsx` | Decide: keep as a scale input or fold into `ToggleGroup` |
| `StatTile` | `components/ui.tsx` | Becomes a button when `onClick` is passed — must adopt button tokens |
| `CollapsibleSection` | `components/CollapsibleSection.tsx` | Header is a raw button; adopt `ghost` |
| `Kbd` | `components/Kbd.tsx` | Not a control, leave |
| ~175 raw `<button>` | across views | Judged per site — most are row/card click surfaces and stay raw |

There is no `IconButton`, `Chip`, `Tab` or `SegmentScale` component; icon
buttons are `Button size="icon-sm"`, chips are hand-rolled, tabs are
`ToggleGroup`-shaped hand-rolled buttons in `FitnessHub`.

### 3 · Control heights and radii today

Heights, from class scan: `h-6` ×11, `h-7` ×9, `h-8` ×9, `h-9` ×7, `h-12` ×4,
plus `size-4`/`size-3` icon boxes. The `Button` cva itself defines **eight**
sizes (`default` 36, `xs` 24, `sm` 32, `lg` 40, `icon` 36, `icon-xs` 24,
`icon-sm` 32, `icon-lg` 40). Target is three: **28 / 36 / 44**, with one 44 for
a single empty-state CTA. Every current size is off-target — this is a real
migration, not a rename.

Radii: `rounded-lg` ×224, `rounded-full` ×141, `rounded-xl` ×38, `rounded-md`
×33, `rounded-2xl` ×22, `rounded-t` ×12, `rounded-sm` ×8, `rounded-xs` ×2,
`rounded-r` ×1, `rounded-none` ×1. Target is three tokens:
`--r-control`, `--r-card`, `--r-pill`. None of those tokens exist yet.

### 4 · Icons today

- **Library:** `lucide-react`, imported directly in **85 files** (88 import
  statements). No wrapper component exists.
- **Sizes:** 16 distinct px values — `size={14}` ×112, `18` ×64, `16` ×60,
  `15` ×57, `13` ×47, `12` ×32, `11` ×19, `20` ×7, `10` ×7, `22` ×3, `17` ×3,
  `30` ×2, `28` ×2, `9`, `26`, `48` ×1 each. All **px**, so none of them track
  the font-scale accessibility control.
- **Inline SVG:** 13 sites (progress rings, sparklines, the muscle map) — these
  are figures, not icons, and stay.
- **Emoji:** 235 emoji characters across 52 files. Most are *data*, not chrome —
  weather codes, exercise names, achievement badges, habit emoji the user
  picks, stickers. Chrome emoji (`FeedbackButton`, `EmojiScale`, a few inline
  markers) are the ones in scope.
- **The bullet glyph column** (`· × — ›`) is typographic and stays typographic.

### 5 · Themes — five, all on `:root[data-theme=…]`

Defined in `src/index.css`. Mocha is the base `:root` block; `latte`, `neon`,
`vscode`, `dawn` each override under `:root[data-theme='…']`, and the attribute
is set on `document.documentElement`.

**The Stage 1 hazard does not apply here.** The themes already redefine their
variables on `:root` itself, so a `:root` bridge resolves correctly and theme
switching works for shadcn components.

Each theme defines: the 14 Catppuccin accent slots, 6 text/overlay tiers, 6
surface tiers, `--fg-3`, and (in latte/vscode/dawn) `--border-hairline` plus
`--border`/`--input` overrides.

### 6 · The bridge already exists — and runs the other way

Spec assumes shadcn variables must be created as aliases of theme variables.
In this codebase it is the reverse and already done:

- `src/index.css` `:root` defines shadcn's `--background`, `--foreground`,
  `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`,
  `--destructive`, `--border`, `--input`, `--ring`, `--radius` **from** the
  Catppuccin palette.
- `src/styles/tokens.css` (`@theme`) defines the purpose layer **from** those:
  `--color-ink-0..3`, `--color-line`, `--color-line-strong`,
  `--color-fg-1..3`, `--color-brand`, `--color-brand-wash`.

So the spec's `--ink-0` / `--text-1` / `--line` / `--accent` names map onto
existing tokens rather than needing new ones:

| Spec name | This codebase |
|---|---|
| `--ink-0` / `--ink-1` / `--ink-2` / `--ink-3` | `--color-ink-0..3` (exists) |
| `--text-1` / `--text-2` / `--text-3` | `--color-fg-1` / `-fg-2` / `-fg-3` (exists) |
| `--line` / `--line-strong` | `--color-line` / `--color-line-strong` (exists) |
| `--accent` | `--color-brand` (exists) |
| `--accent-wash` | `--color-brand-wash` — exists, `color-mix(srgb, primary 16%)` |
| `--accent-wash-hover` | **missing**, to add |
| `--danger` / `--bg-danger` | `--color-red` / **missing wash**, to add |
| `--r-control` / `--r-card` / `--r-pill` | **all missing**, to add |
| `--h-control` | **missing**, to add |

Writing a second `shadcn-bridge.css` on top of this would create two competing
definitions of the same variables. **Recommendation: extend the existing
token layer instead**, adding only what is missing.

### 7 · Tailwind v4, no config file, TypeScript

`tailwindcss@^4.3.0` via `@tailwindcss/vite`. There is **no `tailwind.config`**
— v4 scans automatically and the theme lives in `@theme` blocks in CSS, so the
"content globs cover all views" question does not apply. Project is `.tsx`
throughout; **zero `.jsx` files**, so shadcn installs with TypeScript, not
`tsx: false`.

Trap worth repeating: **Tailwind v4 does not fail the build on a stale utility
class.** It exits 0 and emits nothing, and the element silently inherits. Any
class rename must migrate call sites first, with a grep as the gate.

### 8 · `--text-3` contrast — already passing in all five

`--fg-3` per theme, measured against the page (`--ink-0`) and the card
(`--ink-1`):

| Theme | `--fg-3` | vs page | vs card | Verdict |
|---|---|---|---|---|
| mocha | `#9399b2` (overlay2) | 6.14:1 | 6.50:1 | pass |
| latte | `#6b7075` | 4.74:1 | 5.00:1 | pass |
| neon | `#8585b8` (overlay2) | 5.66:1 | 5.57:1 | pass |
| vscode | `#9d9d9d` (overlay2) | 6.08:1 | 6.55:1 | pass |
| dawn | `#6f6354` (= subtext0) | 5.31:1 | 5.76:1 | pass, but it is the **secondary** tier |

Stage 1's "raise `--text-3` until it clears 4.5:1" is **already done** — it
landed in the earlier contrast pass. Dawn is the exception worth knowing about:
its cream surfaces leave a band one step wide between subtext0 and the floor,
so the third tier was deliberately collapsed into the second. Dawn renders two
text tiers, not three.

### 9 · Accent inflation — measured

`variant="secondary"` ×125, `ghost` ×62, `outline` ×11, `link` ×11,
**`default` (solid accent fill) ×8 explicit + 29 implicit** (a bare `<Button>`
with no variant defaults to `default`). Those **37 solid-accent buttons** are
what decision 2 deletes.

## Open questions for Stage 1

1. **Bridge approach.** Recommend extending `src/styles/tokens.css` +
   `src/index.css` rather than adding `shadcn-bridge.css`, because the bridge
   already exists in the opposite direction and duplicating it would give the
   same variables two definitions. Needs a yes.
2. **`--accent-wash` derivation.** Existing `--color-brand-wash` is
   `color-mix(in srgb, var(--primary) 16%, transparent)`; the spec asks for
   `oklab` at 14% plus a 20% hover. Recommend moving to oklab and adding the
   hover step, then re-checking visibility of the wash in **all five** themes —
   dawn's amber and vscode's muted purple are the two at risk.
3. **Lucide → Phosphor is 85 files.** Every icon in the app changes shape.
   Confirm that is wanted, since it is the single largest diff in this plan and
   is not reversible cheaply.
4. **Icon map coverage.** The map names 23 surfaces; this app has 24 routes and
   many more icon sites (badges, states, empty states, chart legends). Choices
   for everything unlisted get reported for review in Stage 2.
