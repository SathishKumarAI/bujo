# Redesign prompt — bujo

Paste this into Claude Code (or Cursor) from your project root. It assumes React + Vite.

---

## Context

This is `bujo`, a minimal bullet journal / daily-log app. React + Vite, dark theme. It has a left sidebar (Journal, Fitness, Sports, Habits, Wellbeing, Library), a top bar, and a scrolling column of cards on the Today view: mood/energy sliders, a "first meal" tracker, an intermittent fasting timer, and a rapid-log capture input with bullet-journal entries.

It currently works but looks like an unstyled prototype. I want you to do a **visual and interaction pass only** — do not change data models, storage, or business logic. Every existing feature must still work identically when you're done.

## The diagnosis

Read this before touching code. These are the actual problems:

1. **No hierarchy.** Every card has identical padding, border, and background, so nothing leads. Three cards stacked with equal weight means the eye has no entry point.
2. **No max width.** Content stretches the full viewport, so a slider's label sits at x=400 and its collapse button at x=1780. Controls get stranded from what they control.
3. **Toolbar overload.** Seven unlabeled icons plus a notification badge in the top-right corner. Unlearnable.
4. **Inconsistent primitives.** Cards, inputs, buttons, pills, and steppers each have a different corner radius, border treatment, and height.
5. **Accent inflation.** The purple accent is used on Quick add, the Food pill, Start fast, and the sidebar active state simultaneously. When four things are primary, nothing is.
6. **Typography has no system.** Serif and sans appear at nearly the same size, so it reads as accidental rather than deliberate. Numbers use proportional figures and jitter when they change.
7. **The bullet-journal glyph column** (`×`, `·`, `—`) — the actual signature of this app — is tiny, misaligned, and inert.

## Design tokens

Create `src/styles/tokens.css` and route every color, radius, and spacing value through it. No hardcoded hex anywhere in components.

```css
:root {
  /* Surfaces — neutral ink, not purple-black, so the accent can pop */
  --ink-0: #0B0B0F;        /* page */
  --ink-1: #131218;        /* card */
  --ink-2: #1B1A22;        /* input, raised */
  --ink-3: #24222D;        /* hover */

  /* Borders — alpha, never solid grey */
  --line:        rgba(255,255,255,0.07);
  --line-strong: rgba(255,255,255,0.12);

  /* Text */
  --text-1: #EDEBF2;
  --text-2: #9A97A6;
  --text-3: #6B6878;

  /* One accent. One. */
  --accent:      #A78BFA;
  --accent-ink:  #1A1030;   /* text on accent fill */
  --accent-wash: rgba(167,139,250,0.12);

  /* Semantic — used sparingly */
  --success: #6EE7B7;
  --warning: #FCD34D;
  --danger:  #FB7185;

  /* Radius — exactly three */
  --r-control: 8px;
  --r-card:    14px;
  --r-pill:    999px;

  /* Spacing — 4px base, no other values allowed */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;

  /* Motion */
  --dur-fast: 130ms;
  --dur-base: 220ms;
  --ease:     cubic-bezier(0.2, 0, 0, 1);

  /* Layout */
  --col: 820px;
  --h-control: 36px;
}
```

## Typography

Load from Google Fonts: **Fraunces** (display), **Geist Sans** (UI), **Geist Mono** (numerals). If Geist isn't available, use Instrument Sans and JetBrains Mono.

```css
--font-display: 'Fraunces', Georgia, serif;
--font-ui:      'Geist Sans', system-ui, sans-serif;
--font-mono:    'Geist Mono', ui-monospace, monospace;
```

Rules to enforce:

- Fraunces is for **display only**: the page title and card titles at 20px+. Never below 18px. Never on a label, button, or input.
- Everything else is Geist Sans.
- **Every number renders in Geist Mono with `font-variant-numeric: tabular-nums`** — fast hours, streak counts, slider readouts, logged reps, times. Numbers must never change width as they change value.
- Type scale, and nothing outside it: `32 / 22 / 17 / 15 / 13 / 11`.
- Two weights only: 400 and 500. Delete every 600 and 700 in the codebase.
- Sentence case everywhere. No Title Case, no ALL CAPS section headers — replace the current uppercase sidebar labels with 11px `--text-3` in sentence case.

## Tasks

### 1. Layout
- Wrap the Today column in a container at `max-width: var(--col)`, centered, with `padding: var(--s-6) var(--s-5)`.
- Above 1200px, split into two columns: the rapid-log capture stays in the main column; fasting timer and trackers move to a narrower right rail.
- Reduce card count. The **rapid-log capture is the hero** — it keeps `--ink-1`, a border, and `--r-card`. Mood/energy and first-meal become borderless sections separated by a `--line` rule and `--s-6` of space. Fasting keeps its card because it holds live state.

### 2. Top bar
- Reduce to: date pager (left of center), `Quick add` (accent-filled), and a single `⋯` overflow menu.
- Move everything else into a **command palette** bound to `⌘K` / `Ctrl+K`. It should fuzzy-search across: navigation destinations, quick actions (start fast, log water, add task), and existing entries. Show the shortcut hint in the empty state of the capture input.
- Keep the overflow menu items labeled with text, not icons alone.

### 3. Buttons and controls
- Build one `<Button>` with variants: `primary` (accent fill), `secondary` (transparent, `--line-strong` border), `ghost` (transparent, no border).
- **Exactly one `primary` per screen.** Quick add gets it. Start fast, Add, and the Food/Drink pills all become `secondary` or `ghost`.
- All controls: `height: var(--h-control)`, `border-radius: var(--r-control)`.
- Every interactive element gets `:active { transform: scale(0.97) }` at `--dur-fast`.
- Visible `:focus-visible` ring: `box-shadow: 0 0 0 2px var(--ink-0), 0 0 0 4px var(--accent)`.

### 4. Sliders
- Replace the mood/energy range inputs with a **10-segment tap scale** — ten pill segments, filled up to the selected value. Dragging to an exact value on a 1400px track is bad input design; tapping "7" is one gesture.
- Keep keyboard support: arrow keys, 0–9 number keys.
- The numeric readout uses mono tabular figures and animates the digit change (roll or crossfade, 150ms).

### 5. The bullet glyph column — this is the signature
- Fixed 24px gutter, mono font, vertically centered against the entry text.
- Clicking a glyph cycles state: task `•` → done `×` → migrated `>` → scheduled `<` → back to `•`. Note `—` and event `○` set via the capture syntax.
- Animate the transition with a 200ms stroke draw or crossfade, not an instant swap.
- Completed entries: strike the text and drop it to `--text-3`.
- Priority `!` gets `--warning`, tags like `#travel` get `--accent` and are clickable.

### 6. Fasting timer — the one signature motion moment
- Add a thin progress ring (2px stroke) that fills across the fasting window, mirrored as a small ring in the sidebar so it's visible from any view.
- Elapsed time in mono tabular figures, updating every second without layout shift.
- Subtle scale pulse on the ring when a new hour completes. That's the whole animation budget for this feature — nothing else on the card animates.

### 7. Icons
- One set, one stroke width: `lucide-react`, `strokeWidth={1.5}`, `size={18}`.
- Replace the `</>` icon on Focus — a code-brackets glyph is the wrong metaphor. Use `Target` or `Crosshair`.
- Every icon-only button needs an `aria-label` and a tooltip.

### 8. Copy
- "Broke fast with" → "First meal"
- "0 drained · 10 energized" → move to endpoint labels under the scale, not a sentence
- Empty states are invitations, not apologies: "Log your first entry" with the capture focused, not "No entries yet"
- Sentence case, active voice, no exclamation marks, no "please"

### 9. Motion
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, or `left`.
- Hover and press: `--dur-fast`. Entrances: `--dur-base` with an 8px `translateY`, staggered 30ms per item on view change.
- Springs for the stepper and the segment scale; easing curves for everything else.
- Required, non-negotiable:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10. Roll it out to every page

Everything above describes the Today view because that's the densest screen and the one I screenshotted. It is the reference implementation, **not the scope**. The app also has: Plan, Fitness, Pull-ups, Home Workout, Pickleball, Coaching, Trackers, Challenges, Focus, Mindset, Recovery, and Library.

A half-migrated app looks worse than the current one — two button styles alive at once, some screens on neutral ink and some still on purple-black. So:

**Audit first.** Before writing any styles, grep the codebase and give me a table of every page and shared component, with: what it renders, whether it uses shared primitives or one-off markup, and how many hardcoded colors, radii, and font sizes it contains. I want to see the real surface area before we commit to an approach.

**Then migrate page by page**, each in its own step, in this order — highest traffic first:

1. Today (reference implementation — steps 1–9 above)
2. Plan
3. Trackers, Challenges, Focus (habits cluster — these likely share list/grid patterns; extract them)
4. Fitness, Pull-ups, Home Workout (logging cluster — same)
5. Pickleball, Coaching
6. Mindset, Recovery, Library
7. Sidebar and any modals, toasts, dropdowns, empty states, and settings screens

**Extract before you repeat.** If two pages need the same thing, it becomes a shared component before the second page uses it. Candidates I expect: a stat tile, a log-entry row, a day/week strip, a progress ring, a section header with an action, a metric stepper, and a chart wrapper. Put them in `src/components/ui/` and make every page import from there.

**Definition of done, enforced globally:**

- `grep -rE "#[0-9a-fA-F]{3,6}" src/` returns nothing outside `tokens.css`
- No `border-radius` value in the codebase other than the three tokens
- No `font-weight` above 500
- Every number rendered to screen uses the mono/tabular class
- No page renders wider than `--col` without a deliberate two-column layout
- Exactly one accent-filled button per screen, on every screen
- Every route is keyboard-navigable and has a visible focus ring

Run those checks yourself at the end and report anything that fails rather than quietly leaving it.

## Constraints

- **Do not** add gradients, mesh backgrounds, glassmorphism, glow, neon, or noise textures.
- **Do not** add a new component library. Use `lucide-react` and, if you need springs, `framer-motion` — nothing else.
- **Do not** change routing, storage, or the shape of any persisted data.
- **Do not** touch more than the styling layer and the specific components listed above.
- Responsive down to 375px. The sidebar collapses to a bottom bar under 768px.
- Keyboard operable end to end: every action reachable without a mouse.
- Contrast: body text ≥ 4.5:1 against its surface, and check `--text-3` specifically — it's borderline.

## How to work

Do this in order and stop after each step so I can look. Do not run ahead — I want to catch drift early, not after twelve pages are wrong.

0. **Audit** (section 10). Table of pages and components, no code written yet.
1. `tokens.css` plus fonts, wired into existing components with zero visual redesign yet. Show me the diff.
2. Primitives — Button, Card, Input, section header, segment scale. Build a `/kitchen-sink` dev route rendering every variant and state so we can review them in one place.
3. Today view — layout, card reduction, glyph column, fasting ring.
4. Top bar plus command palette.
5. Remaining pages, in the order given in section 10. One step per cluster, not one giant pass.
6. Motion pass and reduced-motion, applied globally.
7. Run the definition-of-done checks and report failures.

At each stop, tell me what you changed and what you deliberately left alone. If a token or rule above makes a specific screen worse, say so and propose an alternative instead of silently working around it.
