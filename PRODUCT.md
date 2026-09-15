# PRODUCT.md — what Cadence is, before any pixel is decided

Product truth. Durable across redesigns. If a visual decision contradicts this
file, the visual decision is wrong. Visual decisions live in `DESIGN.md`.

## One line

A private, local-first journal that keeps the calm of paper and adds the things
paper cannot do — search, streaks, charts that overlay your mood against your
sleep, and **Relay**, which takes a spoken sentence and files it on the page
that owns it.

The name is user-facing only. The repository, the package and every `bujo:`
storage key keep the old one on purpose: a renamed storage key is an orphaned
journal.

## Who opens it

One person, their own journal, most days, mostly on a phone in the evening and a
laptop during the day. Not a team. Not a client. There is no second user, no
sharing, no feed, and nothing to convert. Every screen is someone looking at
their own data.

## What they came to do

Ranked by how often it happens. This ranking is the reason the shell is shaped
the way it is, and any layout that inverts it is wrong regardless of how it looks.

| Frequency | Task | Where |
|---|---|---|
| Many times a day | Capture one line — task, event, note, tag | Today, capture bar, ⌘K |
| Daily | Tick habits, drag mood/sleep, log water | Today, Body · Tracking |
| Daily–weekly | Log a workout, a fast, a session | Body |
| Weekly | Migrate open tasks, plan the week | Plan |
| Weekly–monthly | Read what the data says back | Insights, Stats |
| Rarely | Change a setting, export, sync | Account, Settings |

Capture is the product. Everything else is what capture earns you.

## Mode

**Operate.** The visitor completes a task. Scanability, consistency, and the real
usage scene outrank expression. The brand lives in precise details — the bullet
glyph, the serif date, the numerals — not in decoration.

The one exception is **Welcome**, which is Persuade: it has to earn the first
entry from someone who has typed nothing yet.

## Non-negotiable product truth

Constraints, not preferences. A redesign preserves all of these.

- **Local-first, no account.** Data lives in the browser. Nothing about the UI
  may imply a server exists or that work is being uploaded.
- **Offline.** It is a PWA. It opens on a plane. No design element may depend on
  a network fetch — fonts included, which is why they are self-hosted.
- **Five themes, and they all ship.** mocha · latte · neon · vscode · dawn. A
  visual decision that works in one theme and not the others is not done.
- **Accessibility is a floor, not a goal.** Every piece of text a user reads
  clears WCAG AA (4.5:1) in every theme. `npm run a11y` and `npm run contrast`
  are gates, not reports.
- **The global text-size setting scales the rem root.** Every size that belongs
  to type or to a control is stated in rem. A px control height silently breaks
  the accessibility feature for the user who needs it most.
- **Density is a feature.** Trackers' month grid, Stats' heatmap and the habit
  chip cluster are dense on purpose. Whitespace that halves the information on
  screen is a regression here, not a refinement.
- **The Bullet Journal method is native, not a theme.** Task / event / note,
  the glyph column, migration, monthly spreads. The glyph is the app's
  signature.

## What already works and must survive

Evidence from the incumbent build, kept because it is right — not because it is
there.

- **The type pairing.** Fraunces (display) over Instrument Sans (UI) over
  JetBrains Mono (figures). It is specific, self-hosted, and un-generic.
- **One accent, one primary action per screen**, enforced in dev by
  `registerPrimary()`. Accent inflation was a real past failure; do not reopen it.
- **Seven type steps, three control heights, three radius names.** A system, not
  a pile of decisions. Values may change; the count must not grow.
- **Purpose tokens over palette tokens.** Views say `text-fg-2`, never a hex.
  Every theme re-skins for free because of this. Keep it absolute.

## What is wrong with it today

Measured on `?demo=1` at 1440 and 390 on 2026-09-12, mocha. This is the brief.

A past "Modernist" pass set all three radius tokens to `0rem`, removed every
fill, and left a 1px hairline as the only way anything is bounded. The result
reads as an unstyled HTML form:

1. **Every control is an outlined rectangle** on the same flat ground — capture
   input, Add button, habit chips, +/− steppers, segmented control, grid cells.
2. **Cards are darker than the page in all three dark themes** (`--card` =
   mantle, which sits *below* base). Elevation runs backwards: cards sink.
3. **Nine saturated hues outline nine chips at equal weight**, so nothing leads.
4. **Zero radius everywhere**, including on things shaped by their own text.
5. **Depth utilities exist and are unused** — `.card-3d`, `.aurora`,
   `.glow-mauve` were written, then flattened out from under.

## Out of scope for any redesign

Copy that states a fact (counts, dates, measured numbers), the data model, the
five themes' identities, the glyph vocabulary, and the a11y floor.
