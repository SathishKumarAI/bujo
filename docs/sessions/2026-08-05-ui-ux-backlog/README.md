# Session · UI/UX backlog build-out — 2026-08-05

Branch `feat/ui-ux-backlog`, off `fix/ui-ux-page-pass`.

Builds all eight items that the 2026-08-04 page pass documented in
`docs/sessions/2026-08-04-ui-ux-page-pass/BACKLOG.md` rather than fixing. Same
loop — observe, diagnose, prompt, fix, validate, record — with a Stage 0 audit
in front of the two page-contract rewrites, per the `page-contract` skill.

## What shipped

| Item | Outcome |
|---|---|
| **B-1** Plan · Week is a migration queue | Rebuilt on three zones with a real seven-day agenda |
| **B-2** Two "Pages read" on Reading | The finished-books one is "Pages finished" |
| **B-3** Mono face on prose facts | `StatFact.prose`, set on the five facts that are sentences |
| **B-4** All-equal bars in Exercise frequency | Scaled against training days, not the tallest row |
| **B-5** RPE under the touch floor | 44px tall — and **38 wide, not 44**, recorded as such |
| **B-6** Masonry holes on Insights / Mindset | New `MasonryGrid`, deliberately separate from `CardGrid` |
| **B-7** Nutrition's disabled "Add food" | Two jobs separated, labelled, and the disabled state explained |
| **B-8** Recovery over the card cap | Three reference blocks demoted; the page stays over the cap, on purpose |

## Two entries were wrong, and that is the useful part

**B-8's premise was stale.** It was written from a screenshot as "~20 cards,
needs grouping into three zones". The Stage 0 audit found Recovery already on
`PageLayout` with all three zones, its review zone already divided into titled
sections, and ten cards rather than twenty. The grouping the entry asked for
existed before the entry was written. What was actually left was the card cap —
a smaller, better-defined job than the one that had been queued.

The `page-contract` skill says to state this before Stage 3 rather than halfway
through it: *a brief written from the outside is often right about the intent
and wrong about the nouns.* Backlog entries written from screenshots are briefs
written from the outside, including one's own.

**B-5's fix does not fully land, and the note says so.** RPE segments are 44px
tall and 38px wide. The width cannot reach 44 inside a ~380px act column
whatever the row asks for — that needs a wider column or fewer segments, which
is a layout decision, not a class. Written into the code comment rather than
rounded up.

## One latent bug surfaced by moving code

`.zone-act :is(input, select, textarea) { display: block }` is unlayered, so it
beats Tailwind's `.hidden` in `@layer utilities`. Nothing about the .ics file
input changed — it had been hidden behind its own styled button since it was
written — but moving the import into an act zone made it reappear as a raw
"Choose File / No file chosen". Fixed at the rule with a `:not()`, not at the
call site.

The general form is worth keeping: **a blanket `display` on an element type will
eventually meet something that had a reason to be invisible.**

## Deviations from the contract, stated

- **Plan's zone 1 carries the week agenda as well as the fact bar**, against
  "one horizontal bar, at most four facts, ~64px". At 62% of the tier the seven
  columns are ~94px each and every task title truncates to "Back up p…". The cap
  exists to stop a fact bar growing into a stats card; the agenda is a different
  object, and it is the thing the page was missing.
- **Recovery stays above the two-raised-card cap**, at five. The contract
  anticipates one page in a cluster whose subject really is a collection of
  separately-actionable objects.

## Verification

`npx tsc -b` 0 · `npx vitest run` **741 / 51 files** · `npx eslint .` 0 errors,
2 pre-existing warnings · `npm run build` clean · `npm run a11y` **0 serious
across 80 scans**.

Plan, Mindset, Insights, Fitness, Nutrition and Recovery re-screenshotted at
1440; Plan also at 390, where the agenda scrolls inside its own container and
the page body does not.

## Not verified

- Themes other than mocha, beyond the a11y gate's mechanical sweep.
- **No test covers the week agenda.** It is the largest new component in the
  pass and it is held by screenshots. `weekDays` (week-start offset arithmetic)
  is the part most worth pinning — it is the one piece with a real off-by-one
  available to it.
- Insights and Mindset were not checked at 390 after the masonry change;
  `columns-1` below `md` means they render as a single stack there, which is the
  same as before, but that was reasoned rather than looked at.
