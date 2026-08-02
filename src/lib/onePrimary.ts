/**
 * ONE PRIMARY PER SCREEN · enforcement, not good intentions.
 *
 * "Exactly one primary action per screen" is the kind of rule that holds for a
 * week and then quietly rots: the second primary is always added by someone
 * with a good local reason, in a card they are looking at alone. Nobody sees
 * the screen as a whole until it has four.
 *
 * So the rule counts itself. In dev, mounting more than one `variant="primary"`
 * button under the same view logs which view and how many. It is a warning, not
 * a throw — a false positive during a transition should not blank the app —
 * and it is stripped from production builds entirely.
 *
 * Deliberately counts *mounted* buttons, not source occurrences: a view with
 * two primaries behind mutually-exclusive conditions is fine, and a grep could
 * never tell the difference.
 */
const mounted = new Map<string, number>()
let scheduled = false

function report() {
  scheduled = false
  for (const [view, count] of mounted) {
    if (count > 1) {
      console.warn(
        `[one-primary] "${view}" has ${count} primary buttons mounted. ` +
          `A screen with two primaries has none — demote all but the action the ` +
          `user came to this view to take (docs/ICON-BUTTON-SYSTEM.md).`,
      )
    }
  }
}

/** Current view id, set by the shell so the warning can name the screen. */
let currentView = 'unknown'

export function setPrimaryScope(view: string) {
  currentView = view
}

export function registerPrimary() {
  if (!import.meta.env.DEV) return () => {}
  const view = currentView
  mounted.set(view, (mounted.get(view) ?? 0) + 1)
  // Batch to a microtask: during a render pass buttons mount one at a time, so
  // counting synchronously would warn on the way to a legitimate single one.
  if (!scheduled) {
    scheduled = true
    queueMicrotask(report)
  }
  return () => {
    const next = (mounted.get(view) ?? 1) - 1
    if (next <= 0) mounted.delete(view)
    else mounted.set(view, next)
  }
}
