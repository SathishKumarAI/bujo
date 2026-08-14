import { describe, expect, it } from 'vitest'
import { CLASSIC_NAV, CLASSIC_GROUP_ORDER } from './classicNav'
import { SECTIONS, type SectionGates } from './sections'

const ALL: SectionGates = { cycle: true, nofap: true }
const shown = (g: SectionGates) => CLASSIC_NAV.filter((n) => !n.show || n.show(g))

describe('the classic rail', () => {
  // The bug this file exists for. Strength and Pickleball were tabs of Body in
  // the focused rail and absent from this list, and classic renders no tab row
  // — so on `layout: 'classic'` the two views had no door in the UI at all.
  // Nothing failed: not the build, not a type, not a test. It was only visible
  // by reading the rendered rail and noticing two views missing from it.
  it('reaches every section view, so neither layout can lose one', () => {
    const reachable = new Set(shown(ALL).map((n) => n.id))
    const missing = SECTIONS.flatMap((s) => s.tabs)
      .map((t) => t.view)
      .filter((v) => !reachable.has(v))
    expect(missing).toEqual([])
  })

  it('renders every row it declares — a group not in the order is a dead row', () => {
    // `Sidebar` filters items by `groupOrder`, so an item whose group is absent
    // is silently dropped. That is how `group: 'System'` hid Help and Settings
    // in plain sight for as long as anyone had read this list.
    const orphans = CLASSIC_NAV.filter((n) => !CLASSIC_GROUP_ORDER.includes(n.group))
    expect(orphans.map((n) => `${n.id} (group: ${n.group})`)).toEqual([])
  })

  it('drops a gated row when its setting is off, and only that row', () => {
    const off = shown({ cycle: false, nofap: false }).map((n) => n.id)
    expect(off).not.toContain('cycle')
    expect(off).not.toContain('nofap')
    expect(off).toContain('fitness')
    expect(shown(ALL).length - off.length).toBe(2)
  })

  it('has no duplicate destinations', () => {
    const ids = CLASSIC_NAV.map((n) => n.id)
    expect(ids).toHaveLength(new Set(ids).size)
  })
})
