import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Statement } from './Statement'

const NBSP = '\u00a0'

/**
 * `Statement` caps its measure at 20ch, so almost every real title wraps. A
 * title like "Short memory — flush errors" broke after "memory" and put the em
 * dash at the head of line two, where it reads as a list marker rather than as
 * the continuation of a phrase. `bindDashes` makes that break impossible.
 *
 * Pinned here because the input is not only fixed data — `Statement` also
 * renders book titles the user typed, so the next title with a dash in it is
 * not one anybody can edit ahead of time.
 */
describe('Statement dash binding', () => {
  it('binds an em dash to the word before it', () => {
    render(<Statement>Short memory — flush errors</Statement>)
    expect(screen.getByText(/Short memory/).textContent).toBe(`Short memory${NBSP}— flush errors`)
  })

  it('binds an en dash too', () => {
    render(<Statement>Patience – the long game</Statement>)
    expect(screen.getByText(/Patience/).textContent).toBe(`Patience${NBSP}– the long game`)
  })

  it('leaves a hyphen alone — it is not a dash and does not break badly', () => {
    render(<Statement>Point-by-point play</Statement>)
    expect(screen.getByText(/Point/).textContent).toBe('Point-by-point play')
  })

  it('leaves text without a spaced dash untouched', () => {
    render(<Statement>Be here now</Statement>)
    expect(screen.getByText('Be here now').textContent).toBe('Be here now')
  })

  it('passes elements through rather than trying to rewrite them', () => {
    render(<Statement><span data-testid="inner">a — b</span></Statement>)
    // A Statement given elements is composing its own line breaks; rewriting
    // them would be acting on markup the caller owns.
    expect(screen.getByTestId('inner').textContent).toBe('a — b')
  })

  it('renders as the requested tag', () => {
    render(<Statement as="h2">Heading — here</Statement>)
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  })
})
