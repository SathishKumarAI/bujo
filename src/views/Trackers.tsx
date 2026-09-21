import { useEffect } from 'react'
import { useCursor } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'

/**
 * TRACKERS · a redirect, not a page.
 *
 * The habit grid moved onto Today as its fourth surface
 * (`components/today/HabitsSurface.tsx`). It is not a `Body → Tracking` tab
 * any more — the daily tick already lived on Today while the month view of the
 * same data sat two sections away, which is the split this closes.
 *
 * The view id stays, and stays reachable, because **fifteen places navigate to
 * it**: the Today plan card's "3 habits left", two coach tips, two guide
 * steps, `captureLanding` for every metric and habit record, `recommend`,
 * Goals, Onboarding and the `h` shortcut. Retiring the id would have meant
 * rewriting all of those to a navigation API that can carry a surface, which
 * is a lot of churn to avoid one redirect — and every one of them would still
 * be pointing at the same content.
 *
 * So: land on Today, on the habits surface, and leave the links alone.
 */
export function Trackers() {
  const nav = useNav()
  const { setSurface } = useCursor()
  useEffect(() => {
    setSurface('habits')
    nav('today')
  }, [nav, setSurface])
  return null
}
