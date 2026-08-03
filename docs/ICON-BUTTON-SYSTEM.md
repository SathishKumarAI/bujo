# Icon and button system — spec, audit, stage log

**Status:** Stages 0–4 and the mechanical half of 6 are complete. Stage 5
(per-cluster copy and layout rollout) and the judgement half of 6 (hex literals,
ToggleGroup rebuilds) remain — see "What the sweep did not clear".
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

## Stage 1 — done. Token extension, not a second bridge

**Approach taken: extend the existing token layer.** No `shadcn-bridge.css`.
The bridge already runs Catppuccin → shadcn → purpose tokens, and a second file
redefining `--background` / `--card` / `--border` would have given every one of
them two definitions with the winner decided by import order. Everything new
went into the layer that already exists: `src/index.css` for per-theme raw
values, `src/styles/tokens.css` for what those values are *for*.

**shadcn additions:** `toggle-group`, `toggle`, `command` (button, tooltip,
dialog, dropdown-menu were already installed). `cmdk` is a new dependency.
The CLI could not resolve the `@` alias — the root tsconfig is solution-style
with no `paths` — so it wrote into a literal `@/` directory at the repo root;
the wanted files were copied into `src/components/ui/` by hand and `@/` is now
gitignored and eslint-ignored as a reference copy. Its stock `dialog.tsx` was
**not** adopted: this app's dialog is customised.

### Tokens added

| Token | Value | Why |
|---|---|---|
| `--color-brand-wash` | `color-mix(in oklab, primary 14%, transparent)` | was srgb 16%; oklab keeps the hue instead of dragging the mix toward grey |
| `--color-brand-wash-hover` | same at 20% | the tonal button needs a hover step that is not a colour change |
| `--color-danger-wash` / `-hover` | destructive at 14% / 20% | so `danger` is the same shape in a different colour, not a different system |
| `--color-brand-text` | per theme | the accent as *text* is not the accent as a *surface* — see below |
| `--color-danger-text` | per theme | same, for destructive |
| `--radius-control` / `-card` / `-pill` | 8px / 14px / pill | replaces ten radii in circulation |
| `--h-control-sm` / `--h-control` / `-lg` | 1.75 / 2.25 / 2.75rem | 28 / 36 / 44, in rem so they track the font-scale control |

### The finding that changed the plan

A tonal primary button puts the accent **as text** on the accent **as a wash**.
Measured on the real rendered surfaces, that pairing failed AA in two themes,
and the destructive equivalent failed in three:

| Theme | accent on wash (before) | after | destructive on wash (before) | after |
|---|---|---|---|---|
| mocha | 7.00 ✅ | unchanged | 6.28 ✅ | unchanged |
| latte | **4.39 ❌** | 5.94 (`#5733db`) | **3.87 ❌** | 5.32 (`#b2271e`) |
| neon | 5.94 ✅ | unchanged | 5.66 ✅ | unchanged |
| vscode | 5.18 ✅ | 5.86 (`#cd92c8`)¹ | **4.28 ❌** | 5.29 (`#f46d6d`) |
| dawn | **4.07 ❌** | 5.49 (`#964307`) | **3.80 ❌** | 5.35 (`#b21d1d`) |

¹ vscode's accent passed at rest but sat at 4.67:1 on the *hover* wash — 0.17
above the floor, one surface tweak from failing silently. Lightened for
headroom.

This is §I1 arriving early. It was parked as "accents fail AA as text"; making
the loud button tonal turns it from a papercut into the primary action's label,
so it had to be solved now. It is solved **at the token**, so nothing downstream
has to remember it — anything rendering the accent as text reads
`--color-brand-text`, never `--color-brand`.

### Verification — all five themes

Measured in the browser on the rendered kitchen sink, not computed from source.
ΔE is CIE76 in Lab; a wash is a hue shift, so luminance contrast alone cannot
say whether it is visible (JND ≈ 2.3).

| Theme | wash vs card ΔE | hover step ΔE | label on wash | label on hover | danger label | radii | heights |
|---|---|---|---|---|---|---|---|
| mocha | 13.5 | 5.2 | 7.00 | 6.08 | 6.28 | 8/14/pill | 28/36/44 |
| latte | 14.3 | 6.4 | 5.94 | 5.44 | 5.32 | 8/14/pill | 28/36/44 |
| neon | 16.4 | 5.5 | 5.94 | 5.32 | 5.66 | 8/14/pill | 28/36/44 |
| vscode | 11.1 | 4.3 | 5.86 | 5.24 | 5.29 | 8/14/pill | 28/36/44 |
| dawn | 10.4 | 4.5 | 5.49 | 5.05 | 5.35 | 8/14/pill | 28/36/44 |

No theme needed a local percentage override: 14% is visible everywhere, by a
wide margin on the light themes (ΔE ~14) and comfortably on the dark ones
(ΔE 10–16). Screenshots taken in all five, through the real theme setter rather
than by poking `data-theme` — that path leaves the JS chart palette on the
previous theme (§I2), so a screenshot taken that way would be a lie.

**`--text-3` was already passing** in all five (4.74–6.55:1) before this stage,
so no change was needed there.

### Kitchen sink

Two cards added — *Accent wash* and *Shape & size* — rendering every token this
stage introduced. Standing rule from here on: **a token that cannot be seen in
the kitchen sink in all five themes does not count as shipped.** It also makes
Tailwind emit the new utilities, which is how the first measurement pass caught
that `rounded-control` did not exist yet.

## Stage 2 — done. One icon library, behind one wrapper

**Two modules, and nothing else touches icons.** `components/icons.ts` is the
only importer of `@phosphor-icons/react` (144 glyphs, each commented with the
lucide name it replaces); `components/Icon.tsx` owns size and state.

- **397 JSX icons** converted across **85 files** by codemod, kept in
  `scripts/codemod/` because it records the mapping better than a diff can.
  A further **19** were dynamic — a glyph held in a variable — and were done by
  hand, which is also where the active states got wired.
- **Sizes: three, in rem.** The app had sixteen px sizes (`size={14}` at 112
  sites). Boundaries follow where the old sizes actually clustered: ≤15 → `sm`,
  16–18 → `md`, ≥20 → `lg`.
- **State is weight, not colour.** Regular at rest, duotone when active. The
  active nav row no longer needs to be purple *and* filled *and* railed.
- The bullet glyph column (`· × — ›`) stays typographic, as specified.

Icons that were not in the brief's 23-surface map were chosen by noun and are
listed in the registry with the lucide name each replaces. The ones worth a
second opinion, because Phosphor's noun is not the obvious word:

| Was | Now | Why |
|---|---|---|
| `Ban` | `Prohibit` | Phosphor has no "ban" |
| `HelpCircle` | `Question` | |
| `LifeBuoy` | `Lifebuoy` | spelling differs |
| `Swords` | `Sword` | no crossed-swords glyph |
| `CupSoda` | `Drop` | the call site is hydration, not a drink |
| `Layers` | `Stack` | |
| `GripVertical` | `DotsSixVertical` | |
| `Settings` / `Settings2` | `SlidersHorizontal` / `FadersHorizontal` | two distinct controls kept distinct |
| `Repeat` + `RefreshCw` | both `ArrowsClockwise` | they were the same idea twice |

### Verified in all five themes

Measured on the rendered sidebar, per theme: the active row's glyph renders
**two paths with an opacity layer** (duotone), the resting row renders **one**
(regular), both at **1.125rem**, with the active one in that theme's
`--color-brand-text` — `#cba6f7` mocha, `#5733db` latte, `#c77dff` neon,
`#cd92c8` vscode, `#964307` dawn.

### Two judgement calls

- Rating stars and the "important" marker used `fill` to mean "this one
  counts". They use `active` now, so the state reads as duotone like every
  other state in the app — which is also why `fill` never had to come back.
- `VideoLink` took a px `size` number. It takes a scale step, so a caller
  cannot invent a seventeenth icon size.

### The cost, stated rather than absorbed

The icon set is **413 kB raw / 93 kB gzip**, in its own chunk. Phosphor ships
all six weights per glyph in a single module and this app uses two, so roughly
two thirds of that is dead weight that tree-shaking cannot reach — confirmed by
testing per-icon entrypoints, which produced a byte-identical chunk. Chunked
separately so it does not invalidate the app bundle on every release. Options
for Stage 6: trim the 144-glyph vocabulary, or generate a local two-weight
build. Relates to `TASKS.md` B4 (bundle regression).

Also note: the five vendored shadcn primitives (command, dialog, dropdown-menu,
resizable, sonner) imported lucide of their own accord. They point at the
registry now — but `shadcn add` will reintroduce lucide in anything it
regenerates, so that is a thing to re-check after any future component add.


## Stage 3 — done. Four variants, three heights, no accent fill

`components/ui/button.tsx` rewritten. shadcn's `default` (solid accent) is
gone, which was the point: the app had **37** of them competing with an accent
nav rail, accent icons and accent pills.

| Variant | Treatment | Was |
|---|---|---|
| `primary` | `--brand-wash` bg, `--brand-text` label, no border | `default` (solid fill) ×31 |
| `secondary` | transparent, 1px `--line-strong`, `fg-1` | `secondary` ×123 + `outline` ×11 |
| `ghost` | transparent, `fg-2`, hover `ink-2` | `ghost` ×60 + `link` ×11 |
| `danger` | transparent, `--danger-text`, hover `--danger-wash` | `destructive` ×6 |

Heights are the three control tokens (28 / 36 / 44) in rem, radius is
`--radius-control`, and there are no shadows — the wash and a 0.97 press scale
carry the interaction. The default variant is now `secondary`, not `primary`:
a bare `<Button>` used to be a solid accent fill, which is exactly how 26 of
those 31 primaries happened.

**Selection is not primary.** Trackers' type and time-of-day choosers used the
solid variant to mean "selected". They are `secondary`/`ghost` now — selection
takes the wash, the same rule `Segmented` and the pills already follow.

### The one-primary rule enforces itself

`src/lib/onePrimary.ts` counts *mounted* primaries per view in dev and warns
when a screen has two, naming the screen. Mounted, not grepped: a view with two
primaries behind mutually-exclusive conditions is fine, and no static check can
tell the difference. Stripped from production builds.

### A bug this pass created and fixed

`cn` runs tailwind-merge, which cannot tell a custom `text-label` (a size) from
a custom `text-brand-text` (a colour) — they are both `text-*`. The size class
won, so a **small primary button rendered in the foreground colour instead of
the accent**. Sizes now state font-size as `text-[length:var(--text-label)]`,
which lands in the font-size group where it belongs. Caught by reading computed
styles off the rendered page, not by review.

### Verified

Measured on the rendered kitchen sink: radius 8px on every variant, heights
exactly 28/36/44, `box-shadow: none`, primary background = the oklab wash,
primary label = `#cba6f7` (mocha `--brand-text`), danger label `#f38ba8`. On
Today: **one** primary mounted (top bar "Quick add"), no console warning.


## Stage 4 — done. The kitchen sink reviews itself

`/kitchen-sink` gained a **Review controls** card: a five-theme switcher and the
S/M/L/XL text-size control, both driving the *real* settings rather than a local
preview. That matters — a faked theme switch would leave the JS chart palette on
the previous theme (§I2) and let a desynced state pass review.

Swept **5 themes × 3 font scales = 15 combinations**, measuring the rendered
page rather than eyeballing it:

| Checked | Result |
|---|---|
| Horizontal page overflow | 0 / 15 |
| Buttons with clipped text | 0 / 15 |
| Cards overflowing their container | 0 / 15 |
| Control heights | 25/32/40 at S · **28/36/44** at M · 35/45/55 at XL |

The heights scaling proportionally is the point: they are rem, so the whole
control system grows with the accessibility setting instead of the label
outgrowing its box.

## Stage 6 — sweep

Counts, not prose. Run after the icon, button and radius passes.

| Check | Target | Actual |
|---|---|---|
| `lucide` references | 0 | **0** |
| Phosphor imported outside the registry | 0 | **0** |
| px icon sizes | 0 | **0** |
| px font sizes (`text-[13px]`) | 0 | **0** |
| Solid-accent buttons (`variant="default"`) | 0 | **0** |
| Distinct control heights | 3 | **3** (28 / 36 / 44) |
| Distinct radii | 3 | **3 principal** — `card` ×144, `pill` ×143, `control` ×137 |
| Focus ring on every tab stop | yes | yes — one global `:focus-visible` rule plus the button system's own |
| `prefers-reduced-motion` honoured | yes | yes — every keyframe animation is behind the query |

### What the sweep did *not* clear

- **34 radius stragglers**, all deliberate or side-specific: `rounded-t-*` ×12
  (sheets and table headers), `rounded-sm`/`xs` ×11 (heatmap cells, where the
  radius is geometry rather than chrome), `rounded-xl` ×6 on non-card
  containers, `rounded-r/l` ×3, `rounded-none` ×2.
- **~170 hex literals** across components and views. Sampling them shows they
  are overwhelmingly *data*, not chrome: the Settings theme-swatch previews
  (which must render another theme's colours while you are looking at this one),
  chart series palettes, habit colour pickers, streak tiers. The spec's "zero
  hex outside theme files" check needs the data cases carved out before it can
  be a gate, which is Stage 5 work.
- **~174 raw `<button>`** remain, judged per site in an earlier pass: row and
  card click-surfaces, selection chips, chip internals. They are keyboard
  visible through the global focus ring.
- `Segmented` and `Stepper` are **not** rebuilt on `ToggleGroup` yet.
- Per-view copy work (empty states as invitations, error text that says what to
  do) has not started.


## Stage 5 — done, bar container tiers

### Emoji were the second icon library

Caught in review, not by me: a time-of-day chip still read "🌙 Evening · 0/1"
while everything around it was a Phosphor glyph. Stage 2 said to delete every
other icon source *including emoji used as icons*; I converted lucide and filed
emoji as "mostly data", which was true of the emoji a user picks for a habit and
false of the fixed vocabularies. Emoji also ignore `currentColor`, so they stayed
full-colour beside icons that follow the theme.

Now in `components/glyphs.ts`: time-of-day slots, training splits (which
consolidated a private second map Gym had grown), avoid markers, streak flames,
and WMO weather codes. `lib/timeofday.ts` and `lib/fitness.ts` dropped their
emoji fields and stay pure data — how a slot is *drawn* is a UI decision.

Still emoji, because there it is content: habit and collection emoji, achievement
badges, `EmojiScale` (the emoji *is* the scale), celebration copy, and the
typographic bullet column.

### Copy

Eleven empty states became invitations ("Log a workout to see which splits you
actually train" rather than "No workouts logged yet"). Drive's eight blocking
`alert()` calls became toasts whose copy says what happened *and* what is still
true — "Backup did not finish. Your journal on this device is untouched."

### Hex, classified rather than counted

Most remaining hex is genuinely data: the Settings theme swatches must render
another theme's colours while you are looking at this one, and the Google "G" is
a brand mark. **Five were bugs** — three chart tooltips hardcoded to Mocha
(`#181825`/`#313244`/`#cdd6f4`) that stayed near-black on latte and dawn, and two
`#11111b` label colours. `rechartsTooltip()` already existed and every other
chart used it; nobody noticed because the chart still drew.

### Codemod damage, twice

The lucide→Phosphor rename used a word-boundary regex, and `Search`, `Activity`,
`Repeat` and `Scale` are ordinary English words. Five user-visible strings shipped
as "MagnifyingGlass your Drive…" and "PersonSimpleRun layout". A second batch
surfaced later — "Repeat last" rendering as "ArrowsClockwise last" — which hid
from my own grep because it skipped lines containing `as={`, exactly where a
glyph sits beside its label.

Both the hazard and the rule now live in the gate below.

## Stage 6 — enforced, not audited

Two scripts, both run before they were committed.

**`scripts/check-design-system.mjs`** — source-level, dependency-free, one
second. Fails CI on: a lucide import, a direct Phosphor import, a glyph name
rendering as a label, a px icon size, a retired button variant, an off-token
radius, emoji in the fixed vocabularies, a hardcoded colour. Writing it paid for
itself immediately — it found six `rounded-xl` stragglers the radius codemod's
card-shape heuristic had skipped.

**`scripts/a11y-axe.mjs`** — axe-core over eight views against a production
preview. Serious/critical fail; moderate is reported, because most moderate
findings are contrast inside chart internals and a gate that always fails is a
gate everyone learns to ignore. Current: **0 serious, 0 moderate**, 22 rules
passing on Today.

It asserts each view actually rendered before trusting its score. A clean result
on a blank page is worse than no gate, because it reads as proof. Running it
locally is also what caught `@axe-core/playwright` refusing a page created with
`browser.newPage()`.

## The bundle, after

The icon set cost 413 kB raw / 93 kB gzip because Phosphor ships all six weights
per glyph in one module and this app renders two. Per-icon entrypoints produced a
byte-identical chunk, which proved it was the package layout rather than the
import style.

`scripts/build-icons.mjs` reads the installed package's own defs and emits only
`regular` and `duotone`, plus the registry that wraps them — nothing hand-copied,
so an upgrade is a re-run (`npm run icons`).

| | before | after |
|---|---|---|
| icons chunk | 413 kB / 93 kB gzip | **134 kB / 25.8 kB** |
| total assets | 1611 kB / 445 kB | **1339 kB / 381 kB** |

`@phosphor-icons/react` is a devDependency now: after this, nothing imports it at
runtime.

## Open questions — answered

All four were answered "go with the recommendation":

1. Extend the existing token layer — **done**, no second bridge.
2. oklab wash + hover step — **done**, verified in five themes.
3. lucide → Phosphor across 85 files — **approved**, Stage 2.
4. Icons outside the map get picked by noun and reported — **approved**.

## Original open questions (for the record)

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
