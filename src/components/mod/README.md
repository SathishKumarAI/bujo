# `mod/` — Modernist band primitives

The structural layer of the Modernist redesign (`docs/sessions/2026-08-16-modernist-redesign/PLAN.md`).
App-generic on purpose: Mindset is the first page built from these, and every
later phase consumes them unmodified. **Needing a new variant means this layer
under-abstracted — change it here, do not fork at the call site.**

| Change | File |
|---|---|
| Section rule weight, cell rule, cell padding, flush-left rule | `Band.tsx` |
| The small uppercase label's size, tracking, colour | `Eyebrow.tsx` |
| The one big line's size, measure, wrapping | `Statement.tsx` |

## What these are not

They carry **no colour of their own** beyond the app's purpose tokens
(`border-line`, `text-fg-*`). The handoff's palette (#f3f2f2 / #201e1d /
#ec3013, Archivo) was deliberately dropped: this app ships five themes and a
theme-following chart palette, and a hard-coded ground breaks all five. The
handoff's own build note is the licence — *"keep the rules … they carry the
identity, not any particular div."*

## Rules that must survive any edit

- 2px between sections, 1px between cells. Two weights, no third.
- Radius 0. A `rounded-*` class in here is a bug.
- The first cell of a row is flush left. Alignment down the page is the grid.
- Accent means **state** (active, in focus, selected) and nothing else — never
  decoration, never a heading colour.
- Cells size themselves with flex-basis + min-width, so rows wrap with no
  breakpoint. Rows that must never wrap say so (`BandRow wrap={false}`).
