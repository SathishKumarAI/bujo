import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { Coaching } from './Coaching'

/**
 * COD-481: the manual's chapter heading was an h3 with no h2 above it, so
 * axe flagged `heading-order` on every chapter at every width. A heading
 * level may go down by any amount but never skip on the way in.
 */
afterEach(() => { cleanup(); localStorage.clear() })

const skips = () => {
  const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
  return levels.filter((l, i) => l > (i === 0 ? 2 : levels[i - 1] + 1))
}

describe('Coaching headings', () => {
  it('never skips a level, on the Drills chapter', async () => {
    render(<NavProvider navigate={() => {}}><ConfirmProvider><JournalProvider><Coaching /></JournalProvider></ConfirmProvider></NavProvider>)
    await userEvent.click((await screen.findAllByRole('button', { name: /^Drills/ }))[0])
    expect(await screen.findByRole('heading', { name: /Drill library/ })).toBeTruthy()
    expect(skips()).toEqual([])
  })
})
