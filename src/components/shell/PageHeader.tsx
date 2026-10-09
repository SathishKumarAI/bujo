import { RailToggle } from './RailToggle'
import { DateNav } from './topbar/DateNav'
import { VIEW_CHROME, type ViewId } from './viewChrome'

/**
 * The page's own title strip, **inside the content column** — desktop only.
 * One line: the title, then the subtitle beside it.
 *
 * ── Why it is here and not in the rail ─────────────────────────────────────
 *
 * The top bar came down on desktop (`docs/SHELL-ONE-CHROME.md`) and everything
 * in it moved to `SideRail` — except this. A page title names the *content*,
 * not the navigation, and the rail already carries two things saying where you
 * are (the lit section, the current tab). A third in the same column would be
 * the centred-title mistake again, one column over.
 *
 * ── And it is what survives ⌘B ─────────────────────────────────────────────
 *
 * This is the load-bearing reason, not a nicety. With no top bar, hiding the
 * rail would otherwise leave **no chrome at all**: no toggle to bring it back,
 * no Quick add — which is `SHELL_SCOPE`, the app's one primary action. A strip
 * that is part of the page rather than part of the shell cannot be hidden by a
 * control that hides the shell, so the toggle rides here while the rail is
 * away, exactly as it did in the top bar.
 *
 * ── `.app-header`, deliberately ────────────────────────────────────────────
 *
 * `useHeaderHeight` measures `.app-header` and publishes `--header-h`, which
 * six things read — `LibraryBar`'s sticky top, `SectionRail`'s, three
 * `scroll-mt` anchors and `PageLayout`'s stickiness budget. The variable means
 * "chrome above the content", and that is still exactly what this is. Giving
 * the strip the same class keeps every one of those six correct without
 * touching any of them, and keeps one definition of the measurement rather
 * than a second variable that can drift from the first.
 *
 * Below `md` this renders nothing: `TopBar` is unchanged there and still owns
 * the title, the tab row and the date nav.
 */
export function PageHeader({
  view,
  railHidden,
  onToggleRail,
}: {
  view: ViewId
  railHidden: boolean
  onToggleRail: () => void
}) {
  const chrome = VIEW_CHROME[view]

  return (
    <div className="app-header sticky top-0 z-20 hidden items-center gap-3 border-b border-line bg-card/75 px-4 py-2.5 backdrop-blur-lg md:flex">
      {/* Only while the rail is away — its head carries the control otherwise.
          Same component, same label, same `aria-pressed`; `railHidden` decides
          which of the two renders, so they cannot both appear. */}
      {railHidden && <RailToggle hidden onToggle={onToggleRail} />}

      {/* ── ONE LINE, NOT TWO ────────────────────────────────────────────
          Reported as "it takes more space — move the description to the side".
          Measured on Strength at 1707: the strip was **60px**, and the two
          things in it were a 14-character title and a 28-character subtitle,
          **stacked**, each stretched across 1481px. A `truncate` on a string
          using 9% of its box is a line of text wearing a column's clothes.

          Side by side it is **42px** — 30% of the strip back on every desktop
          page, for free, in the horizontal space the title was already
          occupying and not using.

          `items-baseline`, so a 22px serif and a 13px sans sit on one line
          rather than being centred against each other. The subtitle takes
          `min-w-0` and truncates on its own, and the title keeps a sane
          minimum so a long subtitle can never squeeze the page's name into an
          ellipsis — the title is the one thing here that has to stay
          readable. Below `lg` the subtitle drops entirely rather than fighting
          for a narrow content column; the height does not change when it
          does, because the title sets it. */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        {/* THE ONE FRAUNCES MOMENT ON A DESKTOP — COD-283.

            Measured across 20 views: the display serif was on **0% of
            rendered text on 16 of them**, highest anywhere 2.4%. Phase 2 of
            the design pass said "Fraunces keeps the wordmark and the page
            title" — retreat to one brand moment, not vanish. Two later
            changes removed both homes without either noticing it was the
            last: this title block was written in Instrument Sans during the
            rail work, and the wordmark left the rail when it was reported as
            eating 44px. So the Fraunces + Instrument Sans pairing the doc
            calls the thing separating this from generic output was, on a
            desktop, one typeface.

            `text-title` and not `text-heading`, and that is forced rather
            than chosen: `npm run design` fails `font-display` below
            `text-title`, because a serif at 17px reads as a mistake rather
            than a decision. 22px is the floor for the face, so taking the
            serif back means taking the size with it — which is the right
            answer anyway for the one heading that names the page.

            It stays exactly one place. 11 of 12 headings in Fraunces was the
            original diagnosis this pass existed to fix; the card headings
            stay sans. */}
        <h1 className="min-w-0 shrink-0 truncate font-display text-title leading-tight font-medium text-foreground">{chrome.title}</h1>
        {chrome.subtitle && (
          <>
            {/* A separator, not punctuation: the two are one statement
                ("Strength tools, which is logging, anatomy & analytics"), and
                a screen reader should not read a bullet into it. */}
            <span aria-hidden className="hidden shrink-0 text-label text-fg-3 lg:inline">·</span>
            <p className="hidden min-w-0 truncate text-label text-muted-foreground lg:block">{chrome.subtitle}</p>
          </>
        )}
      </div>

      {/* The date cursor qualifies the title — "Fitness, this week" is one
          statement — so it stays beside it rather than going to the rail with
          the actions. */}
      {chrome.dateNav && (
        <div className="flex shrink-0 items-center">
          <DateNav view={view} mode={chrome.dateNav} />
        </div>
      )}
    </div>
  )
}
