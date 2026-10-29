import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { PhonePoints } from '../components/PhonePoints'
import { Pullups } from './Pullups'

/**
 * The phone shapes of the last pages to get one, each test named for the way
 * it breaks: the desktop drawing changing, or the phone going back to the
 * desktop's long form. "Phone" is the same matchMedia stub ExploreBanner's
 * test uses; jsdom has no matchMedia, so the desktop gets a stub too.
 */
const media = (matches: (q: string) => boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches(q), media: q, addEventListener() {}, removeEventListener() {} }))
const phone = () => media((q) => !q.includes('coarse'))
const desktop = () => media(() => false)
const wrap = (ui: ReactNode) =>
  render(<DeviceProvider><JournalProvider><NavProvider navigate={() => {}}>{ui}</NavProvider></JournalProvider></DeviceProvider>)

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

describe('PhonePoints', () => {
  const ui = <PhonePoints prose={<p>One long paragraph.</p>} points={['first point here', 'second point here']} />

  it('leaves the desktop paragraph exactly as it was', () => {
    desktop()
    const { container } = wrap(ui)
    expect(container.querySelector('p')?.textContent).toBe('One long paragraph.')
    expect(container.querySelector('li')).toBeNull()
  })

  it('draws points, not the paragraph, on a phone', () => {
    phone()
    const { container } = wrap(ui)
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelector('p')).toBeNull()
  })
})

describe('Pull-ups log on a phone', () => {
  it('keeps effort, duration and notes inline on a desktop', async () => {
    desktop()
    wrap(<Pullups />)
    // jsdom's 0px shell is the stacked layout, where the act starts shut.
    await userEvent.click(screen.getAllByRole('button', { expanded: false }).find((b) => /log/i.test(b.textContent ?? ''))!)
    expect(screen.getByPlaceholderText(/Grip, how the last set felt/)).toBeTruthy()
  })

  it('puts them behind one row on a phone, and the row opens them', async () => {
    phone()
    wrap(<Pullups />)
    expect(screen.queryByPlaceholderText(/Grip, how the last set felt/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Log session' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Effort, duration, notes/ }))
    expect(screen.getByRole('dialog', { name: 'How it went' })).toBeTruthy()
    expect(screen.getByPlaceholderText(/Grip, how the last set felt/)).toBeTruthy()
  })
})
