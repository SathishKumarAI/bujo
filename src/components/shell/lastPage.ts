import { landingOf, sectionOf, tabsOf, type SectionGates, type SectionId } from './sections'
import type { ViewId } from './viewChrome'

/**
 * WHICH PAGE OF EACH SECTION YOU WERE LAST ON — the phone bottom bar's memory.
 *
 * Owner, 2026-10-29: "unable to navigate from body to … mind". With the tab
 * strip gone from the phone bar (the title opens every page instead), the
 * quick hop it gave — Nutrition, over to Mind, back to Nutrition — would cost
 * a sheet each way. An iOS tab bar keeps each tab's place; so does this: tap
 * Body and you land where you left Body, not on Fitness.
 *
 * `bujo.ui.` so "Erase everything" and the a11y gate's reset both sweep it.
 * Checked against the gates on read, so a page since switched off (Cycle) is
 * never a destination.
 */
const key = (s: SectionId) => `bujo.ui.lastPage.${s}`

export function rememberPage(view: ViewId) {
  const s = sectionOf(view)
  if (!s) return
  try { localStorage.setItem(key(s), view) } catch { /* private mode: no memory, still navigates */ }
}

export function lastPageOf(s: SectionId, gates: SectionGates): ViewId {
  let v: string | null = null
  try { v = localStorage.getItem(key(s)) } catch { /* fall through to the landing */ }
  return tabsOf(s, gates).find((t) => t.view === v)?.view ?? landingOf(s, gates)
}
