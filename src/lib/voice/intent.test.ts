import { describe, expect, it } from 'vitest'
import { emptyJournal } from '../storage'
import { addDays } from '../date'
import { ofArray, plan } from '../ingest/plan'
import { validateRecords } from '../ingest/validate'
import { answer, CONFIRM_BELOW, readDate, understand } from './intent'

const TODAY = '2026-09-11'
const ctx = { exercises: ['bench press', 'squat'], habits: ['Water', 'Read'], unit: 'kg' as const }
const hear = (said: string) => understand(said, ctx, TODAY)

describe('readDate', () => {
  it('files yesterday on yesterday, and takes the word out of the sentence', () => {
    const r = readDate('yesterday I played two games', TODAY)
    expect(r.date).toBe(addDays(TODAY, -1))
    expect(r.rest).not.toMatch(/yesterday/i)
  })

  it('leaves a sentence with no date word on today', () => {
    expect(readDate('mood 7', TODAY)).toEqual({ date: TODAY, rest: 'mood 7' })
  })
})

describe('understand · the sentences this was built for', () => {
  it('logs a pickleball session from "I played two games and scored 68"', () => {
    const i = hear('I played two games and scored 68')
    expect(i.records).toHaveLength(1)
    expect(i.records[0]).toMatchObject({ kind: 'pickleball', date: TODAY, pointsFor: 68 })
    // It repeats the number it heard inside the question, so a mis-heard "68"
    // is caught at the point of asking rather than after saving.
    expect(i.say).toMatch(/68 points/)
    expect(i.say).toMatch(/how many did you win/i)
  })

  /**
   * The failure this catches, found in the browser rather than here: "I played
   * two games" saved as **0 won, 0 lost** — the planner fills the required
   * fields, so an unasked question became a two-game loss the user never
   * reported. It asks now.
   */
  it('asks for the split instead of filing two games as two losses', () => {
    const i = hear('I played two games and scored 68')
    expect(i.ask).toMatchObject({ field: 'gamesWon', of: 2 })
    expect(i.say).toMatch(/how many did you win/i)
    const answered = answer(i, 1)
    expect(answered.ask).toBeUndefined()
    expect(answered.records[0]).toMatchObject({ gamesWon: 1, gamesLost: 1, pointsFor: 68 })
  })

  it('clamps an impossible answer to the games actually played', () => {
    const i = hear('played 3 games')
    expect(answer(i, 9).records[0]).toMatchObject({ gamesWon: 3, gamesLost: 0 })
  })

  it('does not ask when the sentence already gave the split', () => {
    expect(hear('pickleball won 3 lost 1').ask).toBeUndefined()
  })

  /**
   * The failure this catches: "played two games" recorded as two games **won**.
   * A score logger inventing a win the user did not claim is the one mistake
   * that makes every downstream statistic a lie.
   */
  it('does not turn games played into games won', () => {
    const i = hear('I played two games')
    const r = i.records[0] as { gamesWon?: number; gamesLost?: number }
    expect(r.gamesWon).toBeUndefined()
    expect(r.gamesLost).toBeUndefined()
  })

  it('reads a win/loss split either way round', () => {
    expect(hear('pickleball won 3 lost 1').records[0]).toMatchObject({ gamesWon: 3, gamesLost: 1 })
    expect(hear('played 4 games, lost 1').records[0]).toMatchObject({ gamesLost: 1, gamesWon: 3 })
  })

  it('takes singles or doubles when the word is there, and guesses neither when it is not', () => {
    expect(hear('played 2 games of singles').records[0]).toMatchObject({ format: 'singles' })
    expect(hear('doubles, won 2').records[0]).toMatchObject({ format: 'doubles' })
    expect((hear('played 2 games')!.records[0] as { format?: string }).format).toBeUndefined()
  })

  it('logs nutrition when the numbers are spoken', () => {
    const i = hear('log 600 calories and 40 grams of protein')
    expect(i.records[0]).toMatchObject({ kind: 'metric', calories: 600, protein: 40 })
  })

  /**
   * A spoken food name carries no numbers. Inventing 150 kcal for "oatmeal"
   * would put a fabricated figure into a nutrition total the user later reads
   * as measured — so it is kept as a note and the sentence survives intact.
   */
  it('keeps a food with no numbers as a note instead of guessing at it', () => {
    const i = hear('I ate oatmeal and eggs for breakfast')
    expect(i.records[0]).toMatchObject({ kind: 'entry', type: 'note' })
    expect((i.records[0] as { text: string }).text).toMatch(/oatmeal and eggs/)
    expect(i.confidence).toBeLessThan(CONFIRM_BELOW)
  })

  it('still understands the typed shorthand the app already parsed', () => {
    expect(hear('mood 7').records[0]).toMatchObject({ kind: 'metric', mood: 7 })
    expect(hear('ran 5k in 28 minutes').records[0]).toMatchObject({ kind: 'workout', activity: 'run', distanceKm: 5, durationMin: 28 })
    expect(hear('Water').records[0]).toMatchObject({ kind: 'habit', habit: 'Water' })
  })

  it('strips the spoken wrapper the typed matchers were never written for', () => {
    expect(hear("so I've just logged mood 8").records[0]).toMatchObject({ kind: 'metric', mood: 8 })
  })

  it('files yesterday\'s session on yesterday', () => {
    const i = hear('yesterday I played 3 games and scored 55')
    expect(i.date).toBe(addDays(TODAY, -1))
    expect(i.records[0].date).toBe(addDays(TODAY, -1))
    expect(i.say).toMatch(/yesterday/)
  })

  /** Never a dropped sentence: what it cannot parse, it keeps verbatim. */
  it('keeps an unrecognised sentence as a note, word for word', () => {
    const said = 'the court was busy so we rallied on the back wall'
    const i = hear(said)
    expect(i.records[0]).toMatchObject({ kind: 'entry', text: said })
    expect(i.confidence).toBeLessThan(CONFIRM_BELOW)
  })

  it('says so when it heard nothing', () => {
    expect(hear('   ').records).toHaveLength(0)
    expect(hear('   ').say).toMatch(/didn't catch/)
  })
})

describe('understand · what it hands to the pipeline', () => {
  /**
   * The safety property: voice is just another producer of import records, so
   * a mis-heard number is refused by the same validator that refuses a
   * malformed file. Nothing about the microphone gets its own write path.
   */
  it('emits records the import validator accepts', () => {
    for (const said of [
      'I played two games and scored 68',
      'log 600 calories and 40 grams of protein',
      'mood 7',
      'ran 5k in 28 minutes',
      'I ate oatmeal and eggs',
    ]) {
      const { records, rejected } = validateRecords(hear(said).records as unknown[])
      expect(rejected, `"${said}" produced a record the validator refuses`).toHaveLength(0)
      expect(records.length).toBeGreaterThan(0)
    }
  })

  it('applies through the planner, and saying it twice does not log it twice', async () => {
    const i = hear('I played two games and scored 68')
    const first = await plan(ofArray(i.records), emptyJournal(), { source: 'claude' })
    expect(first.next.pickleball).toHaveLength(1)
    expect(first.next.pickleball![0]).toMatchObject({ pointsFor: 68 })
    const second = await plan(ofArray(i.records), first.next, { source: 'claude' })
    expect(second.next.pickleball).toHaveLength(1)
    expect(second.counts.added).toBe(0)
  })

  it('a mis-heard number is refused rather than stored', async () => {
    // "mood seven" misheard as "mood 77" — the validator's range, not a clamp.
    const { records, rejected } = validateRecords(hear('mood 77').records as unknown[])
    expect(records).toHaveLength(0)
    expect(rejected[0].reason).toMatch(/mood 77 is outside 0–10/)
  })
})

/**
 * A spoken session that reports a DURATION and no score.
 *
 * The reported bug: "I played pickleball for 10 minutes today" was landing as
 * a plain note at confidence 0.3 instead of a pickleball session. The matcher
 * parsed the 10 minutes and then returned null because no game count was
 * spoken, so the fact it had just extracted was thrown away with the sentence.
 *
 * Each case here is named for what the user said, because that is what they
 * will report when it breaks again.
 */
describe('pickleball by duration, no score', () => {
  const ctx = { habits: [] } as never
  const TODAY = '2026-09-21'

  it('"I played pickleball for 10 minutes today" is a session, not a note', () => {
    const r = understand('I played pickleball for 10 minutes today', ctx, TODAY)
    expect(r.records).toHaveLength(1)
    expect(r.records[0].kind).toBe('pickleball')
    expect(r.records[0]).toMatchObject({ date: TODAY, durationMin: 10 })
  })

  it('does not invent a win or a loss it was never told about', () => {
    // The one thing a score logger must never do. `plan.ts` writes 0–0, which
    // reads as "played, kept no score" — but the RECORD must stay silent.
    const r = understand('I played pickleball for 10 minutes today', ctx, TODAY)
    const rec = r.records[0] as { gamesWon?: number; gamesLost?: number }
    expect(rec.gamesWon).toBeUndefined()
    expect(rec.gamesLost).toBeUndefined()
  })

  it('"I played pickleball today" with no numbers at all is still a session', () => {
    const r = understand('I played pickleball today', ctx, TODAY)
    expect(r.records[0].kind).toBe('pickleball')
  })

  it('reads hours, not just minutes', () => {
    // "for an hour" parsed to nothing before — for a sport whose one required
    // field is the duration, that is the same bug one step further in.
    for (const [said, min] of [
      ['played pickleball for an hour', 60],
      ['played pickleball for half an hour', 30],
      ['played pickleball for an hour and a half', 90],
      ['played pickleball for 2 hours', 120],
      ['played pickleball for 1.5 hours', 90],
      ['played pickleball for 45 minutes', 45],
      ['pickleball 90 mins', 90],
    ] as [string, number][]) {
      const r = understand(said, ctx, TODAY)
      expect(r.records[0], said).toMatchObject({ kind: 'pickleball', durationMin: min })
    }
  })

  it('still asks for the split when a game COUNT was spoken', () => {
    // Unchanged behaviour, and the reason the guard was not simply deleted:
    // "two games" with no split is the case where asking is the honest answer.
    const r = understand('I played two games of pickleball', ctx, TODAY)
    expect(r.ask).toMatchObject({ field: 'gamesWon', of: 2 })
  })

  it('still refuses to guess the sport from "games" alone with no numbers', () => {
    // "played" + no sport + no count stays a note. The guard was narrowed to
    // the inferred case, not removed.
    const r = understand('I played with my friends', ctx, TODAY)
    expect(r.records[0].kind).toBe('entry')
  })

  it('keeps the score when one IS spoken alongside a duration', () => {
    const r = understand('played pickleball 30 minutes won 2 lost 1', ctx, TODAY)
    expect(r.records[0]).toMatchObject({ kind: 'pickleball', gamesWon: 2, gamesLost: 1, durationMin: 30 })
  })

  it('survives the validator and lands in data.pickleball with its minutes', async () => {
    // The parser being right is not the thing the user reported. The thing they
    // reported is where it ends up, so assert the whole path: understand →
    // validate → plan → journal.
    const i = understand('I played pickleball for 10 minutes today', ctx, TODAY)
    const { records, rejected } = validateRecords(i.records as unknown[])
    expect(rejected).toHaveLength(0)
    const { next } = await plan(ofArray(records), emptyJournal(), { source: 'claude' })
    expect(next.pickleball).toHaveLength(1)
    expect(next.pickleball![0]).toMatchObject({ date: TODAY, durationMin: 10, gamesWon: 0, gamesLost: 0 })
    // And it does not land anywhere else — a session filed twice, once as a
    // note, is the other way this could look "fixed".
    expect(next.entries).toHaveLength(0)
    expect(next.workouts).toHaveLength(0)
  })
})
