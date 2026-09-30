/**
 * THE FEEDBACK LEDGER · both sides of the thing you are trying to change.
 *
 * ## The problem
 *
 * The app recorded both outcomes and showed neither as an outcome. Resisting an
 * urge wrote a `UrgeWin`; slipping wrote a `Relapse`. Two lists, no relationship
 * — so the page could tell you "17 urges resisted" and "3 lapses" and never the
 * one thing you actually want to know: **was today a win or a loss, and for
 * which thing?**
 *
 * That gap is why "I watched porn — is that positive or negative feedback here?"
 * had no answer. The app knew. It just never said.
 *
 * ## What a ledger is
 *
 * Every logged event is signed:
 *
 * | Event | Sign | Meaning |
 * |---|---|---|
 * | urge resisted | **+1** | you were pulled and did not go |
 * | lapse day | **−1** per occurrence | you went |
 *
 * `net` is the difference over a window; `ratio` is resisted ÷ (resisted +
 * lapses), which is the one number that survives a change in how often you log.
 *
 * ## Two rules that keep it honest
 *
 * **A quiet day is not a win.** Only logged events count. A week with no entries
 * scores 0, not 7 — inventing wins for days nobody recorded would make the whole
 * thing a flattery machine, and someone relying on it to decide whether they are
 * getting better deserves better than that.
 *
 * **Not resisting is also feedback, and it is not failure.** A lapse is a data
 * point with a trigger attached, and the copy that renders this says so. An app
 * that only counts the good days teaches people to stop logging the bad ones,
 * and then it knows nothing.
 */
import type { AddictionStreak, JournalData, Relapse, UrgeWin } from './types'
import { addDays, dayDiff, todayISO } from './date'
import { formatAmount, totalMinutes, unitOf } from './addictionUnits'

export interface FeedbackRow {
  addictionId: string
  name: string
  /** Urges resisted in the window. */
  resisted: number
  /** AMOUNT slipped in the window, in this addiction's unit. */
  lapses: number
  /**
   * How many separate days you slipped on — the count the RATIO uses.
   *
   * Introduced because the ratio was silently comparing different things once
   * units arrived: five resisted urges against 235 *minutes* of scrolling
   * rendered as "2% of the pulls you logged, you did not follow", which is
   * arithmetic on apples and oranges. A ratio needs both sides in the same
   * currency, and the shared currency is EVENTS — each side is "a moment that
   * went one way or the other". The amount stays, for saying what it cost.
   */
  lapseDays: number
  /** `resisted - lapses`. */
  net: number
  /**
   * Share of logged pulls that you did not follow, 0–1. `null` when nothing was
   * logged — a ratio over zero events is not 0%, it is unknown, and printing
   * "0% resisted" to someone who simply had a quiet week is a lie that hurts.
   */
  ratio: number | null
  /** Days since the last slip, or null when there has never been one. */
  cleanDays: number | null
  /** Same ratio over the previous window, for the arrow. */
  prevRatio: number | null
  /** The HALT driver that accompanied most resisted urges here. */
  topDriver: string | null
  /** The technique that worked most often for THIS addiction. */
  topTechnique: string | null
  /** Every urge logged for this addiction in the window, both outcomes. */
  urges: UrgeWin[]
  /** The kind of loneliness most often logged here, when `lonely` leads. */
  lonelyKind: string | null
  /** What amounts are measured in — `times` unless the addiction says otherwise. */
  unit: string
  /** "14 cigarettes", "8.5 hours" — the lapse total, said properly. */
  lapsesLabel: string
  /**
   * Minutes lost in the window, for duration units only. `null` for a count
   * unit, because "0 hours of cigarettes" states a category error as a fact.
   */
  minutesLost: number | null
}

export interface Ledger {
  rows: FeedbackRow[]
  /** Totals across every addiction. */
  resisted: number
  lapses: number
  net: number
  ratio: number | null
  /** Urges logged before `addictionId` existed, or with no addiction chosen. */
  unattributed: number
  windowDays: number
}

const HALT_LABEL: Record<string, string> = {
  hungry: 'hungry',
  angry: 'angry',
  lonely: 'lonely',
  tired: 'tired',
}

const TECHNIQUE_LABEL: Record<string, string> = {
  surf: 'urge surfing',
  delay: 'delaying it',
  halt: 'a HALT check',
  'reach-out': 'reaching out',
}

/**
 * Build the ledger over the last `windowDays`, with the window before it for
 * comparison.
 */
export function feedbackLedger(
  data: JournalData,
  windowDays = 30,
  today = todayISO(),
): Ledger {
  const addictions: AddictionStreak[] = data.nofap?.addictions ?? []
  const urges: UrgeWin[] = data.nofap?.urgeLog ?? []

  const from = addDays(today, -(windowDays - 1))
  const prevFrom = addDays(today, -(windowDays * 2 - 1))
  const inWindow = (d: string) => d >= from && d <= today
  const inPrev = (d: string) => d >= prevFrom && d < from

  const rows: FeedbackRow[] = addictions.map((a) => {
    const mine = urges.filter((u) => u.addictionId === a.id)
    // ONLY the urges that ended in resisting. A row whose outcome is
    // `followed` is the same moment logged with the same context, but it is
    // not a win — counting it as one would let logging a slip improve the
    // score, which is the single worst bug this file could have.
    const won = mine.filter((u) => u.outcome !== 'followed')
    const resisted = won.filter((u) => inWindow(u.date)).length
    const prevResisted = won.filter((u) => inPrev(u.date)).length

    const lapses = countOccurrences(a.relapses, inWindow)
    // Days, not amounts — see `lapseDays`. A 90-minute scroll is one decision
    // that went the other way, the same as one cigarette is.
    const lapseDays = a.relapses.filter((r) => inWindow(r.date)).length
    const prevLapseDays = a.relapses.filter((r) => inPrev(r.date)).length

    const last = [...a.relapses].sort((x, y) => (x.date < y.date ? 1 : -1))[0]

    return {
      addictionId: a.id,
      name: a.name,
      resisted,
      lapses,
      lapseDays,
      net: resisted - lapseDays,
      ratio: ratioOf(resisted, lapseDays),
      cleanDays: last ? Math.max(0, dayDiff(last.date, today)) : null,
      prevRatio: ratioOf(prevResisted, prevLapseDays),
      // Drivers read BOTH outcomes: the states that accompany a slip are the
      // ones worth naming, and excluding them would describe only good days.
      topDriver: topOf(mine.filter((u) => inWindow(u.date)).flatMap((u) => (u.halt ?? []).map((h) => HALT_LABEL[h] ?? h))),
      topTechnique: topOf(
        won.filter((u) => inWindow(u.date) && u.technique).map((u) => TECHNIQUE_LABEL[u.technique!] ?? u.technique!),
      ),
      urges: mine.filter((u) => inWindow(u.date)),
      lonelyKind: topOf(
        mine.filter((u) => inWindow(u.date) && u.lonelyKind).map((u) => u.lonelyKind!),
      ),
      unit: unitOf(a.unit).id,
      lapsesLabel: formatAmount(lapses, a.unit),
      minutesLost: totalMinutes(lapses, a.unit),
    }
  })

  const resisted = rows.reduce((s, r) => s + r.resisted, 0)
  // Totals across addictions are in DAYS too: summing 39 cigarettes and 235
  // minutes would be a number with no unit at all.
  const lapses = rows.reduce((s, r) => s + r.lapseDays, 0)

  return {
    rows: rows.sort((a, b) => (b.resisted + b.lapses) - (a.resisted + a.lapses)),
    resisted,
    lapses,
    net: resisted - lapses,
    ratio: ratioOf(resisted, lapses),
    // Named rather than hidden. An urge logged before `addictionId` existed is
    // still a real thing that happened, and quietly dropping it would make the
    // totals disagree with the list the user can see.
    unattributed: urges.filter((u) => inWindow(u.date) && !u.addictionId && u.outcome !== 'followed').length,
    windowDays,
  }
}

/** A lapse day of count 3 is three occurrences, not one. */
function countOccurrences(relapses: Relapse[], within: (d: string) => boolean): number {
  return relapses.filter((r) => within(r.date)).reduce((s, r) => s + (r.count ?? 1), 0)
}

function ratioOf(resisted: number, lapses: number): number | null {
  const total = resisted + lapses
  // Zero logged events is UNKNOWN, not 0%. See the file note.
  return total === 0 ? null : resisted / total
}

function topOf(xs: string[]): string | null {
  if (xs.length === 0) return null
  const counts = new Map<string, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * THE KINDS OF LONELY, and what each one actually calls for.
 *
 * One list, because the label, the thing it means and the step it implies are
 * three views of one fact — and the step is the whole reason the field exists.
 * Every `step` here is different from every other; if two of them collapsed into
 * "reach out to someone", the split would not be earning its question.
 */
export const LONELY_KINDS = [
  {
    id: 'alone' as const,
    label: 'Nobody around',
    step: 'Arrange company before the hour it usually hits, not during it',
    why: 'This is the kind that company genuinely fixes — and the only one where it does. By the time the urge is there, arranging it is already too slow.',
  },
  {
    id: 'unseen' as const,
    label: 'People around, none who know me',
    step: 'One honest conversation with one person, rather than more company',
    why: 'You were not short of people. More of them does not touch this — depth with one does, and it is the harder thing to schedule.',
  },
  {
    id: 'no-one-close' as const,
    label: 'Nobody I could call',
    step: 'Pick one person and build the tie over weeks',
    why: 'Nothing tonight fixes this, and pretending otherwise is why quick advice fails here. It is a months-long thing, and it is worth starting anyway.',
  },
  {
    id: 'disconnected' as const,
    label: 'Adrift from everything',
    step: 'Worth saying out loud to someone — a friend, or someone qualified',
    why: 'This one sits outside what a tracking page can help with. Logging it is useful; relying on the log to fix it is not.',
  },
  {
    id: 'bored' as const,
    label: 'Mostly just bored',
    step: 'Something absorbing, not company',
    why: 'Understimulation gets logged as loneliness constantly, and it needs the opposite response — company will not hold your attention, a hard task will.',
  },
]

export const LONELY_LABEL: Record<string, string> = Object.fromEntries(
  LONELY_KINDS.map((k) => [k.id, k.label.toLowerCase()]),
)

export type Verdict = 'strong' | 'holding' | 'slipping' | 'quiet'

/**
 * How a row is going, in one word.
 *
 * The thresholds are deliberately generous at the bottom. Someone logging a
 * recovery app in a bad week does not need a red verdict; they need to still be
 * logging next week. `slipping` requires the majority of logged pulls to have
 * been followed, which is a fact rather than a judgement.
 */
export function verdictOf(row: FeedbackRow): Verdict {
  if (row.ratio == null) return 'quiet'
  if (row.ratio >= 0.8) return 'strong'
  if (row.ratio >= 0.5) return 'holding'
  return 'slipping'
}

export const VERDICT_COPY: Record<Verdict, { label: string; hue: string; line: string }> = {
  strong: {
    label: 'going well',
    hue: 'green',
    line: 'You are resisting most of what you log. Whatever you are doing, it is working.',
  },
  holding: {
    label: 'holding',
    hue: 'teal',
    line: 'More resisted than not. The wins are real even when it does not feel like progress.',
  },
  slipping: {
    label: 'a hard stretch',
    hue: 'peach',
    line: 'More followed than resisted lately. That is information, not a verdict — the triggers below are where to look.',
  },
  quiet: {
    label: 'nothing logged',
    hue: 'overlay1',
    line: 'Nothing recorded in this window, so there is nothing to read. A quiet log is not the same as a good month.',
  },
}

export interface NextStep {
  title: string
  why: string
}

/**
 * What to try next, derived from the row rather than from a listicle.
 *
 * Every suggestion names the evidence it came from. "Try reaching out" is
 * advice; "loneliness accompanied most of your urges, and reaching out is what
 * worked the last three times" is the app being useful — and it is only sayable
 * because the urge log carries HALT and technique.
 */
export function nextSteps(row: FeedbackRow): NextStep[] {
  const out: NextStep[] = []

  if (row.topDriver === 'lonely') {
    // The KIND decides the step. Telling someone who was surrounded by people
    // to "arrange company" is advice that misses, and it is the reason the app
    // asks which kind rather than treating loneliness as one thing.
    const kind = LONELY_KINDS.find((k) => k.id === row.lonelyKind)
    out.push(kind
      ? { title: kind.step, why: `${kind.why} You logged this as “${kind.label.toLowerCase()}” more than any other kind.` }
      : {
        title: 'Name what kind of lonely it is',
        why: 'Loneliness accompanied most of these urges, but the useful move depends on which kind — being alone, being unseen in company, or having nobody to call all point somewhere different. The urge form asks when you tick it.',
      })
  }
  if (row.topDriver === 'tired') {
    out.push({
      title: 'Treat an early night as part of the plan',
      why: 'Tiredness accompanied most of these urges. Willpower is measurably worse on short sleep, so a bedtime is a recovery tactic rather than a separate goal.',
    })
  }
  if (row.topDriver === 'hungry') {
    out.push({
      title: 'Eat before the usual hour',
      why: 'Hunger showed up with most of these. It is the cheapest HALT state to remove, and removing it makes the others easier to see.',
    })
  }
  if (row.topDriver === 'angry') {
    out.push({
      title: 'Put a physical outlet between the feeling and the decision',
      why: 'Anger accompanied most of these urges. A walk or ten minutes of something hard is not a cure, but it moves the decision out of the moment it was made in.',
    })
  }

  if (row.topTechnique) {
    out.push({
      title: `Lead with ${row.topTechnique}`,
      why: `It is what you actually used on the urges you resisted here — more than anything else you tried.`,
    })
  }

  if (row.lapses > 0 && row.resisted === 0) {
    out.push({
      title: 'Log the urges you resist, not only the slips',
      why: 'Only lapses are recorded for this one, so the page can show you the bad days and none of the good ones. Both halves are what make the trend readable.',
    })
  }

  return out.slice(0, 3)
}

export interface Contrast {
  /** What differed, e.g. "lonely" or "intensity". */
  factor: string
  /** Share of FOLLOWED urges carrying it, 0–1. */
  whenFollowed: number
  /** Share of RESISTED urges carrying it. */
  whenResisted: number
  /** followed − resisted, so positive means "more common when you gave in". */
  gap: number
  /** A sentence naming the difference, in the user's terms. */
  text: string
}

/** Both sides need this many rows before a comparison means anything. */
export const MIN_FOR_CONTRAST = 3

/**
 * WHAT WAS DIFFERENT ABOUT THE TIMES YOU GAVE IN.
 *
 * This is the whole reason `outcome` exists, and it is the only analysis on the
 * page that can answer "how do I move away from this" with evidence rather than
 * advice. It compares the urges that ended one way against the urges that ended
 * the other — same person, same log, same fields — so anything that shows up
 * far more often on the `followed` side is a lever.
 *
 * **Both sides need `MIN_FOR_CONTRAST` rows.** A comparison against one bad
 * night is not a finding, and this is exactly the output someone would act on.
 *
 * **Only gaps of 25 points or more are reported.** Below that it is the noise
 * of a few dozen self-logged moments, and naming it would send someone
 * rearranging their life around a coin flip.
 */
export function contrastOutcomes(urges: UrgeWin[]): Contrast[] {
  const followed = urges.filter((u) => u.outcome === 'followed')
  const resisted = urges.filter((u) => u.outcome !== 'followed')
  if (followed.length < MIN_FOR_CONTRAST || resisted.length < MIN_FOR_CONTRAST) return []

  const out: Contrast[] = []
  const share = (xs: UrgeWin[], has: (u: UrgeWin) => boolean) => xs.filter(has).length / xs.length

  for (const [state, label] of Object.entries(HALT_LABEL)) {
    const f = share(followed, (u) => (u.halt ?? []).includes(state as 'lonely'))
    const r = share(resisted, (u) => (u.halt ?? []).includes(state as 'lonely'))
    if (f - r >= 0.25) {
      out.push({
        factor: label,
        whenFollowed: f,
        whenResisted: r,
        gap: f - r,
        text: `You were ${label} in ${pct(f)} of the times you gave in, against ${pct(r)} of the times you held. That is the biggest single difference in your log.`,
      })
    }
  }

  // Intensity and stress are scales, so the comparison is a mean rather than a
  // share — reported only when the gap clears a full point on a five-point one.
  const meanOf = (xs: UrgeWin[], pick: (u: UrgeWin) => number | undefined) => {
    const vals = xs.map(pick).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  for (const [key, label, pick] of [
    ['intensity', 'the urge was stronger', (u: UrgeWin) => u.intensity],
    ['stress', 'you were more stressed', (u: UrgeWin) => u.stress],
  ] as const) {
    const f = meanOf(followed, pick)
    const r = meanOf(resisted, pick)
    if (f != null && r != null && f - r >= 1) {
      out.push({
        factor: key,
        whenFollowed: f / 5,
        whenResisted: r / 5,
        gap: (f - r) / 5,
        text: `On the days you gave in, ${label} — ${f.toFixed(1)} out of 5, against ${r.toFixed(1)} when you held.`,
      })
    }
  }

  // A technique that appears on the resisted side and not the followed one is
  // the most actionable thing here: it is something you did, not something that
  // happened to you.
  for (const [key, label] of Object.entries(TECHNIQUE_LABEL)) {
    const f = share(followed, (u) => u.technique === key)
    const r = share(resisted, (u) => u.technique === key)
    if (r - f >= 0.25) {
      out.push({
        factor: label,
        whenFollowed: f,
        whenResisted: r,
        gap: f - r,
        text: `You used ${label} in ${pct(r)} of the times you held, and only ${pct(f)} of the times you did not.`,
      })
    }
  }

  return out.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 3)
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}
