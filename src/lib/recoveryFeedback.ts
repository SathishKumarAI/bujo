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

export interface FeedbackRow {
  addictionId: string
  name: string
  /** Urges resisted in the window. */
  resisted: number
  /** Occurrences slipped in the window (a lapse day of count 3 is 3). */
  lapses: number
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
    const resisted = mine.filter((u) => inWindow(u.date)).length
    const prevResisted = mine.filter((u) => inPrev(u.date)).length

    const lapses = countOccurrences(a.relapses, inWindow)
    const prevLapses = countOccurrences(a.relapses, inPrev)

    const last = [...a.relapses].sort((x, y) => (x.date < y.date ? 1 : -1))[0]

    return {
      addictionId: a.id,
      name: a.name,
      resisted,
      lapses,
      net: resisted - lapses,
      ratio: ratioOf(resisted, lapses),
      cleanDays: last ? Math.max(0, dayDiff(last.date, today)) : null,
      prevRatio: ratioOf(prevResisted, prevLapses),
      topDriver: topOf(mine.filter((u) => inWindow(u.date)).flatMap((u) => (u.halt ?? []).map((h) => HALT_LABEL[h] ?? h))),
      topTechnique: topOf(
        mine.filter((u) => inWindow(u.date) && u.technique).map((u) => TECHNIQUE_LABEL[u.technique!] ?? u.technique!),
      ),
    }
  })

  const resisted = rows.reduce((s, r) => s + r.resisted, 0)
  const lapses = rows.reduce((s, r) => s + r.lapses, 0)

  return {
    rows: rows.sort((a, b) => (b.resisted + b.lapses) - (a.resisted + a.lapses)),
    resisted,
    lapses,
    net: resisted - lapses,
    ratio: ratioOf(resisted, lapses),
    // Named rather than hidden. An urge logged before `addictionId` existed is
    // still a real thing that happened, and quietly dropping it would make the
    // totals disagree with the list the user can see.
    unattributed: urges.filter((u) => inWindow(u.date) && !u.addictionId).length,
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
    out.push({
      title: 'Plan company before the window, not during it',
      why: 'Loneliness was the most common thing you logged alongside these urges. It is the one HALT state that cannot be fixed in the moment — by the time the urge is there, arranging company is already too slow.',
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
