# One chrome: the top bar comes down, the rail takes everything

Asked for directly: *"take down the top nav bar and move all features to the
sidebar."* Written before any code, because three things about this are not
obvious from looking at the screen, and one of them is a hard blocker that has
to be designed around rather than discovered.

## Where things are now, measured

At 1707×872 on `?demo=1`, desktop:

| | |
|---|---|
| header height | **59px**, full content width |
| `--header-h` | 58.76px, published by `useHeaderHeight` off `.app-header` |
| rail | 208 × 872, **last item's bottom at 860** — it is already full |
| `<main>` top | 59 |

The header holds, left to right: the rail toggle (only while the rail is
hidden), the page title + subtitle, `DateNav`, the microphone, Quick add, and
`AccountMenu`. Below `md` it also holds `Brand`, the phone search button, the
`SectionTabs` row and a second `DateNav`.

## The three things that make this not a move

### 1 · The rail has no free vertical

Its last item already sits at 860 of 872. "Move all features to the sidebar"
is not a matter of appending four controls — the rail needs its own layout
with a middle that scrolls and a floor that does not.

**Decision.** Three regions:

```
head    search + collapse            fixed
body    sections, section tabs       scrolls
foot    Quick add, Relay, week, you  fixed
```

`min-h-0 overflow-y-auto` on the body is what lets the foot stay put when Body's
twelve tabs are showing. Without it the foot is pushed off the bottom on exactly
the section that has the most to navigate.

### 2 · Six things read `--header-h`, and one of them breaks at zero

`LibraryBar` (`sticky top-[var(--header-h)]`), `SectionRail`
(`top-[calc(var(--header-h,4rem)+0.75rem)]`), three `scroll-mt` anchors, and
`PageLayout`:

```js
const header = parseFloat(...getPropertyValue('--header-h')) || 56
```

**`|| 56` is a bug the moment the real answer is 0** — `parseFloat('0px')` is
falsy, so a genuinely headerless layout would be told the header is 56px and
would refuse stickiness to a column that deserves it. It has been correct only
because the value has never been zero.

**Decision.** The variable keeps meaning *"chrome above the content"*, because
there still is some — see below. `useHeaderHeight` measures whichever chrome
element exists. `PageLayout`'s fallback becomes `Number.isFinite(...) ? v : 56`
so that zero is allowed to mean zero.

### 3 · Hiding the rail would leave no chrome at all — the blocker

Today ⌘B hides the rail and the header carries the toggle back. Delete the
header and there is nothing: no toggle, no Quick add, no account, no way back.
Quick add is `primaryScope={SHELL_SCOPE}`, the app's single primary action.

**Decision.** The page title does not move into the rail. It moves **into the
content column as a page header**, and that strip is what survives the rail
being hidden:

```
┌─────────┬────────────────────────────────┐
│ ⌘K    ⇤ │  Fitness              ‹ Oct 8 ›│  ← page header, in <main>
│ Today   │  Log a session, see the week   │
│ Plan    │  ──────────────────────────────│
│ Body    │  content                       │
│  Fitness│                                │
│ ─────── │                                │
│ + Quick │                                │
│ 🎤 Relay│                                │
│ ▦▦ 90d  │                                │
│ ◉ You   │                                │
└─────────┴────────────────────────────────┘
```

The title belongs there anyway: it names the content, not the navigation, and
putting it in the rail would have been the third thing in that column claiming
to say where you are. The toggle rides in the page header **only while the rail
is hidden**, exactly as it does in the top bar today.

## What this is not

**Not a phone change.** The rail is `hidden md:flex`; a phone has no rail, so
`TopBar` stays exactly as it is below `md` — brand, search, mic, Quick add,
account, tab row, date nav, and `BottomNav` underneath. The header becomes
`md:hidden`, nothing more.

**Not a second navigation.** Every destination still comes from `SECTIONS`
through `SectionNav` and `SectionTabs`. Nothing is duplicated; four controls
change parent.

## Order, and what each step has to prove

1. **Rail gets head/body/foot** and the four controls move into the foot.
   Prove: the foot is still on screen on Body (twelve tabs) at 900px tall.
2. **Page header inside `<main>`**, carrying title, subtitle, date nav and the
   toggle-while-hidden. Prove: exactly one `h1` in the accessibility tree per
   breakpoint, still.
3. **Header goes `md:hidden`;** `useHeaderHeight` and `PageLayout` taught that
   zero is a real answer. Prove: `LibraryBar` and `SectionRail` still clear the
   chrome above them, measured, on a page that has both.
4. Re-measure chrome-before-content and re-run every gate.

## The numbers this owes

Chrome before content is **58.8px** today. The honest accounting afterwards is
not "0" — the page header replaces it inside the column. What actually changes
is that **the band no longer crosses the full window**, the rail reaches the top
on its own, and the controls sit nearer the navigation they belong with. Quote
chrome height, the rail's foot position at 900px, `--header-h`, and the `h1`
count either side.
