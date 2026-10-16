# User control — what the person using this must always be able to do

A checklist with a specific origin. Home Workout shipped a history list whose
only affordance was a `×` that deleted a session **on the first click, with no
confirmation and no way to correct anything**.

> **Strength was worse, and it is the third adopter (COD-329).** It had **no
> history at all**: you logged a session, a rollup card appeared until your next
> keystroke, and after that the session existed only inside twelve analytics —
> so a set typed as `120` instead of `12` was permanent, while `updateWorkout`
> had been in the store the whole time. Rule 1 does not only mean "`add`
> without `edit` is a bug"; it means **a record with no LIST has no edit**,
> however many charts read it. Mistype one rep count and the
price was the whole session: the date, the duration, the notes and every other
exercise in it, retyped from memory.

The store had carried `updateWorkout(id, patch)` the entire time, with two call
sites in the app. The capability existed. The page never offered it.

That is the shape this file exists to catch, and it is not a UI preference —
it is the difference between a journal you trust and one you are careful
around. Check it against every surface that records something.

## The four rules

### 1 · Anything a person records, they can correct

If a view can `add` it, the same view can `edit` it. Not "delete and re-enter":
re-entering loses every field you did not get wrong, which is most of them.

**The test:** find the create path, then find the edit path. If there is no
second one, that is the finding. Grep the store for an `update*` — in this repo
the function usually already exists and is simply not called.

**What an edit must rewrite:** *every* stored shape of the thing, not the one
the list happens to render. A home session stores a human-readable `sets`
string **and** a structured `setRows`; rewriting the strings alone leaves the
muscle and volume analytics reporting pre-edit numbers for ever. Measured on the
fix: editing one exercise from `3×12` to `9×99` moved `setRows` from 12 to 18,
and a version that only rewrote the string would have looked identical on screen
and been wrong in every chart.

**The worst case is where nothing was stored to correct.** Nutrition's food log
folded a tapped food's four macros into four running totals and **threw the food
away** — so there was no entry to edit, no entry to delete, and no way to undo a
mis-tap at any price. Reported as *"if I enter a food item, I'm unable to edit it
or delete it"*, and the fix was a storage change (`LoggedFood[]` on the day)
before it could be a UI one. When rule 1 has no edit path, check whether the
record exists at all; an `add` that keeps only a sum is a write-only log.

And an edit moves the totals **by the delta, never by a recount** — the day's
numbers can also be typed by hand, and re-summing the log silently throws that
away. Same shape as the `setRows` case above, from the other end: there, one
stored shape was left stale; here, a recount would have destroyed the other one.

### 2 · Anything destructive asks first, and says what it is destroying

Not a generic "Are you sure?". Name the thing and its size: *"The 4 exercises
logged on Tue, Oct 13 are removed from your history. This cannot be undone."*
`useConfirm` from `components/ConfirmDialog` is the one implementation; Fitness
has used it since it was written, and the pages that skipped it are the ones
where a misclick was unrecoverable.

A destructive control also never sits alone: put the reversible action next to
it, and put it **first**. `Edit` before `×`.

### 3 · Every list of choices has an escape hatch

A chip row is a set of common answers, not the set of possible ones. If a
number can be anything, the row needs the typed input beside it — the pull-up
log form's `Rounds` and `Duration` rows both carry one, and that is the pattern.
A person whose answer is not on the row must not be stuck.

### 4 · Shortening what is drawn never shortens what is meant

A chip may read `H push` only if it still **announces** `Horizontal push` and
says so on hover. `ChipPick` takes a visible `label`, a separate `name` for the
accessible name, and a `hint` for the title, and its own comment states the
rule: *a shortened label is a shortened name unless it is said somewhere.*
The same applies to a truncated row: if the text is clipped, the full value
belongs in a `title` or an `aria-label`, or the layout is wrong.

## The review questions

Ask these of any page that records something, before calling it finished:

| Question | Where it has failed here |
|---|---|
| Can I fix a typo without deleting the record? | Home Workout history — no edit at all |
| Does delete ask, and name what it removes? | Home Workout history — deleted on first click |
| Does an edit rewrite every stored shape? | `sets` strings vs `setRows` |
| Can I answer something not on the chip row? | pull-up `Rounds`, which has the escape input |
| Is a shortened label still announced in full? | family and routine chips, via `name`/`hint` |
| Is the reversible action more prominent than the destructive one? | `Edit` placed before `×` |

## What this is not

It is not an argument for putting every field on every screen. The session
editor deliberately does **not** let you add or swap an exercise — that is
building a session, which the builder above it already does, and a second place
to do it is a second opinion about what a session holds. Flexibility means the
person can always reach the thing they need to change, not that every control
appears everywhere.
