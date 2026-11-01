import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../../store'
import { ConfirmProvider } from '../ConfirmDialog'
import { CompetitionPanel } from './CompetitionPanel'
import { generateDemoData } from '../../lib/demo'

/**
 * The desktop Competition panel's × (COD-560). It removed a DUPR rating on the
 * first click; the phone drawing already asked. Asserted on the JOURNAL: the
 * rating must still be stored after Cancel and gone only after confirming.
 */
afterEach(() => { cleanup(); localStorage.clear() })

const ratings = () => (JSON.parse(localStorage.getItem('bujo:data')!) as { settings: { duprLog?: { date: string }[] } }).settings.duprLog ?? []

describe('desktop Competition panel', () => {
  it('asks before removing a DUPR rating, and Cancel keeps it', async () => {
    localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
    render(<ConfirmProvider><JournalProvider><CompetitionPanel /></JournalProvider></ConfirmProvider>)
    const date = ratings().at(-1)!.date
    const before = ratings().length

    await userEvent.click(screen.getByRole('button', { name: `Remove rating from ${date}` }))
    await screen.findByRole('alertdialog')
    expect(ratings().length).toBe(before)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(ratings().some((r) => r.date === date)).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: `Remove rating from ${date}` }))
    await userEvent.click(await screen.findByRole('button', { name: 'Remove it' }))
    expect(ratings().some((r) => r.date === date)).toBe(false)
  })
})
