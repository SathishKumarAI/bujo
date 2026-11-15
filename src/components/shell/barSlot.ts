import { useSyncExternalStore } from 'react'

/**
 * GAPS IN THE SHELL'S BARS, as somewhere a page can draw.
 *
 * OWNS: one element per bar that the bar leaves empty, and telling the page
 * when it appears or goes. A bar is the page's sibling, not its parent, so a
 * context cannot reach; a ref store can.
 * DOES NOT OWN: what is drawn there — the page portals in when the slot
 * exists and draws inline when it does not (component tests, which render a
 * page without the shell).
 *
 * - `barSlot`: the phone bar's gap between title and Quick add (COD-537);
 *   `DayStrip` draws its day pill there.
 */
function slotStore() {
  let slot: HTMLElement | null = null
  const subs = new Set<() => void>()
  const set = (el: HTMLElement | null) => {
    slot = el
    subs.forEach((f) => f())
  }
  const subscribe = (f: () => void) => {
    subs.add(f)
    return () => { subs.delete(f) }
  }
  const use = () => useSyncExternalStore(subscribe, () => slot, () => null)
  return [set, use] as const
}

export const [setBarSlot, useBarSlot] = slotStore()
