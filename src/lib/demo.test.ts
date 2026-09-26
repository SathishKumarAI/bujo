import { describe, it, expect } from 'vitest'
import { generateDemoData } from './demo'
import { emptyJournal } from './storage'
import { hasLapseQuantity, lapseCountOn, lapseTrend, peakLapseWeekday } from './lapse'
import { todayISO } from './date'

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

/**
 * The recovery seed, asserted rather than eyeballed.
 *
 * Every one of these is a card that renders only when its data exists, so an
 * unseeded field is a card no browser gate can fail — the trap that cost
 * `data.cycle` its entire coverage. The seed had no `addictions` at all, so
 * "Per-addiction streaks" showed its empty state on every run of every gate.
 */
describe('demo seeds the recovery day log', () => {
  it('tracks at least one addiction, so the per-addiction card is not an empty state', () => {
    const ad = generateDemoData().nofap.addictions ?? []
    expect(ad.length).toBeGreaterThan(1)
    expect(ad.map((a) => a.name)).toContain('Nicotine')
  })

  it('gives a lapse day a quantity, so the "how many" card renders at all', () => {
    const d = generateDemoData()
    const nic = (d.nofap.addictions ?? []).find((a) => a.name === 'Nicotine')!
    expect(hasLapseQuantity(nic.relapses)).toBe(true)
    expect(hasLapseQuantity(d.nofap.relapses)).toBe(true)
  })

  it('leaves one addiction unquantified, so the gate on the card has a false case', () => {
    const doom = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Doomscrolling')!
    expect(doom.relapses.length).toBeGreaterThan(0)
    expect(hasLapseQuantity(doom.relapses)).toBe(false)
  })

  it('logs today, so the zone-2 tally shows a live count and not only "Clean today"', () => {
    const nic = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Nicotine')!
    expect(lapseCountOn(nic.relapses, todayISO())).toBeGreaterThan(0)
  })

  it('spans the whole eight-week trend window, so the direction is not an artefact', () => {
    // Seeded over six weeks it read "rising" for a sequence that falls 18 → 8:
    // the two empty leading buckets pulled the first half's average under the
    // second's. A trend seeded shorter than its window states the opposite.
    const nic = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Nicotine')!
    const t = lapseTrend(nic.relapses, 8, todayISO())
    expect(t.weeks.every((w) => w.count > 0)).toBe(true)
    expect(t.direction).toBe('down')
  })

  it('peaks on Sunday whatever weekday the gate runs on', () => {
    // Fixed day-offsets from today would move the peak weekday daily, making
    // the card's one claim ("Sundays average ten") a coincidence of the clock.
    const nic = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Nicotine')!
    expect(peakLapseWeekday(nic.relapses)?.label).toBe('Sun')
  })
})
