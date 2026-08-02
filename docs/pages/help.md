# Help

`src/views/Help.tsx` · top bar → ? · `?view=help`

## What this page is

The in-app guide: what the method is, what each screen does, and the bullet
legend. A plain-language companion to the docs' Feature Guide.

## Measured (1440×900, demo data)

- **1.3 screens.**
- **One block, 1,127px.** Four `<h2>`s inside it, no navigation between them.

## The finding that matters

**P1 · Help is one long scroll with no way in.** A single 1,127px card
containing the method, the top bar, every screen, and the bullet grammar. There
is no table of contents, no search, no anchors, and no per-section collapse — in
an app whose own `CollapsibleSection` is used on eleven other pages.

Help is the page users arrive at with a *specific* question. It is the one page
that most needs a way to jump, and the only reference page in the app without
one.

**P2 · It duplicates the ⓘ system.** Every card in the app already carries an ⓘ
explaining itself, and `VIEW_CHROME` holds a `help` string per view that the top
bar's "?" shows. So each screen is documented three times: in the card ⓘ, in the
top-bar help, and in this page's prose. Three copies drift.

## UX / IA

**P2 · Nothing links out.** "What each section does" describes Today, Monthly,
Trackers — and none of the names are links. A help page that names twenty
screens and navigates to none of them makes the reader do the routing.

**P3 · The page is unreachable from the sidebar.** It lives behind the top bar's
"?", so a user who wants to read the guide has to already know where the guide
is.

## UI

**P2 · Prose set at content width with no visual rhythm.** Four headings and
long paragraphs in one card. The app has pull-quotes, stat tiles, glyph columns
and callouts available; the page that teaches the visual language uses none of
it.

**P3 · The bullet legend is the most useful thing here** and is buried in the
lower half rather than pinned or repeated at the top.

## Copy

**Genuinely good and correctly scoped.** *"This is a digital take on the Bullet
Journal method by Ryder Carroll, in the minimal one-pen style. Everything you
write is saved automatically in this browser only · nobody else can see it, and
there are no accounts."* — credits the method, states the storage model and the
privacy position in two sentences.

The top-bar walkthrough is equally concrete: *"On the right: Quick add (capture
an entry from anywhere), ⌘K (jump to any view or run a command), and the ⋯
menu"*.

**P3 · "Below is what each section does"** is a signpost that a table of
contents would render unnecessary.

## Upgrades, ranked

1. **P1 · Add navigation** — collapse per section, or a sticky contents column.
   The primitive already exists in the codebase.
2. **P2 · Link every screen name** to that screen.
3. **P2 · Make `VIEW_CHROME.help` the single source** and generate the
   per-screen sections from it, so the three copies cannot drift.
4. **P3 · Pin the bullet legend** to the top, or repeat it at both ends.
5. **P3 · Put Help in the sidebar**, under a Review or About group.

## Leave alone

- **The opening paragraph.** Method credit, storage model, privacy, in two
  sentences.
- **The top-bar walkthrough.**
- **Plain language throughout** — no screenshots, no video, no marketing voice.
