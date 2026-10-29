import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { PhonePoints } from '../components/PhonePoints'
import { Pullups } from './Pullups'
import { SectionRail } from '../components/page'
import { TodayPlanCard } from '../components/TodayPlanCard'

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

describe('a section rail on a phone', () => {
  // The failure: Coaching's eight chapter chips wrapping to three lines
  // (~140px) above the content. A phone gets one native select.
  const groups = [{ id: 'a', label: 'Shots', count: 14 }, { id: 'b', label: 'Drills', count: 21 }]

  it('is one select on a phone, and choosing an option switches the panel', async () => {
    phone()
    const onChange = vi.fn()
    wrap(<SectionRail label="Chapters" groups={groups} value="a" onChange={onChange} railAt="never" />)
    const select = screen.getByRole('combobox', { name: 'Chapters' })
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    await userEvent.selectOptions(select, 'b')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('stays the chip row on a desktop', () => {
    desktop()
    wrap(<SectionRail label="Chapters" groups={groups} value="a" onChange={() => {}} railAt="never" />)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})

describe("Today's plan on a phone", () => {
  // The failure: a 7-day bar chart on the phone's Today, and the coverage
  // strip is the only `role="img"` this card draws.
  it('draws the week strip on a desktop', () => {
    desktop()
    wrap(<TodayPlanCard />)
    expect(screen.getByRole('img', { name: /^Coverage this week/ })).toBeTruthy()
  })

  it('draws no chart on a phone', () => {
    phone()
    wrap(<TodayPlanCard />)
    expect(screen.queryByRole('img', { name: /^Coverage this week/ })).toBeNull()
  })
})
