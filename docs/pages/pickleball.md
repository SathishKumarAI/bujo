# Pickleball

`src/views/Pickleball.tsx` · nav: Sports → Pickleball · `?view=pickleball`

## What this page is

Everything pickleball except coaching: log a session (format, games won/lost,
scoring), a record summary, history, DUPR rating over time, leagues and
tournaments, injury-prevention notes, a format playbook, and four collapsed
analytics groups.

## Measured (1440×900, demo data)

**4.2 screens · 12 top-level blocks** — the longest page in the app.

| Block | Height | State |
|---|---|---|
| At a glance | 267px | open |
| Log a session | 644px | open |
| History | 409px | open |
| DUPR rating | 266px | open, **empty** |
| Leagues & tournaments | 600px | open |
| Practice today & improve | 103px | open |
| Form & momentum | 50px | collapsed |
| Opponents, partners & venues | 50px | collapsed |
| Deeper signals | 50px | collapsed |
| Charts | 50px | collapsed |
| Play safe · physio & trainer notes | 396px | open |
| Format playbook | 536px | open |

## The finding that matters

**P1 · The page expands its reference material and collapses your data.**
"Play safe" (396px) and "Format playbook" (536px) are static articles — the same
text for every user, forever — and both are open. Meanwhile *your* form, your
opponents, your signals and your charts are four collapsed 50px strips. Nearly
**1,000px of content that never changes** outranks everything the app learned
about you.

Flip it: analytics open, reference collapsed. That one change removes ~900px
from the default page and puts the personal content first.

## UX / IA

**P1 · Four identical collapsed strips in a row.** Form & momentum · Opponents,
partners & venues · Deeper signals · Charts — 50px each, same chrome, stacked.
It reads as a filing cabinet, not a page, and "Deeper signals" versus "Form &
momentum" gives no clue which drawer holds what.

**P2 · An empty 266px card for DUPR.** "No DUPR ratings logged yet · add one
above to start the trend" occupies a quarter-screen between History and Leagues.
Empty and open is the worst of both: it costs full height and shows nothing. It
should be a one-line prompt until it has data.

**P2 · Leagues & tournaments is a second full logging form** (600px, six event
formats, its own stat row) inside a page that already has one. Two forms, both
open, 1,244px combined. For most users this is an occasional feature sitting
permanently in the main flow.

**P3 · "Practice today & improve" is a 103px pointer to the Coaching page**
placed in the middle of the stack, where it reads as another feature rather than
a link out.

## UI

**P2 · "At a glance" is the strongest block and it is not the biggest.**
`6 sessions · 20 games · 75% win · 1 day streak`, then "This week: 7 games · 100%
won" and a weekly goal — the whole story in 267px, sitting above a 644px form.

**P3 · History rows carry `Edit` and `×` per row**, always visible, so a
six-session list shows twelve secondary controls. Reveal on hover would give the
scores the row back.

**P3 · The scoring picker is four options wide** (`to 11 · to 15 · to 21 ·
rally 21`) on a form most people fill the same way every time. It should
remember the last value.

## Copy

**P2 · "Deeper signals"** and **"Form & momentum"** are titles that describe a
mood, not a content. A reader cannot predict what is inside either. Compare
"Opponents, partners & venues", which says exactly what it holds.

**P3 · "Tap Edit to fix a score, × to remove"** is a manual for two visible
buttons. If the buttons need the sentence, the buttons are unclear; if they are
clear, the sentence is clutter.

**P3 · "Log your DUPR over time, watch the trend climb"** presumes the trend
climbs. It is a nice line and slightly overconfident.

## Upgrades, ranked

1. **P1 · Collapse the reference, open the analytics.** Play safe and Format
   playbook closed; Form, Opponents, Signals and Charts open. Removes ~900px and
   inverts the priority correctly.
2. **P1 · Merge the four collapsed strips** into one "Analytics" section with
   internal tabs, or give them names that predict their contents.
3. **P2 · Collapse DUPR to a single line while empty.**
4. **P2 · Move Leagues & tournaments behind a disclosure** — it is the
   occasional path, not the daily one.
5. **P3 · Remember the last scoring format** instead of asking every time.
6. **P3 · Reveal row actions on hover** in History.

## Leave alone

- **"At a glance".** Four numbers, a this-week line and a goal — the model other
  pages should copy.
- **The physio content itself.** Genuinely useful and clearly specialist; it
  just should not be open by default.
- **Format playbook as content.** Same: valuable, wrongly prominent.
- **Games won / lost as the core unit.** Right primitive for the sport.

---

## Update — the grid landed

**4.2 → 2.6 screens.** The twelve stacked blocks now flow three across
(`CardGrid`, see `docs/redesign/12-three-column-grid.md`); "At a glance" spans
two columns, and the six charts inside *Form & momentum* became two rows of
three instead of a six-card column.

**Still open, and still the headline:** the page expands ~1,000px of static
reference (Play safe, Format playbook) while collapsing all four analytics
groups built from your own data. The grid made the page shorter; it did not fix
the priority.
