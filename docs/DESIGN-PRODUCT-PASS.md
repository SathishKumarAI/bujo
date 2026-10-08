# Looking like a product, not a website

Five phases, each its own branch and PR. Written after measuring the running app
over CDP rather than describing it — every number below came off the live DOM at
1512×950 and 1180×820, on `?demo=1`.

## What this is NOT

**It is not a redesign, and it is not an anti-AI-slop pass.** Measured on a
live page, the token discipline is already tight:

| | measured | the "slop" signature |
|---|---|---|
| distinct border radii | **3** (10px, 16px, pill) | many |
| distinct font sizes | **5** (10/11/13/15/17) | many |
| font weights | **2** (400, 500) | many |
| typeface | Fraunces + Instrument Sans | Inter, no personality |

The published tells of AI-generated UI are *"Inter or Roboto with no
personality, a purple or indigo gradient, a centered hero with one CTA, a row of
three icon cards"*. This app has none of them, and Fraunces + Instrument Sans is
a deliberate pairing that a statistical average would never produce.

So the palette and the type scale are **not** the problem and are not being
rebuilt. The problem is narrower: the app wears the costume of a *document*.

## The diagnosis, with numbers

| # | Measured | Why it reads as a website |
|---|---|---|
| 1 | **16 of 16** header nav items are `text-decoration: underline`; only 5 of 27 header controls carry a background fill | Underline *is* the hyperlink affordance. No product underlines its navigation — active state is fill or weight |
| 2 | **152px of chrome before content** = 17.2% of a 1512 viewport, **18.5%** at 1180, in three stacked rows | Twelve destinations in a horizontal row is a site pattern. A left rail takes 12+ at zero vertical cost |
| 3 | Header is `sticky` but sheds its nav on scroll (`useHideOnScroll`) | A reading page hides chrome to get out of the way. A product's chrome is permanent — losing navigation mid-task is a document behaviour |
| 4 | **11 of 12** `#main` headings render in Fraunces | Serif at every heading level reads editorial. Serif is for one brand moment, not for "Log a session" |
| 5 | Page title centred with a subtitle beneath | Marketing-header centring. Products are left-aligned and small, with actions on the right |
| 6 | `⌘K` appears **nowhere** in the rendered text, though the palette exists | The command palette is the product affordance, and it is invisible |

### 7 · The card does not read as a card

Reported directly ("I don't like the card and the background with the card"),
and it measures out exactly. In OKLCH, mocha:

| | hex | L* | chroma |
|---|---|---|---|
| page `--background` | `#1a1a1f` | 22.0 | 0.0097 |
| **card** (the `color-mix` result) | `#212228` | **25.3** | 0.0114 |
| card **border** `--color-line` | `#313244` | **32.4** | **0.0319** |

**The card is 3.3 L-points off the page.** Linear's elevation steps are 4.5 and
6.1. So the fill is doing almost nothing, and the card is instead defined by a
hairline that is *10 points brighter than the card itself* and four times more
saturated than any Linear border — a visibly violet edge drawn around a surface
that is barely there. That is backwards: a product's card is a **surface**, and
its border is a whisper.

`#313244` is Catppuccin Mocha's `surface0`, a community terminal theme, which is
exactly what it reads as.

## The phases

Ordered by signal-per-line-changed, not by size. Each is shippable alone.

### Phase 1 · The nav stops being hyperlinks
`SectionTabs`, `TopBar`. Active state becomes fill + weight; the underline goes.

The cause is worth stating because the obvious fix is wrong. Nav items are real
`<a href>` **on purpose** — the tab is in the URL, so a tab is deep-linkable and
the back button works. They are underlined by `@layer base { a { … } }`, a rule
added for a real reason: before it, an inline citation link was indistinguishable
from body text, and its own comment records that *"a rule each author must
re-type is a rule that gets forgotten."*

So the base rule **stays**. Navigation opts out at the call site with
`no-underline`, which lands in `@layer utilities` and therefore wins — the
cascade doing exactly the job that comment says it is for. Weakening the base
rule with a `:not()` guard is the move that file already documents as wrong.

### Phase 2 · Serif retreats to where it means something
Fraunces keeps the wordmark and the page title. Card headings move to
Instrument Sans 500. One typeface change, applied in `Card`, not 90 call sites.

### Phase 3 · The chrome stays put, and says ⌘K
Desktop keeps its navigation while scrolling; phone keeps `useHideOnScroll`,
where vertical really is scarce and the bottom bar is the real navigation. Add a
visible `⌘K` affordance to the header.

### Phase 4 · The card becomes a surface
The one that was reported, and the biggest visual return. Token layer only.

- **Raise the card off the page** to a ~5-6 L-point step, so the fill carries
  the elevation instead of the outline.
- **Neutralise the ramp** - strip the chroma, keep every accent untouched.
- **Demote the border to a whisper**: a low-alpha neutral in the Linear manner
  rather than a lighter, more saturated token than the surface it edges.
- Radius 16 card / 10 control -> **8 / 6**.

Guarded rather than eyeballed: `npm run contrast` fails on any accent under
4.5:1, and since COD-244 it measures against the **card ground** specifically -
which is the ground every one of these changes moves.

### Phase 5 - The left rail, and the shell becomes a row - SHIPPED

The structural one, last on purpose. Five sections plus up to twelve
sub-destinations move out of two horizontal header rows into a persistent rail
- **and then the shell itself turns on its side**, because the rail alone was
not the whole answer.

#### Two passes, and the second was the one that mattered

The first pass put the rail beside `<main>` and left the header where it was:
two full-width rows stacked above the row holding rail and page. It measured
well - 152px to 103px - and it was reported, correctly, as *"the top bar and
the sidebar are conflicting and wasting space"*. Both halves of that are true
and both are visible in the screenshot: the header band crossed the rail as
well as the page, so the rail began **103px down with nothing in that space**,
and the title row was ~1100px of nothing to the right of "Fitness". Two chrome
layers, each mostly empty, each saying where you are.

The second pass makes the frame a **row**: the rail from y=0 carrying the brand
at its head, and the header *inside* the content column as a single band holding
the page title, the date cursor and the tools.

| Measured at 1512x950, `?demo=1` | before | pass 1 | **shipped** |
|---|---|---|---|
| chrome before content | 152px | 103px | **58.8px** |
| ... as a share of the viewport | 17.2% | 11.7% | **6.7%** |
| ... spread across ten views | 103-152px | 103px | **58.8px, all ten** |
| chrome bands crossing the window | 2 | 2 | **0** |
| underlined nav items | 16 of 16 | 0 | **0** |
| rail top edge | - | y=103 | **y=0** |
| header height after a 900px scroll | folds away | folds away | **58.8px, pinned** |
| `h1` in the accessibility tree per breakpoint | 1 | 1 | **1** |
| `document.body.scrollWidth` at a 501px viewport | = viewport | **1245** | = viewport |

**That is 93px of every page back, and a band across the full window width that
no longer exists.** The old number also *varied with the section* - Body's twelve
tabs cost more chrome than Insights' one; the new one cannot, because the row
they occupied is not rendered on desktop at all.

Phones are untouched by design: the rail is `hidden md:flex`, so the frame is the
single column it has always been, `TopBar`'s two rows plus `BottomNav`.

#### Phase 3 came with it

Once the header is one 58.8px band holding the page title, the date cursor and
Quick add, folding it on scroll trades **the app's primary action** for 58 pixels
of a 900px window. So the fold is now `@media (width < 48rem)` - phones keep it,
where the row is one of two and `BottomNav` hides on the same rule. Measured:
desktop header **58.8px before and after a 900px scroll**, rail top still 0,
Quick add still at y=16. Phone: row 1 still folds to `0px`, row 2 (the tabs)
still never folds.

Guarded in CSS rather than by withholding the attribute, so `useHideOnScroll`
stays one rule shared with `BottomNav` and no JS breakpoint can disagree with the
`md:` ones in the markup.

#### Not a revert of PR #120

That PR deleted a 240px rail and was right to: it sat *above* the top bar and a
detached tab row - three chrome layers - and had grown `collapsed`,
`sidebarAutoHide`, a hover reveal zone, a mobile drawer and a scrim, all of it
machinery for winning back space the rail itself spent. This rail **replaces**
the nav rows and has none of that. The one control it does have is a width
toggle, which is a different thing from auto-hide: it is a choice the reader
makes and it persists, rather than chrome that moves on its own.

#### One destination list, still

`SideRail` renders `SectionNav` and `SectionTabs` - same components, same
`SECTIONS`, same `hrefFor` targets. A second copy is the mistake `BottomNav`'s
`PRIMARY` list already cost this repo once. `SectionNav`'s horizontal branch was
then deleted rather than kept behind a `vertical` prop (one caller, one layout),
and the file moved out of `topbar/`, which no longer described it. `Brand` moved
to its own file for the same reason - the rail head and the phone bar render one
component, never two copies of the markup.

#### Four defects it created, none of which a gate could see at the time

1. **`<main>` lost its width constraint.** It became a flex-row item, and a flex
   item's `min-width: auto` resolves to *min-content* unless the box is a scroll
   container - `overflow-x: clip` is explicitly **not** one (`hidden` would be).
   Measured at a 501px viewport: `document.body.scrollWidth` **1245**, a
   page-wide horizontal scrollbar on every view, with `overflow-x-clip` clipping
   nothing because the box it clips had itself grown. One `min-w-0`.
2. **Row 1 was a three-column grid whose middle child had just left.** With
   `1fr auto 1fr` and two children, the tool cluster takes the `auto` column and
   the trailing `1fr` sits empty - the week strip, Quick add and the account
   button parked mid-bar with a third of the header blank to their right. Visible
   on the first screenshot, invisible to every gate: nothing clipped, nothing
   unlabelled, nothing overflowing.
3. **Dead `md:` utilities on the tab row.** Its only call site is now inside
   `md:hidden`, so the auto-margin centring and `md:ml-0 md:flex-none` describe a
   state that renders nowhere. Tailwind v4 emits no CSS for a stale utility and
   fails no build - the trap already in CLAUDE.md, met from the other side.
4. **`npm run clipped` caught the one a gate could see.** Narrowing `<main>` by
   208px put Recovery's `"4 cigarettes today"` at **38px shown of 60px needed**.
   The row was already `flex-wrap`, but a `flex-1 min-w-0` text column shrinks to
   nothing rather than forcing the wrap, so the quick-amount cluster kept its full
   width and crushed the text instead of moving to a second line. `min-w-40` is
   what makes `flex-wrap` able to act.

Three of the four were found by looking at the rendered page while every gate was
green, which is the point.

**Found and fixed on the way, not Phase 5:** `npm run design` was **red on**
`main` - `WeekStrip.tsx:57` put `font-display` on a 10px streak counter, the
exact case the size floor from #346 exists to stop. It shipped because that gate
is in CI and not in `npm run verify`.


## Space is a constraint on every phase, not a phase

Also asked for: no wasted space, content earning its area. This is not a
separate task - it is a condition each phase has to leave better or equal, and
the repo already owns the instrument. `npm run space` reports screens of content
and fill per zone, and `scripts/clipped-text.mjs` catches the opposite failure
(a control pushed out of reach by tightening).

Two phases are space work by nature and must show it in numbers:

- **Phase 3** returns the vertical that `useHideOnScroll` currently trades away.
- **Phase 5** returns ~150px per page by moving two horizontal nav rows into a
  rail - measured at **152px of chrome, 17.2% of a 1512 viewport and 18.5% at
  1180**.

The trap to avoid is one this repo already records: *a page is not better
because it is shorter.* `space-audit` flags a page over three screens AND a card
under 45% fill, because empty is as much a failure as long. Quote both numbers
either side of every phase.

## Verification each phase owes

`npm run verify`, plus `design` and `contrast` (in CI, **not** in `verify`), plus
the browser gates — `a11y`, `smoke`, `clipped` — which need
`npm i -D --no-save playwright @axe-core/playwright` first.

And the measurement that justified the phase, re-taken: chrome height, underline
count, serif-heading ratio, OKLCH chroma. A design change with no number either
side of it is an opinion.

## Sources

- [SaaS UI trends 2026, shown with real screens](https://www.saasui.design/blog/7-saas-ui-design-trends-2026)
- [Why AI design looks generic](https://superdesign.dev/blog/why-ai-design-looks-generic)
- [How to make AI UI look less generic](https://superdesign.dev/blog/how-to-make-ai-ui-look-less-generic)
- [Linear design tokens — palette, typography, radii](https://open-design.ai/plugins/design-system-linear-app/)


## The page audit, 2026-10-08

Screenshotted every view at 1440 and 1707 and measured per-zone fill. Recording
it because two of the three conclusions were the opposite of what the
screenshots suggested.

**Zone fill is 94-100% on every contract page.** The emptiness people report is
not in the zones, and no amount of re-tuning the zone split will find it.

**The measured gap was six pages rendering a single column at 1440.** One of
them mattered:

| page | screens | cards | verdict |
|---|---|---|---|
| mindset | 4.2 -> **3.7** | 3 | fixed (#352). A list that could take columns. |
| coaching | 2.7 | 3 | open |
| reading | 1.74 | 5 | **not the same problem** |
| collections | 1.4 | 6 | **not the same problem** |
| challenges | 0.9 | 1 | not a problem |
| goals | 0.9 | 2 | not a problem |

### Reading and Collections are not tall, they are wide and underfull

Measured at a 1368px shell: Reading is five bands of 232/301/412/249/218px;
Collections is six of 260/105/144/180/121/335px. Neither has a height problem —
Collections is 1,249px total. What they have is **bands as wide as the page
holding a row's worth of content**: Collections' Inbox is 1368x105 at **41%
fill**, which `space` already flags as `1 thin`.

So the fix is not the container-query treatment that worked on Mindset. It is
pairing short bands two-up — and the primitive for that already exists and is
already used: `BandRow` + two `BandCell`s, exactly as `PracticeBand` puts
Practice beside Category balance.

**The cost is why it is not done here.** Reading's and Collections' children are
standalone components (`NowReading`, `Shelves`, `Stalled`, ...) that each render
their own `Card band`. Pairing them means restructuring each to render a
`BandCell` instead, across ~11 components on two pages, for roughly
**1.74 -> 1.2 and 1.4 -> 1.0 screens**. That is a real increment with a modest
return, and it should be taken deliberately rather than smuggled into a session
about the shell.

`challenges` and `goals` are under one screen. A single column is the correct
layout for them and the gate's warning is noise there.
