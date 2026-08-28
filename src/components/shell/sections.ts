import { ArrowsClockwise, Brain, PersonSimpleRun, Sparkle, Sun } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import type { ViewId } from './viewChrome'

/**
 * FIVE SECTIONS · the nav, and the only nav.
 *
 * The rail carried seventeen destinations under six group headers while Today
 * carried ten cards. That is the wrong way round: the nav was split so finely
 * that Trackers was a peer of Insights, and the headers existed only because
 * seventeen rows are unreadable without them. Five items need no headers.
 *
 * A section is a **destination**; the views inside it are **tabs**. Nothing
 * moved on disk — every view file is where it was, still lazy-loaded, still
 * reached by `?view=<id>`. What changed is that `?view=nutrition` now lights up
 * *Body* in the rail and renders a tab row above the page, instead of being its
 * own rail row.
 *
 * `?view=` stays the address because this app has no path router (see
 * `lib/deepLink.ts`). The tab is therefore in the URL, not in local state —
 * which is the property the tabs had to have.
 *
 * **Home workout is deliberately not a tab.** It is an activity you pick inside
 * Fitness, not a surface you navigate to. `MEMBERS` maps it to Body anyway so
 * that arriving on it lights the right rail row.
 *
 * **Pickleball is a tab, and was wrongly grouped with it.** The test for
 * "activity or surface" is not whether you can do the thing — it is whether the
 * page holds anything the Fitness activity form does not. A pickleball session
 * is a `PickleballSession`: format (singles/doubles), games won and lost,
 * scoring format, partner, opponent, level, points for and against — none of
 * which a `Workout` can hold.
 *
 * **Pull-ups is a tab too, and this note argued the opposite for three
 * releases.** The argument was "a pull-up session IS a `Workout`, so Pull-ups
 * is an activity", and it is the wrong test — the same wrong test this file
 * already records making about Pickleball, applied to the record instead of to
 * the page. A pull-up session is indeed a `Workout`. The *page* is the six-week
 * program tracker, the ability calculator, the rep-scheme builder and the whole
 * training manual, and none of those are reachable from a duration field. Its
 * only door was a link that appeared inside Fitness once you had already picked
 * Pull-ups on the activity select, which is the Strength-tools hole verbatim.
 *
 * Redirecting Pickleball into Fitness did not move the page, it deleted it.
 * `ACTIVITIES.pickleball` is `mode: 'sport'` with `required: ['durationMin']`,
 * so the form you land on asks for a duration and nothing else, and the whole
 * record — win rate, singles-vs-doubles, tournaments, leagues — became
 * unreachable except through a companion link that only appears once you have
 * already picked Pickleball on the Fitness activity select. Reported as
 * "options are not available", which is exactly what it was.
 *
 * The Fitness activity stays, so a quick "played for 45 minutes" still logs
 * from there without a score. The two are different records on purpose.
 */
export type SectionId = 'today' | 'plan' | 'body' | 'mind' | 'insights'

export interface SectionTab {
  view: ViewId
  label: string
  /** Hidden unless the gate passes (opt-in trackers). */
  gate?: keyof SectionGates
}

export interface SectionGates {
  cycle: boolean
  nofap: boolean
}

export interface Section {
  id: SectionId
  label: string
  icon: IconGlyph
  /** Where the rail row lands. Always the first tab. */
  tabs: SectionTab[]
}

export const SECTIONS: Section[] = [
  {
    id: 'today',
    label: 'Today',
    icon: Sun,
    // One surface, no tab row: Today does its own splitting by time of day.
    tabs: [{ view: 'today', label: 'Today' }],
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: ArrowsClockwise,
    tabs: [
      { view: 'plan', label: 'Week' },
      { view: 'monthly', label: 'Month' },
      { view: 'goals', label: 'Goals' },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    icon: PersonSimpleRun,
    tabs: [
      { view: 'fitness', label: 'Fitness' },
      // Moved out of Insights, by the same test that moved Challenges. Trackers
      // is where the gym habit, the protein target and the step count are
      // *logged* — it is the second half of the daily loop whose first half is
      // Fitness, and it sat two rail sections away from it. It produces charts,
      // which is a fact about its output, not about what the page is for.
      //
      // Insights keeps the two surfaces that only ever look backwards.
      { view: 'trackers', label: 'Tracking' },
      // Strength tools was reachable only from a link inside Fitness, and only
      // while the mode happened to be `strength` — so the exercise picker, the
      // program tracker, the plate calculator, the muscle map and progress
      // photos were all behind a conditional. A whole workshop should not need
      // a mode to be set before it has a door.
      { view: 'gym', label: 'Strength' },
      // The 12-week hypertrophy block, by the same test that made Pickleball a
      // tab. It was one line inside Strength's "Program & progress" fold, so a
      // twelve-week commitment sat behind a collapsible on a page whose job is
      // logging today's sets — invisible unless you went looking for it. What
      // you follow six days a week for three months is a destination.
      { view: 'program', label: 'Program' },
      // Pickleball is a surface, not an activity — see the note below.
      { view: 'pickleball', label: 'Pickleball' },
      // Pull-ups, by the same test, applied a third time. See the note below.
      { view: 'pullups', label: 'Pull-ups' },
      { view: 'coaching', label: 'Coaching' },
      { view: 'nutrition', label: 'Nutrition' },
      // Moved out of Insights. 75 Hard and the 90-day blocks are disciplines you
      // *run*, checking in against rules each day — not analytics you read. They
      // sat beside Stats and Trackers because they produce a streak, which is a
      // fact about their output, not about what the page is for. Insights keeps
      // the three surfaces that only ever look backwards.
      { view: 'challenges', label: 'Challenges' },
      { view: 'nofap', label: 'Recovery', gate: 'nofap' },
      { view: 'cycle', label: 'Cycle', gate: 'cycle' },
    ],
  },
  {
    id: 'mind',
    label: 'Mind',
    icon: Brain,
    tabs: [
      { view: 'mindset', label: 'Mindset' },
      { view: 'reading', label: 'Reading' },
      { view: 'collections', label: 'Collections' },
      { view: 'focus', label: 'Focus' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Sparkle,
    tabs: [
      { view: 'insights', label: 'Insights' },
      { view: 'stats', label: 'Stats' },
    ],
  },
]

/**
 * Which section a view belongs to — the "section prefix" the active state
 * matches on. Includes Home workout, which is **not** a tab, so landing on it
 * still lights its rail row.
 * Views absent from this map (Settings, Help, Account, the kitchen sink) light
 * nothing, which is correct: they are not section destinations.
 */
export const MEMBERS: Partial<Record<ViewId, SectionId>> = (() => {
  const m: Partial<Record<ViewId, SectionId>> = {}
  for (const s of SECTIONS) for (const t of s.tabs) m[t.view] = s.id
  // Companion: reachable from a link inside Fitness, not tabbed. Listed here
  // only so landing on it lights the right rail row. Pull-ups used to sit
  // beside it and is a tab now, so it arrives through `SECTIONS` above.
  m.homeworkout = 'body'
  return m
})()

export const sectionOf = (view: ViewId): SectionId | undefined => MEMBERS[view]

/** The tabs of a section, minus anything its settings gate turns off. */
export function tabsOf(id: SectionId, gates: SectionGates): SectionTab[] {
  const s = SECTIONS.find((x) => x.id === id)
  if (!s) return []
  return s.tabs.filter((t) => !t.gate || gates[t.gate])
}

/** Where a rail click lands: the section's first *visible* tab. */
export function landingOf(id: SectionId, gates: SectionGates): ViewId {
  return tabsOf(id, gates)[0]?.view ?? 'today'
}

