import { describe, it, expect } from 'vitest'
import { parseCapture, normalizeExercise, normalizeSpoken, type CaptureCtx, type CaptureResult } from './capture'

const ctx: CaptureCtx = {
  exercises: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Lat Pulldown'],
  habits: ['Water', 'Meditate', 'Read'],
  unit: 'kg',
}

describe('parseCapture — gym sets', () => {
  const cases: [string, Partial<Extract<CaptureResult, { kind: 'gym' }>>][] = [
    ['bench 80x5', { exercise: 'Bench Press', weight: 80, reps: 5, unit: 'kg' }],
    ['squat 100×5 @8', { exercise: 'Squat', weight: 100, reps: 5, rpe: 8 }],
    ['ohp 40kg x 8 rpe7', { exercise: 'Overhead Press', weight: 40, reps: 8, rpe: 7, unit: 'kg' }],
    ['bench 135lb x5', { exercise: 'Bench Press', weight: 135, reps: 5, unit: 'lb' }],
  ]
  it.each(cases)('%s', (input, expected) => {
    const r = parseCapture(input, ctx)
    expect(r.kind).toBe('gym')
    expect(r).toMatchObject(expected)
    expect(r.confidence).toBeGreaterThanOrEqual(0.7)
  })

  it('still parses an unknown exercise name, with lower confidence', () => {
    const r = parseCapture('facepull 25x15', ctx)
    expect(r.kind).toBe('gym')
    if (r.kind === 'gym') {
      expect(r.exercise).toBe('Facepull')
      expect(r.weight).toBe(25)
      expect(r.reps).toBe(15)
      expect(r.confidence).toBeLessThan(0.9)
    }
  })
})

describe('parseCapture — cardio', () => {
  it('ran 5k 28min → Run with distance + duration', () => {
    const r = parseCapture('ran 5k 28min', ctx)
    expect(r).toMatchObject({ kind: 'cardio', activity: 'Run', distanceKm: 5, durationMin: 28 })
  })
  it('converts miles to km', () => {
    const r = parseCapture('ran 3mi', ctx)
    expect(r.kind).toBe('cardio')
    if (r.kind === 'cardio') expect(r.distanceKm).toBeCloseTo(4.83, 1)
  })
  it('walk 1h 30min → 90 minutes', () => {
    const r = parseCapture('walk 1h 30min', ctx)
    expect(r).toMatchObject({ kind: 'cardio', activity: 'Walk', durationMin: 90 })
  })
  it('bare activity word still matches, lower confidence', () => {
    const r = parseCapture('cycled today', ctx)
    expect(r.kind).toBe('cardio')
    expect(r.confidence).toBeLessThan(0.85)
  })
})

describe('parseCapture — metrics', () => {
  it('mood 7', () => {
    expect(parseCapture('mood 7', ctx)).toMatchObject({ kind: 'metric', mood: 7 })
  })
  it('slept 8h', () => {
    expect(parseCapture('slept 8h', ctx)).toMatchObject({ kind: 'metric', sleep: 8 })
  })
  it('combines several metrics in one line', () => {
    expect(parseCapture('mood 8 stress 3', ctx)).toMatchObject({ kind: 'metric', mood: 8, stress: 3 })
  })
  it('clamps out-of-range values', () => {
    const r = parseCapture('mood 99', ctx)
    if (r.kind === 'metric') expect(r.mood).toBe(10)
  })
})

describe('parseCapture — habits', () => {
  it('matches a known habit with a count', () => {
    expect(parseCapture('water 6', ctx)).toMatchObject({ kind: 'habit', habit: 'Water', value: 6 })
  })
  it('matches a bare habit name as a toggle', () => {
    const r = parseCapture('meditate', ctx)
    expect(r).toMatchObject({ kind: 'habit', habit: 'Meditate' })
    if (r.kind === 'habit') expect(r.value).toBeUndefined()
  })
  it('falls through to bullet when no habit matches', () => {
    expect(parseCapture('xyzzy', ctx).kind).toBe('bullet')
  })
  it('does not match a habit when extra (non-count) words follow', () => {
    // "water plants" is a task, not a log against the Water habit.
    expect(parseCapture('water plants', ctx).kind).toBe('bullet')
  })
})

describe('parseCapture — bullet fallback', () => {
  it('arbitrary text becomes a note (never dropped)', () => {
    const r = parseCapture('buy milk and call the dentist', ctx)
    expect(r.kind).toBe('bullet')
    expect(r.raw).toBe('buy milk and call the dentist')
  })
  it('explicit signifiers raise confidence', () => {
    const explicit = parseCapture('t call mom #work', ctx)
    const plain = parseCapture('random thought', ctx)
    expect(explicit.kind).toBe('bullet')
    expect(explicit.confidence).toBeGreaterThan(plain.confidence)
  })
  it('empty input is a zero-confidence bullet', () => {
    expect(parseCapture('   ', ctx)).toMatchObject({ kind: 'bullet', confidence: 0 })
  })
})

describe('normalizeSpoken', () => {
  it('combines tens and ones', () => {
    expect(normalizeSpoken('eighty five')).toBe('85')
    expect(normalizeSpoken('twenty two')).toBe('22')
  })
  it('maps units and connectors', () => {
    expect(normalizeSpoken('eighty kilos by five')).toBe('80 kg x 5')
  })
  it('handles hundreds', () => {
    expect(normalizeSpoken('two hundred')).toBe('200')
    expect(normalizeSpoken('hundred')).toBe('100')
  })
  it('leaves non-number words alone', () => {
    expect(normalizeSpoken('call the dentist')).toBe('call the dentist')
  })
})

describe('parseCapture — dictated (voice) input', () => {
  it('"bench eighty by five" → gym 80x5', () => {
    expect(parseCapture('bench eighty by five', ctx)).toMatchObject({ kind: 'gym', exercise: 'Bench Press', weight: 80, reps: 5 })
  })
  it('"squat hundred by five rpe eight" → gym 100x5 @8', () => {
    expect(parseCapture('squat hundred by five rpe eight', ctx)).toMatchObject({ kind: 'gym', weight: 100, reps: 5, rpe: 8 })
  })
  it('"ran five k" → cardio 5km', () => {
    expect(parseCapture('ran five k', ctx)).toMatchObject({ kind: 'cardio', activity: 'Run', distanceKm: 5 })
  })
  it('"mood seven" → metric mood 7', () => {
    expect(parseCapture('mood seven', ctx)).toMatchObject({ kind: 'metric', mood: 7 })
  })
  it('keeps original words for journal bullets', () => {
    const r = parseCapture('call John at five', ctx)
    expect(r.kind).toBe('bullet')
    expect(r.raw).toBe('call John at five')
  })
})

describe('normalizeExercise', () => {
  it('resolves aliases', () => {
    expect(normalizeExercise('bench', ctx.exercises)).toBe('Bench Press')
    expect(normalizeExercise('dl', ctx.exercises)).toBe('Deadlift')
  })
  it('prefix-matches the library', () => {
    expect(normalizeExercise('lat', ctx.exercises)).toBe('Lat Pulldown')
  })
  it('titlecases an unknown name', () => {
    expect(normalizeExercise('cable fly', ctx.exercises)).toBe('Cable Fly')
  })
})
