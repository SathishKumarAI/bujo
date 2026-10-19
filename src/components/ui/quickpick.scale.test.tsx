import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChipPick } from './quickpick'

/**
 * THE SEGMENTED SCALE · what makes it a scale rather than five pills.
 *
 * A 1–5 rating drawn as five separate chips is five peers, and five peers is
 * what a TAG row looks like — on Cycle's field panel `Mood` sat four pixels
 * above `Mood tags` with the numbers carrying exactly the weight and shape of
 * `calm` / `happy`. One is ordered and the other is a set, and nothing said
 * so.
 *
 * These assert the things that carry "ordered" and nothing about the colours,
 * which `check-contrast` owns: the options are ONE control rather than five,
 * the ends are NAMED, the legend is the group's name rather than a sentence
 * with the endpoints in it — and, since it became a rail, that **nothing
 * chosen draws an empty rail**. That last one is load-bearing rather than
 * cosmetic: this app has to keep "not answered" and "answered 1" apart,
 * because a 1 and a skipped day must never average together.
 */
const OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))

function renderScale(extra: Record<string, unknown> = {}) {
  const onChange = vi.fn()
  const r = render(
    <ChipPick
      label="Mood"
      value={3}
      onChange={onChange}
      scale={{ low: '1 low', high: '5 great' }}
      options={OPTIONS}
      {...extra}
    />,
  )
  return { ...r, onChange }
}

describe('ChipPick · the segmented scale', () => {
  it('draws one rail with five stops, not five loose chips', () => {
    const { container } = renderScale()
    // The stops are one grid, so they divide the width evenly and read as
    // positions along a run rather than as five peers that happen to be
    // adjacent. Asserted on the STRUCTURE, not on a utility class: this test
    // was keyed to `.divide-x` and broke the day the track became a rail,
    // which is the "a test keyed to styling" trap one level down from the
    // one keyed to copy.
    const stops = container.querySelectorAll('button')
    expect(stops).toHaveLength(5)
    const parents = new Set([...stops].map((b) => b.parentElement))
    expect(parents.size, 'the stops are not one group').toBe(1)
  })

  it('draws nothing on the rail until something is chosen', () => {
    const chosen = renderScale().container.querySelectorAll('[style*="width"]').length
    expect(chosen, 'a chosen value draws a block on the rail').toBeGreaterThan(0)
    const empty = renderScale({ value: null }).container
    // Not a styling preference: an empty rail is how "you have not answered"
    // stays distinguishable from "you answered 1".
    expect(
      [...empty.querySelectorAll('[style*="left"]')].length,
      'an unanswered scale drew a block anyway',
    ).toBe(0)
    expect(empty.querySelectorAll('button')).toHaveLength(5)
  })

  it('names both ends, outside the legend', () => {
    const { container } = renderScale()
    // The endpoints used to live inside the legend — "Mood · 1 low … 5 great"
    // — which made the group's NAME a sentence and still did not say which
    // end was which.
    expect(container.querySelector('legend')!.textContent).toBe('Mood')
    expect(screen.getByText('1 low')).toBeInTheDocument()
    expect(screen.getByText('5 great')).toBeInTheDocument()
  })

  it('still reports which segment is chosen, and reports a press', async () => {
    const user = userEvent.setup()
    const { onChange } = renderScale()
    const three = screen.getByRole('button', { name: '3' })
    expect(three).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: '4' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('keeps every segment on the 44px target floor', () => {
    // COD-96 is open on controls under 44px and the hand-rolled drive row
    // this replaces used `min-w-11` to hit it one dimension at a time. A
    // segment is a fifth of the column wide, so height is the one that needs
    // saying — and a class is the only place jsdom can be asked.
    const { container } = renderScale()
    for (const b of container.querySelectorAll('.divide-x button')) {
      expect(b.className).toContain('min-h-11')
    }
  })

  it('ignores the scale for a multi-select, which has no ends', () => {
    // A set has no low and no high. Rendering a track for one would be the
    // control telling the reader something untrue about its own values, so
    // the chip row is what comes back.
    const { container } = render(
      <ChipPick
        label="Mood tags"
        multi
        value={['calm']}
        onChange={() => {}}
        scale={{ low: 'a', high: 'b' }}
        options={[{ value: 'calm', label: 'calm' }, { value: 'low', label: 'low' }]}
      />,
    )
    expect(container.querySelector('.divide-x')).toBeNull()
    expect(screen.queryByText('a')).toBeNull()
  })
})
