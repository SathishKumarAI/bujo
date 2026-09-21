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

Five numbers per viewport, and they are the whole diagnosis:

| Column | Question | Bad |
|---|---|---|
| `shipped` | screens of scroll as the user first sees it | — |
| `open` | screens with every fold opened | > 3 on desktop |
| `cards in N group(s)` | how much is on the page | — |
| `columns` | how many columns the layout **actually uses** | `1` at 1440 |
| `thin` | cards whose box is mostly air | any |

**Both scroll numbers, because either alone is gameable.** Measuring only the
opened page punishes a disclosure for existing — fold four optional fields away
and the page is shorter for every user while the tool reports no change at all.
Measuring only the shipped page rewards hiding content, which is the trap the
a11y gate already documents. The gap between them is what the folds are worth.

**`1 column` at desktop width is the finding.** It means every card is full
width whatever it holds, and it is almost always a layout primitive that stacks,
not a page that needs redesigning.

**A number over budget is a question, not a verdict.** Of the eight bujo pages
over three desktop screens, four are deliberately that long and two say so in
the file, with the measurements that decided it — Coaching records that its act
column ran 1676px against a review of 238px, so no two-column split balances it.
Read the view before you "fix" it; overriding a measured decision is worse than
leaving a long page alone.

### 2. Find the primitive, not the page

Before editing a view, ask what lays its children out. In this repo:

| Primitive | Lays out | Use for |
|---|---|---|
| `CardGrid` | 1 / 2 / 3 columns on **viewport** width | anything sequenced, anything needing `SPAN_2`, **and any zone narrower than 768px** |
| `MasonryGrid` | balanced columns on **container** width (`@container`, `@3xl` = 768px) | a shelf of peer analytics in no particular order, in a zone you know is wide |
| `CollapsibleSection` | **a vertical stack** — it does not lay out | grouping; wrap the children in a grid yourself |

**`MasonryGrid` in a zone under 768px silently does nothing.** Gym's review zone
is **722px** — 46px short — so three groups wrapped in it resolved to one column
and the first version of that fix packed nothing at all. The tool caught it
(`open` barely moved); reading the class list would not have. Measure the zone,
or use `CardGrid`, which asks about the viewport instead.

`CollapsibleSection` stacking its children is the single most common cause of a
one-column page here. Pickleball had thirteen analytics cards in three groups,
each card spanning 1,180px to hold about 180px, because the group stacked.

**Fix the primitive or the call site, never both by copy-paste.** If two
components do the same job, that is the finding: Pickleball carried a local
`components/pickleball/Section` that was a near-duplicate of
`CollapsibleSection` with no `stickyKey`, so fold state there did not survive a
reload. Deleting it fixed the layout *and* a bug.

### 3. Re-measure with the same tool, on the same fold state

`npm run space` measures once as shipped and again with every fold opened, so
the fold state is not something you can get wrong between runs — but the
*build* is. Measure the baseline from the built app too, not from memory. To
get one after you have already edited:

```bash
cp src/views/X.tsx  "$SCRATCH/X.new.tsx"
git checkout HEAD -- src/views/X.tsx <any file you deleted>
npm run build && npm run space -- x          # baseline
cp "$SCRATCH/X.new.tsx" src/views/X.tsx      # restore
```

`git stash push -- <paths>` is the usual trick, but it **fails on a path you
have `git rm`'d** — the pathspec no longer matches anything git knows about.

### 4. Tap-to-log costs vertical space — budget for it

Converting typed fields to `ChipPick`/`Stepper` (`ui/quickpick.tsx`) makes a
form fewer actions and **taller**: Pickleball's log form grew the page by 0.4
screens. Two things buy it back, in this order:

1. Give the form the row it deserves. It is the primary action — `SPAN_2`, then
   pair the chip groups two-up inside it.
2. Put the half you fill less than half the time behind `DisclosureRow`.
   **Not a `<details>`** — `DisclosureRow` renders `aria-expanded`, which is
   what `npm run a11y` clicks before it scans. A `<details>` keeps those
   controls out of the accessibility gate entirely.

A chip row is only an improvement if it is fewer actions than typing. Arbitrary
numbers with no common values (a 0–21 score) stay typed; a stepper there is
eleven taps and chips are a list of twenty-two.

### 5. The opposite failure: everything folded shut

A very low `shipped` next to a high `open` is its own bug. Gym measured **1.2
shipped against 4.7 open** because all eight of its `QuietSection`s passed
`defaultOpen={false}` — nearly everything the page held was behind one of eight
identical grey bars, with nothing to say which one had your squat PR in it.
Collapsed-by-default is right for reference and wrong for the answer someone
came back for. Merge groups by the question each answers, and open the payoff.

### 6. Organisation is not packing

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

### 7. Prove it

Every claim in the PR body is a number from the tool, both viewports:

> desktop 4.1 → 3.5 shipped / 5.0 → 4.7 open · phone 6.0 → 6.2 shipped
> (unchanged-to-worse: a single column cannot pack, and tap-to-log is taller
> than the number inputs it replaced)

**Report the viewport that did not improve.** A phone stacks at one column by
design, so most packing work is a desktop win and neutral on phone. Saying so is
the difference between a measurement and a sales pitch.

## Gates this must not break

`npm run verify`, then `npm run a11y` — layout changes move things in and out of
the accessibility tree. **Do not `npm run build` while the a11y gate is
running**: the preview server serves the half-written `dist` and the gate
reports `rendered 0 characters — the view did not load`, which reads exactly
like a real regression. Two specifics, both learned here:

- **Do not fix length by collapsing sections by default.** `npm run a11y` walks
  the rendered page, so a fold that starts shut hides its contents from the
  gate. Shortening a page that way makes violations disappear rather than
  content (see the COD-93 trap in `CLAUDE.md`).
- **Swapping a bespoke section for `CollapsibleSection` adds an `<h2>`** around
  the toggle, which is a real accessibility gain and a small height cost. Keep
  it; take the height back from redundant subtitles instead.
