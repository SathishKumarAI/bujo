import { RailToggle } from './RailToggle'
import { DateNav } from './topbar/DateNav'
import { VIEW_CHROME, type ViewId } from './viewChrome'

/**
 * The page's own title strip, **inside the content column** — desktop only.
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

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h1 className="truncate text-heading leading-tight font-medium text-foreground">{chrome.title}</h1>
        {chrome.subtitle && <p className="truncate text-label text-muted-foreground">{chrome.subtitle}</p>}
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
