# STATUS

**Stopped:** 2026-09-15, on `main`. Seven PRs merged this session: **#219**
centred nav, **#220** capture receipt, **#221** header overflow fix (a
regression from #219), **#222** the capture ring, **#223** Trackers wired to
it, **#224** the rename, **#225** this file, **#226** the full name and the
docs.

All gates green at the end: `npm run verify` — **1047 tests across 83 files**,
tsc, eslint (one pre-existing `react-hooks/exhaustive-deps` warning in
`App.tsx`, zero errors), build — plus `a11y` (0 serious/critical), `clipped`
(clean at 1440, **1024** and 390), `smoke` (25/25), `design` (308 files),
`contrast` (5 themes).

## The product has names now

**The app is Cadence Journal. The capture assistant is Relay.**

- **Cadence Journal** in full — `<title>`, the PWA manifest, README, PRODUCT.md.
- **Cadence** alone in the header, because a header is a place you are already
  standing.
- **Relay** on the microphone and its dialog: "Ask Relay".

User-visible copy only. The repo, the package, the `bujo:` storage keys and
`bujo.json` keep the old name **on purpose**: a renamed storage key does not
migrate a journal, it orphans one, and `bujo.json` is the contract with folders
already syncing.

**Docs written before 2026-09-15 say `bujo` and are left that way** — a session
log, a dated hosting note or an archived prompt is a *record*, and editing it to
match today's name falsifies it. Only the living docs were renamed: `README`,
`PRODUCT.md`, `docs/WHY.md`, `docs/FEATURE_GUIDE.md`,
`docs/features/daily-use-guide.md`, `docs/pages/welcome.md`,
`docs/ARCHITECTURE.md`, `TASKS.md`. The "BuJo" in citations of Ryder Carroll's
paper method is a different word and was not touched.

## What the capture loop does now

Say or type a sentence → Relay works out which page owns the record, writes it,
**moves the app to that page**, leaves a receipt naming what was written with
Undo, and **rings the row it wrote** for six seconds after scrolling it into
view.

- `lib/captureLanding.ts` — kind → view, exhaustive over `RecordKind` with a
  `never` at the end, so a new kind fails the typecheck rather than landing on
  Today.
- `lib/recordKeys.ts` — the fingerprint diff that decides what to ring.
- `components/CaptureReceipt.tsx` — the bar, the navigation and the ring set.

## Next session — start here

Read `docs/WORKLOG.md`'s top entry for what happened and why; this file is only
the re-entry state. Then pick from the list below — it is ordered, and item 1
is the one a user would notice.

The capture loop's remaining gaps, in the order they are worth doing:

1. **Gym cannot ring anything** — it is a session builder, charts and PRs, with
   no per-workout row. A captured lift lands there with the receipt naming it
   and nothing to point at. Either give Gym a session list or accept it.
2. **The three alternative Trackers layouts** (`GridCardsLayout`,
   `ActivityLayout`, `RadialTracker`) draw their own habit cells and are not
   wired.
3. **Undo does not navigate back** — it removes the record and clears the bar,
   leaving you on the page you were taken to.
4. The command palette does not route through the receipt.

## Decisions that will surprise you later

- **`justify-content: center` on a scrolling row is a navigation bug.** It
  distributes *negative* free space, so an overflowing row is pushed off BOTH
  edges and `scrollLeft` cannot go below zero — the leading tabs become
  unreachable by scrolling, by keyboard, by anything. The header tab row is
  centred by **auto margins on the first and last tab**, which collapse to 0 the
  moment free space goes negative. Do not "simplify" them back.
- **`minmax(0,1fr)` has no content floor, and `1fr` does.** The centring grid
  shipped with `minmax(0,1fr)` and gave the tool cluster a column narrower than
  its contents between ~768 and ~1180px. A flex row justified to the end
  overflows *backwards*, so the streak strip was drawn across the section nav —
  125px of overlap at 1024, on every view, with `body.scrollWidth` equal to the
  window the whole time. Both rendering gates were green because `clipped` ran
  at 1440 and 390 only. **A responsive layout fails between breakpoints, not at
  them.**
- **Three separate things produce phantom overlaps** and all three cost a detour
  before anything was fixed: content inside a **closed `<details>`** still has a
  rect (94 fake hits on Coaching), elements **scrolled out of a scrollport**
  still intersect in coordinate space, and an **inline box that wraps** has a
  bounding rect spanning both lines. Use `checkVisibility()`, clip to
  scrollports, and compare `getClientRects()` per line.
- **`display: contents` generates no box.** A wrapper used to keep a grid intact
  made `getBoundingClientRect` 0x0 and `scrollIntoView` a silent no-op — the
  chart dot drew correctly at y=1271 in a 900px window on a page that never
  scrolled.
- **A metric key must be per FIELD, not per day.** `DailyMetric` is one row of
  eleven numbers; a day-level key made "mood 7" mark mood, stress AND sleep —
  two readings given days earlier, presented as just-captured.
- **`useJustCaptured` tolerates a missing provider and `useCaptureReceipt` does
  not.** Writing must be loud ("saved but did not move" is invisible); reading
  is a decoration, and an empty set is the honest answer.
- **Three gates assert the app's identity by `document.title`** —
  `smoke-views.mjs`, `column-audit.mjs`, `type-census.mjs` — and all three now
  expect "Cadence". That is what proves a rename reached the built app.
- **`a11y` now scans two things no view-walking gate can reach**: the receipt
  bar and the ringed row, in five themes, asserting both are on screen first. A
  surface that only exists after an action cannot fail a gate that only
  navigates.
- **Demo data is persisted, not regenerated** — re-seed via Settings → Data →
  Load demo data after editing `src/lib/demo.ts`.

## Before you start

- `npm run verify` first, so a red gate is attributable to you rather than
  inherited. It takes about two minutes; the browser gates take ten.
- The dev-server trap still applies: **check the port's command line before
  believing a screenshot.** `learn/dsa_problems` holds 5173 on this machine, and
  every gate here defaults to 4173 (`vite preview`).
- The preview server serves `dist/`, so **rebuild before running a browser
  gate**. A red `clipped` this session was a stale `dist/` — `verify`'s build
  never ran because eslint failed first, and the gate faithfully reported the
  bug from the previous commit.

## Environment

**Plane was unreachable all session** (`localhost:8080` refused), so none of the
five PRs is linked to a work item. If the board matters, they need filing by
hand: the capture loop (#220, #222, #223), the header regression (#221) and the
rename (#224).
