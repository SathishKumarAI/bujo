import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { PhonePoints } from '../components/PhonePoints'
import { Pullups } from './Pullups'
import { repsOf } from '../lib/pullups'
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

  // The failure the owner named: the free-form log above the program. On a
  // phone the program's day is the page; a free session is one row away.
  it('opens on the Starting From Zero day, and a tick plus your max logs both', async () => {
    phone()
    wrap(<Pullups />)
    expect(screen.getByRole('region', { name: /Starting From Zero/ })).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: 'Method' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /^Hollow Rocks: 0\/\d+ sets done/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Pull-up assessment/, expanded: false }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Pull-up assessment, what you did' }), '3')
    await userEvent.click(screen.getByRole('button', { name: /^Log day 1/ }))
    const journal = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"workouts"'))!)
    expect(journal.settings.programDone).toEqual(expect.arrayContaining(['pullup-zero-w1d1-e0', 'pullup-zero-w1d1-e1']))
    const logged = journal.workouts.filter((w: { activity: string }) => w.activity === 'pullups')
    expect(logged.map((w: { sets: string[] }) => repsOf(w.sets))).toEqual([3])
  })

  it('puts effort, duration and notes behind one dock button in the free session', async () => {
    phone()
    wrap(<Pullups />)
    await userEvent.click(screen.getByRole('button', { name: /Log a free session/ }))
    expect(screen.queryByPlaceholderText(/Grip, how the last set felt/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /^Effort, duration, notes/ }))
    expect(screen.getByRole('dialog', { name: 'How it went' })).toBeTruthy()
    expect(screen.getByPlaceholderText(/Grip, how the last set felt/)).toBeTruthy()
  })

  // The failures: the method left unexplained above the form (owner: "how
  // will I know what is straight and ladder"), and Log writing the plan when
  // only some rounds were ticked.
  it('says what the method means, and logs only the rounds you ticked', async () => {
    phone()
    wrap(<Pullups />)
    await userEvent.click(screen.getByRole('button', { name: /Log a free session/ }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Method' }), 'ladder')
    expect(screen.getByText(/1,2,…,top per round/)).toBeTruthy()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rounds' }), '2')
    await userEvent.click(screen.getByRole('button', { name: /^Round 1, tap when done/ }))
    const log = screen.getByRole('button', { name: /^Log · \d+ reps$/ })
    const perRound = Number(/(\d+)/.exec(log.textContent ?? '')![1])
    await userEvent.click(screen.getByRole('button', { name: /^Round 2, tap when done/ }))
    expect(log.textContent).toContain(`${perRound * 2} reps`)
    await userEvent.click(screen.getByRole('button', { name: /^Round 2, done/ }))
    await userEvent.click(log)
    const journal = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"workouts"'))!)
    const logged = journal.workouts.filter((w: { activity: string }) => w.activity === 'pullups')
    expect(logged).toHaveLength(1)
    expect(repsOf(logged[0].sets)).toBe(perRound)
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
