import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerPrimary, setPrimaryScope, SHELL_SCOPE } from './onePrimary'

/**
 * The guard is dev-only and reports on a microtask, so a test has to await one
 * before reading the spy. Without that the assertions run before `report()` and
 * every case passes as "no warning", which would make this file worse than
 * having none.
 */
const flush = () => new Promise<void>((r) => queueMicrotask(() => r()))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('one-primary guard', () => {
  it('stays quiet for one primary on a view', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setPrimaryScope('gym')
    const off = registerPrimary()
    await flush()
    expect(warn).not.toHaveBeenCalled()
    off()
  })

  it('warns, and names the view, when one view mounts two', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setPrimaryScope('gym')
    const a = registerPrimary()
    const b = registerPrimary()
    await flush()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('"gym" has 2')
    a(); b()
  })

  // The regression this scope exists for. `shell/TopBar`'s Quick add mounts once
  // for the life of the app, under whichever view was current at the time, and
  // then sits in that view's budget forever — which is why the symptom was
  // "Gym warns, Fitness does not" rather than "every page warns". Charging it to
  // `shell` means a page with one primary of its own is still a page with one.
  it('does not charge shell chrome to the page under it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setPrimaryScope('gym')
    const chrome = registerPrimary(SHELL_SCOPE)
    const page = registerPrimary()
    await flush()
    expect(warn).not.toHaveBeenCalled()
    chrome(); page()
  })

  // …but the header is still held to the same rule. Two primaries in the chrome
  // is the same design failure one level up, and a scope that can never warn is
  // a scope that has switched the guard off.
  it('still warns when the shell itself mounts two', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const a = registerPrimary(SHELL_SCOPE)
    const b = registerPrimary(SHELL_SCOPE)
    await flush()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain(`"${SHELL_SCOPE}" has 2`)
    a(); b()
  })

  it('unmounting clears the count, so navigating away does not leave a phantom', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setPrimaryScope('plan')
    const a = registerPrimary()
    a()
    const b = registerPrimary()
    await flush()
    expect(warn).not.toHaveBeenCalled()
    b()
  })
})
