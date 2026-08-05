import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom has no ResizeObserver, and `PageLayout` constructs one on mount to
// decide whether its act column can be sticky. Without this, rendering any view
// built on the page contract throws before a single assertion runs — which is
// most of the reason none of them had a test.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})
