/**
 * VOICE INTENT · one spoken utterance → records the journal can hold.
 *
 * The assistant half of the app: you say "I played two games and scored 68" and
 * it proposes a pickleball session, reads back what it understood, and waits to
 * be told to go ahead.
 *
 * **It emits `ImportRecord[]` and nothing else.** It cannot write, and neither
 * can whatever produced the sentence — the records go through the same
 * `validate` → `plan` → confirm path as an Apple Health file, so a voice
 * mis-hear and a malformed import file fail identically and in one place. That
 * is the whole reason this layer exists rather than a set of store calls behind
 * a microphone.
 *
 * Deterministic first, and offline always. `lib/capture.ts` already parses
 * typed, tapped and spoken input into gym/cardio/metric/habit/bullet; this
 * reuses it rather than growing a second grammar, and adds only what a spoken
 * *sentence* carries that a typed shorthand does not: a leading "I", a date
 * word ("yesterday"), several facts in one breath, and the two subjects
 * `capture.ts` has no matcher for — a pickleball session and food.
 *
 * An LLM is the **fallback**, not the path: `docs/voice/README.md` has the
 * seam. Nothing here needs a model, a key, a download or a network.
 */
import type { ImportRecord } from '../ingest/envelope'
import { addDays, todayISO } from '../date'
import { parseCapture, type CaptureCtx } from '../capture'
import { isActivityKey } from '../../domain/activities'

export interface VoiceIntent {
  /** What was heard, unmodified — the user's own words survive whatever we do with them. */
  transcript: string
  /** The day the records were filed under, after any date word. */
  date: string
  records: ImportRecord[]
  /** What the assistant says back. Always a sentence a person would say out loud. */
  say: string
  /** 0–1. Under `CONFIRM_BELOW` the UI must not offer a one-tap apply. */
  confidence: number
  /**
   * One thing the sentence did not say and the schema cannot represent without
   * guessing. The UI asks it before saving; skipping is always allowed.
   *
   * This exists because of a defect the browser pass caught: "I played two
   * games" has no win/loss split, `PickleballSession` has no "games played"
   * field, and defaulting to `0 won, 0 lost` files a two-game loss the user
   * never reported. Asking is the only honest option — inventing a split and
   * dropping the count are both lies, one of them flattering.
   */
  ask?: { field: 'gamesWon'; of: number; prompt: string }
}

/**
 * Below this, the assistant asks instead of offering.
 *
 * Dictation mis-hears numbers more than words ("68" / "sixty eight" / "6 to 8"),
 * and a number is exactly what these records are made of — so the bar for
 * "just do it" is higher here than for typed input.
 */
export const CONFIRM_BELOW = 0.6

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, ninety: 90,
}

/** "two" → 2, "2" → 2, anything else → undefined. */
function num(word: string | undefined): number | undefined {
  if (!word) return undefined
  const n = Number(word)
  if (Number.isFinite(n)) return n
  return WORD_NUMBERS[word.toLowerCase()]
}

const NUM = `(\\d+(?:\\.\\d+)?|${Object.keys(WORD_NUMBERS).join('|')})`

/**
 * Strip the date word off the front and return the day it names.
 *
 * Only the three a person actually says out loud. "Last Tuesday" is a date
 * picker's job — guessing at it would file a session on the wrong day, and a
 * wrong day is worse than a question.
 */
export function readDate(text: string, today = todayISO()): { date: string; rest: string } {
  const lc = text.toLowerCase()
  if (/\byesterday\b/.test(lc)) return { date: addDays(today, -1), rest: text.replace(/\byesterday\b/i, '').trim() }
  if (/\bday before yesterday\b/.test(lc)) return { date: addDays(today, -2), rest: text.replace(/\bday before yesterday\b/i, '').trim() }
  if (/\btoday\b/.test(lc)) return { date: today, rest: text.replace(/\btoday\b/i, '').trim() }
  return { date: today, rest: text }
}

/**
 * "I played two games and scored 68", "pickleball, won 3 lost 1, 45 minutes".
 *
 * Games and points are told apart by **which number is bigger and how it is
 * introduced**, not by order: pickleball games run to 11, so a bare number over
 * 30 beside the word "score" or "points" is a point total, and a small number
 * beside "games" or "won" is a game count. Said the other way round —
 * "scored 68 across two games" — the same rule still holds.
 */
function matchPickleball(text: string, date: string): ImportRecord[] | null {
  const lc = text.toLowerCase()
  if (!/\bpickle\s?ball\b|\bplayed\b|\bgames?\b|\bsingles?\b|\bdoubles?\b/.test(lc)) return null
  // "played two games" without the sport named is only pickleball when nothing
  // else claims it — this app has one game sport, and the alternative is
  // dropping the sentence the user actually says most often.
  const games = lc.match(new RegExp(`${NUM}\\s+games?\\b`))
  const won = lc.match(new RegExp(`\\bwon\\s+${NUM}`)) ?? lc.match(new RegExp(`${NUM}\\s+wins?\\b`))
  const lost = lc.match(new RegExp(`\\blost\\s+${NUM}`)) ?? lc.match(new RegExp(`${NUM}\\s+loss(?:es)?\\b`))
  const points = lc.match(new RegExp(`\\b(?:scored?|points?|score is|score was)\\D{0,6}${NUM}`))
  const doubles = /\bdoubles?\b|\bpartner\b/.test(lc)
  const singles = /\bsingles?\b/.test(lc)
  /** Is the sport itself in the sentence, or are we inferring it from "games"? */
  const named = /\bpickle\s?ball\b/.test(lc)

  const gamesWon = num(won?.[1])
  const gamesLost = num(lost?.[1])
  const played = num(games?.[1])

  /**
   * **A named sport is a session, with or without a score.**
   *
   * This used to read `if (gamesWon === undefined && gamesLost === undefined &&
   * played === undefined) return null` — so "I played pickleball for 10 minutes
   * today" parsed its duration on the line above and then threw the whole
   * sentence away, landing it as a plain note at confidence 0.3. Five of eight
   * spoken pickleball sentences did that, including every one that reports a
   * session the way most people actually report a session: by how long they
   * played.
   *
   * `domain/activities.ts` has said which fact matters all along —
   * `pickleball: { required: ['durationMin'], best: 'duration' }`. The score is
   * the optional half of the record, and this guard had it backwards.
   *
   * It stays for the *inferred* case. "I played two games" with no sport named
   * is already a guess that this app's one game sport is the subject, and a
   * guess carrying no number at all is not worth filing as a session.
   */
  if (!named && gamesWon === undefined && gamesLost === undefined && played === undefined) return null

  return [{
    kind: 'pickleball',
    date,
    format: singles ? 'singles' : doubles ? 'doubles' : undefined,
    // "played two games" with no win/loss split is two games played, not two
    // won — claiming a win the user did not say is the one thing a score
    // logger must never do. Absent entirely when no score was spoken: `plan.ts`
    // writes 0–0, which reads as "played, kept no score", and `winRateSeries`
    // skips a scoreless session rather than plotting it as a defeat.
    gamesWon: gamesWon ?? (played !== undefined && gamesLost !== undefined ? Math.max(0, played - gamesLost) : undefined),
    gamesLost: gamesLost ?? (played !== undefined && gamesWon !== undefined ? Math.max(0, played - gamesWon) : undefined),
    pointsFor: num(points?.[1]),
    durationMin: readMinutes(lc),
  }]
}

/**
 * "45 minutes", "an hour", "1.5 hours", "an hour and a half", "90 mins".
 *
 * Hours were not parsed at all — the old matcher looked only for
 * `min|mins|minutes` — so "played pickleball for an hour" reached the record
 * with `durationMin: undefined`. For a sport whose one *required* field is the
 * duration, that is the same defect as dropping the sentence, one step further
 * in. People say hours out loud at least as often as minutes.
 */
export function readMinutes(lc: string): number | undefined {
  const half = /\band\s+a\s+half\b/.test(lc)
  if (/\bhalf\s+an\s+hour\b/.test(lc)) return 30
  if (/\b(?:an?|one)\s+hour\b/.test(lc)) return half ? 90 : 60
  const hrs = lc.match(new RegExp(`${NUM}\\s*(?:h|hr|hrs|hour|hours)\\b`))
  const n = num(hrs?.[1])
  if (n !== undefined) return Math.round(n * 60 + (half ? 30 : 0))
  const mins = lc.match(new RegExp(`${NUM}\\s*(?:min|mins|minute|minutes)\\b`))
  return num(mins?.[1])
}

/** The bare "N games" count, when the sentence gives one. */
function playedCount(text: string): number | undefined {
  const m = text.toLowerCase().match(new RegExp(`${NUM}\\s+games?\\b`))
  return num(m?.[1])
}

/**
 * Answer the open question, turning "2 games" into a real win/loss split.
 *
 * Pure, and returns new records — the caller replaces the intent rather than
 * mutating one, so an answered question cannot half-apply.
 */
export function answer(intent: VoiceIntent, won: number): VoiceIntent {
  if (!intent.ask) return intent
  const of = intent.ask.of
  const w = Math.max(0, Math.min(of, Math.round(won)))
  const records = intent.records.map((r) =>
    r.kind === 'pickleball' ? { ...r, gamesWon: w, gamesLost: of - w } : r)
  return {
    ...intent,
    records,
    ask: undefined,
    confidence: 0.85,
    say: `${w} won, ${of - w} lost. Save it?`,
  }
}

/**
 * "500 calories", "ate 40 grams of protein", "breakfast 600 calories".
 *
 * Numbers with a named unit only. A spoken food *name* ("oatmeal and eggs")
 * carries no numbers at all, and inventing 150 kcal for "oatmeal" would put a
 * fabricated figure into a nutrition total that the user will later read as
 * measured — so a bare food name becomes a note on the day instead, and the
 * lookup that turns it into numbers is a separate, verifiable feature.
 */
function matchFood(text: string, date: string): ImportRecord[] | null {
  const lc = text.toLowerCase()
  const kcal = lc.match(new RegExp(`${NUM}\\s*(?:k?cal|calories|kilocalories)\\b`))
  const protein = lc.match(new RegExp(`${NUM}\\s*(?:g|grams?)?\\s*(?:of\\s+)?protein\\b`))
  const carbs = lc.match(new RegExp(`${NUM}\\s*(?:g|grams?)?\\s*(?:of\\s+)?(?:carbs|carbohydrates)\\b`))
  const fat = lc.match(new RegExp(`${NUM}\\s*(?:g|grams?)?\\s*(?:of\\s+)?fat\\b`))
  if (!kcal && !protein && !carbs && !fat) return null
  return [{
    kind: 'metric',
    date,
    calories: num(kcal?.[1]),
    protein: num(protein?.[1]),
    carbs: num(carbs?.[1]),
    fat: num(fat?.[1]),
  }]
}

/** A spoken food with no numbers — kept as a note rather than guessed at. */
function matchFoodNote(text: string, date: string): ImportRecord[] | null {
  const lc = text.toLowerCase()
  const m = lc.match(/\b(?:ate|eating|had|log(?:ged)?|breakfast|lunch|dinner|snack)\b/)
  if (!m) return null
  return [{ kind: 'entry', date, type: 'note', text: text.trim() }]
}

/** Everything `lib/capture.ts` already knows, re-expressed as import records. */
function fromCapture(text: string, date: string, ctx: CaptureCtx): { records: ImportRecord[]; confidence: number } | null {
  // `clampValues: false` — a mis-heard "77" must reach the validator as 77 and
  // be refused, not arrive as a clamped, plausible 10. See `CaptureCtx`.
  const c = parseCapture(text, { ...ctx, clampValues: false })
  switch (c.kind) {
    case 'cardio':
      if (!isActivityKey(c.activity)) return null
      return {
        confidence: c.confidence,
        records: [{ kind: 'workout', date, activity: c.activity, distanceKm: c.distanceKm, durationMin: c.durationMin }],
      }
    case 'metric':
      return {
        confidence: c.confidence,
        records: [{ kind: 'metric', date, mood: c.mood, sleep: c.sleep, stress: c.stress }],
      }
    case 'habit':
      return { confidence: c.confidence, records: [{ kind: 'habit', date, habit: c.habit, value: c.value }] }
    case 'gym':
      return {
        confidence: c.confidence,
        records: [{
          kind: 'workout', date, activity: 'strength',
          sets: [`${c.exercise}${c.reps ? ` x${c.reps}` : ''}${c.weight ? ` @ ${c.weight}${c.unit}` : ''}`],
          rpe: c.rpe,
        }],
      }
    case 'bullet':
      return null // the caller decides; a bullet is the floor, not a match
  }
}

/** " today" / " yesterday" / " on 2026-09-03" — always with its leading space. */
function whenWord(date: string, today: string): string {
  return date === today ? ' today' : date === addDays(today, -1) ? ' yesterday' : ` on ${date}`
}

/** A sentence a person would actually say back, built from what was understood. */
function describe(records: ImportRecord[], date: string, today: string): string {
  const when = whenWord(date, today).trim()
  const parts = records.map((r) => {
    switch (r.kind) {
      case 'pickleball': {
        const bits: string[] = []
        if (r.gamesWon !== undefined || r.gamesLost !== undefined) {
          bits.push(`${r.gamesWon ?? 0} won${r.gamesLost !== undefined ? `, ${r.gamesLost} lost` : ''}`)
        }
        if (r.pointsFor !== undefined) bits.push(`${r.pointsFor} points`)
        if (r.durationMin !== undefined) bits.push(`${r.durationMin} minutes`)
        return `pickleball · ${bits.join(' · ') || 'a session'}`
      }
      case 'metric': {
        const bits = (['mood', 'sleep', 'stress', 'calories', 'protein', 'carbs', 'fat'] as const)
          .filter((f) => r[f] !== undefined)
          .map((f) => `${f} ${r[f]}`)
        return bits.join(', ')
      }
      case 'workout':
        return [r.activity, r.distanceKm && `${r.distanceKm} km`, r.durationMin && `${r.durationMin} min`, r.sets?.[0]]
          .filter(Boolean).join(' · ')
      case 'habit':
        return `${r.habit}${r.value !== undefined ? ` ${r.value}` : ''}`
      case 'entry':
        return `a note: "${r.text}"`
      case 'body':
        return r.weightKg !== undefined ? `weight ${r.weightKg} kg` : 'a body measurement'
      case 'cycle':
        return (r.flags ?? []).join(', ') || 'a cycle note'
    }
  }).filter(Boolean)
  return `${parts.join('; ')} — ${when}. Save it?`
}

/**
 * Understand one utterance.
 *
 * Ordered, first confident match wins, and **nothing is ever dropped**: an
 * utterance nothing recognises becomes a note on the day carrying the words as
 * spoken. A journal that silently discards what you told it is worse than one
 * that files it untidily.
 */
export function understand(transcript: string, ctx: CaptureCtx, today = todayISO()): VoiceIntent {
  const said = transcript.trim()
  if (!said) {
    return { transcript, date: today, records: [], say: "I didn't catch that.", confidence: 0 }
  }
  const { date, rest } = readDate(said, today)
  // "I played…", "log…", "add…" — the spoken wrapper around the fact. Stripped
  // before the typed-shorthand matchers see it, because they were written for
  // "ran 5k", not for "so I ran 5k this morning".
  const text = rest.replace(/^(?:so\s+)?(?:i\s+|i've\s+|ive\s+)?(?:just\s+)?(?:log|logged|add|record|note)?\s*/i, '').trim()

  const pickle = matchPickleball(text, date)
  if (pickle) {
    const r = pickle[0] as { gamesWon?: number; gamesLost?: number; notes?: string }
    const played = playedCount(text)
    const pointsHeard = (pickle[0] as { pointsFor?: number }).pointsFor
    const split = r.gamesWon !== undefined || r.gamesLost !== undefined
    if (played !== undefined && !split) {
      return {
        transcript, date, records: pickle, confidence: 0.7,
        ask: { field: 'gamesWon', of: played, prompt: `How many of the ${played} did you win?` },
        say: `${played} games${pointsHeard !== undefined ? `, ${pointsHeard} points` : ''}${
          whenWord(date, today)} — how many did you win?`,
      }
    }
    return { transcript, date, records: pickle, say: describe(pickle, date, today), confidence: 0.8 }
  }

  const food = matchFood(text, date)
  if (food) return { transcript, date, records: food, say: describe(food, date, today), confidence: 0.8 }

  const captured = fromCapture(text, date, ctx)
  if (captured) {
    return { transcript, date, records: captured.records, say: describe(captured.records, date, today), confidence: captured.confidence }
  }

  const note = matchFoodNote(text, date)
  if (note) {
    return {
      transcript, date, records: note, confidence: 0.5,
      say: `I don't have numbers for that, so I'll keep it as a note — ${date === today ? 'today' : date}. Save it?`,
    }
  }

  // The floor. Never a dropped sentence.
  return {
    transcript,
    date,
    records: [{ kind: 'entry', date, type: 'note', text: said }],
    say: `I'll keep that as a note. Save it?`,
    confidence: 0.3,
  }
}
