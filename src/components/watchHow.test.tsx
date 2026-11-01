import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
