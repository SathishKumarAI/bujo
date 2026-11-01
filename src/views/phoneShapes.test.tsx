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
import { Goals } from './Goals'
import { HomeWorkout } from './HomeWorkout'
import { Coaching } from './Coaching'
import { Collections } from './Collections'
import { repsOf } from '../lib/pullups'
import { SectionRail } from '../components/page'
import { TodayPlanCard } from '../components/TodayPlanCard'
import { STORAGE_KEY, emptyJournal } from '../lib/storage'

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
    // One tap, not a native picker; straight is the default, so a ladder in
    // the journal can only come from the tap.
    expect(screen.queryByRole('combobox', { name: 'Method' })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Ladder' }))
    expect(screen.getByText(/1,2,…,top per round/)).toBeTruthy()
    while (Number(document.querySelector('output[aria-label="Top set"]')!.textContent) < 3) {
      await userEvent.click(screen.getByRole('button', { name: 'Top set, one more' }))
    }
    const top = Number(document.querySelector('output[aria-label="Top set"]')!.textContent)
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
    expect(perRound).toBe((top * (top + 1)) / 2)
  })

  // The failure: Effort and Duration as two bare segmented rows with no
  // heading — a row of "Easy … Max" and one of "10m … 45m" that say nothing
  // about what they are until you read them.
  it('labels Effort and Duration in How it went', async () => {
    phone()
    wrap(<Pullups />)
    await userEvent.click(screen.getByRole('button', { name: /Log a free session/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Effort, duration, notes/ }))
    const sheet = screen.getByRole('dialog', { name: 'How it went' })
    for (const name of ['Effort', 'Duration']) {
      const group = screen.getByRole('radiogroup', { name })
      expect(group.closest('.cell')?.textContent?.startsWith(name)).toBe(true)
      expect(sheet.contains(group)).toBe(true)
    }
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

  // The failure: the source switch going back to a native picker (two taps
  // and a wheel), or a tap on it that does not change the list. Whey is
  // American and not in a fresh journal's usual, so it can only be logged if
  // the tap really switched the list.
  it('switches the food list in one tap and logs from the new list', async () => {
    phone()
    wrap(<Nutrition />)
    await userEvent.click(screen.getByRole('button', { name: 'Add food' }))
    expect(screen.queryByRole('combobox', { name: 'Show' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add Whey protein/ })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: /^American, \d+ foods$/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Add Whey protein, 126 kcal/ }))
    expect(today()).toMatchObject({ calories: 126, foodLog: [expect.objectContaining({ name: 'Whey protein' })] })
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

  // The duplicate that went: a second "Today" list writing the same count
  // Gave in writes. Today's count lives on the streak line and opens to fix.
  it('has one list, and the streak line opens the day count to fix a mis-tap', async () => {
    phone()
    wrap(<NoFap />)
    expect(screen.queryByRole('region', { name: 'Today' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /tap to fix today/ }))
    await userEvent.click(screen.getByRole('button', { name: /^More Main streak today/ }))
    expect(nofap().relapses.at(-1)).toMatchObject({ count: 1 })
    // A minus never deletes a logged day (it would undo a reset silently)…
    expect((screen.getByRole('button', { name: 'Less Main streak today' }) as HTMLButtonElement).disabled).toBe(true)
    // …the explicit remove does, after asking (no provider: window.confirm).
    vi.stubGlobal('confirm', () => true)
    await userEvent.click(screen.getByRole('button', { name: 'Remove today’s slip' }))
    expect(nofap().relapses).toHaveLength(0)
  })
})

describe('Goals on a phone', () => {
  // The failure: the only input on the page at y 924, a four-field form under
  // fifteen derived bars. Your own goals come first, added from a sheet and
  // moved with + in their row.
  it('adds a goal from the sheet and moves it with + in its row', async () => {
    phone()
    wrap(<Goals />)
    await userEvent.click(screen.getByRole('button', { name: /Add a goal/ }))
    await userEvent.type(screen.getByPlaceholderText('Save $500'), 'Read books')
    await userEvent.type(screen.getByPlaceholderText('500'), '12')
    await userEvent.click(screen.getByRole('button', { name: 'Add goal' }))
    await userEvent.click(screen.getByRole('button', { name: 'One more on Read books' }))
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"customGoals"'))!)
    expect(j.customGoals).toMatchObject([{ label: 'Read books', target: 12, value: 1 }])
  })
})

describe('Home workout on a phone', () => {
  // The failure: a session of six typed "3×12" fields and a full-width Log
  // slab. A routine is one select, an exercise is a row you tick set by set,
  // and Log writes what you ticked (all of it when you ticked nothing).
  it('loads a routine into rows and logs only the exercises you ticked', async () => {
    phone()
    wrap(<HomeWorkout />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Routine' }), 'fullbody')
    await userEvent.click(screen.getByRole('button', { name: /^Push-ups: 0\/3 sets done/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Log · 1/ }))
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"workouts"'))!)
    const logged = j.workouts.filter((w: { activity: string }) => w.activity === 'homeWorkout')
    expect(logged.map((w: { sets: string[] }) => w.sets)).toEqual([['Push-ups 3×12']])
  })
})

describe('Coaching on a phone', () => {
  // The failure: the program as a roadmap card with its own stepper, a
  // template of timed paragraphs and the record, all open (1,685px). One week
  // from a select, drills as rows, and a dock that marks it done — then offers
  // the next week rather than unticking this one.
  it('starts the program, marks the week done from the dock, and moves on', async () => {
    phone()
    wrap(<Coaching />)
    await userEvent.click(screen.getByRole('button', { name: /Start the program/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark week 1 done' }))
    const j = JSON.parse(Object.values({ ...localStorage }).find((v) => String(v).includes('"coachingWeeksDone"'))!)
    expect(j.settings.coachingWeeksDone).toEqual([1])
    await userEvent.click(screen.getByRole('button', { name: /Week 1 done · next/ }))
    expect((screen.getByRole('combobox', { name: 'Week' }) as HTMLSelectElement).value).toBe('2')
  })
})

describe('Collections on a phone', () => {
  // The failures: three always-open add forms (one wrapped into a jumble
  // around its heading), and deletes that removed on the first tap.
  it('adds a collection from a sheet, and deleting it asks first', async () => {
    phone()
    vi.stubGlobal('confirm', () => false)
    wrap(<Collections />)
    expect(screen.queryByRole('textbox', { name: 'Collection name' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'New collection' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Collection name' }), 'Packing list{Enter}')
    await userEvent.click(screen.getByRole('button', { name: 'Delete Packing list' }))
    // The confirm said no, so it is still there.
    expect(screen.getByRole('button', { name: /Packing list/, expanded: false })).toBeTruthy()
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

  // The failure: "9 habits left" under a Habits card saying "0 of 8 done" —
  // dayCompletion counted an AVOID habit as one still to do. The chip reads
  // the same helper as the Habits card (dayHabitSummary).
  it('counts habits left the way the Habits card does — an avoid habit is not one to do', () => {
    desktop()
    const h = (id: string, avoid?: boolean) => ({ id, name: id, category: 'custom', color: 'mauve', startedOn: '2020-01-01', avoid })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyJournal(), habits: [h('Read'), h('Water'), h('Doomscrolling', true)] }))
    wrap(<TodayPlanCard />)
    expect(screen.getByText('2 habits left')).toBeTruthy()
  })

  // COD-500: the chip navigated to `trackers`, which redirects to Today, so
  // the tap only jumped to the top. It must bring Today's Habits card in.
  it('takes "habits left" to the Habits card on this page, not to a redirect', async () => {
    desktop()
    const h = (id: string) => ({ id, name: id, category: 'custom', color: 'mauve', startedOn: '2020-01-01' })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyJournal(), habits: [h('Read')] }))
    const navigate = vi.fn()
    render(<DeviceProvider><JournalProvider><NavProvider navigate={navigate}>
      <TodayPlanCard /><div id="today-habits"><section aria-label="Habits" /></div>
    </NavProvider></JournalProvider></DeviceProvider>)
    const card = screen.getByRole('region', { name: 'Habits' })
    card.scrollIntoView = vi.fn()
    await userEvent.click(screen.getByRole('button', { name: /1 habit left/ }))
    expect(card.scrollIntoView).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
