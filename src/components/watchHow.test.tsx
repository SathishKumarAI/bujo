import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { DeviceProvider } from './shell/device'
import { SetCards } from './gym/phone/SetCards'
import { newSetRow } from './gym/setRow'
import { emptyJournal } from '../lib/storage'
import { ActivityForm } from './page/ActivityForm'
import { emptyDraft } from './page/draft'
import { ActivityFieldsPhone } from './fitness/phone/ActivityFieldsPhone'
import { DayLog } from './nutrition/DayLog'
import { Nutrition } from '../views/Nutrition'
import { TypingDrill } from './focus/TypingBand'
import { videoUrl } from '../lib/video'
import { NavProvider } from './shell/nav'
import { JournalProvider } from '../store'
import { TodayDrill } from './pickleball/TodayDrill'
import { LeadingPrinciple } from './mindset/LeadingPrinciple'
import { PrincipleSpotlight } from './mindset/PrincipleSpotlight'
import { MINDSET_LIBRARY } from '../lib/mindset'
import { todayISO } from '../lib/date'
import { useProgram } from './program/useProgram'
import { DayChecklist } from './program/DayChecklist'
import { ProgramPhone } from './program/phone/ProgramPhone'

// COD-479: a "watch how" link on every named thing. One test per CALL SITE,
// because a helper nobody passes is a feature nobody can reach (the InfoTip
// `onMore` trap in CLAUDE.md). Each asserts the item's own name reached the
// query, and the domain's question — not "proper form" — was asked.

const searchOf = (a: HTMLElement) => new URL(a.getAttribute('href')!).searchParams.get('search_query')

describe('watch-how links reach every page that names a thing', () => {
  it("Pickleball's today's drill searches for that drill", () => {
    render(<NavProvider navigate={() => {}}><JournalProvider><TodayDrill /></JournalProvider></NavProvider>)
    const a = screen.getByRole('link', { name: /^Watch how: / })
    const drill = a.getAttribute('aria-label')!.replace('Watch how: ', '')
    expect(searchOf(a)).toBe(`pickleball ${drill} drill`)
  })

  it("Mindset's leading principle searches for a talk on it", () => {
    const p = MINDSET_LIBRARY[0]
    render(<LeadingPrinciple principle={p} daysPracticed={0} />)
    expect(searchOf(screen.getByRole('link', { name: `Watch a talk: ${p.title}` }))).toBe(`${p.title} explained`)
  })

  it("Mindset's daily spotlight carries the same link", () => {
    const p = MINDSET_LIBRARY[1]
    render(<PrincipleSpotlight principle={p} today={todayISO()} practisedToday={false} onPractise={() => {}} />)
    expect(searchOf(screen.getByRole('link', { name: `Watch a talk: ${p.title}` }))).toBe(`${p.title} explained`)
  })
})

// COD-541: on Program the link sits RIGHT AFTER the lift name on the closed
// row — it used to live only inside the opened row, one tap down.
function PhoneDay() {
  const s = useProgram('hyper12')
  return <ProgramPhone s={s} onCheck={() => {}} rest={null} />
}
function DeskDay() {
  return <DayChecklist s={useProgram('hyper12')} />
}

describe('Program shows "Watch" beside every lift without opening it', () => {
  it('phone: every closed lift row carries its own Watch link', () => {
    render(<NavProvider navigate={() => {}}><JournalProvider><PhoneDay /></JournalProvider></NavProvider>)
    const toggles = screen.getAllByRole('button', { expanded: false }).filter((b) => b.closest('.lift-row'))
    expect(toggles.length).toBeGreaterThan(0)
    for (const t of toggles) {
      const name = t.textContent!.trim()
      // In the same row, not somewhere else on the page.
      within(t.closest('.lift-row') as HTMLElement).getByRole('link', { name: `Watch: ${name}` })
    }
  })

  it('desktop: each checklist row names its Watch link after the lift', () => {
    render(<NavProvider navigate={() => {}}><JournalProvider><DeskDay /></JournalProvider></NavProvider>)
    const rows = screen.getAllByRole('listitem')
    expect(rows.length).toBeGreaterThan(0)
    for (const li of rows) {
      const name = within(li).getByRole('checkbox').getAttribute('aria-label')!.replace(/^Did /, '')
      expect(within(li).getByRole('link', { name: `Watch: ${name}` }).textContent).toContain('Watch')
    }
  })
})

// COD-479, the rest of the §1 table: Strength's phone set cards, Fitness (both
// drawings), Nutrition (both drawings) and Focus's typing practice.
describe('watch-how links on Strength, Fitness, Nutrition and Focus', () => {
  afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

  it("Strength phone: each set card's header names its exercise", () => {
    render(<SetCards rows={[newSetRow({ exercise: 'Romanian deadlift' }), newSetRow({ exercise: 'Leg press' })]} onChange={() => {}} unit="lb" data={emptyJournal()} />)
    for (const ex of ['Romanian deadlift', 'Leg press']) {
      const card = screen.getByRole('region', { name: ex })
      // A lift goes through `videoUrl`: the owner's pinned clip when the
      // catalogue has one (Romanian deadlift does), else a proper-form search.
      expect(within(card).getByRole('link', { name: `Watch: ${ex}` }).getAttribute('href')).toBe(videoUrl(ex))
    }
  })

  it('Fitness desktop: the link follows the activity and its kind', () => {
    const form = (draft: ReturnType<typeof emptyDraft>, mode: 'cardio' | 'sport' = 'cardio') =>
      <ActivityForm mode={mode} draft={draft} onChange={() => {}} onSubmit={() => {}} unit="km" />
    const { rerender } = render(form(emptyDraft('cardio')))
    expect(searchOf(screen.getByRole('link', { name: 'Watch how: Run' }))).toBe('Run technique for beginners')
    rerender(form({ ...emptyDraft('cardio'), subActivity: 'Intervals' }))
    expect(searchOf(screen.getByRole('link', { name: 'Watch how: Run · Intervals' }))).toBe('Run · Intervals technique for beginners')
    // A catch-all with no kind has nothing worth searching for.
    rerender(form({ ...emptyDraft('sport'), activity: 'sport' }, 'sport'))
    expect(screen.queryByRole('link', { name: /^Watch how/ })).toBeNull()
    rerender(form({ ...emptyDraft('sport'), activity: 'sport', subActivity: 'Tennis' }, 'sport'))
    expect(searchOf(screen.getByRole('link', { name: 'Watch how: Tennis' }))).toBe('Tennis technique for beginners')
  })

  it("Fitness phone: the link is in the sheet's details, not on the one-screen log", () => {
    // jsdom has no scrollTo; the picker row centres its chosen tile with it.
    Element.prototype.scrollTo = () => {}
    const draft = { ...emptyDraft('cardio'), activity: 'swim' as const }
    const { rerender } = render(<ActivityFieldsPhone part="main" mode="cardio" draft={draft} onChange={() => {}} unit="km" />)
    expect(screen.queryByRole('link', { name: /^Watch how/ })).toBeNull()
    rerender(<ActivityFieldsPhone part="more" mode="cardio" draft={draft} onChange={() => {}} unit="km" />)
    expect(searchOf(screen.getByRole('link', { name: 'Watch how: Swim' }))).toBe('Swim technique for beginners')
  })

  it('Nutrition desktop: each logged food asks how to cook it, in its own row', () => {
    const food = { id: 'f1', name: 'Paneer tikka', kcal: 300, protein: 18, carbs: 8, fat: 20 }
    render(<DayLog date={todayISO()} today={todayISO()} foods={[food]} onEdit={() => true} onRemove={() => {}} onServings={() => {}} />)
    const row = screen.getByRole('listitem')
    expect(searchOf(within(row).getByRole('link', { name: 'Watch a video: Paneer tikka' }))).toBe('how to cook Paneer tikka')
  })

  it('Nutrition phone: every food row carries its own link, in that row', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: !q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} }))
    render(<DeviceProvider><JournalProvider><NavProvider navigate={() => {}}><Nutrition /></NavProvider></JournalProvider></DeviceProvider>)
    const links = screen.getAllByRole('link', { name: /^Watch a video: / })
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      const name = a.getAttribute('aria-label')!.replace('Watch a video: ', '')
      expect(searchOf(a)).toBe(`how to cook ${name}`)
      expect(a.closest('.cell')!.textContent).toContain(name)
    }
  })

  it('Focus: typing practice searches for touch typing', () => {
    render(<JournalProvider><TypingDrill /></JournalProvider>)
    expect(searchOf(screen.getByRole('link', { name: 'Watch how: Touch typing' }))).toBe('touch typing technique for beginners')
  })
})
