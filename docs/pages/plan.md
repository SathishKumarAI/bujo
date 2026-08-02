# Plan

`src/views/Plan.tsx` · nav: Journal → Plan · `?view=plan`

## What this page is

The migration workhorse. Open tasks whose date has passed collect here, and you
decide the fate of each one: pull it to today, push it to tomorrow, or drop it.
Underneath, a collapsed "Setup" section holds recurring rules and `.ics` import.

This is the page that makes a bullet journal a *system* rather than a list — the
periodic review where stale tasks either get recommitted to or die.

## Measured (1440×900, demo data)

- **0.9 screens** — the whole page fits without scrolling. Good.
- Two blocks in a two-column CSS masonry: **Migration 594px tall**, **Setup 32px**.
- 5 of 14 overdue tasks shown; each is a bordered card with **3 action buttons**.

## UI

**P1 · The masonry only has one heavy stack, so half the page is empty.** CSS
columns split the content into two, but there are only two children and one of
them is a 32px collapsed header. The result: a 526px card on the left and a
strip of text alone in ~600px of dark space on the right. Multi-column pays off
when both stacks have comparable mass; with one big card it reads as a rendering
fault. Either give the right column real content (Setup expanded, or the aging
breakdown promoted into it) or drop to a single column and use `Page aside`.

**P1 · Setup's "SHOW" affordance is 1,360px from its own label.** The header
stretches the full page width, so the label sits at the far left and the toggle
hint at the far right, with nothing between them. On a wide screen the two ends
of one control are further apart than most windows are tall.

**P2 · Each task costs ~130px to display ~20 characters.** Bordered card, star,
title, date, then three buttons on their own row. Five tasks fill 500px. Expand
to all 14 and you are looking at 42 buttons for a job that is "decide about
fourteen things". Migration should feel like dealing cards, not filling a form.

**P2 · Three sibling actions, three different weights.** `→ Today` and
`→ Tomorrow` are solid secondary buttons; `drop` is bare red lowercase text.
They are peers — all three resolve the task — but the styling says two are
buttons and the third is a warning label.

## UX / IA

**P1 · There is no bulk action, and this is the one page that needs one.** The
whole point is clearing a backlog. With 14 overdue tasks the only path is 14
individual decisions. "Move all to today", or select-many-then-act, would turn a
five-minute chore into one click. This is the single biggest product gap on the
page.

**P2 · "Aging" is collapsed by default, and it is the most useful thing here.**
It holds the staleness histogram and `oldest 26d`. A task overdue by 26 days
usually wants dropping, not migrating — that is exactly the judgement the page
is asking you to make, hidden behind a disclosure.

**P2 · Only 5 of 14 shown, with "Show all 14" as a text link.** The count is
already in the subtitle, so the page tells you 14 twice and shows you 5. If the
whole page fits in 0.9 screens, showing all of them costs nothing.

**P3 · No sense of progress.** Clearing a backlog is satisfying; the page never
says "9 left" or "backlog cleared" as you work. The empty state exists
(`Nothing overdue. You're on top of it. 🎉`) but you only meet it once.

## Copy

**P2 · The subtitle spends its words on doctrine.** "14 overdue open tasks, the
heart of bullet journaling" — the second clause is a claim about the method, not
information about your day. Something like "14 tasks waiting on a decision"
tells the user what is being asked of them.

**P3 · `drop` is method jargon.** Correct BuJo vocabulary, so it can stay — but
it is the only unlabelled-by-context verb on the page, and it is the destructive
one.

**P3 · "Setup · recurring rules & calendar import"** is two unrelated features
behind one word. Fine while collapsed; worth splitting if it ever opens by
default.

## Upgrades, ranked

1. ~~**P1 · Add bulk migration.**~~ ✅ Done — "Move all 14 → Today". No confirm:
   it moves dates, destroys nothing, and undo covers it.
2. ~~**P1 · Fix the empty right column.**~~ ✅ Done — the masonry is gone, one
   `read` column. The wide tier went with it; that width existed only to stop
   the masonry collapsing.
3. **P2 · Compress the task card to a row.** **Still open** — fourteen tasks now
   render, but each still costs ~130px and three always-visible buttons.
4. ~~**P2 · Open "Aging" by default.**~~ ✅ Done.
5. ~~**P2 · Show all tasks.**~~ ✅ Done.
6. **P3 · Give the three actions one visual family.** **Still open.**
7. **P3 · Add a progress line.** **Still open.**

The subtitle also changed: "14 overdue open tasks, the heart of bullet
journaling" → **"14 tasks waiting on a decision"**. The old second clause was a
claim about the method rather than information about your day.

Measured after: 0.9 → **1.1 screens** (all 14 tasks now render), single 820px
column, no dead half-page.

## Leave alone

- **The Date / Priority sort toggle.** Small, well-placed, exactly the control
  this page needs.
- **The star / important marker** — earns its place, and priority sort makes it
  meaningful.
- **The empty state.** "Nothing overdue. You're on top of it. 🎉" is the right
  tone and the right reward.
- **Page height.** Fitting the whole review in one screen is a feature; do not
  spend that budget on decoration.
