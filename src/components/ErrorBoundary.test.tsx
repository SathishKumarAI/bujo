import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { STORAGE_KEY } from '../lib/storage'

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // The boundary logs the crash; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>journal</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('journal')).toBeTruthy()
  })

  it('catches a render crash and offers a way out instead of a blank screen', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('bujo hit a snag')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reload the app' })).toBeTruthy()
  })

  it('offers a raw backup download only when there is data to rescue', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.queryByRole('button', { name: 'Download a backup first' })).toBeNull()
    unmount()

    localStorage.setItem(STORAGE_KEY, '{"entries":[]}')
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: 'Download a backup first' })).toBeTruthy()
  })
})
