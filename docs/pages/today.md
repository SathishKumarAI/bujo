# Today

`src/views/Today.tsx` · nav: Journal → Today · `?view=today`

## What this page is

The daily log — and the app's home screen. In a bullet journal, this is where
you *write things down*: tasks, events, notes, in one line each. Everything else
in the product is downstream of what gets captured here.

## Measured (1440×900, demo data)

- **3.5 screens tall** (3,180px of content in a 900px viewport).
- **Ten top-level cards**, in this order:

| # | Card | Height | What it is |
|---|---|---|---|
| 1 | Today's plan | 275px | read-only summary |
| 2 | Your coach | 340px | read-only suggestions |
| 3 | Training penalty | 120px | read-only status |
| 4 | Today's habits | 403px | input |
| 5 | Wellbeing | 527px | input (4 sliders) |
| 6 | Intermittent fasting | 184px | input |
| 7 | **Sun, Aug 2 — the actual log** | 363px | **input, the point of the page** |
| 8 | Gratitude / Reflection / Daily memory | 462px | input (3 cards, 1 field each) |
| 9 | Weekly goals | 102px | collapsed |
| 10 | Stickers | 102px | collapsed |

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

**P3 · The date is stated twice.** The top bar shows `Sun, Aug 2` in the date
picker; the log card repeats it as its title with "Today" beneath.

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
6. **P2 · Give the week strip a scale**, or drop it to a sparkline with a single
   number. **Still open.**
7. ~~**P2 · Distinguish unset from 0** on the Wellbeing sliders.~~ ✅ Done — an
   unrated slider dims its track, parks at the midpoint and reads "not set",
   with `aria-valuetext` to match. Sleep also gained the anchors it was missing.
8. **P3 · Drop the duplicated date** from the log card title. **Still open.**

Also done while in here: the habit note buttons were bare 13px glyphs beside
each chip — under the 24px floor and reading as an eighth unexplained icon.
Now 24×24, grouped with their chip, quiet until hovered, focused, or holding a
note. "Mark all" became "Mark 3 left", through the Button system.

## Where each card lives now

One rule: **the left column is the journal entry you are writing; the right rail
is everything that reports on it.** The weight also sets order within a column.

| Left (you write it) | | Right (it tells you something) | |
|---|---|---|---|
| Day log + capture | 10 | Today's plan | 7 |
| Today's habits | 9 | Your coach | 6 |
| Wellbeing | 8 | Training penalty | 4 |
| Close the day | 6 | Intermittent fasting | 4 |
| | | Weekly goals · On this day | 3 |
| | | Stickers | 1 |

Measured at 1920: page 3.5 → **2.4 screens**, left gutter 245 → **163px**,
column 808 → **908px**, rail 352 → **416px**, rail height 983 → **1,348px**
against the column's 1,932 (it used to stop a third of the way down).

## Leave alone

- The bullet grammar in the capture bar (`t` / `e` / `n` / `#tag`) is the
  product's actual idea and it works.
- Habit chips grouped by time of day (Morning / Afternoon / Evening / Anytime) —
  a genuinely good pattern, better than a flat list.
- Collapsed-by-default on Weekly goals and Stickers.
- The `1/4 tasks done` footer on the log.
