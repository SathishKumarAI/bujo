import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LazyMount } from './LazyMount'

/**
 * The two failure modes that matter:
 * - an environment with no IntersectionObserver must render content
 *   immediately (lazy is an optimisation, never a gate on content), and
 * - the gates' `bujo:reveal-lazy` arm must mount content without any
 *   scrolling — if this breaks, the a11y and clipped gates silently scan a
 *   page with the lazy sections missing and print a meaningless green.
 */
describe('LazyMount', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders children immediately when IntersectionObserver is unavailable', () => {
    // jsdom has no IntersectionObserver — this is the fallback path.
    render(<LazyMount minHeight={100}><p>content</p></LazyMount>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('holds a placeholder until the reveal-lazy event arms it', () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    })
    render(<LazyMount minHeight={100}><p>content</p></LazyMount>)
    expect(screen.queryByText('content')).toBeNull()
    act(() => { window.dispatchEvent(new Event('bujo:reveal-lazy')) })
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
