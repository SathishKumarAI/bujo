import { describe, it, expect } from 'vitest'
import { generateDemoData } from './demo'
import { emptyJournal } from './storage'

/**
 * The demo journal has to be able to say that it is the demo journal.
 *
 * Nothing distinguishes a sample entry from a real one — `generateDemoData`
 * returns an ordinary `JournalData` — so without a flag on the journal itself
 * there is no safe "remove the demo" action, only "erase everything". That is
 * what users were being offered, and it is why `?demo=1` (which set no flag at
 * all) left people with a journal of someone else's data and no way out.
 */
describe('demo data marks itself', () => {
  it('sets demoSeeded, so the app can offer to remove it', () => {
    expect(generateDemoData().settings.demoSeeded).toBe(true)
  })

  it('does not mark a real journal', () => {
    expect(emptyJournal().settings.demoSeeded).toBeUndefined()
  })

  it('leaves demo allowed by default — the flag is opt-out, not opt-in', () => {
    // If this ever defaults to true, `?demo=1` links go dead silently and the
    // only symptom is an empty page where a preview was expected.
    expect(emptyJournal().settings.demoDisabled).toBeFalsy()
    expect(generateDemoData().settings.demoDisabled).toBeFalsy()
  })

  it('produces a journal worth showing', () => {
    // Guards the seed itself: an empty "demo" would make every gate that loads
    // ?demo=1 pass vacuously, which is the empty-journal trap one level up.
    const d = generateDemoData()
    expect(d.entries.length).toBeGreaterThan(50)
    expect(d.habits.length).toBeGreaterThan(0)
  })
})
