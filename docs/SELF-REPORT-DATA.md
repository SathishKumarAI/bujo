# Self-reported data, and the rules that keep it honest

Two subsystems shipped in the #311–#318 stretch — the Cycle page's pattern and
feelings engines, and Recovery's feedback ledger — read the same kind of data:
**numbers a person typed about their own body on a day they may or may not have
felt like typing anything.**

That is a specific kind of data with specific failure modes, and both engines
hit the same ones. This page is the rules they arrived at, so the third one does
not rediscover them.

Where the numbers live:

| File | Answers |
|---|---|
| `lib/cyclePatterns.ts` | what tends to happen, on which cycle day |
| `lib/cycleFeelings.ts` | does desire / mood / energy move with the cycle |
| `lib/ovulation.ts` | did a temperature shift happen, and how sure are we |
| `lib/recoveryFeedback.ts` | did that count for you or against you |
| `lib/addictionUnits.ts` | what "how much" means, per addiction |

---

## 1 · Absent is not zero. Ever.

A day with no mood logged did not score zero — it was not asked. This is written
down in four places in this repo and has been shipped wrong three times, which
is why it leads.

```ts
// Wrong, and it looks right:
const mean = values.reduce((a, b) => a + b, 0) / days.length

// Right:
const rated = values.filter((v) => v != null)
const mean = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null
```

Return `null` and let the caller decide what to render. The caller usually
renders the words "not rated", which is a true statement; a bar at the floor is
a false one.

**The test that hides it:** `expect(null).toBeGreaterThanOrEqual(0)` coerces and
passes. Assert `not.toBeNull()` first.

---

## 2 · A quiet week is not a good week

The recovery ledger's `ratio` is `resisted ÷ (resisted + slips)`, and it returns
`null` when both are zero rather than 0% or 100%.

This matters more than it looks. Someone opens that page to decide whether they
are getting better. A blank week scoring 100% makes the app a flattery machine;
scoring 0% punishes someone who simply had nothing to log. The honest output is
the word **quiet**, and copy that says a quiet log is not the same as a good
month.

Same shape as rule 1, one level up: rule 1 is about a missing *value*, this is
about a missing *period*.

---

## 3 · The denominator is what was observed, not what exists

The pattern grid shades a cell by `count ÷ observed`, never `count ÷ cycles`.

If only two of five cycles reach day 33, a symptom logged in both is **always**,
not 40%. Dividing by the cycle count makes every late-cycle row fade out purely
because long cycles are rarer — and that artefact looks exactly like a finding.

The general form: **the denominator is the set that could have answered**, not
the set that exists.

---

## 4 · A ratio needs both sides in the same currency

Shipped wrong for about ten minutes. Once an addiction could be measured in
minutes, the ledger divided urges *resisted* by minutes *scrolled*:

```
5 resisted  ÷  (5 + 235 minutes)  =  2% — for a month with five wins
                                        and two bad evenings
```

Events against events. The shared currency is "a moment that went one way or the
other": a 90-minute scroll is **one** decision, the same as one cigarette is. The
amount survives separately, for saying what it cost.

Whenever a quantity gains a unit, grep every place it is divided by, subtracted
from, or compared against something else.

---

## 5 · Say it in the unit the thing is actually measured in

"3 lapses" is a fact for cigarettes and meaningless for doomscrolling — three
sessions is twenty minutes or four hours and the page cannot tell which.

`lib/addictionUnits.ts` gives each addiction a unit, and `Relapse.count` is an
amount in it. Two consequences worth copying:

- **Duration units answer what it cost.** *"3h 55m in the last 30 days — about
  8m a day"* lands in a way *"31 sessions"* never does.
- **`totalMinutes` returns `null` for a count unit**, not 0. "No time lost" and
  "this is not measured in time" are different facts, and printing 0 hours
  beside cigarettes states a category error as a measurement.

---

## 6 · Set a floor before you say "usually"

Every claim in these engines has a minimum:

| Claim | Floor | Why |
|---|---|---|
| a pattern grid at all | 3 cycles | one is an anecdote, two is a coincidence |
| a phase average | 3 rated days | two is not a tendency |
| "usually day 24" | 2/3 of observed cycles | *usually* is a word with a meaning |
| a feelings peak | 0.5 points of 5 | below that is self-rating noise |
| a resisted-vs-followed contrast | 3 rows per side, 25-point gap | a comparison against one bad night is not a finding |

These are not tuning knobs. **Someone will repeat one of these sentences to a
clinician, or to a partner**, and a sentence generated from two coincidences is
the worst thing either engine could produce.

---

## 7 · Capture both outcomes, and never punish the bad one

An urge has two endings. Recording only the good one leaves the app unable to
answer its own central question, and the data it loses is the data worth having
— the times someone gave in are the ones they want fewer of.

So: one form, one `outcome` field, same fields either way. And then:

- the "gave in" button is **secondary, not destructive**;
- the toast says *"that is data, not a verdict"*;
- a slip renders in `peach`, never `red`;
- a test asserts **logging a slip can never raise the score**.

The last one is mechanical honesty; the first three are the reason anyone keeps
logging. An app that punishes the honest entry teaches people to stop making it,
and then it knows nothing at all.

---

## 8 · Make the seed contain the pattern the analysis claims to find

Every engine here was first seen against demo data, and every one of them
initially rendered as broken because the seed had no relationship in it.

- Uniform random cravings make the pattern grid evenly grey — a demo of the
  arithmetic working, not of the feature.
- A seed with only wins renders an empty "what was different" section, because
  the comparison needs three rows per side.
- `tempDisturbed` at `rand() > 0.97` produced **zero** disturbed days, so the
  detection skip path and the chart's hollow marker never rendered.

And the one that cost the most: **a seed test can pass while the browser shows
nothing.** `?demo=1` only seeded an empty journal, so a demo opened once was
frozen forever. `DEMO_VERSION` re-seeds a demo journal — never a real one — and
must be bumped whenever the seed gains a field a page renders.

---

## 9 · Say which claim is which

`cycleFeelings.ts` renders two things side by side and keeps them visibly apart:

- **measurements** — "your drive averaged 4.4 in your ovulation window";
- **physiology** — "oestrogen peaks, then LH surges".

The app measured the first and read the second in a textbook. Merging them would
let the physiology borrow the authority of the measurement. The card says so in
words: *"General physiology, not a reading of your data — this app measures
temperature and what you log, never hormones."*

The same rule produced the Cycle page's confidence ladder: `estimated` is the
calendar, `likely` is a temperature shift, `confirmed` is a shift plus a second
sign. A page that says "Luteal" identically whether it measured anything or not
cannot be trusted on the occasion it did.
