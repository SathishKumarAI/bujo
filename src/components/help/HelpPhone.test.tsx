import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../../store'
import { NavProvider } from '../shell/nav'
import { DeviceProvider } from '../shell/device'
import { Help } from '../../views/Help'

/**
 * Help on a phone, each test named for the way it breaks. Anchored on roles
 * and accessible names, never copy. Same matchMedia stub as phoneShapes.test.
 */
const media = (matches: (q: string) => boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches(q), media: q, addEventListener() {}, removeEventListener() {} }))
const phone = () => media((q) => !q.includes('coarse'))
const desktop = () => media(() => false)
const go = vi.fn()
const wrap = () => render(<DeviceProvider><JournalProvider><NavProvider navigate={go}><Help /></NavProvider></JournalProvider></DeviceProvider>)

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); go.mockReset() })

describe('Help on a phone', () => {
  it('has one navigation — no tutorial tablist or second rail competing with it', () => {
    phone()
    wrap()
    expect(screen.getAllByRole('navigation').map((n) => n.getAttribute('aria-label'))).toEqual(['Help sections'])
    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('opens a tutorial in place, and its step opens the screen it names', async () => {
    phone()
    wrap()
    const row = screen.getByRole('button', { name: /Your first five minutes/ })
    expect(row.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(row)
    expect(row.getAttribute('aria-expanded')).toBe('true')
    const body = document.getElementById(row.getAttribute('aria-controls')!)!
    expect(within(body).getAllByRole('listitem').length).toBeGreaterThan(5)
    await userEvent.click(within(body).getAllByRole('button', { name: /^Open Settings/ })[0])
    expect(go).toHaveBeenCalledWith('settings')
  })

  it('reaches the glossary through the one select, not a fold with its own rail', async () => {
    phone()
    wrap()
    await userEvent.selectOptions(screen.getByRole('combobox'), 'abbr')
    expect(screen.getByRole('region', { name: 'Cycle & fertility' })).toBeTruthy()
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
  })

  it('a search crosses every section and opens its hits', async () => {
    phone()
    wrap()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the guide' }), 'backup')
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('all')
    expect(screen.getAllByRole('button', { expanded: true }).length).toBeGreaterThan(0)
  })
})

describe('Help on a desktop', () => {
  it('keeps the tutorial tablist and its own drawing', () => {
    desktop()
    wrap()
    expect(screen.getByRole('tablist', { name: 'Tutorials' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Help sections' })).toBeNull()
  })
})
