import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavProvider } from './shell/nav'
import { JournalProvider } from '../store'
import { TodayDrill } from './pickleball/TodayDrill'
import { LeadingPrinciple } from './mindset/LeadingPrinciple'
import { PrincipleSpotlight } from './mindset/PrincipleSpotlight'
import { MINDSET_LIBRARY } from '../lib/mindset'
import { todayISO } from '../lib/date'

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
