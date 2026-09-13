# DESIGN.md — Layered Depth

The visual world. Supersedes the "Modernist" pass (radius 0, hairline rules, no
fills), which is now anti-reference: it is kept in the git history and nowhere
else. Product truth lives in `PRODUCT.md` and outranks everything here.

## The idea in one sentence

**Things you can operate are made of material; things you read are not.**

A control has a surface — a fill, a soft edge, a shadow that says it sits above
the page. Text, rules and data do not. The old system had it backwards: it drew
a box around everything and gave substance to nothing, which is why an input and
a table cell and a button were the same object on screen.

## The four rules

The Modernist pass had four rules and they were applied honestly; these replace
them one for one.

| Was | Is |
|---|---|
| Radius 0 everywhere | **Three radii, all non-zero**, by what the thing is |
| 2px / 1px rules close a section | **Elevation** closes a section; a rule is the exception |
| Outline defines every control | **Fill** defines every control; outline is the quiet variant |
| Accent for state only | **Accent for state only** — unchanged, it was right |

### 1. Elevation is a ladder, and it goes up

Four surfaces, and only four. On a dark theme each rung is *lighter* than the one
below it; on a light theme each rung is lighter too — toward white, which is
already how latte and dawn behave and why they never looked broken.

```
ink-0   page ground        the thing everything sits on
ink-1   card               lifted off the page, reads first
ink-2   inset / control    a field you type into, a button at rest
ink-3   hover / active     the rung you touch
```

The rung a surface occupies is decided by what it *is*, never by what looks
nice next to it. A card inside a card is two rungs and therefore a mistake — one
of them is not a card.

**Dark themes must override `--card`.** `--card` aliased `--color-mantle`, which
is *below* `--color-base` in mocha, neon and vscode. That single alias is why
every card in the app receded instead of lifting.

### 2. Depth is a shadow with an offset, plus one hairline of light

Not a halo, not a glow, not a colored border. Every elevated surface on a dark
theme gets:

- a **downward shadow** with a real offset and a soft blur, and
- a **1px inset highlight along its top edge**, at low alpha — the single
  cheapest signal that a surface is lit from above and therefore in front.

Light themes get the diffuse Material-ish shadow they already have and **no
highlight** — a white line on white is nothing, and the hairline border does the
work instead. This split already exists in `.card-3d`; it stays.

Three shadow steps, named for what they are, not how big they are:

```
--shadow-raise   a card, a chip, a button at rest
--shadow-lift    a card on hover, a popover, a dropdown
--shadow-float   a modal, a sheet, the enlarge panel
```

### 3. Radius says what kind of thing this is

The three names were right and stay; only the values change, in one line each.

```
--radius-control  0.625rem  10px   buttons, inputs, segments, steppers — you operate it
--radius-card     1rem      16px   cards, sheets, modals, panels — you read it
--radius-pill     9999px    full   chips, tags, avatars — shaped by its own text
```

A nested control inside a card steps **down** one notch, never up: a 16px card
holding a 16px button reads as a sticker, not a control.

### 4. Fill defines a control; an outline is the quiet variant

The default state of an operable thing is a **fill one rung above its container**
and no border. A border appears only when the fill alone cannot separate it
— against a photo, inside a dense grid, or on the `secondary` variant where a
boundary is the entire point.

Ranked, loudest to quietest. Exactly one of the first row per screen:

| Emphasis | Surface | Text |
|---|---|---|
| Primary | accent wash (14% rest / 20% hover) | `--color-brand-text` |
| Secondary | `ink-2` fill, no border | `fg-1` |
| Quiet | transparent, fill on hover | `fg-2` |
| Danger | transparent, danger wash on hover | `--color-danger-text` |

The solid saturated accent fill stays retired. That decision was correct and the
reasoning in `button.tsx` still holds — a wash plus real elevation reads as
primary without adding a third competing surface.

## Colour discipline

One accent per theme. The other eight palette hues exist to **name a thing**
(this habit, this series, this muscle group), never to rank it.

**Hue is identity; fill is state.** The habit chips got this backwards: nine
saturated 1px outlines at equal weight, so a slipped habit and a clean one
shouted equally. Corrected:

- **off / not logged** — `ink-2` fill, `fg-2` text, no hue at all
- **on / done** — that habit's hue at a wash, hue-tinted text, no border
- **slip / broken** — the same wash plus a 1px border in the hue, which is the
  *only* place a border carries meaning

The consequence is that a row of untouched habits is grey and a completed day
lights up. That is the information the screen exists to give.

### Text on a coloured surface is never grey

Secondary text on an accent or hue wash is tinted from that hue, not from the
neutral ramp. `onAccent(fill)` already exists for this and must be used; the
21 hand-written `cat('crust')` call sites are the known counter-example and are
wrong in the two light themes.

## Type

The seven-step scale, three control heights and two container widths are
unchanged — they are a system and the system is not the problem.

What changes is **how much display type a page is allowed**. The serif appears
once per page, at the top, at `--text-display` or larger, and carries the page's
identity. Everything below it is Instrument Sans. A page with three serif
headings has no hierarchy; a page with none has no voice.

Numerals stay `.num` — JetBrains Mono, tabular — everywhere a figure can change
under the reader. A column of numbers that reflows as it updates is the detail
that separates a built app from an assembled one.

## Browser surfaces

The parts nobody draws still carry the design. All five themes must theme:
`::selection`, `caret-color`, the scrollbar (already done), the focus ring
(already done), and tabular figures (already done). Selection and caret are the
two that ship with a browser default today.

## Motion

The existing token set is right and stays: one emphasis curve
(`--ease-emphasis`), one rise curve, four durations. Every animation reads
`prefers-reduced-motion`.

Depth adds exactly one new moment and no more: **a card lifts on hover** — the
shadow steps `raise → lift` and the surface moves 2px — because it is now a
material that can. The glyph-set animation on the bullet column stays the app's
one authored flourish. Nothing else gets a new entrance.

## What this world refuses

- A card inside a card.
- A border wider than 1px used as decoration, and any coloured `border-left`.
- A shadow with no offset — a zero-offset halo is a glow, not depth.
- Gradient text, glass used as decoration rather than as a specific effect.
- A ninth type step, a fourth radius, a fifth control height.
- Any hex literal in a view. Views read purpose tokens, always.
- Any size in px that belongs to type or to a control.

## Rollout

Each phase is a branch, a PR, and a verified `npm run verify` + the four visual
gates (`contrast`, `a11y`, `clipped`, `design`). Phases land in order because
each one leaves the app coherent.

| Phase | Scope | State |
|---|---|---|
| 0 | `PRODUCT.md`, this file | ✅ |
| 1 | Tokens + primitives — every view restyled at once | ✅ (#216) |
| 2 | Shell: header, nav, page frame, book | ✅ (#217, and the header rows centred in a follow-up) |
| 3 | Today · Plan · Body · Mind · Insights | ☐ |
| 4 | The long tail — 20 remaining views | ☐ |
| 5 | Motion + polish pass | ☐ |

Phase 1 is deliberately token-and-primitive only. Nothing under `views/` is
touched, so the diff that changes all 28 screens stays reviewable and any
regression is one file away.
