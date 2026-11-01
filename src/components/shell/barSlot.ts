import { useSyncExternalStore } from 'react'

/**
 * THE GAP IN THE PHONE BAR, as somewhere a page can draw (COD-537).
 *
 * OWNS: the one element `PhoneTopBar` leaves between its title and Quick add,
 * and telling the page when it appears or goes. The bar is the page's sibling,
 * not its parent, so a context cannot reach; a ref store can.
 * DOES NOT OWN: what is drawn there — `DayStrip` portals itself in when the
 * slot exists and draws inline when it does not (component tests, which
 * render a page without the shell).
 */
let slot: HTMLElement | null = null
const subs = new Set<() => void>()

export function setBarSlot(el: HTMLElement | null) {
  slot = el
  subs.forEach((f) => f())
}

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => { subs.delete(f) }
}

export const useBarSlot = () => useSyncExternalStore(subscribe, () => slot, () => null)
