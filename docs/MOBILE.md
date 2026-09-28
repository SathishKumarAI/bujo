# MOBILE.md — the phone, measured

The target is a real device, not "small": **iPhone 13 Pro, 390 × 844 CSS px,
DPR 3, in Chrome — which on iOS is WebKit**. Everything here is a number taken
off a running browser at that size, against `?demo=1` on a preview server
verified to be serving this worktree's own bundle. Where a claim could not be
measured here, it says so instead of rounding up to "fixed".

Companion to `DESIGN.md` (what things look like) and `docs/PAGE-SHAPE.md` (where
they go). This file is only about what changes when the pointer is a thumb.

## How to take these numbers again

```
npx vite build
npx vite preview --port 4173 --strictPort &
BUJO_URL=http://localhost:4173 node scripts/phone-probe.mjs
```

`scripts/phone-probe.mjs` drives Chromium at 390×844 / dpr 3 / `isMobile` /
`hasTouch` over the same view list `a11y-axe.mjs` walks, with the same fold and
lazy-mount passes, and reports per view: page height in screens, controls under
44 × 44, inputs under 16px, document width, and what sits in the safe-area
bands. `--json out.json` writes the raw rows so two runs can be diffed.

It is a **probe, not a gate** — it prints numbers and always exits 0. A gate
needs a threshold, and the right threshold here is not 44px (see below).

## Findings, worst first

Measured at `003f5f2` (the branch point), 22 views, mocha.

| # | Finding | Number | State |
|---|---|---|---|
| 1 | The focus-zoom guard did not apply in landscape | **5 of 5** inputs at 15px at 844 × 390 | fixed |
| 2 | `min-height: 100vh` sizes every page against a viewport iOS does not show | 844px declared vs **~745px** visible | fixed |
| 3 | The app's three global controls are under the touch floor | Quick add **36 × 28**, Relay **28 × 28**, menu **28 × 28**, on 18 views | fixed |
| 4 | A `.reveal` control is visible but has no box | delete entry **8 × 23** (184px²), remove person **7 × 19** | fixed |
| 5 | Two native checkboxes have no size class | **13 × 13**, one of them the workout logger's tick | fixed |
| 6 | Vertical cost: six views over 5 phone screens | Mindset **9.0**, Strength **7.5**, Today **6.3** | not fixed — see below |
| 7 | 6 of 10 Body tabs need a horizontal swipe | row holds 888px in a 358px scroller | not fixed — by design |
| 8 | Shell chrome is 18% of the screen before Chrome's own | header 104 + nav 48 of 844 | partly worsened, deliberately |
| 9 | Nothing overflows horizontally | `documentElement.scrollWidth` = **390** on all 22 views | already correct |
| 10 | Safe-area insets are handled | top on `.app-header`, bottom on `BottomNav` | already correct |

### 1 · The 16px guard asked the wrong question

`src/index.css` forced `font-size: 16px` on inputs under `@media (max-width:
640px)`, under a comment reading *"Force 16px on phones so focusing an input
never triggers that jarring page zoom"*. The comment was the only record of the
claim — it is in neither `CLAUDE.md` nor `docs/ACCESSIBILITY.md` — and it was
half true. An iPhone 13 Pro **in landscape is 844px wide**, so the rule never fired in the orientation people fill a form
in. Measured at 844 × 390: **5 of 5** rendered fields computed to 15px, and iOS
zooms the page on focus below 16.

Width is a guess at "a phone". The real condition is the input method:

```css
@media (hover: none) and (pointer: coarse) {
  input:not([type='checkbox']):not([type='radio']), textarea, select {
    font-size: max(16px, var(--text-body));
  }
}
```

`max()` rather than a flat `16px`, because a hard px type size is the one thing
`PRODUCT.md` forbids — it opts every input out of the global text-size setting.
The zoom triggers on the *computed* px, which can no longer fall under 16, and
a reader who turns the text size up still gets a bigger field.

**After: 0 of 5 under 16px in landscape, 0 of 5 in portrait.**

### 2 · `100vh` is the viewport iOS would have if its toolbars went away

On iOS, `100vh` resolves to the **large** viewport — 844px on this device — not
to what you can see. With both Chrome toolbars showing, the visible band is
about 745px. `html, body, #root { min-height: 100vh }` therefore made every page
at least 844px tall: **99px of forced scroll on a page with nothing to scroll**,
which is also enough travel to trigger `useHideOnScroll` and slide the bottom
nav — the phone's only navigation — out of the way for no reason.

Now `min-height: 100dvh`, with the `vh` line kept in front as the fallback.

The enlarge modals and the four sheet offsets went to **`svh`**, and the
difference matters:

| Unit | Is | Right for |
|---|---|---|
| `vh` | the large viewport | nothing, on a phone |
| `dvh` | the current viewport, changes as toolbars move | the page's own `min-height` |
| `svh` | the small viewport, constant | a floating panel — it fits whatever the toolbars do, and does not resize under the soft keyboard |

A `max-h-[92vh]` panel was 776px inside a 745px band, i.e. its buttons under
Chrome's toolbar.

**This is the one finding that cannot be verified here.** Desktop Chromium has
no retracting toolbar, so `vh == dvh == svh` by construction and the probe reads
844 either way. What is verified is the landscape number above, that the units
reach the built CSS, and that no gate went red. Believe it on an actual iPhone
before writing it down as proven.

### 3 · The most-pressed control in the product was 36 × 28

`PRODUCT.md` ranks capture first — "many times a day". On a phone, capture is
the header's **Quick add**, and it measured 36 × 28 in the top-right corner of
an 844px screen: the smallest target in the shell, in the least reachable
corner, for the thing the app exists to do. Ask Relay (the same job said out
loud) and the account menu — the only door to Settings, Help and the command
palette — were 28 × 28 beside it. All three on all 18 views.

Fixed behind a new `.touch-target` utility, `@media (hover: none)` only:

```
before  relay 28x28 @x270 · quick add 36x28 @x304 · menu 28x28 @x346
after   relay 44x44 @x230 · quick add 44x44 @x280 · menu 44x44 @x330
```

The room was measured first: at 390px the brand ends at x118 and the cluster
started at x259, so there were **141px** spare. The cluster is now 155px wide
and still 101px clear. `DateNav`'s Previous / Next / date button got the same
treatment.

**Why a class and not a change to the `icon-sm` token.** See the next section —
this is the whole reason the 44px number is not a gate.

### 4 · 83% of controls are under 44px and that is mostly correct

| Floor | Standard | Under it |
|---|---|---|
| 44 × 44 | WCAG 2.5.5, **AAA** | 1367 of 1653 (83%) |
| 24 × 24 | WCAG 2.5.8, **AA** — the repo's actual floor | 547 either axis · 386 both |

A sweep over the primitive would be wrong, and the counts say why:

- **Density is a feature** (`PRODUCT.md`). 330 of those 1367 are Today's habit
  and water grid cells at 16 × 16, by design. 55 are the eleven steps of a mood
  scale, which cannot be 44 wide because 11 × 44 = 484 in a 390px viewport.
- **Growing a small control in a dense cluster moves the tap onto its
  neighbour.** On Today alone, 99 sub-44 controls form 212 horizontally-adjacent
  pairs, **52 of them closer than 16px and the tightest 2px**. At 44 each those
  hit areas overlap and a tap lands on whichever element is later in the DOM.
  `button.tsx` already argued this; the numbers are now behind it.

So the floor is **opt-in per cluster, after measuring that cluster's room**.
What is genuinely wrong is a control with no box at all, and there were three
kinds:

| Where | Was | Now |
|---|---|---|
| `.reveal` buttons — delete entry, remove person, remove book | 8 × 23 / 7 × 19 | **36 × 36** on touch |
| `DayChecklist` / `HabitEditor` native checkboxes | 13 × 13 (UA default) | **24 × 24** |
| `VideoLink` with `label=""` | 16 × 16 | **24 × 24** floor in the component |

`.reveal` got 36 and not 44 on purpose: `EntryRow`'s `!` priority toggle is
24 × 24 immediately to its left, and 44 would overlap it. 36 is 7× the area of
the 8 × 23 box without moving the tap.

**Neither rendering gate could see any of this, and both were right to be
quiet.** `clipped-text` asks whether an element shows less than it holds, and a
`×` shows all of itself. axe asks whether the accessibility tree is sound, and
these are focusable and named. Same family as the transparent sticky rail: a
geometric defect with no judgement in it that no gate is shaped to catch.

### 6 · Vertical cost — the thing that was not fixed

`npm run space` at 390 × 844, shipped / with every fold open. Over 3 screens is
a page you cannot hold in your head; these are phone numbers, so read them
against a longer budget, but six views are over **five**:

| View | shipped | open |
|---|---|---|
| mindset | 8.8 | 8.8 |
| gym | 3.2 | **7.2** |
| trackers | 5.3 | 6.0 |
| pickleball | 4.8 | 5.2 |
| help | 2.7 | 5.1 |
| nofap | 5.0 | 5.0 |
| today | 4.3 | 5.9 |

Not touched here, deliberately. `docs/PAGE-SHAPE.md` already establishes what
fixes this and it is not a mobile change: **the lever is removing content from
the page, not reflowing it** — Insights went 6.3 → 1.8 desktop screens because
five of six groups stopped rendering. Mindset at 8.8 phone screens is a
page-shape job (a rail over its library), sized in days, and doing it inside a
touch-target pass would bury it.

### 7 · The Body tab row holds 888px in a 358px scroller

Six of ten tabs need a horizontal swipe at 390px. This is not a bug:
`SectionTabs` centres the active tab on mount, on `fonts.ready` and on resize,
so the tab that matches the page is always the one you can see, and the comment
above that effect records the two ways it was got wrong before. A scrolling tab
row is a legitimate phone pattern and the alternative — wrapping to two rows —
costs 44px of every screen.

Worth knowing rather than fixing. If the Body cluster grows again, the answer is
the same one `PAGE-SHAPE.md` gives for more than ~4 groups.

### 8 · Chrome, ours and theirs

At 390 × 844, with the demo banner dismissed:

| | px | of 844 |
|---|---|---|
| our header | 104 → **120** after the touch targets | 14% |
| our bottom nav | 48 (+ `env(safe-area-inset-bottom)`) | 6% |
| Chrome iOS's own top + bottom toolbars | ~99 | 12% |
| **total** | **~267** | **32%** |

The +16px of header is the price of the three 44px controls and is stated rather
than hidden. `phone-probe` measures it as ~0.03 screens per view — across its 18
views, **73.52 → 74.08**.

`npm run space` disagrees, and the disagreement is instructive rather than
worrying: it reports every phone page **flat or 0.1 shorter** (trackers 5.3 →
5.2, pullups 3.9 → 3.8, mindset 8.8 → 8.7, reading 3.9 → 3.8 open). The two
instruments are measuring different DOMs — the probe opens every fold and fires
every `LazyMount` before it measures, `space-audit` reports shipped and open
separately and navigates by URL. Neither shows a regression worth a decimal
place; quote whichever one you also quoted before, and never mix them.

### 9 · No horizontal overflow

`document.documentElement.scrollWidth` is **390 on all 22 views**, and
`npm run clipped` reports *"No clipped or off-screen text across 24 views at
1440px and 1024px and 390px"*. The `grid-cols-N` / implicit-track trap in
`CLAUDE.md` is holding.

### 10 · Safe-area insets are already right

- `viewport-fit=cover` is set, without which `env()` is always 0.
- `.app-header` carries `padding-top: max(0.625rem, env(safe-area-inset-top))`
  inside an `@supports`, so the notch is cleared and nothing regresses where
  `env()` is unknown.
- `BottomNav` carries `paddingBottom: env(safe-area-inset-bottom)`, measured at
  the bottom edge (top 796, bottom 844 in an 844px viewport).
- `#main` carries `pb-24` (96px), which clears the 48px bar plus a 34px home
  indicator with 14px to spare.

Chromium reports `env(safe-area-inset-*)` as **0** and there is no way to
emulate a notch, so the mechanism is verified, not the pixels.

## iOS / Chrome traps, so nobody rediscovers them

**Chrome on iOS is WebKit.** There is no Blink on that platform. A bug you
reproduce in desktop Chrome is not necessarily the bug on the device, and — the
direction that costs more — a bug on the device may be invisible in every
Chromium you have.

**`env(safe-area-inset-bottom)` is 0 in a browser tab and 34px in a home-screen
PWA.** Both are correct: in browser mode Chrome's own toolbar occupies that
band. So the bottom nav sits directly above Chrome's toolbar in a tab and above
the home indicator when installed, from the same one line of CSS. Do not
"correct" the 0 with a hard-coded 34.

**A fixed element is pinned to the *visual* viewport on iOS, but `100vh` is the
*large* one.** That combination is why a bottom bar looks right while the page
under it is 99px too tall.

**`svh` for a floating panel, `dvh` for the page.** `dvh` on a modal resizes it
while the soft keyboard opens.

**`@media (max-width: …)` is not "a phone".** Landscape is 844px wide. Ask
`(hover: none) and (pointer: coarse)`.

**A preview port cannot be identified by its `<title>`** — every worktree serves
the same one. Compare the served `assets/index-*.js` against your own
`dist/index.html`. (Already in `CLAUDE.md`; it bit this pass too, from the other
side: the shared `node_modules` this worktree was junctioned to had its
`--no-save` Playwright pruned by another session mid-run, and the a11y gate
exited **silently with no table**. An empty gate output is never a pass.)

## What was deliberately not changed

| Left alone | Why |
|---|---|
| Quick add's **position** in the top-right corner | It is 44 × 44 now, but it is still in the hardest corner for a right thumb on an 844px screen — 6 of 16 shell controls sit above y281. Moving capture into the thumb zone is a shell redesign with a product argument already on the record (`BottomNav`: "no centre FAB. Capture lives in the top bar's Quick add"), not a touch-target fix. **COD-259.** |
| `Card`'s ⓘ / ⛶ / ⌄ at **24 × 24** | Already a deliberate, documented decision that clears WCAG 2.5.8's AA floor exactly (`ui.tsx`, `CARD.headerButton`). Three of them sit adjacent in a card header; 44 each would be 132px against a truncating title. |
| The **16 × 16 habit grid cells** and the 11-step mood scale | `PRODUCT.md`: density is a feature. The scale physically cannot be 44 wide at 390. |
| `icon-sm` (28px) in dense clusters | 52 pairs closer than 16px on Today alone. Growing them moves taps onto neighbours. |
| The **six long views** (Mindset 8.8 screens, …) | A page-shape job, not a mobile one. See above. |
| `layout.css`'s `max-height: calc(100vh - …)` | Behind a `@container (min-width: 1365px)` query — no phone ever reaches it. |
| **Search having no on-screen door** | From Today at scroll 0, scanning every visible control for /search\|find\|command/ returns **zero**; it is ⌘K — not a door on a phone — or four taps through a twelve-item account menu. Information architecture, not sizing. **COD-260.** |

## Taps, measured

| Task | Taps | Note |
|---|---|---|
| Log one line from any page | **2** | Quick add → type → Enter. The sheet auto-focuses its input, so the keyboard opens on tap 1. |
| Find something you logged | **≥4** | No on-screen search door; account menu → Command palette → type → pick. |

Capture is two taps and that is as good as it gets. Retrieval is the asymmetry:
the product's own ranking puts "capture" first and reading back further down,
but four taps behind a twelve-item menu is further down than the ranking asks
for. Filed as **COD-260**, with **COD-259** beside it — they are the same
question (what the phone's reachable chrome is allowed to hold) and answering
them apart is how a shell ends up with two opinions.
