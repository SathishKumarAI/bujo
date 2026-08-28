# Today

`src/views/Today.tsx` · nav: Journal → Today · `?view=today`

## What this page is

The daily log — and the app's home screen. In a bullet journal, this is where
you *write things down*: tasks, events, notes, in one line each. Everything else
in the product is downstream of what gets captured here.

## Measured (2026-08-28, demo data)

The page is **three surfaces** now — Morning / Day / Evening, picked by the
clock and overridable in the URL — so there is no single height for it. Each is
a filter over the same day record; no surface owns state.

Re-measured on the rendered page, before and after the orient-zone pass:

| Surface | @1440 before | @1440 after | @390 |
|---|---|---|---|
| Morning | 1.36 screens | **0.91** | 1.56 |
| Day | 1.01 | **0.88** | 1.28 |
| Evening | 1.09 | **0.88** | 1.21 |

All three fit one desktop screen. Two things paid for that:

- **Chrome was 180px before a word of the day** — a 112px dateline and a 68px
  tab row, a fifth of the viewport, on every surface at every width. One band
  now, 105px, with the tabs riding in it.
- **550px of dead gutter each side at 1920.** The focused layout had no rail:
  an 820px column centred in a 1920px window, i.e. the phone layout with more
  air. It splits at `xl` on the classic layout's rule — you write in the left
  column, the right rail reports on it. Gutter is 288px now.

**The phone is content-bound, not chrome-bound** (1.57 → 1.56). The saving
there is ~36px and there is no more chrome to take: the remaining height is
cards. Anything further is a density decision about what the cards ask for, not
a layout one.

Where each card sits per surface:

| Surface | Left (you write it) | Right (it reports) |
|---|---|---|
| Morning | How is today going? | Fasting · Today's plan |
| Day | Day log + capture · habit pills | Count habits · Keep your streaks · status strip |
| Evening | Close out your habits | Write one line |

The rail is DOM-ordered after main, so a phone stacks exactly the order these
surfaces already had — which is why the status strip ends Day's *rail* rather
than Day's main.

## UX / IA

**P1 · The journal is seventh.** The page is titled "Today · Your daily log" and
the log sits ~2,100px down, under three read-only cards and three input cards.
On a phone that is six full swipes before you can write anything. The one thing
a bullet journal must make effortless — capture — is the hardest thing to reach
on its home screen. Everything above it is *derived from* entries that this box
is where you create.

**P1 · Read-only cards open the page.** Cards 1–3 tell you about your day; you
cannot act on them except to navigate away. A daily log should open with the
thing you came to do, then show you what it means.

**P2 · Ten cards, one weight.** Every card has the same border, radius, padding
and title size, so nothing is more important than anything else. The page reads
as a list of widgets rather than a day. Premium products earn their feel largely
by *not* giving everything equal prominence.

**P2 · Three cards for three one-line inputs.** Gratitude, Reflection and Daily
memory are three separate bordered cards, each holding a single text field. They
are the same act — closing out the day — split into three containers.

**P3 · The date is stated twice — now three times.** The top bar shows
`Fri, Aug 28` in the date picker and `Today · Your daily log` above it; the page
masthead then says `Friday · August 28 · today`. Hoisting the dateline out of
the log card (so Morning and Evening are dated at all) made this worse, not
better. **Still open**, and the shape of the fix is known: the shell's Row 2
exists for Today only to hold the day chevrons, so moving those into the
masthead retires the row and ~56px with it. Not done here because it is a shell
change for one view and the saving is 6% of a phone screen — worth doing with
the next shell pass, not on its own.

## UI

**P1 · At 1440px the page is a 820px column with ~600px of empty gutter.** The
`read` tier is the right call for the log itself, but `Page` already supports an
`aside` rail, and this page has an obvious split: derived/read-only cards belong
in the rail, the log and the day's inputs in the column. Right now the desktop
layout is the phone layout, centred.

**P2 · The week strip has no legend.** Seven bars under Today's plan, all the
same pale yellow except Sunday. They are `weekCoverage` scores 0–1, but nothing
on screen says so — no scale, no axis, no tooltip visible at rest. A bar chart
where every bar looks identical is decoration, not data.

**P2 · "Energy" cannot distinguish unset from zero.** The four Wellbeing sliders
read 7, 3, 8 and "–". Energy is unset, but its handle sits at the far left, which
is exactly where a real 0 would sit. The value display knows the difference; the
control does not.

**P3 · Habit chips carry a second, unexplained icon.** Each chip has a small
outline glyph after the label. It is not labelled and does not look pressable.

## Copy

**P1 · The capture placeholder is a specification, not a prompt.**

> `Capture... e.g. bench 80x5, ran 5k 28min, mood 7, water 6, t call mom`

Five examples in one comma-run, mixing three different grammars (exercise,
metric, bullet prefix). It teaches nothing on a glance and is unreadable on a
phone. One example, rotating, would teach more.

**P1 · Two voices on one screen.** "Nine-Tails Sprint Protocol: 3 km run" with a
`Legendary` badge, three cards above "One thing you're grateful for today" and
"Where did you spend time that did not matter?". Gamified anime tone and calm
stationery tone, 800px apart. A premium product picks one and commits. (Which
one is the owner's call — the gratitude/reflection voice is the stronger and
more distinctive of the two.)

**P2 · "3 habits left · No workout yet · 17 tasks due" are stated as deficits.**
Three chips, all counting what you have not done, above a coach card that says
"Vitamins is slipping" and "Read streak is at risk". The first screen of the day
is a list of ways you are behind.

**P3 · "Your coach · What to focus on next, from your data"** — "from your data"
is engineer-speak for "based on what you have logged".

## Upgrades, ranked

1. ~~**P1 · Move capture to the top.**~~ ✅ Done. Capture sits **215px** from the
   top, was ~2,100px.
2. ~~**P1 · Use the rail on desktop.**~~ ✅ Done. `<Page aside={…}>`; every card
   now has a weight and a side (table below).
3. ~~**P1 · Rewrite the capture placeholder.**~~ ✅ Done — one example, picked by
   a stable hash of the logged date, so it teaches a different piece of the
   grammar each day and never changes mid-sentence.
4. **P2 · Pick a voice** and rewrite the penalty card or the reflection prompts
   to match it. **Still open** — the one item here that is a judgement call, not
   a fix.
5. ~~**P2 · Merge Gratitude + Reflection + Daily memory.**~~ ✅ Done — one "Close
   the day" card, three labelled fields, on a new `Field` primitive.
6. ~~**P2 · Give the week strip a scale**~~ ✅ Done — height is the primary
   encoding with a 2px floor, and each bar prints its own percentage.
7. ~~**P2 · Distinguish unset from 0** on the Wellbeing sliders.~~ ✅ Done — the
   sliders became `SegmentScale`: eleven dots, and `—` until one is tapped.
8. ~~**P3 · Drop the duplicated date** from the log card title.~~ ✅ Done, then
   re-opened one level up — see the P3 above.
9. ~~**P2 · The tab row carries no state.**~~ ✅ Done — each segment marks the
   surface whose own record is empty for the day, from a pure
   `surfaceUntouched()`. Each surface owns one record and they do not overlap
   (morning → the ratings, day → the log, evening → gratitude/memory). Habits
   are deliberately excluded: they render on two surfaces, so attributing them
   to either would clear the other tab's mark from the same tap.
10. ~~**P1 · `TodayPlanCard` ignored the day cursor.**~~ ✅ Done — every figure
    on it was computed against `todayISO()`, so stepping back a day on Morning
    left it reporting *today's* habits, tasks, workout and at-risk streaks
    under a header saying otherwise.

Also done while in here: the habit note buttons were bare 13px glyphs beside
each chip — under the 24px floor and reading as an eighth unexplained icon.
Now 24×24, grouped with their chip, quiet until hovered, focused, or holding a
note. "Mark all" became "Mark 3 left", through the Button system.

## Where each card lives now

One rule, and it is the same one in both layouts: **the left column is the
journal entry you are writing; the right rail is everything that reports on
it.** The per-surface split is in the Measured section above; this is the
**classic** layout, which shows every card on one page.

| Left (you write it) | | Right (it tells you something) | |
|---|---|---|---|
| Day log + capture | 10 | Today's plan | 7 |
| Today's habits | 9 | Your coach | 6 |
| Wellbeing | 8 | Make-up work | 4 |
| Write one line | 6 | Intermittent fasting | 4 |
| | | Weekly goals · On this day | 3 |

The dateline is not in either column: it heads the page, above the split, in
both layouts.

Measured at 1920 when the rail was introduced: page 3.5 → **2.4 screens**, left
gutter 245 → **163px**, column 808 → **908px**, rail 352 → **416px**.

## Leave alone

- The bullet grammar in the capture bar (`t` / `e` / `n` / `#tag`) is the
  product's actual idea and it works.
- Habit chips grouped by time of day (Morning / Afternoon / Evening / Anytime) —
  a genuinely good pattern, better than a flat list.
- Collapsed-by-default on Weekly goals and On this day.
- The status sentence in the masthead (`3 lines today · 2 still open.`) — it is
  the one line on the page that reads as prose rather than as a readout.
- **The three surfaces themselves.** They are a filter over one day record, not
  three pages: a card that appears on two of them is the same component both
  times, and no surface owns state. Do not give one its own copy of anything.
- The evening list being a list of real checkboxes (`CheckRow`), with the
  habit's colour on a `●` beside the name rather than on the box. The box is a
  control and reads from the one accent; the colour is identity.
