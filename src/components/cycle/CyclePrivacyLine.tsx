import { Abbr } from '../Abbr'

/**
 * The persistent one-liner under the page header, after the welcome is accepted.
 *
 * It exists so the promise does not live only on a screen the user saw once.
 * Small, in the secondary colour, no accent: a reassurance that shouts reads as
 * a warning.
 *
 * The ⓘ is `Abbr`, the app's existing popover primitive — a real button inside a
 * Radix popover, focusable, dismissable with Escape, and reachable on touch,
 * where a `title` tooltip is not. Rolling a second info affordance for this one
 * line is how an app ends up with two that behave differently.
 */
export function CyclePrivacyLine({ onExport }: { onExport?: () => void }) {
  return (
    <p className="mt-1 text-label text-fg-2">
      <Abbr term="local-only">Stored on this device only</Abbr>
      {onExport && (
        <>
          {' · '}
          <button type="button" onClick={onExport} className="underline underline-offset-2 hover:text-fg-1">
            Export backup
          </button>
        </>
      )}
    </p>
  )
}
