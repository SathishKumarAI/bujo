# 2026-11-15: Today said once, Insights in two columns, a year of Mindset cards

Written to be read cold: what shipped, what was measured, what the owner
said, and what is still open. PRs #570–#587. **Production is at #586**
(`index-vD7WmtKN.js`, checked against a local build after the deploy).

## The asks, in the owner's words

- Timers: "in mobile the rounds in points are not changed".
- Today: "work on the today task table in desktop as well as in the mobile
  version. Make it more usable and remove the duplicated things … I don't
  think we need the calendar in mobile and again on [desktop], keep only one".
- Desktop top bar holding only "Sat, Nov 14": "include this into the top
  bar, why waste space".
- "Especially in desktop Insights it's looking too bad … a lot of wastage of
  the scrolls and content is duplicated."
- Mindset: "add 100 quotes and practice … 365 … more practical, leadership
  and development".
- "Complete all the pending tasks", then "deploy this and start the
  documentation".
- On the desktop bar "Sat, Nov 14 · 3 lines today": "add this to the top of
  the cards for Today only, why one more bar".
- "Mindset does not have all the 365 cards, check and fix this."

## What shipped

| PR | What | Measured |
|---|---|---|
| #570 | Timer sheet header says its plan as lines ("8 rounds / 20 s on / 10 s off"), like the card | axe 0 on the open sheet |
| #572 | Today: one date, no repeated habit count, no week rings or status strip on desktop, tick habit cards 88 → 56px | desktop 1.60 → 1.35 screens; phone 4.43 → 4.20 |
| #573 | Today's status line portals into the desktop page header beside the date stepper | Habits heading y 259 → 177; 1.35 → 1.26 screens |
| #575 | Insights: two columns beside the rail; stat bar and repeated figures gone | Mood & sleep 5.27 → 3.17 screens; All 13.83 → 8.27 |
| #576 | Mindset library opens on one shelf on a desktop too | 3.7 → 1.4 screens (the only desktop page over budget) |
| #578 | Mindset: 365 daily cards; library 46 → 100 principles (Leadership, Self-development) | 2503 tests; desktop 1.4 → 1.6 screens |
| #579 | COD-631: `api/sync.test.ts` was a live production function; `process` typed for Vercel | `vercel build` 3 TS errors → 0; `/api/sync.test` now 404 |
| #580 | Phone copy: "50+" → "50 or more", " + " → "and" | plain tests 17 |
| #581 | Interval timer on a short screen keeps every control on it | Save 645–689 → 607–651 in a 664px viewport |
| #582 | COD-575: the a11y gate opens three sheets on every phone page | 101 → 135 scans, 34 sheets, 0 serious |
| #585 | Today: the date stepper and status line are one row on the cards; no bar above the page (replaces #573's header slot) | 1.27 screens; no bar |
| #586 | Mindset: every card reachable — ‹ ›, All 365 (a sheet of every card), Today's card | sheet lists 365 rows, axe 0, desktop and phone |

## The shapes, as they are now

**Today.**
- One date per device. Desktop: one row at the top of the cards — the stepper
  ("‹ Sat, Nov 14 ›"), then the day's status line (`DayMasthead`).
  `PageHeader` draws no bar for Today unless the rail is hidden. The
  masthead's dateline is `sr-only` at every width.
- A phone's Today logs today: no day picker. Backfilling is Plan and the log
  pages.
- The masthead says only what no card says: lines, open tasks, streaks at
  risk. The habit count is the Habits card's.
- Desktop grid is three rows, so writing sits under the log and fasting under
  the check-in with no hole.

**Insights.**
- Domain cards in two columns from a 52rem pane (`MasonryGrid` asks for 64rem;
  the pane is 902px at 1440).
- No stat bar. The digest's "Avg mood" shows only when Momentum cannot draw;
  the coach's r= line only when there is no Patterns card.
- Weekly review and Find & filter side by side.

**Mindset.**
- `DailyCard` under the leading principle: a quotation (and its source, when
  documented), then "Try today", one thing under 15 minutes. ‹ › step a card
  (wrapping), "All 365" lists every card in a sheet, "Today's card" returns.
- `lib/mindsetDaily/`: four theme files (leadership 92, growth 91, habits 91,
  resilience 91) dealt in turn. Day N of the year gets card N; a leap day
  wraps to card 1.
- The library is 100 principles in 11 categories; Leadership (Flag) and
  Self-development (GraduationCap) are new. It opens on the leading principle's
  shelf.

## What I got wrong, and what caught it

- **`text-body-lg` does not exist.** The daily card's quote would have
  inherited a size silently; caught by listing the tokens before using one.
- **The four card files were written in parallel and shared 53 quotations.**
  The uniqueness test listed them; each was replaced with an original line that
  fits the card's practice.
- **Three quotations had no findable source** (a Drucker line, William James's
  "uncompleted task", Samuel Johnson's "chains of habit"). Rewritten in the
  app's own words with an empty `by` rather than kept under a guessed name.
- **`categoryCounts` asserted a literal 9.** Adding two categories failed it;
  it now reads the category count.
- **Two wrong shapes for Today's date before the right one.** #573 moved the
  status line into the page header, which was still a bar; the owner wanted no
  bar at all, and #585 put both on the cards.
- **365 cards with one reachable.** The data test counted 365 and passed while
  the page offered no control; the owner found it. A count test is not a
  reachability test — #586's test picks a card from the list.
- **The first deploy-then-check read the old bundle.** The alias served the
  previous build for a few seconds (edge cache HIT); a second request got the
  new one. Check twice before calling a deploy wrong.

## Traps found

- **A deploy reinstalls `node_modules` under a running dev server**, and Vite
  answers `504 (Outdated Optimize Dep)`: a blank page that is not the change.
  Restart the dev server after `ship.sh`.
- **Every file in `api/` is a Vercel function**, tests included. An underscore
  prefix keeps a file out; vitest still finds it.
- **`MasonryGrid` beside a rail never reaches its second column at 1440.** A
  page with a rail needs its own threshold, measured against the pane.

## Open

- **Tab bar:** ask the owner before taking it off any page beyond the three
  workout days.
- **Mindset:** a daily card has no "done today" tick; adding one needs storage.
  Ask first.
- **Home workout and Coaching's shots and drills** did not appear in the phone
  sheet scan; their rows may open sheets without `aria-haspopup`. Check before
  trusting the 34.
