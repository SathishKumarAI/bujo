# Collections

`src/views/Collections.tsx` · nav: Library → Collections · `?view=collections`

## What this page is

The bullet journal's free-form pages: an Index (table of contents), a
brain-dump inbox for dateless entries, the Future Log, custom collection pages,
plus People (friends/birthdays) and Auto-pages (memories, tag pages) behind
disclosures.

## Measured (1440×900, demo data)

- **1.3 screens.** A four-card two-column grid (903px) plus two collapsed
  sections (32px each).
- Cards: Index · Brain-dump inbox · Future log · Custom collections.

## The finding that matters

**P1 · The Future Log prints raw ISO dates.** `2026-08-07 · ○ Super Bowl party`.
Every other surface in the app uses `prettyDay` — "Sat, Aug 1", "Fri, Jul 17" —
including History on four other pages. This is the only place a user meets a
machine date, and it is in the card whose entire job is *when*.

**P2 · Two of four cards are empty, and both are open.** "Inbox zero. Nothing
dateless waiting to be sorted. ✨" is a lovely empty state; the Index shows one
collection holding `0` entries. Half the page's default state is a report that
there is nothing to report.

## UX / IA

**P2 · The Index lists a collection with zero entries and four tag pages with
one or two.** As a table of contents it is currently longer than the thing it
indexes. An index earns its place at scale; below some threshold it is
scaffolding.

**P3 · "Custom collections" and "Auto-pages" are the same idea split by
authorship.** One is pages you made, the other pages the app made from your
tags and memories. Presenting them 400px apart, one open and one collapsed,
makes them look like unrelated features.

**P3 · The `×` delete on a collection is always visible** and sits immediately
after the collection name, with no confirmation implied by its styling.

## UI

**P2 · The two-column grid puts a 903px block beside nothing in particular.**
With four cards of unequal height the right column ends early, the same
half-empty look Plan has.

**P3 · The Index's own two columns** (`COLLECTIONS` | `TAG PAGES`) are the
clearest layout on the page. That pattern, applied to the page as a whole, would
fix the point above.

## Copy

**"Inbox zero. Nothing dateless waiting to be sorted. ✨"** — best empty state in
the app. Specific, warm, and it teaches the concept ("dateless") in passing.

**P2 · "The journal's table of contents, jump to any page"** is accurate and
does the thing good subtitles do: names the paper-journal concept, then says
what it does here.

**P3 · "Free-form pages, book lists, packing, projects…"** — three examples and
an ellipsis is one example too many for a subtitle.

## Upgrades, ranked

1. **P1 · Use `prettyDay` in the Future Log.** One-line fix, removes the only
   ISO date a user ever sees.
2. **P2 · Hide the Index until there is something to index** (say, three or more
   pages).
3. **P2 · Collapse empty cards to a line**, as with Pickleball's DUPR.
4. **P3 · Put Custom collections and Auto-pages together** — same concept, two
   authors.
5. **P3 · Reveal the `×` on hover** and confirm before deleting a page that may
   hold entries.

## Leave alone

- **The Index's internal two-column layout.**
- **The empty states.** All of them, but especially inbox zero.
- **The brain-dump inbox as a concept** — a place for dateless capture is
  exactly right for this method, and it is a differentiator.
- **Tag pages generated automatically** from `#tags`.
