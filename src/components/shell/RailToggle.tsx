import { Sidebar, SidebarSimple } from '@/components/icons'
import { Icon } from '@/components/Icon'

/**
 * Show/hide `SideRail`. **One control, two homes, exactly one rendered.**
 *
 * It shipped in the header for one release, on the reasoning that a control
 * which hides its own container cannot bring it back. That reasoning is sound
 * and the conclusion was still wrong: it argues for a second home when the rail
 * is away, not for living in the header while the rail is right there. Asked
 * directly — *"why are you seeing top bar?"* — and the honest answer is that
 * the button belongs on the thing it operates.
 *
 * So:
 *
 * - **rail open** → the toggle sits in the rail's own head, beside Search.
 * - **rail hidden** → the rail is `display: none` and so is its copy, and
 *   `TopBar` renders this in the header's left slot instead.
 *
 * `AppShell` owns `railHidden`, so the two placements cannot disagree about
 * which is showing: each is rendered by a branch of the same boolean. Both
 * carry the same `aria-label` and `aria-pressed`, so a screen reader hears one
 * control with a state rather than two buttons that happen to do the same job.
 *
 * `aria-pressed` rather than swapping the label: the label must not change
 * under the user, or every press re-announces as a different button.
 */
export function RailToggle({
  hidden,
  onToggle,
  className = '',
}: {
  /** Whether the rail is currently collapsed away. */
  hidden: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hidden}
      aria-label="Hide the sidebar"
      title="Hide the sidebar · ⌘B"
      className={`inline-flex shrink-0 items-center rounded-control p-1.5 text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1 ${className}`}
    >
      {/* The glyph carries the state, which is what lets the label stay put. */}
      <Icon as={hidden ? Sidebar : SidebarSimple} size="md" />
    </button>
  )
}
