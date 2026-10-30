import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { PhonePoints } from '../components/PhonePoints'
import { Pullups } from './Pullups'
import { Nutrition } from './Nutrition'
import { Challenges } from './Challenges'
import { NoFap } from './NoFap'
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

describe('Nutrition on a phone', () => {
  const today = () => {
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"metrics"'))!)
    return j.metrics.find((m: { foodLog?: unknown[] }) => m.foodLog?.length)
  }

  it('keeps the desktop act: date field and chip picker, no dock', () => {
    desktop()
    wrap(<Nutrition />)
    expect(screen.queryByRole('button', { name: 'Add food' })).toBeNull()
    expect(screen.queryByRole('radiogroup', { name: 'Day to log' })).toBeNull()
  })

  // The failure: the phone going back to a page of chips and charts. The
  // log is a day strip, a scoreboard and rows; adding goes through the sheet
  // and lands as a row whose servings change in place.
  it('adds a food from the sheet, and + on its row is a second serving', async () => {
    phone()
    wrap(<Nutrition />)
    expect(screen.getByRole('radiogroup', { name: 'Day to log' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Add food' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Search every food' }), 'plain dosa')
    await userEvent.click(screen.getByRole('button', { name: /^Add Plain dosa, 133 kcal/ }))
    expect(today()).toMatchObject({ calories: 133 })
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    await userEvent.click(screen.getByRole('button', { name: /^Plain dosa/, expanded: false }))
    await userEvent.click(screen.getByRole('button', { name: 'One more serving of Plain dosa' }))
    expect(today()).toMatchObject({ calories: 266, foodLog: [expect.objectContaining({ servings: 2 })] })
  })

  it('pins a food to the top of Your usual and keeps the pin in the journal', async () => {
    phone()
    wrap(<Nutrition />)
    const usual = () => [...screen.getByRole('region', { name: 'Your usual' }).querySelectorAll('.cell')].map((c) => c.textContent)
    expect(usual()[0]).toMatch(/^Chicken curry/)
    await userEvent.click(screen.getByRole('button', { name: 'Pin Idli to Your usual' }))
    expect(usual()[0]).toMatch(/^Idli/)
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"metrics"'))!)
    expect(j.settings.pinnedFoods).toEqual(['Idli'])
  })
})

describe('Challenges on a phone', () => {
  const log = () => {
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"challenges"'))!)
    return Object.values(j.challengeLog ?? {})[0] as Record<string, number[]> | undefined
  }

  it('keeps the desktop review: the summary strip and the calendar, no dock', async () => {
    desktop()
    wrap(<Challenges />)
    expect(screen.queryByRole('button', { name: 'Manage challenge' })).toBeNull()
  })

  // The failure: the phone going back to cards, four facts and a folded
  // calendar. Start from the sheet, tick from a row, tick the rest from the dock.
  it('starts a challenge from a sheet, ticks one rule from its row and the rest from the dock', async () => {
    phone()
    wrap(<Challenges />)
    await userEvent.click(screen.getByRole('button', { name: /New challenge/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Start challenge' }))
    const ticks = screen.getAllByRole('button', { name: /: tap when done$/ })
    await userEvent.click(ticks[0])
    expect(Object.values(log()!)[0]).toEqual([0])
    await userEvent.click(screen.getByRole('button', { name: /^Tick all/ }))
    expect(Object.values(log()!)[0]).toHaveLength(ticks.length)
    // Done is a state: the button that says it cannot untick the day.
    expect((screen.getByRole('button', { name: /^Day 1 done/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('Recovery on a phone', () => {
  const nofap = () => JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"nofap"'))!).nofap

  it('keeps the desktop log card, no dock', () => {
    desktop()
    wrap(<NoFap />)
    expect(screen.queryByRole('button', { name: 'I held' })).toBeNull()
  })

  // The failure: the phone going back to a select and a strength above the
  // two endings. An urge is a row you already know, and one tap logs it —
  // with no intensity written, since the phone never asks for one. "Gave in"
  // also counts the day: the same write as the desktop form (useUrgeDraft).
  it('logs an urge from its row in one tap, and Gave in counts the day', async () => {
    phone()
    wrap(<NoFap />)
    expect(screen.queryByRole('combobox', { name: 'What was the urge for?' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Nicotine: Held' }))
    expect(nofap().urgeLog.at(-1)).toMatchObject({ trigger: 'Nicotine' })
    expect(nofap().urgeLog.at(-1).intensity).toBeUndefined()
    await new Promise((r) => setTimeout(r, 3100)) // the double-tap guard
    await userEvent.click(screen.getByRole('button', { name: 'Nicotine: Gave in' }))
    expect(nofap().urgeLog.at(-1)).toMatchObject({ trigger: 'Nicotine', outcome: 'followed' })
    expect(nofap().relapses).toHaveLength(1)
  }, 10000)
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
