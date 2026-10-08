import { describe, it, expect, vi } from 'vitest'
import { generateDemoData } from './demo'
import { emptyJournal } from './storage'
import { hasLapseQuantity, lapseCountOn, lapseTrend, peakLapseWeekday } from './lapse'
import { todayISO } from './date'
import { metricsCsv } from './csv'
import { deepWorkHeatmap, focusByDuration, focusFindings, interruptionCost, weeklyVolume } from './focus'
import { avgWpm, bestWpm, wpmTrend } from './typing'
import { coachingWeekOf, rowsInCoachingWeek } from './coachingWeek'

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

  /**
   * `steps`, `restingHR` and `activeKcal` are device-only fields — an Apple
   * Health import or a voice capture writes them and no form can. They had been
   * on `DailyMetric` since the ingest pipeline landed and the seed wrote none of
   * them, so nothing in the app had ever been rendered or exported with one
   * present. Asserted here because that is the documented trap: a field the seed
   * skips is a field every browser gate silently does not check.
   */
  it('seeds the device-only metrics, not just the ones a form can write', () => {
    const d = generateDemoData()
    for (const field of ['steps', 'restingHR', 'activeKcal'] as const) {
      const withField = d.metrics.filter((m) => m[field] != null)
      // `not.toBeNull()` style first: `expect(undefined).toBeGreaterThan(0)`
      // would coerce and the assertion would pass on an unseeded field.
      expect(withField.length, `no metric row carries ${field}`).toBeGreaterThan(20)
      expect(withField.every((m) => Number.isFinite(m[field]))).toBe(true)
    }
  })

  it('can export every seeded metric field back out again', () => {
    // The other half of the same finding: those three fields had no reader AND
    // no CSV column, so they were data you could put in and never get out.
    const NL = String.fromCharCode(10)
    const csv = metricsCsv(generateDemoData())
    const header = csv.split(NL)[0]
    for (const col of ['steps', 'restingHR', 'activeKcal']) expect(header).toContain(col)
    // A column of nothing but empty cells would satisfy the header check.
    const stepsCol = header.split(',').indexOf('steps')
    const values = csv.split(NL).slice(1).map((l) => l.split(',')[stepsCol]).filter((v) => v !== '')
    expect(values.length).toBeGreaterThan(20)
  })

  /**
   * The cycle log carries the *fields the page reads*, not just rows.
   *
   * `data.cycle` was the one domain the seed never wrote, so a page the a11y
   * gate opens at five themes and two viewports could not fail on any of it.
   * Adding a field to `CyclePoint` re-opens that hole one field wide: an
   * unseeded `drive` means the drive card renders its empty state on every gate
   * run and the card that has the content is never checked.
   */
  it('rates drive on most cycle days, and leaves some unrated', () => {
    const cycle = generateDemoData().cycle
    expect(cycle.length).toBeGreaterThan(50)
    const rated = cycle.filter((c) => c.drive != null)
    const unrated = cycle.filter((c) => c.drive == null)
    expect(rated.length).toBeGreaterThan(40)
    // Both branches, because "unrated" must stay distinguishable from a 1 and
    // a seed that rates every day never exercises the null path.
    expect(unrated.length).toBeGreaterThan(0)
    for (const c of rated) {
      expect(c.drive).toBeGreaterThanOrEqual(1)
      expect(c.drive).toBeLessThanOrEqual(5)
    }
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
    // Was Doomscrolling, which could not stay once its unit became minutes —
    // a bare `count ?? 1` there would have meant ONE MINUTE of scrolling, a
    // default value rendered as a measurement. Porn carries the false case now,
    // where "once, unquantified" is a truthful reading.
    const porn = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Porn')!
    expect(porn.relapses.length).toBeGreaterThan(0)
    expect(hasLapseQuantity(porn.relapses)).toBe(false)
  })

  it('measures the time-based addiction in time, not in sessions', () => {
    const doom = (generateDemoData().nofap.addictions ?? []).find((a) => a.name === 'Doomscrolling')!
    expect(doom.unit).toBe('minutes')
    // And with real amounts: a `count ?? 1` here would read as one minute.
    expect(doom.relapses.every((r) => (r.count ?? 1) > 10)).toBe(true)
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

/**
 * The Focus page's two domains, and what each chart needs before it can fail.
 *
 * Both holes here are the `data.cycle` hole in CLAUDE.md. `typingSessions` was
 * written by **nothing**, so the whole Typing subject had never been rendered
 * with data at any theme or viewport — `page-census` said `focus · charts 0` on
 * a page that holds a Recharts `LineChart`, because that chart is gated on
 * `wpmCount >= 2` and the count was always zero. And `devSessions` covered
 * nineteen days against a 26-week heatmap, while its `60 + rand()*180` duration
 * made two of the five bands `focusByDuration` declares **structurally
 * unreachable** — "a branch the seed never takes cannot fail", aimed at a chart
 * axis instead of a colour.
 *
 * Asserted rather than eyeballed, because the symptom of either regressing is a
 * page that looks plausible and a gate that stays green.
 */
describe('demo · the Focus page has something to plot', () => {
  const d = generateDemoData()
  const today = todayISO()

  it('spans the heatmap window, not a fortnight of it', () => {
    const { cells, max } = deepWorkHeatmap(d, today, 26)
    expect(max).toBeGreaterThan(0)
    // A quarter of 182 cells lit is a grid with a shape; ten is three columns.
    expect(cells.filter((c) => c.level > 0).length).toBeGreaterThan(30)
  })

  it('reaches every session-length band, so none of the five is dead', () => {
    const bands = focusByDuration(d)
    expect(bands.every((b) => b.count > 0)).toBe(true)
    for (const b of bands) {
      // `not.toBeNull()` first: `expect(null).toBeGreaterThan(0)` coerces.
      expect(b.avg).not.toBeNull()
      expect(b.avg).toBeGreaterThan(0)
    }
  })

  it('fills every rolling week the volume chart draws', () => {
    expect(weeklyVolume(d, today, 12).every((w) => w.min > 0)).toBe(true)
  })

  it('fills them on EVERY weekday, not just the one the suite happened to run on', () => {
    // The assertion above is the one that matters and it was a coin flip. The
    // seed keeps ~3 days a week at random against a threshold that depends on
    // each day's WEEKDAY, and `weeklyVolume`'s rolling boundaries move with the
    // calendar — so the same commit was green on 2026-10-07 and red on 10-08
    // with bucket 9 (Sep 18–24) empty. Nothing had changed but the clock.
    //
    // Fourteen consecutive days is two full weekday cycles, which is the whole
    // space of alignments the old test was sampling one point of.
    const empties: string[] = []
    for (let k = 0; k < 14; k++) {
      vi.setSystemTime(new Date(2026, 9, 8 + k, 12, 0, 0))
      const seeded = generateDemoData()
      const t = todayISO()
      for (const w of weeklyVolume(seeded, t, 12)) {
        if (w.min === 0) empties.push(`${t}: ${w.start}..${w.end}`)
      }
    }
    vi.useRealTimers()
    expect(empties).toEqual([])
  })

  it('exhibits the findings the page claims to make', () => {
    // A seed of independent uniforms makes every relationship report "no
    // pattern" however the maths is written, so the seed correlates focus with
    // block length and against interruptions on purpose.
    const cost = interruptionCost(d)
    expect(cost).not.toBeNull()
    expect(cost!.gap).toBeGreaterThan(0)
    const ids = focusFindings(d, today).map((f) => f.id)
    expect(ids).toContain('duration')
    expect(ids).toContain('interruptions')
  })

  it('seeds typing practice at all, with enough WPM readings to draw the trend', () => {
    const ts = d.typingSessions ?? []
    expect(ts.length).toBeGreaterThan(15)
    // The chart's own gate: `wpmCount >= 2`, and a 14-day window with points.
    expect(ts.filter((s) => s.wpm != null).length).toBeGreaterThan(15)
    expect(wpmTrend(d, 14, today).filter((p) => p.has).length).toBeGreaterThanOrEqual(2)
    expect(bestWpm(d)).toBeGreaterThan(0)
    expect(avgWpm(d)).toBeGreaterThan(0)
    // Weekdays only — the goal bar's "bonus today" branch is the weekend case
    // and must stay reachable rather than be papered over with weekend drills.
    expect(ts.every((s) => { const wd = new Date(s.date + 'T00:00').getDay(); return wd !== 0 && wd !== 6 })).toBe(true)
  })
})

/**
 * THE COACHING PROGRAM HAS TO BE STARTED IN THE SEED.
 *
 * `coachingStart` and `coachingWeeksDone` were both unset, so every gate that
 * visits Coaching — five themes, two viewports, every run — saw only the
 * `!start` branch: "Commit to 12 weeks" and twelve identical untaken rows. The
 * progress bar, the done chips, the `· now` week, the open-on-first-unfinished
 * default and now the per-week record had never been rendered by anything.
 *
 * Same finding as the unseeded `data.cycle` in CLAUDE.md, for a program whose
 * state lives in `settings` rather than in its own domain.
 */
describe('demo seeds a coaching program in progress', () => {
  const today = todayISO()
  const d = generateDemoData(today)
  const start = d.settings.coachingStart

  it('starts the program, mid-way rather than on week 1 or past week 12', () => {
    expect(start, 'coachingStart unset — the page renders its not-started branch').toBeTruthy()
    const w = coachingWeekOf(start!, today)
    expect(w).not.toBeNull()
    expect(w!).toBeGreaterThan(1)
    expect(w!).toBeLessThanOrEqual(12)
  })

  it('ticks some weeks and leaves others, so both chip states render', () => {
    const done = d.settings.coachingWeeksDone ?? []
    expect(done.length).toBeGreaterThan(0)
    expect(done.length).toBeLessThan(12)
  })

  it('notes some weeks and not others', () => {
    const notes = d.settings.coachingWeekNotes ?? {}
    const keys = Object.keys(notes)
    expect(keys.length).toBeGreaterThan(1)
    expect(keys.length).toBeLessThan(12)
    expect(Object.values(notes).every((v) => v.trim().length > 10)).toBe(true)
  })

  /**
   * The join is what the week record is FOR, so both of its branches have to be
   * reachable from the seed: a week whose days hold sessions, and a week whose
   * days hold none. The second is the one that renders "no sessions logged for
   * these days" rather than a zero, and a seed covering every week with play
   * would make that branch unrenderable — the latte-yellow trap.
   */
  it('leaves at least one week with play and one with none', () => {
    const counts = Array.from({ length: 12 }, (_, i) => rowsInCoachingWeek(d.pickleball ?? [], start!, i + 1).length)
    expect(counts.filter((n) => n > 0).length, 'no coaching week has any session in it').toBeGreaterThan(0)
    expect(counts.filter((n) => n === 0).length, 'every week has play — the empty branch cannot render').toBeGreaterThan(0)
  })

  it('gives some pickleball sessions their own notes and leaves others blank', () => {
    const rows = d.pickleball ?? []
    expect(rows.filter((r) => (r.notes ?? '').length > 10).length).toBeGreaterThan(1)
    expect(rows.filter((r) => !r.notes).length).toBeGreaterThan(0)
  })
})
