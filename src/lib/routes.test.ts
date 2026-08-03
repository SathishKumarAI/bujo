import { describe, expect, it } from 'vitest'
import { ROUTES, pathFor, sectionForPath, tabsFor, viewForPath } from './routes'
import { VIEW_CHROME, type ViewId } from '../components/shell/viewChrome'

const GATES_ON = { cycle: true, nofap: true }
const GATES_OFF = { cycle: false, nofap: false }

describe('route table', () => {
  it('covers every view the app can render', () => {
    const routed = new Set(ROUTES.map((r) => r.id))
    const known = Object.keys(VIEW_CHROME) as ViewId[]
    // `gym` is intentionally absent: it was never its own screen, only
    // FitnessHub opened on its Strength tab, so it survives as a legacy
    // redirect rather than a route.
    const missing = known.filter((id) => id !== 'gym' && !routed.has(id))
    expect(missing).toEqual([])
  })

  it('gives every view a unique path', () => {
    const paths = ROUTES.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('round-trips id → path → id', () => {
    for (const r of ROUTES) {
      expect(viewForPath(pathFor(r.id))).toBe(r.id)
    }
  })

  it('fills params from the caller, not just from today', () => {
    expect(pathFor('today', { day: '2026-07-04' })).toBe('/day/2026-07-04')
    expect(pathFor('monthly', { month: '2026-03' })).toBe('/plan/month/2026-03')
    // A day implies its month when no month is given.
    expect(pathFor('monthly', { day: '2026-07-04' })).toBe('/plan/month/2026-07')
  })

  it('does not let a shorter path swallow a longer one', () => {
    // The bug this guards: `/settings` matching before `/settings/account`.
    expect(viewForPath('/settings/account')).toBe('account')
    expect(viewForPath('/settings')).toBe('settings')
    expect(viewForPath('/plan/month/2026-08')).toBe('monthly')
    expect(viewForPath('/plan/tasks')).toBe('plan')
  })

  it('lights up the section a sub-route belongs to', () => {
    expect(sectionForPath('/body/pullups')).toBe('body')
    expect(sectionForPath('/body/fitness')).toBe('body')
    expect(sectionForPath('/insights/focus')).toBe('insights')
    expect(sectionForPath('/day/2026-07-04')).toBe('day')
  })

  it('returns null for a path that is not a route', () => {
    expect(viewForPath('/nope')).toBeNull()
    expect(sectionForPath('/nope')).toBeNull()
  })

  it('hides gated views from their section tabs', () => {
    const on = tabsFor('body', GATES_ON).map((r) => r.id)
    const off = tabsFor('body', GATES_OFF).map((r) => r.id)
    expect(on).toContain('cycle')
    expect(on).toContain('nofap')
    expect(off).not.toContain('cycle')
    expect(off).not.toContain('nofap')
  })

  it('keeps the five nav sections to five', () => {
    const sections = new Set(ROUTES.filter((r) => r.section !== 'system').map((r) => r.section))
    expect(sections.size).toBe(5)
  })
})
