import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { JournalProvider } from '../../store'
import { ConfirmProvider } from '../ConfirmDialog'
import { AppleHealthCard } from './AppleHealthCard'

// The reader never resolves: the test is about the file reaching it, and the
// "Reading…" stage is what a user sees the moment it does.
const readHealthExport = vi.fn<(...a: unknown[]) => Promise<never>>(() => new Promise<never>(() => {}))
vi.mock('../../lib/health/parse', async (orig) => ({
  ...(await orig<typeof import('../../lib/health/parse')>()),
  readHealthExport: (...a: unknown[]) => readHealthExport(...a),
}))

afterEach(() => { cleanup(); localStorage.clear(); readHealthExport.mockClear() })

function mount() {
  render(<ConfirmProvider><JournalProvider><AppleHealthCard /></JournalProvider></ConfirmProvider>)
  return screen.getByRole('region', { name: 'Apple Health' })
}

const drag = (file?: File) => ({ dataTransfer: { types: ['Files'], files: file ? [file] : [] } })

describe('AppleHealthCard drop target', () => {
  it('a file dropped on the group is read, exactly as if it were chosen', async () => {
    const group = mount()
    const file = new File(['<HealthData/>'], 'export.xml', { type: 'text/xml' })
    fireEvent.dragOver(group, drag(file))
    fireEvent.drop(group, drag(file))
    expect(readHealthExport).toHaveBeenCalledTimes(1)
    expect(readHealthExport.mock.calls[0][0]).toBe(file)
    expect(await screen.findByText(/Reading…/)).toBeTruthy()
  })

  it('holding a file over it draws the brand outline, and leaving clears it', () => {
    const group = mount()
    const zone = group.parentElement!
    fireEvent.dragOver(group, drag())
    expect(zone.className).toContain('outline-brand')
    fireEvent.dragLeave(zone, { relatedTarget: document.body })
    expect(zone.className).not.toContain('outline-brand')
  })

  it('a drop with no file does nothing', () => {
    const group = mount()
    fireEvent.drop(group, drag())
    expect(readHealthExport).not.toHaveBeenCalled()
    expect(screen.queryByText(/Reading…/)).toBeNull()
  })
})
