# Home workout

Train with what is in the room, and know why you are doing it that way.
83 movements, a written manual per movement family, and the citation ledger
behind every number.

## Where to look

| Change | File |
|---|---|
| Add or edit a movement | `src/lib/homeExerciseData.ts` |
| Types, filters, progression chains, video links | `src/lib/homeExercises.ts` |
| Family chapters (set-up, execution, the mistake, how to progress) and the sources | `src/lib/homeManual.ts` |
| Sets/reps/rest, overload levers, principles, kit, routines | `src/lib/homeProgramming.ts` |
| Which muscles a movement works | `src/lib/exerciseMuscles.ts` — **not** a field on the movement |
| The session builder (zone 2) | `src/components/homeworkout/SessionCard.tsx` |
| The catalogue and its filters (zone 3) | `src/components/homeworkout/ExerciseLibrary.tsx` |
| The manual rail and its chapters (zone 3) | `src/components/homeworkout/Manual.tsx` |
| Page shape, orient bar, history, calendar | `src/views/HomeWorkout.tsx` |
| Demo sessions the gates render against | `src/lib/demo.ts`, the `rand3` block |

## The shape

Three zones, per `docs/PAGE-SHAPE.md`.

| Zone | Holds |
|---|---|
| Orient | Days trained this week, against the two-day guideline; what is in the session you are building; the last session |
| Act | The session builder — a routine in one tap, or exercises added from the library |
| Review | Summary, the 26-week calendar, history, then the catalogue and the manual as reference |

The orient bar counts **distinct days, not sessions**. The guideline it reads
against is "two or more days a week", so two sessions on one Saturday is one
day against it.

## Rules this feature is holding up

**The view imports the data modules; it never restates them.** Commit 531596f
added "cards from the training guide" to `views/Pullups.tsx` by rewriting its
lists inline, cutting fourteen workout formats to three and nine progressions
to seven — with `tsc -b`, eslint, vitest and the build all green, because an
export nobody imports is not an error. `homeExercises.test.ts` and
`homeManual.test.ts` assert the counts, and that is the only thing that catches
it.

**Muscles are not a field here.** `lib/exerciseMuscles.ts` is the app's one
name → wger-muscle-id table and has ~20 callers; a second table would drift
within a month. `musclesOf` delegates, and the test fails if a movement added
here resolves to nothing. Arming that found nine gaps in the shared table —
"Pike push-ups" and "Diamond push-ups" resolved to the *chest*, and seven more
resolved to nothing at all.

**Routines carry exercise ids only.** The reps come from the library when the
routine is loaded, so a routine cannot hold a private opinion of what a push-up
set is.

**A new domain goes in the demo seed in the same change.** `homeWorkout` was a
domain the seed skipped, so three of this page's four review sections were the
empty branch at every theme and viewport the gates visit. Bump `DEMO_VERSION`
when the seed gains a field a page renders.

## Citations

`HOME_SOURCES` is 31 references and **every URL was fetched and returned
readable content.** That is the rule, not a nicety: the first draft of the list
cited five PubMed abstracts, the NSCA position-statement index and a Mayo
Clinic article — the obvious, correct-looking sources — and *none of them
opens*. PubMed serves a cookie wall with no abstract, `nsca.com` and
`mayoclinic.org` answer 403, and the ACSM position stand is 402 on
`journals.lww.com`. A citation that does not open is worse than none, because
it looks checked. `homeManual.test.ts` refuses those hosts by name.

The visible consequence: the famous **ACSM 2009 rep/load/rest table** and the
**"+2–10% load when you clear the target by 1–2 reps"** rule are absent from
`HOME_GOALS`, despite being what everyone quotes. They could not be read.

Number citations and cue citations are **separate fields**, and an empty cue
list is a real answer the page prints. No reachable authority publishes cues
for a pike push-up, a Pallof press, a dip, a burpee or a jumping jack, so
`conditioning` carries none and says so rather than borrowing a public-health
guideline's authority for a form cue. Three ACE pages describe a barbell
variant; `cueNote` says so at the call site.

### What this manual does not claim

Enforced by a test over every string in the data, not by intention:

- that a cue prevents an injury, or that an error causes one;
- any treatment, rehabilitation or diagnosis claim;
- any prescription for the high-rep/low-load band — the only verified number
  there is a *classification* (`<30% 1RM, >20 reps`), and the row says so.

Every "why" in the manual is mechanical — where the load sits, which way the
joint is travelling — because that is the only kind of "why" the sources give.
`HOME_SAFETY` is the single place allowed to mention pain or a health
professional, and it uses the NHS's own wording.

## Known gate ceiling

The manual is a `SectionRail`, and a rail has no `aria-expanded`, so
`openFolds()` in `scripts/a11y-axe.mjs` scans whichever chapter the page opens
on and never sees the other eleven. The fold count it prints is **not**
coverage (COD-237).

Driven per chapter by hand instead, against the built bundle on a confirmed
port: 12 chapters × mocha, latte, neon, vscode, dawn at 1440, plus 12 chapters
at 390 — **0 violations of any impact**, after the `VideoLink` contrast fix
that the same sweep found.
