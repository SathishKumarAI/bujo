import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatTile } from './ui'
import { cat } from '../lib/colors'

/**
 * Catches the BUJO-278 failure: `color` tints `icon` and nothing else, so a
 * tile passing one without the other renders no accent at all. Three of the
 * four accents audited as drawn on Trackers were props only.
 *
 * The real guard is the prop union — the `@ts-expect-error` below fails
 * `npx tsc -b` if anyone loosens it back to two independent optionals. The
 * render assertion is here so the tint is checked as a pixel, not a prop.
 */
describe('StatTile', () => {
  it('tints the icon with `color`', () => {
    render(<StatTile label="Win %" value="62%" color="green" icon={<span data-testid="i">▲</span>} />)
    expect(screen.getByTestId('i').parentElement).toHaveStyle({ color: cat('green') })
  })

  it('rejects `color` without an `icon` at the type level, and drew nothing anyway', () => {
    // @ts-expect-error `color` requires `icon` — without one it draws nothing.
    const { container: tinted } = render(<StatTile label="Sessions" value={12} color="mauve" />)
    const { container: plain } = render(<StatTile label="Sessions" value={12} />)
    // The measurement behind deleting 45 of these: identical markup either way.
    expect(tinted.innerHTML).toBe(plain.innerHTML)
    expect(screen.getAllByText('12')).toHaveLength(2)
  })
})
