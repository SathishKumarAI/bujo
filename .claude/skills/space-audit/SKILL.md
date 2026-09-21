---
name: space-audit
description: Use when a page feels too long, too empty, or badly organised — "there is too much white space", "organise this page", "too much scrolling", "this looks scattered". Measures the page first, fixes the layout primitive rather than the call site, and proves the change with before/after numbers.
---

# Space audit

A page that "feels empty" is a claim about pixels, and pixels can be counted.
This skill exists because the alternative — opening the page, squinting, and
adding padding tweaks — has been tried in this repo and left behind a comment
claiming a page was fixed (`"three across instead of one tall stack, this page
was 4.2 screens"`) next to a page that still measured **4.1**.

## The procedure

### 1. Measure before you look

```bash
npm run build && npm run preview     # the gate reads 4173, not the dev server
npm run space -- <view>              # or --all
```

Three numbers per viewport, and they are the whole diagnosis:

| Column | Question | Bad |
|---|---|---|
| `screens` | how far must I scroll | > 3 on desktop |
| `cards in N group(s)` | how much is on the page | — |
| `columns` | how many columns the layout **actually uses** | `1` at 1440 |
| `thin` | cards whose box is mostly air | any |

**`1 column` at desktop width is the finding.** It means every card is full
width whatever it holds, and it is almost always a layout primitive that stacks,
not a page that needs redesigning.

### 2. Find the primitive, not the page

Before editing a view, ask what lays its children out. In this repo:

| Primitive | Lays out | Use for |
|---|---|---|
| `CardGrid` | 1 / 2 / 3 columns on **viewport** width | anything sequenced, anything needing `SPAN_2` |
| `MasonryGrid` | balanced columns on **container** width (`@container`) | a shelf of peer analytics in no particular order |
| `CollapsibleSection` | **a vertical stack** — it does not lay out | grouping; wrap the children in a grid yourself |

`CollapsibleSection` stacking its children is the single most common cause of a
one-column page here. Pickleball had thirteen analytics cards in three groups,
each card spanning 1,180px to hold about 180px, because the group stacked.

**Fix the primitive or the call site, never both by copy-paste.** If two
components do the same job, that is the finding: Pickleball carried a local
`components/pickleball/Section` that was a near-duplicate of
`CollapsibleSection` with no `stickyKey`, so fold state there did not survive a
reload. Deleting it fixed the layout *and* a bug.

### 3. Re-measure with the same tool, on the same fold state

`npm run space` **opens every fold before measuring**, because a collapsed page
is not a short page. A before/after taken with different fold states is not a
comparison. To get a true baseline after you have already edited:

```bash
cp src/views/X.tsx  "$SCRATCH/X.new.tsx"
git checkout HEAD -- src/views/X.tsx <any file you deleted>
npm run build && npm run space -- x          # baseline
cp "$SCRATCH/X.new.tsx" src/views/X.tsx      # restore
```

`git stash push -- <paths>` is the usual trick, but it **fails on a path you
have `git rm`'d** — the pathspec no longer matches anything git knows about.

### 4. Organisation is not packing

The tool measures boxes, not meaning. Read a good score as "this page is
packed", never "this page is good". Check by hand, every time:

- **Is the summary above the thing it summarises?** Pickleball's "At a glance"
  was the *last* card on a four-screen page, under a comment citing ticket
  `BUJO-XXX` — a placeholder, so the request it claimed to implement could not
  be checked.
- **Is the primary action above the analytics?** You log a session far more
  often than you read your weekday win-rate.
- **Does any subtitle just list what is visible underneath it?** Three section
  hints read "Recent form · forecast · milestones · intensity" directly above
  those four cards. Deleting them cost nothing and bought a phone screen.

### 5. Prove it

Every claim in the PR body is a number from the tool, both viewports:

> desktop 5.0 → 4.3 screens, phone 7.5 → 7.5 (unchanged — a single column
> cannot pack; only cutting cards would shorten it)

**Report the viewport that did not improve.** A phone stacks at one column by
design, so most packing work is a desktop win and neutral on phone. Saying so is
the difference between a measurement and a sales pitch.

## Gates this must not break

`npm run verify`, then `npm run a11y` — layout changes move things in and out of
the accessibility tree. Two specifics, both learned here:

- **Do not fix length by collapsing sections by default.** `npm run a11y` walks
  the rendered page, so a fold that starts shut hides its contents from the
  gate. Shortening a page that way makes violations disappear rather than
  content (see the COD-93 trap in `CLAUDE.md`).
- **Swapping a bespoke section for `CollapsibleSection` adds an `<h2>`** around
  the toggle, which is a real accessibility gain and a small height cost. Keep
  it; take the height back from redundant subtitles instead.
