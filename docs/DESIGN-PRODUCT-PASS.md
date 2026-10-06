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

### Phase 5 · The left rail
The structural one, last on purpose: it is the biggest diff and it benefits from
the other four being settled. Five sections plus up to twelve sub-destinations
move out of two horizontal rows into a persistent rail, returning ~150px of
vertical to every page at every width.

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
