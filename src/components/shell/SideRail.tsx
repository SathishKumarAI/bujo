import { MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Kbd } from '../Kbd'
import { WeekStrip } from './WeekStrip'
import { SectionNav } from './SectionNav'
import { SectionTabs } from './SectionTabs'
import type { SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * The desktop navigation, standing up.
 *
 * ── Why it exists ──────────────────────────────────────────────────────────
 *
 * Measured on the running app before this: **152px of chrome before any
 * content** — 17.2% of a 1512px viewport and 18.5% at 1180 — stacked in two
 * rows, the five sections above up to twelve sub-destinations. Twelve
 * destinations laid out horizontally is a *site* pattern: it costs vertical on
 * every page, it gets tighter at every narrower width, and at 1180 the Body row
 * was already within pixels of needing to scroll.
 *
 * A rail takes the same twelve at zero vertical cost, because it spends the
 * axis that is not scarce. That is the whole trade, and it is the single
 * biggest reason the app read as a document rather than a tool.
 *
 * Measured either side at 1512×950 on `?demo=1`: chrome before content
 * **152px → 58.8px**, 17.2% → 6.7%, identical on all ten views probed — the
 * old number varied with the section’s tab count, the new one cannot. The rail
 * alone got that to 103px; the rest came from turning the shell into a row so
 * the header stops spanning the rail (see `AppShell`).
 *
 * ── There was a rail here before, and it was right to delete it ────────────
 *
 * PR #120 ("one nav bar, and the rail is gone") removed a 240px sidebar. Read
 * its commit before assuming this is a revert: that rail sat *above* the top
 * bar and a detached tab row — **three** chrome layers between viewport and
 * page — and had accumulated `collapsed`, `sidebarAutoHide`, a hover reveal
 * zone, a mobile drawer and a scrim, every one of them machinery for winning
 * back space the rail itself was spending.
 *
 * This rail replaces the two nav rows rather than standing on top of them, and
 * has none of that: one width, always open, no drawer, no auto-hide. **If it
 * ever needs collapsing, that is the signal it has grown back into the thing
 * #120 deleted** — the fix then is fewer destinations, not a hover zone.
 *
 * ── What it deliberately is not ────────────────────────────────────────────
 *
 * **Not new navigation.** It renders `SectionNav` and `SectionTabs` — the same
 * components, the same `SECTIONS` list, the same `hrefFor` targets, the same
 * active logic. A second copy of the destination list is the exact mistake this
 * repo already paid for once, when a hand-written id list in `BottomNav` was
 * resolved against another source and silently dropped a phone tab with no
 * error.
 *
 * ── What it adds that the header never had ─────────────────────────
 *
 * Both are **surfacing something that already worked and could not be found**,
 * which is the actual gap — not new capability bolted on:
 *
 * - **a search row saying `⌘K`.** The palette reaches every destination, theme
 *   and action in the app, and the string `⌘K` was rendered on no view at any
 *   width. Item 6 on the diagnosis list.
 * - **the `g` chord on each section row.** `useLeaderKey` has worked since the
 *   shell was built and was written down only in the `?` cheatsheet. The keys
 *   now come from `SECTIONS.jump`, which `AppShell` also builds its leader
 *   table from, so the hint cannot drift from the key it advertises.
 *
 * **Not for phones.** `BottomNav` already carries the five sections within
 * thumb reach, and a 390px screen has no horizontal axis to spend. The rail is
 * `hidden md:flex` and the top bar keeps its tab row below `md`.
 *
 * ── The element ────────────────────────────────────────────────────────────
 *
 * An `<aside>` wrapping two `<nav>`s rather than one `<nav>` wrapping another:
 * nested navigation landmarks give a screen reader two things called
 * "navigation" with no way to tell them apart, and the two lists answer
 * different questions ("which area" / "which surface within it"). Both keep
 * their own `aria-label`.
 *
 * `scripts/a11y-axe.mjs` already clicks `aside a` as well as `nav a` — the gate
 * was written to tolerate a rail before there was one — so moving the
 * navigation here does not blind it.
 */
export function SideRail({
  view,
  gates,
  onNavigate,
  onCommand,
}: {
  view: ViewId
  gates: SectionGates
  onNavigate: (id: ViewId) => void
  /** Opens the command palette. The rail’s search row is its only visible door. */
  onCommand: () => void
}) {
  return (
    <aside
      aria-label="Main navigation"
      /* `sticky top-0 h-screen`, so the rail is still there after any amount of
         scrolling. That is the point of a rail and the thing the old top bar
         gave away: it sheds its nav on scroll, so the navigation disappeared
         exactly when a long page made it most useful.

         `shrink-0` because the content beside it is allowed to be wide; without
         it a wide table squeezes the rail and the labels wrap. */
      className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col gap-1 self-start overflow-y-auto border-r border-line p-3 md:flex"
    >
      {/* NO WORDMARK HERE.

          It sat at the rail’s head for one release and was reported as "taking
          a lot of space" — correctly: 44px of the one axis a rail is supposed
          to be generous with, spent telling you the name of the app you are
          already inside. Identity is a thing you need once, on first run; the
          rail is a thing you read every time you move. `TopBar` keeps its copy
          below `md`, where the header is the only chrome and there is nothing
          else to anchor the top-left corner.

          `Brand` stays a shared component rather than being inlined back into
          `TopBar`: one copy of the markup, which is the whole reason it was
          extracted. */}

      {/* THE COMMAND PALETTE, GIVEN A DOOR.
          Item 6 on the DESIGN-PRODUCT-PASS diagnosis list, measured: `⌘K`
          appeared **nowhere** in the rendered text of any view, though the
          palette has been built and working the whole time. It can reach every
          destination, every theme and every action in the app, and the only way
          to find that out was to already know.
          A search row at the head of the rail is where every product puts it,
          and it is the row a reader is looking at in the moment they want to go
          somewhere they cannot see.

          A `<button>`, not an `<input>`: it opens a dialog that owns the real
          field, and a text box that refuses to be typed into is a worse lie
          than a button that looks like one. The borrowed box shape is the
          affordance; the caret is what it does not claim. */}
      <button
        type="button"
        onClick={onCommand}
        className="mb-2 flex min-h-9 w-full items-center gap-2 rounded-control border border-line bg-ink-2 px-2.5 text-body text-fg-2 transition-colors hover:border-line-strong hover:text-fg-1"
      >
        <Icon as={MagnifyingGlass} size="md" />
        Search
        {/* The chord, said where the thing it opens is. `aria-hidden` for the
            same reason as the section rows: the button is already named
            "Search", and the shortcut is announced in the `?` cheatsheet where
            it is actionable. */}
        <span aria-hidden className="ml-auto">
          <Kbd>⌘K</Kbd>
        </span>
      </button>

      <SectionNav view={view} gates={gates} onNavigate={onNavigate} />
      {/* The rule that separates the two lists lives on `SectionTabs` itself,
          not here, because it must exist exactly when that list does —
          `SectionTabs` returns null below two tabs, so Today and Insights get
          neither a divider nor the gap one would leave behind. A separator
          drawn by the parent cannot know that. */}
      <SectionTabs view={view} gates={gates} onNavigate={onNavigate} vertical />

      {/* THE WEEK, AT THE FOOT OF THE RAIL.

          Moved out of the top bar, where it sat between the page title and
          Quick add as the one thing in that row that is not about this page
          and not an action. It is ambient: seven dots and a streak count, read
          in passing, never clicked. That is rail content, and it is what a
          footer is for.

          `mt-auto` so it sits on the floor rather than under the tabs — the
          tab list varies from zero to twelve rows, and a strip that drifts
          with it reads as part of the list it is not part of.

          It goes WITH the rail when you hide it, and that is the right trade:
          a streak count is losable. Quick add, the microphone and the account
          menu stay in the header precisely because they are not — ⌘B must not
          take away the app’s primary action. */}
      <div className="mt-auto border-t border-line px-2 pt-3">
        <WeekStrip />
      </div>
    </aside>
  )
}
